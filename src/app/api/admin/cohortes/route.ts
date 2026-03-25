import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Program, CohortStatus, PaymentStatus } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────
interface CreateCohortRequest {
  name: string;
  program: Program;
  description?: string;
  startDate: string;
  endDate?: string;
  status: CohortStatus;
  maxStudents?: number;
  price?: number;
  installmentPrice?: number;
  installmentCount?: number;
}

interface CohortListItem {
  id: string;
  name: string;
  program: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  maxStudents?: number;
  enrollmentCount: number;
  mentorNames: string[];
  invitationLinkCount: number;
  revenueStats: {
    totalRevenue: number;
    completedPayments: number;
    pendingPayments: number;
    totalPending: number;
  };
  createdAt: string;
}

// ── Auth Helper ────────────────────────────────────────────────────────
async function checkSuperAdminAuth(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return {
      error: "No autorizado",
      user: null,
      status: 401,
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "SUPERADMIN") {
    return {
      error: "No tienes permiso para realizar esta acción",
      user: null,
      status: 403,
    };
  }

  return {
    error: null,
    user: dbUser,
    status: 200,
  };
}

// ── GET: List all cohorts with comprehensive details ────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await checkSuperAdminAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Fetch all cohorts with related data
    const cohorts = await prisma.cohort.findMany({
      select: {
        id: true,
        name: true,
        program: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        maxStudents: true,
        createdAt: true,
        enrollments: {
          select: { id: true },
        },
        mentors: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        invitationLinks: {
          select: { id: true },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data for response
    const response: CohortListItem[] = cohorts.map((cohort) => {
      // Calculate revenue stats
      const completedPayments = cohort.payments.filter(
        (p) => p.status === "COMPLETED"
      );
      const pendingPayments = cohort.payments.filter(
        (p) => p.status === "PENDING"
      );
      const totalRevenue = completedPayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      // Get mentor names
      const mentorNames = cohort.mentors.map(
        (m) => `${m.user.firstName} ${m.user.lastName}`
      );

      return {
        id: cohort.id,
        name: cohort.name,
        program: cohort.program,
        description: cohort.description || undefined,
        status: cohort.status,
        startDate: cohort.startDate.toISOString(),
        endDate: cohort.endDate ? cohort.endDate.toISOString() : undefined,
        maxStudents: cohort.maxStudents || undefined,
        enrollmentCount: cohort.enrollments.length,
        mentorNames,
        invitationLinkCount: cohort.invitationLinks.length,
        revenueStats: {
          totalRevenue,
          completedPayments: completedPayments.length,
          pendingPayments: pendingPayments.length,
          totalPending,
        },
        createdAt: cohort.createdAt.toISOString(),
      };
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/admin/cohortes error:", error);
    const message =
      error instanceof Error ? error.message : "Error al obtener cohortes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Create a new cohort ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await checkSuperAdminAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as CreateCohortRequest;

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la cohorte es requerido" },
        { status: 400 }
      );
    }

    if (!body.program) {
      return NextResponse.json(
        { error: "El programa es requerido" },
        { status: 400 }
      );
    }

    if (!body.startDate) {
      return NextResponse.json(
        { error: "La fecha de inicio es requerida" },
        { status: 400 }
      );
    }

    if (!body.status) {
      return NextResponse.json(
        { error: "El estado es requerido" },
        { status: 400 }
      );
    }

    // Validate enums
    const validPrograms: Program[] = ["ACTIVA", "OPTIMIZA", "ESCALA"];
    if (!validPrograms.includes(body.program)) {
      return NextResponse.json(
        { error: "El programa no es válido (ACTIVA, OPTIMIZA, ESCALA)" },
        { status: 400 }
      );
    }

    const validStatuses: CohortStatus[] = [
      "DRAFT",
      "ACTIVE",
      "COMPLETED",
      "ARCHIVED",
    ];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          error: "El estado no es válido (DRAFT, ACTIVE, COMPLETED, ARCHIVED)",
        },
        { status: 400 }
      );
    }

    // Parse and validate dates
    const startDateTime = new Date(body.startDate);
    if (isNaN(startDateTime.getTime())) {
      return NextResponse.json(
        { error: "La fecha de inicio no es válida" },
        { status: 400 }
      );
    }

    let endDateTime: Date | null = null;
    if (body.endDate) {
      endDateTime = new Date(body.endDate);
      if (isNaN(endDateTime.getTime())) {
        return NextResponse.json(
          { error: "La fecha de fin no es válida" },
          { status: 400 }
        );
      }

      if (endDateTime <= startDateTime) {
        return NextResponse.json(
          { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
          { status: 400 }
        );
      }
    }

    // Validate price fields
    if (body.price !== undefined && body.price < 0) {
      return NextResponse.json(
        { error: "El precio no puede ser negativo" },
        { status: 400 }
      );
    }

    if (body.installmentPrice !== undefined && body.installmentPrice < 0) {
      return NextResponse.json(
        { error: "El precio de la cuota no puede ser negativo" },
        { status: 400 }
      );
    }

    if (body.installmentCount !== undefined && body.installmentCount < 1) {
      return NextResponse.json(
        { error: "El número de cuotas debe ser al menos 1" },
        { status: 400 }
      );
    }

    // Create cohort
    const cohort = await prisma.cohort.create({
      data: {
        name: body.name.trim(),
        program: body.program,
        description: body.description?.trim() || null,
        startDate: startDateTime,
        endDate: endDateTime,
        status: body.status,
        maxStudents: body.maxStudents || null,
        price: body.price || null,
        installmentPrice: body.installmentPrice || null,
        installmentCount: body.installmentCount || null,
      },
      select: {
        id: true,
        name: true,
        program: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        maxStudents: true,
        price: true,
        installmentPrice: true,
        installmentCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json(cohort, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/cohortes error:", error);
    const message =
      error instanceof Error ? error.message : "Error al crear cohorte";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

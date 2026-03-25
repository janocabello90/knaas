import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { CohortStatus, Program } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────
interface UpdateCohortRequest {
  name?: string;
  description?: string;
  program?: Program;
  startDate?: string;
  endDate?: string;
  status?: CohortStatus;
  maxStudents?: number;
  price?: number;
  installmentPrice?: number;
  installmentCount?: number;
}

interface CohortDetailResponse {
  id: string;
  name: string;
  program: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  maxStudents?: number;
  price?: number;
  installmentPrice?: number;
  installmentCount?: number;
  enrollments: {
    id: string;
    status: string;
    enrolledAt: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  }[];
  mentors: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  paymentsSummary: {
    totalCompleted: number;
    totalPending: number;
    completedAmount: number;
    pendingAmount: number;
    paymentCount: number;
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

// ── GET: Single cohort with full details ────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkSuperAdminAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Validate ID format
    if (!id || id.trim() === "") {
      return NextResponse.json(
        { error: "El ID de la cohorte es requerido" },
        { status: 400 }
      );
    }

    // Fetch cohort with full details
    const cohort = await prisma.cohort.findUnique({
      where: { id },
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
        enrollments: {
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
        mentors: {
          select: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json(
        { error: "Cohorte no encontrada" },
        { status: 404 }
      );
    }

    // Calculate payment summary
    const completedPayments = cohort.payments.filter(
      (p) => p.status === "COMPLETED"
    );
    const pendingPayments = cohort.payments.filter((p) => p.status === "PENDING");

    const paymentsSummary = {
      totalCompleted: completedPayments.length,
      totalPending: pendingPayments.length,
      completedAmount: completedPayments.reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
      paymentCount: cohort.payments.length,
    };

    // Format response
    const response: CohortDetailResponse = {
      id: cohort.id,
      name: cohort.name,
      program: cohort.program,
      description: cohort.description || undefined,
      status: cohort.status,
      startDate: cohort.startDate.toISOString(),
      endDate: cohort.endDate ? cohort.endDate.toISOString() : undefined,
      maxStudents: cohort.maxStudents || undefined,
      price: cohort.price || undefined,
      installmentPrice: cohort.installmentPrice || undefined,
      installmentCount: cohort.installmentCount || undefined,
      enrollments: cohort.enrollments.map((e) => ({
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
        user: {
          id: e.user.id,
          email: e.user.email,
          firstName: e.user.firstName,
          lastName: e.user.lastName,
          role: e.user.role,
        },
      })),
      mentors: cohort.mentors.map((m) => ({
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
      })),
      paymentsSummary,
      createdAt: cohort.createdAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/admin/cohortes/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "Error al obtener cohorte";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PUT: Update cohort fields ──────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkSuperAdminAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Validate ID format
    if (!id || id.trim() === "") {
      return NextResponse.json(
        { error: "El ID de la cohorte es requerido" },
        { status: 400 }
      );
    }

    // Check if cohort exists
    const existingCohort = await prisma.cohort.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCohort) {
      return NextResponse.json(
        { error: "Cohorte no encontrada" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as UpdateCohortRequest;
    const updateData: Record<string, unknown> = {};

    // Validate and build update data
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "El nombre de la cohorte no puede estar vacío" },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description.trim() || null;
    }

    if (body.program !== undefined) {
      const validPrograms: Program[] = ["ACTIVA", "OPTIMIZA", "ESCALA"];
      if (!validPrograms.includes(body.program)) {
        return NextResponse.json(
          { error: "El programa no es válido (ACTIVA, OPTIMIZA, ESCALA)" },
          { status: 400 }
        );
      }
      updateData.program = body.program;
    }

    if (body.status !== undefined) {
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
      updateData.status = body.status;
    }

    if (body.maxStudents !== undefined) {
      if (body.maxStudents < 1) {
        return NextResponse.json(
          { error: "El número máximo de estudiantes debe ser al menos 1" },
          { status: 400 }
        );
      }
      updateData.maxStudents = body.maxStudents;
    }

    if (body.price !== undefined) {
      if (body.price < 0) {
        return NextResponse.json(
          { error: "El precio no puede ser negativo" },
          { status: 400 }
        );
      }
      updateData.price = body.price || null;
    }

    if (body.installmentPrice !== undefined) {
      if (body.installmentPrice < 0) {
        return NextResponse.json(
          { error: "El precio de la cuota no puede ser negativo" },
          { status: 400 }
        );
      }
      updateData.installmentPrice = body.installmentPrice || null;
    }

    if (body.installmentCount !== undefined) {
      if (body.installmentCount < 1) {
        return NextResponse.json(
          { error: "El número de cuotas debe ser al menos 1" },
          { status: 400 }
        );
      }
      updateData.installmentCount = body.installmentCount;
    }

    // Handle dates
    if (body.startDate !== undefined || body.endDate !== undefined) {
      const currentCohort = await prisma.cohort.findUnique({
        where: { id },
        select: { startDate: true, endDate: true },
      });

      const startDate = body.startDate
        ? new Date(body.startDate)
        : currentCohort?.startDate;
      const endDate = body.endDate
        ? new Date(body.endDate)
        : currentCohort?.endDate;

      // Validate dates
      if (startDate && isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "La fecha de inicio no es válida" },
          { status: 400 }
        );
      }

      if (endDate && isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "La fecha de fin no es válida" },
          { status: 400 }
        );
      }

      if (startDate && endDate && endDate <= startDate) {
        return NextResponse.json(
          { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
          { status: 400 }
        );
      }

      if (body.startDate !== undefined) {
        updateData.startDate = startDate;
      }
      if (body.endDate !== undefined) {
        updateData.endDate = endDate || null;
      }
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    // Update cohort
    const updatedCohort = await prisma.cohort.update({
      where: { id },
      data: updateData,
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
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedCohort, { status: 200 });
  } catch (error: unknown) {
    console.error("PUT /api/admin/cohortes/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "Error al actualizar cohorte";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE: Delete cohort (only if no enrollments) ─────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkSuperAdminAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Validate ID format
    if (!id || id.trim() === "") {
      return NextResponse.json(
        { error: "El ID de la cohorte es requerido" },
        { status: 400 }
      );
    }

    // Check if cohort exists and has enrollments
    const cohort = await prisma.cohort.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: { select: { enrollments: true } },
      },
    });

    if (!cohort) {
      return NextResponse.json(
        { error: "Cohorte no encontrada" },
        { status: 404 }
      );
    }

    if (cohort._count.enrollments > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la cohorte porque tiene ${cohort._count.enrollments} inscripción(es). Elimina las inscripciones primero.`,
        },
        { status: 409 }
      );
    }

    // Delete cohort
    await prisma.cohort.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Cohorte eliminada correctamente" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("DELETE /api/admin/cohortes/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "Error al eliminar cohorte";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Program, CohortStatus } from "@prisma/client";

interface CreateCohortRequest {
  name: string;
  program: Program;
  startDate: string;
  endDate: string | null;
  status: CohortStatus;
}

interface CohortResponse {
  id: string;
  name: string;
  program: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check user role
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      select: { id: true, role: true },
    });

    if (!dbUser || dbUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No tienes permiso para realizar esta acción" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, program, startDate, endDate, status } = body as CreateCohortRequest;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la cohorte es requerido" },
        { status: 400 }
      );
    }

    if (!program) {
      return NextResponse.json(
        { error: "El programa es requerido" },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: "La fecha de inicio es requerida" },
        { status: 400 }
      );
    }

    // Validate program enum
    const validPrograms: Program[] = ["ACTIVA", "OPTIMIZA", "ESCALA"];
    if (!validPrograms.includes(program)) {
      return NextResponse.json(
        { error: "El programa no es válido" },
        { status: 400 }
      );
    }

    // Validate status enum
    const validStatuses: CohortStatus[] = ["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "El estado no es válido" },
        { status: 400 }
      );
    }

    // Parse dates
    const startDateTime = new Date(startDate);
    if (isNaN(startDateTime.getTime())) {
      return NextResponse.json(
        { error: "La fecha de inicio no es válida" },
        { status: 400 }
      );
    }

    let endDateTime: Date | null = null;
    if (endDate) {
      endDateTime = new Date(endDate);
      if (isNaN(endDateTime.getTime())) {
        return NextResponse.json(
          { error: "La fecha de fin no es válida" },
          { status: 400 }
        );
      }

      // Validate that end date is after start date
      if (endDateTime <= startDateTime) {
        return NextResponse.json(
          { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
          { status: 400 }
        );
      }
    }

    // Create cohort in database
    const cohort = await prisma.cohort.create({
      data: {
        name: name.trim(),
        program,
        startDate: startDateTime,
        endDate: endDateTime,
        status,
      },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    return NextResponse.json(cohort, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating cohort:", error);
    const message = error instanceof Error ? error.message : "Error al crear la cohorte";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check user role
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No tienes permiso para realizar esta acción" },
        { status: 401 }
      );
    }

    // Fetch all cohorts
    const cohorts = await prisma.cohort.findMany({
      select: {
        id: true,
        name: true,
        program: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response: CohortResponse[] = cohorts.map((cohort) => ({
      id: cohort.id,
      name: cohort.name,
      program: cohort.program,
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/admin/cohortes error:", error);
    const message = error instanceof Error ? error.message : "Error al obtener cohortes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

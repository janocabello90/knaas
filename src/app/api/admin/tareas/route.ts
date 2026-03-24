import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// ── Auto-verification logic ─────────────────────────────────────────
async function checkTaskTrigger(task: {
  triggerType: string;
  triggerConfig: unknown;
  cohortId: string | null;
}): Promise<boolean> {
  const config = (task.triggerConfig ?? {}) as Record<string, unknown>;
  const cohortId = (config.cohortId as string) ?? task.cohortId;

  switch (task.triggerType) {
    case "MANUAL":
      return false; // Never auto-completes

    case "MENTORIAS_SCHEDULED": {
      if (!cohortId) return false;
      const minSessions = (config.minSessions as number) ?? 1;
      const count = await prisma.mentoringSession.count({
        where: { cohortId },
      });
      return count >= minSessions;
    }

    case "CEREBRO_DOCS_UPLOADED": {
      const stepNumber = config.stepNumber as number | undefined;
      const program = config.program as string | undefined;
      const minDocs = (config.minDocs as number) ?? 1;
      const where: Record<string, unknown> = { isActive: true };
      if (stepNumber) where.stepNumber = stepNumber;
      if (program) where.program = program;
      const count = await prisma.cerebroDocument.count({ where });
      return count >= minDocs;
    }

    case "MESSAGES_SENT": {
      if (!cohortId) return false;
      const minMessages = (config.minMessages as number) ?? 1;
      const count = await prisma.message.count({
        where: { cohortId },
      });
      return count >= minMessages;
    }

    case "KPI_REVIEW": {
      if (!cohortId) return false;
      // Check all active students in cohort have at least 1 KPI snapshot
      const enrollments = await prisma.enrollment.findMany({
        where: { cohortId, status: "ACTIVE" },
        include: { user: { include: { clinics: { include: { kpiSnapshots: { take: 1 } } } } } },
      });
      if (enrollments.length === 0) return false;
      return enrollments.every(
        (e) => e.user.clinics.some((c) => c.kpiSnapshots.length > 0)
      );
    }

    case "ALUMNOS_ONBOARDED": {
      if (!cohortId) return false;
      const enrollments = await prisma.enrollment.findMany({
        where: { cohortId, status: "ACTIVE" },
        include: { user: { select: { onboardingDone: true } } },
      });
      if (enrollments.length === 0) return false;
      return enrollments.every((e) => e.user.onboardingDone);
    }

    case "STEPS_VALIDATED": {
      if (!cohortId) return false;
      const stepNumber = config.stepNumber as number | undefined;
      if (!stepNumber) return false;
      // Check all active enrollments have this step completed
      const enrollments = await prisma.enrollment.findMany({
        where: { cohortId, status: "ACTIVE" },
        include: {
          stepProgress: { where: { stepNumber } },
        },
      });
      if (enrollments.length === 0) return false;
      return enrollments.every(
        (e) => e.stepProgress.some((sp) => sp.status === "COMPLETED")
      );
    }

    default:
      return false;
  }
}

// ── GET: List all tasks (with auto-verify check) ────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Fetch tasks
    const tasks = await prisma.adminTask.findMany({
      orderBy: [
        { status: "asc" }, // PENDING first, then IN_PROGRESS, then COMPLETED
        { priority: "desc" },
        { dueDate: "asc" },
      ],
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        cohort: { select: { id: true, name: true, program: true } },
      },
    });

    // Auto-verify pending/in-progress tasks with triggers
    const autoCheckable = tasks.filter(
      (t) => t.status !== "COMPLETED" && t.triggerType !== "MANUAL"
    );

    const autoCompleted: string[] = [];
    for (const task of autoCheckable) {
      const isComplete = await checkTaskTrigger(task);
      if (isComplete) {
        await prisma.adminTask.update({
          where: { id: task.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        task.status = "COMPLETED";
        task.completedAt = new Date();
        autoCompleted.push(task.id);
      }
    }

    // Fetch assignable users (superadmins + mentors)
    const assignableUsers = await prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "MENTOR"] } },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: "asc" },
    });

    // Fetch cohorts for task creation
    const cohorts = await prisma.cohort.findMany({
      select: { id: true, name: true, program: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      tasks,
      assignableUsers,
      cohorts,
      autoCompleted, // IDs of tasks that were just auto-completed
    });
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json(
      { error: "Error al cargar tareas" },
      { status: 500 }
    );
  }
}

// ── POST: Create a new task ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      select: { id: true, role: true },
    });

    if (!dbUser || dbUser.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      priority = "MEDIUM",
      dueDate,
      assignedToId,
      cohortId,
      triggerType = "MANUAL",
      triggerConfig,
    } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: "Título y categoría son obligatorios" },
        { status: 400 }
      );
    }

    const task = await prisma.adminTask.create({
      data: {
        title,
        description: description || null,
        category,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        createdById: dbUser.id,
        cohortId: cohortId || null,
        triggerType,
        triggerConfig: triggerConfig || null,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        cohort: { select: { id: true, name: true, program: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json(
      { error: "Error al crear tarea" },
      { status: 500 }
    );
  }
}

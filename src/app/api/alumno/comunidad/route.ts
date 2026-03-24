import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    include: {
      enrollments: {
        include: { cohort: true },
      },
    },
  });
  return dbUser;
}

const studentSelect = {
  id: true,
  firstName: true,
  lastName: true,
  photo: true,
  city: true,
  province: true,
  specialty: true,
  yearsExperience: true,
  linkedinUrl: true,
  instagramUrl: true,
  bio: true,
};

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type"); // "mi-cohorte" or "todos"
  const isSuperAdmin = user.role === "SUPERADMIN";

  // Get user's active enrollment cohort
  const activeEnrollment = user.enrollments.find(
    (e) => e.status === "ACTIVE" || e.status === "PENDING"
  );

  if (type === "mi-cohorte") {
    // SUPERADMIN without enrollment: show first available cohort's students
    if (!activeEnrollment && !isSuperAdmin) {
      return NextResponse.json({ students: [], cohortName: null });
    }

    let targetCohortId: string | null = activeEnrollment?.cohortId || null;
    let targetCohortName: string | null = activeEnrollment?.cohort?.name || null;

    // SUPERADMIN fallback: pick first active cohort
    if (!targetCohortId && isSuperAdmin) {
      const firstCohort = await prisma.cohort.findFirst({
        orderBy: { startDate: "desc" },
        select: { id: true, name: true },
      });
      if (firstCohort) {
        targetCohortId = firstCohort.id;
        targetCohortName = firstCohort.name;
      }
    }

    if (!targetCohortId) {
      return NextResponse.json({ students: [], cohortName: null });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        cohortId: targetCohortId,
        userId: { not: user.id },
      },
      include: {
        user: { select: studentSelect },
        cohort: { select: { name: true, program: true } },
        stepProgress: {
          where: { status: "COMPLETED" },
          select: { id: true },
        },
      },
    });

    const students = enrollments.map((e) => ({
      ...e.user,
      cohortName: e.cohort.name,
      program: e.cohort.program,
      completedSteps: e.stepProgress.length,
      enrollmentStatus: e.status,
    }));

    return NextResponse.json({
      students,
      cohortName: targetCohortName,
    });
  }

  // type === "todos" — all students from other cohorts
  const myCohortIds = user.enrollments.map((e) => e.cohortId);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: { not: user.id },
      ...(myCohortIds.length > 0 && !isSuperAdmin
        ? { cohortId: { notIn: myCohortIds } }
        : {}),
    },
    include: {
      user: { select: studentSelect },
      cohort: { select: { name: true, program: true } },
      stepProgress: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
    },
  });

  const students = enrollments.map((e) => ({
    ...e.user,
    cohortName: e.cohort.name,
    program: e.cohort.program,
    completedSteps: e.stepProgress.length,
    enrollmentStatus: e.status,
  }));

  return NextResponse.json({ students });
}

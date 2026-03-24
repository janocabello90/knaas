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

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type"); // "mi-cohorte" or "todos"

  // Get user's active enrollment cohort
  const activeEnrollment = user.enrollments.find(
    (e) => e.status === "ACTIVE" || e.status === "PENDING"
  );

  if (type === "mi-cohorte") {
    if (!activeEnrollment) {
      return NextResponse.json({ students: [], cohortName: null });
    }

    // Get all students in the same cohort
    const enrollments = await prisma.enrollment.findMany({
      where: {
        cohortId: activeEnrollment.cohortId,
        userId: { not: user.id },
      },
      include: {
        user: {
          select: {
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
          },
        },
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
      cohortName: activeEnrollment.cohort.name,
    });
  }

  // type === "todos" — all students from other cohorts
  const myCohortIds = user.enrollments.map((e) => e.cohortId);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: { not: user.id },
      ...(myCohortIds.length > 0
        ? { cohortId: { notIn: myCohortIds } }
        : {}),
    },
    include: {
      user: {
        select: {
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
        },
      },
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

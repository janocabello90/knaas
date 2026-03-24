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

// GET — sessions for the student's cohort (SUPERADMIN sees ALL)
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isSuperAdmin = user.role === "SUPERADMIN";

  const activeEnrollment = user.enrollments.find(
    (e) => e.status === "ACTIVE" || e.status === "PENDING"
  );

  // SUPERADMIN without enrollment sees ALL sessions
  // Regular student without enrollment sees nothing
  if (!activeEnrollment && !isSuperAdmin) {
    return NextResponse.json({ sessions: [] });
  }

  const whereClause = isSuperAdmin && !activeEnrollment
    ? {} // SUPERADMIN sees all
    : { cohortId: activeEnrollment!.cohortId };

  try {
    const sessions = await prisma.mentoringSession.findMany({
      where: whereClause,
      include: {
        cohort: { select: { name: true, program: true } },
        attendees: {
          where: { userId: user.id },
          select: { attended: true },
        },
      },
      orderBy: { date: "desc" },
    });

    const formatted = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date.toISOString(),
      stepNumber: s.stepNumber,
      zoomLink: s.zoomLink,
      expertName: s.expertName,
      objectives: (s as Record<string, unknown>).objectives as string | null,
      summary: s.summary,
      recordingUrl: s.recordingUrl,
      cohortName: s.cohort.name,
      attended: s.attendees[0]?.attended ?? null,
      isPast: new Date(s.date) < new Date(),
    }));

    return NextResponse.json({ sessions: formatted });
  } catch (err) {
    console.error("Error fetching alumno mentorias:", err);
    return NextResponse.json({ sessions: [] });
  }
}

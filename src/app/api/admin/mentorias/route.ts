import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
  });
  if (!user || user.role !== "SUPERADMIN") return null;
  return user;
}

// GET — all mentoring sessions
export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cohortId = url.searchParams.get("cohortId");

  const sessions = await prisma.mentoringSession.findMany({
    where: cohortId ? { cohortId } : {},
    include: {
      cohort: { select: { name: true, program: true } },
      attendees: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, photo: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const cohorts = await prisma.cohort.findMany({
    where: { status: { in: ["ACTIVE", "DRAFT"] } },
    select: { id: true, name: true, program: true },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ sessions, cohorts });
}

// POST — create a new mentoring session
export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }
    if (!body.cohortId) {
      return NextResponse.json({ error: "Selecciona una cohorte" }, { status: 400 });
    }
    if (!body.date) {
      return NextResponse.json({ error: "La fecha es obligatoria" }, { status: 400 });
    }

    const session = await prisma.mentoringSession.create({
      data: {
        title: body.title.trim(),
        cohortId: body.cohortId,
        date: new Date(body.date),
        stepNumber: body.stepNumber ? parseInt(String(body.stepNumber)) : null,
        zoomLink: body.zoomLink?.trim() || null,
        expertName: body.expertName?.trim() || null,
        summary: body.summary?.trim() || null,
        recordingUrl: body.recordingUrl?.trim() || null,
      },
      include: {
        cohort: { select: { name: true, program: true } },
        attendees: true,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("Error creating session:", err);
    return NextResponse.json({ error: "Error al crear la sesión" }, { status: 500 });
  }
}

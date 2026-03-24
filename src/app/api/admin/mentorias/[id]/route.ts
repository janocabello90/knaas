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

// PUT — update session (add recording, summary, zoom link, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const updated = await prisma.mentoringSession.update({
      where: { id },
      data: {
        title: body.title?.trim(),
        date: body.date ? new Date(body.date) : undefined,
        stepNumber: body.stepNumber !== undefined ? (body.stepNumber ? parseInt(String(body.stepNumber)) : null) : undefined,
        zoomLink: body.zoomLink !== undefined ? (body.zoomLink?.trim() || null) : undefined,
        expertName: body.expertName !== undefined ? (body.expertName?.trim() || null) : undefined,
        summary: body.summary !== undefined ? (body.summary?.trim() || null) : undefined,
        recordingUrl: body.recordingUrl !== undefined ? (body.recordingUrl?.trim() || null) : undefined,
      },
      include: {
        cohort: { select: { name: true, program: true } },
        attendees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating session:", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.mentoringSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting session:", err);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

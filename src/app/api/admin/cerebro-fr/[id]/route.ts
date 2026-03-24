import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Program } from "@prisma/client";

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

// GET single document
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const doc = await prisma.cerebroDocument.findUnique({
    where: { id },
    include: { uploadedBy: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  return NextResponse.json(doc);
}

// PUT update document
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    const updated = await prisma.cerebroDocument.update({
      where: { id },
      data: {
        title: body.title?.trim(),
        description: body.description?.trim() || null,
        category: body.category,
        program: (body.program as Program) || null,
        stepNumber: body.stepNumber ? parseInt(String(body.stepNumber)) : null,
        tags: body.tags ?? [],
        content: body.content?.trim(),
      },
      include: { uploadedBy: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating cerebro doc:", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE document
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
    await prisma.cerebroDocument.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting cerebro doc:", err);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Program } from "@prisma/client";

type RequestBody = {
  title: string;
  description: string | null;
  category: string;
  program: Program | null;
  stepNumber: number | null;
  tags: string[];
  content: string;
};

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get user and verify SUPERADMIN role
    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para subir documentos" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: RequestBody = await request.json();

    // Validate required fields
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "El título es obligatorio" },
        { status: 400 }
      );
    }

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: "El contenido es obligatorio" },
        { status: 400 }
      );
    }

    if (!body.category || !body.category.trim()) {
      return NextResponse.json(
        { error: "La categoría es obligatoria" },
        { status: 400 }
      );
    }

    // Validate stepNumber if provided
    if (body.stepNumber != null && (body.stepNumber < 0 || body.stepNumber > 13)) {
      return NextResponse.json(
        { error: "El paso debe estar entre 0 y 13" },
        { status: 400 }
      );
    }

    // Create document in database
    const cerebroDoc = await prisma.cerebroDocument.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        category: body.category,
        program: body.program || null,
        stepNumber: body.stepNumber || null,
        tags: body.tags,
        content: body.content.trim(),
        fileName: "manual-entry",
        fileUrl: "#",
        uploadedById: user.id,
      },
      include: {
        uploadedBy: true,
      },
    });

    return NextResponse.json(cerebroDoc, { status: 201 });
  } catch (error: unknown) {
    console.error("Cerebro FR upload error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

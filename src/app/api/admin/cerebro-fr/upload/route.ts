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

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return result.text;
    } catch (err) {
      console.error("PDF parse error:", err);
      throw new Error("No se pudo leer el PDF. Asegúrate de que no está protegido.");
    }
  }

  if (ext === "docx" || ext === "doc") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (err) {
      console.error("DOCX parse error:", err);
      throw new Error("No se pudo leer el archivo Word.");
    }
  }

  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Formato no soportado: .${ext}. Usa PDF, DOCX, TXT o MD.`);
}

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string;
    const program = formData.get("program") as string | null;
    const stepNumber = formData.get("stepNumber") as string | null;
    const tags = formData.get("tags") as string | null;

    if (!title?.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo no puede superar los 10MB" },
        { status: 400 }
      );
    }

    // Extract text from file
    const extractedText = await extractTextFromFile(file);

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "No se pudo extraer texto del archivo. ¿Está vacío o es un escaneado?" },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const supabase = await createSupabaseServerClient();
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `cerebro-fr/${timestamp}_${safeName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    let fileUrl = "#";
    if (uploadError) {
      console.warn("Storage upload failed (may not be configured):", uploadError.message);
      fileUrl = `pending://${safeName}`;
    } else {
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(uploadData.path);
      fileUrl = urlData.publicUrl;
    }

    // Parse tags
    const parsedTags = tags
      ? tags.split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0)
      : [];

    // Parse step number
    const parsedStep = stepNumber ? parseInt(stepNumber, 10) : null;
    if (parsedStep && (parsedStep < 1 || parsedStep > 16)) {
      return NextResponse.json({ error: "El paso debe estar entre 1 y 16" }, { status: 400 });
    }

    // Create document
    const doc = await prisma.cerebroDocument.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "referencia",
        program: (program as Program) || null,
        stepNumber: parsedStep,
        tags: parsedTags,
        content: extractedText,
        fileName: file.name,
        fileUrl,
        uploadedById: admin.id,
      },
      include: { uploadedBy: true },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Error al subir el archivo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

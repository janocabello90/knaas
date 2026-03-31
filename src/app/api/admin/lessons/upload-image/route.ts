import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 });
    }

    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 5MB" },
        { status: 400 }
      );
    }

    // Use service role key for storage operations (anon key doesn't have storage permissions)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${timestamp}_${safeName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Try to create bucket if it doesn't exist (idempotent)
    const { error: bucketError } = await supabaseAdmin.storage.createBucket("lesson-images", {
      public: true,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"],
      fileSizeLimit: 5 * 1024 * 1024,
    });

    if (bucketError && !bucketError.message.includes("already exists")) {
      console.error("Bucket creation error:", bucketError.message);
      // Continue anyway — bucket may already exist with a different error message
    }

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("lesson-images")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError.message);
      return NextResponse.json(
        { error: `Error al subir: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("lesson-images")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
  } catch (err) {
    console.error("Image upload error:", err);
    const message = err instanceof Error ? err.message : "Error al subir la imagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

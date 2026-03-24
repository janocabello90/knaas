import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Auth check
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Check if API key exists and return masked version
    const apiKey = user.apiKeyEncrypted;
    const hasApiKey = !!apiKey;
    const masked = hasApiKey && apiKey
      ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`
      : null;

    return NextResponse.json({
      exists: hasApiKey,
      masked,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        photo: user.photo,
        bio: user.bio,
        phone: user.phone,
        city: user.city,
        province: user.province,
        country: user.country,
        specialty: user.specialty,
        yearsExperience: user.yearsExperience,
        linkedinUrl: user.linkedinUrl,
        instagramUrl: user.instagramUrl,
      },
    });
  } catch (error: unknown) {
    console.error("Ajustes GET error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    // Get user
    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { apiKey } = body as { apiKey: string };

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        { error: "La API key no puede estar vacía" },
        { status: 400 }
      );
    }

    // Update user's API key
    // NOTE: For MVP, we store plain text. In production, encrypt this with a proper key management service
    // TODO: Implement proper encryption (e.g., AES-256 with KMS or similar)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        apiKeyEncrypted: apiKey.trim(),
      },
    });

    // Return masked version
    const key = updatedUser.apiKeyEncrypted ?? "";
    const masked = `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;

    return NextResponse.json({
      exists: true,
      masked,
      profile: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error: unknown) {
    console.error("Ajustes POST error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PUT: Update profile ─────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Only SUPERADMIN and MENTOR can use this endpoint
    if (user.role !== "SUPERADMIN" && user.role !== "MENTOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.photo !== undefined) updateData.photo = body.photo;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.province !== undefined) updateData.province = body.province;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.specialty !== undefined) updateData.specialty = body.specialty;
    if (body.yearsExperience !== undefined) updateData.yearsExperience = body.yearsExperience;
    if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl;
    if (body.instagramUrl !== undefined) updateData.instagramUrl = body.instagramUrl;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      profile: {
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
        photo: updated.photo,
        bio: updated.bio,
        phone: updated.phone,
        city: updated.city,
        province: updated.province,
        country: updated.country,
        specialty: updated.specialty,
        yearsExperience: updated.yearsExperience,
        linkedinUrl: updated.linkedinUrl,
        instagramUrl: updated.instagramUrl,
      },
    });
  } catch (error: unknown) {
    console.error("Ajustes PUT error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const hasApiKey = !!user.apiKeyEncrypted;
    const masked = hasApiKey
      ? `${user.apiKeyEncrypted.substring(0, 10)}...${user.apiKeyEncrypted.substring(user.apiKeyEncrypted.length - 4)}`
      : null;

    return NextResponse.json({
      exists: hasApiKey,
      masked,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
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
    const masked = `${updatedUser.apiKeyEncrypted.substring(0, 10)}...${updatedUser.apiKeyEncrypted.substring(updatedUser.apiKeyEncrypted.length - 4)}`;

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

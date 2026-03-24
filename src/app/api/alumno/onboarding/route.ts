import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await request.json();

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        firstName: body.firstName?.trim() || dbUser.firstName,
        lastName: body.lastName?.trim() || dbUser.lastName,
        phone: body.phone?.trim() || null,
        photo: body.photo || null,
        bio: body.bio?.trim() || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        city: body.city?.trim() || null,
        province: body.province?.trim() || null,
        country: body.country?.trim() || "España",
        linkedinUrl: body.linkedinUrl?.trim() || null,
        instagramUrl: body.instagramUrl?.trim() || null,
        yearsExperience: body.yearsExperience ?? null,
        specialty: body.specialty?.trim() || null,
        motivation: body.motivation?.trim() || null,
        onboardingDone: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Onboarding error:", error);
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

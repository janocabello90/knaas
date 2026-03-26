import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    select: { id: true },
  });
  return dbUser?.id ?? null;
}

const VALID_PURPOSES = ["terms", "privacy", "ai_processing", "marketing", "cookies_analytics"];
const CURRENT_VERSION = "1.0";

// GET — Return all consents for the logged-in user
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const consents = await prisma.userConsent.findMany({
      where: { userId },
      select: { purpose: true, granted: true, version: true, grantedAt: true, revokedAt: true },
    });

    // Build a map with all purposes (default false if not found)
    const map: Record<string, { granted: boolean; version: string; grantedAt: string | null }> = {};
    for (const p of VALID_PURPOSES) {
      const found = consents.find((c) => c.purpose === p);
      map[p] = {
        granted: found?.granted ?? false,
        version: found?.version ?? CURRENT_VERSION,
        grantedAt: found?.grantedAt?.toISOString() ?? null,
      };
    }

    return NextResponse.json({ consents: map, requiredVersion: CURRENT_VERSION });
  } catch (error) {
    console.error("[Consents] GET error:", error);
    return NextResponse.json({ error: "Error al cargar consentimientos" }, { status: 500 });
  }
}

// PUT — Update consent(s) for the logged-in user
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { consents } = body as { consents: Record<string, boolean> };

    if (!consents || typeof consents !== "object") {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;
    const now = new Date();

    const results = [];
    for (const [purpose, granted] of Object.entries(consents)) {
      if (!VALID_PURPOSES.includes(purpose)) continue;

      const existing = await prisma.userConsent.findUnique({
        where: { userId_purpose: { userId, purpose } },
      });

      if (existing) {
        // Update
        const updated = await prisma.userConsent.update({
          where: { userId_purpose: { userId, purpose } },
          data: {
            granted,
            version: CURRENT_VERSION,
            ip,
            userAgent,
            grantedAt: granted ? now : existing.grantedAt,
            revokedAt: !granted ? now : null,
          },
        });
        results.push(updated);
      } else {
        // Create
        const created = await prisma.userConsent.create({
          data: {
            userId,
            purpose,
            granted,
            version: CURRENT_VERSION,
            ip,
            userAgent,
            grantedAt: now,
            revokedAt: !granted ? now : null,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({ ok: true, updated: results.length });
  } catch (error) {
    console.error("[Consents] PUT error:", error);
    return NextResponse.json({ error: "Error al guardar consentimientos" }, { status: 500 });
  }
}

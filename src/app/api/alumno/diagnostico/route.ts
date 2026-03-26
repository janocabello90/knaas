import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    select: { id: true },
  });

  return dbUser?.id ?? null;
}

// GET /api/alumno/diagnostico?year=2026
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const year = parseInt(request.nextUrl.searchParams.get("year") || String(new Date().getFullYear()));

    const record = await prisma.diagnosticData.findUnique({
      where: { userId_year: { userId, year } },
    });

    return NextResponse.json({
      year,
      data: record?.data ?? {},
      updatedAt: record?.updatedAt ?? null,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/alumno/diagnostico error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// PUT /api/alumno/diagnostico  body: { year, data }
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const year = body.year || new Date().getFullYear();
    const data = body.data;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "data es requerido" }, { status: 400 });
    }

    // Upsert: create or merge
    const existing = await prisma.diagnosticData.findUnique({
      where: { userId_year: { userId, year } },
    });

    if (existing) {
      // Deep merge: preserve keys not in the new data
      const merged = { ...(existing.data as Record<string, unknown>), ...data };
      await prisma.diagnosticData.update({
        where: { id: existing.id },
        data: { data: merged },
      });
    } else {
      await prisma.diagnosticData.create({
        data: { userId, year, data },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("PUT /api/alumno/diagnostico error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

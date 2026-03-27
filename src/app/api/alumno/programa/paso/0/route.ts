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

// We store Paso 0 data in DiagnosticData with year = 0 (special sentinel)
const PASO_0_YEAR = 0;

// GET /api/alumno/programa/paso/0
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const record = await prisma.diagnosticData.findUnique({
      where: { userId_year: { userId, year: PASO_0_YEAR } },
    });

    return NextResponse.json(record?.data ?? {});
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/alumno/programa/paso/0 error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// PUT /api/alumno/programa/paso/0  body: { ejercicio1, ejercicio2 }
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body es requerido" }, { status: 400 });
    }

    const existing = await prisma.diagnosticData.findUnique({
      where: { userId_year: { userId, year: PASO_0_YEAR } },
    });

    if (existing) {
      const merged = { ...(existing.data as Record<string, unknown>), ...body };
      await prisma.diagnosticData.update({
        where: { id: existing.id },
        data: { data: merged },
      });
    } else {
      await prisma.diagnosticData.create({
        data: { userId, year: PASO_0_YEAR, data: body },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("PUT /api/alumno/programa/paso/0 error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Auto-create table if it doesn't exist ──
async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS graduation_rsvp (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      attendance TEXT NOT NULL DEFAULT 'no_se',
      guests INT NOT NULL DEFAULT 0,
      guest_names TEXT,
      allergies TEXT,
      dietary_notes TEXT,
      comments TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id, cohort_id)
    )
  `);
}

// GET — fetch current user's RSVP
export async function GET() {
  try {
    const user = await requireRole(["ALUMNO"]);
    await ensureTable();

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: user.id },
      include: { cohort: true },
    });

    if (!enrollment) {
      return NextResponse.json({ rsvp: null });
    }

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM graduation_rsvp WHERE user_id = $1::uuid AND cohort_id = $2::uuid LIMIT 1`,
      user.id,
      enrollment.cohortId
    );

    return NextResponse.json({
      rsvp: rows[0] ?? null,
      cohort: {
        id: enrollment.cohort.id,
        name: enrollment.cohort.name,
        endDate: enrollment.cohort.endDate,
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/alumno/graduacion error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

// POST — create or update RSVP
export async function POST(req: Request) {
  try {
    const user = await requireRole(["ALUMNO"]);
    await ensureTable();

    const body = await req.json();
    const { attendance, guests, guestNames, allergies, dietaryNotes, comments } = body;

    if (!attendance || !["si", "no", "no_se"].includes(attendance)) {
      return NextResponse.json(
        { error: "Respuesta de asistencia no válida" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: user.id },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "No tienes matrícula activa" },
        { status: 400 }
      );
    }

    // Upsert
    await prisma.$executeRawUnsafe(
      `INSERT INTO graduation_rsvp (user_id, cohort_id, attendance, guests, guest_names, allergies, dietary_notes, comments, updated_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, now())
       ON CONFLICT (user_id, cohort_id) DO UPDATE SET
         attendance = EXCLUDED.attendance,
         guests = EXCLUDED.guests,
         guest_names = EXCLUDED.guest_names,
         allergies = EXCLUDED.allergies,
         dietary_notes = EXCLUDED.dietary_notes,
         comments = EXCLUDED.comments,
         updated_at = now()`,
      user.id,
      enrollment.cohortId,
      attendance,
      guests ?? 0,
      guestNames ?? null,
      allergies ?? null,
      dietaryNotes ?? null,
      comments ?? null
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("POST /api/alumno/graduacion error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

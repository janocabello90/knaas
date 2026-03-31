import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list all RSVPs (admin only)
export async function GET(req: Request) {
  try {
    await requireRole(["SUPERADMIN"]);

    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get("cohortId");

    // Ensure table exists
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

    let query = `
      SELECT
        r.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        c.name as cohort_name
      FROM graduation_rsvp r
      JOIN users u ON u.id = r.user_id
      JOIN cohorts c ON c.id = r.cohort_id
    `;
    const params: unknown[] = [];

    if (cohortId) {
      query += ` WHERE r.cohort_id = $1::uuid`;
      params.push(cohortId);
    }

    query += ` ORDER BY r.attendance ASC, u.last_name ASC`;

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(query, ...params);

    // Summary stats
    const total = rows.length;
    const attending = rows.filter((r) => r.attendance === "si").length;
    const notAttending = rows.filter((r) => r.attendance === "no").length;
    const undecided = rows.filter((r) => r.attendance === "no_se").length;
    const totalGuests = rows
      .filter((r) => r.attendance === "si")
      .reduce((sum, r) => sum + (Number(r.guests) || 0), 0);
    const withAllergies = rows.filter(
      (r) => r.attendance === "si" && r.allergies && String(r.allergies).trim().length > 0
    ).length;

    return NextResponse.json({
      rsvps: rows,
      summary: {
        total,
        attending,
        notAttending,
        undecided,
        totalGuests,
        totalPeople: attending + totalGuests,
        withAllergies,
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/graduacion error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

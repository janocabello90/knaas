import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cron/send-scheduled
// Called by Vercel Cron or manually to send messages whose scheduled_at has passed.
// Also posts to Feed if the message was marked for feed posting.
export async function POST(req: NextRequest) {
  // Simple auth via secret header (for Vercel Cron)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find messages that are due but not yet sent
    const dueMessages = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
      SELECT id, subject, body, from_id, cohort_id, to_id, scheduled_at
      FROM messages
      WHERE sent = false
        AND scheduled_at IS NOT NULL
        AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 50
    `);

    if (dueMessages.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    // Mark them as sent
    const ids = dueMessages.map((m) => m.id as string);
    const placeholders = ids.map((_, i) => `$${i + 1}::uuid`).join(",");
    await prisma.$executeRawUnsafe(
      `UPDATE messages SET sent = true WHERE id IN (${placeholders})`,
      ...ids
    );

    return NextResponse.json({
      sent: dueMessages.length,
      ids,
    });
  } catch (err) {
    console.error("cron/send-scheduled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron (which uses GET by default)
export async function GET(req: NextRequest) {
  return POST(req);
}
// deploy trigger

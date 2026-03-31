import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── Ensure scheduled_at column exists ──
async function ensureScheduledColumn() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS sent BOOLEAN DEFAULT true
    `);
  } catch {
    // Column may already exist
  }
}

// GET - List all messages (sent by admins/mentors)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERADMIN" && user.role !== "MENTOR"))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureScheduledColumn();

  const { searchParams } = new URL(req.url);
  const cohortId = searchParams.get("cohortId");
  const showScheduled = searchParams.get("scheduled") === "true";

  const where: Record<string, unknown> = {};
  if (cohortId) where.cohortId = cohortId;

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      from: { select: { id: true, firstName: true, lastName: true, photo: true, role: true } },
      to: { select: { id: true, firstName: true, lastName: true, photo: true } },
      cohort: { select: { id: true, name: true, program: true } },
    },
  });

  // Enrich with scheduled_at and sent columns (not in Prisma schema)
  let enriched = messages;
  if (messages.length > 0) {
    try {
      const ids = messages.map((m) => m.id);
      const placeholders = ids.map((_, i) => `$${i + 1}::uuid`).join(",");
      const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT id, scheduled_at, sent FROM messages WHERE id IN (${placeholders})`,
        ...ids
      );
      const scheduleMap = new Map(rows.map((r) => [r.id as string, r]));
      enriched = messages.map((m) => {
        const extra = scheduleMap.get(m.id);
        return {
          ...m,
          scheduledAt: extra?.scheduled_at ?? null,
          sent: extra?.sent ?? true,
        };
      });
    } catch {
      // Columns might not exist yet
    }
  }

  // Filter: if showScheduled, show only pending scheduled; otherwise show sent
  const finalMessages = showScheduled
    ? enriched.filter((m: Record<string, unknown>) => m.scheduledAt && !m.sent)
    : enriched;

  // Fetch cohorts for the filter dropdown
  const cohorts = await prisma.cohort.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, program: true },
  });

  return NextResponse.json({ messages: finalMessages, cohorts });
}

// POST - Send a new message (broadcast to cohort, direct, or to feed)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERADMIN" && user.role !== "MENTOR"))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureScheduledColumn();

  const body = await req.json();
  const { subject, content, cohortId, toId, sendToFeed, scheduledAt } = body;

  if (!subject || !content) {
    return NextResponse.json({ error: "Asunto y mensaje son obligatorios" }, { status: 400 });
  }

  if (!cohortId && !toId && !sendToFeed) {
    return NextResponse.json({ error: "Debes elegir un destino: cohorte, alumno o feed" }, { status: 400 });
  }

  const isScheduled = !!scheduledAt;
  const scheduledDate = isScheduled ? new Date(scheduledAt) : null;

  // If scheduled in the past, just send immediately
  const shouldSendNow = !isScheduled || (scheduledDate && scheduledDate <= new Date());

  // ── Create message in Messages table ──
  const message = await prisma.message.create({
    data: {
      fromId: user.id,
      toId: toId || null,
      cohortId: cohortId || null,
      subject,
      body: content,
    },
    include: {
      from: { select: { id: true, firstName: true, lastName: true, photo: true, role: true } },
      to: { select: { id: true, firstName: true, lastName: true, photo: true } },
      cohort: { select: { id: true, name: true, program: true } },
    },
  });

  // Set scheduled_at and sent columns via raw SQL
  if (isScheduled && !shouldSendNow) {
    await prisma.$executeRawUnsafe(
      `UPDATE messages SET scheduled_at = $1, sent = false WHERE id = $2::uuid`,
      scheduledDate,
      message.id
    );
  }

  // ── Also post to Feed if requested ──
  if (sendToFeed && shouldSendNow) {
    try {
      // Ensure feed tables exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS feed_topics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(500) NOT NULL,
          body TEXT NOT NULL DEFAULT '',
          category VARCHAR(100) DEFAULT NULL,
          pinned BOOLEAN DEFAULT false,
          author_id VARCHAR(255) NOT NULL,
          reply_count INT DEFAULT 0,
          last_reply_at TIMESTAMPTZ DEFAULT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `INSERT INTO feed_topics (title, body, category, pinned, author_id)
         VALUES ($1, $2, $3, false, $4)
         RETURNING *`,
        subject,
        content,
        "anuncio",
        user.id
      );
    } catch (err) {
      console.error("Error posting to feed:", err);
      // Non-fatal: message was still created
    }
  }

  return NextResponse.json(
    { ...message, scheduledAt: isScheduled && !shouldSendNow ? scheduledAt : null, sent: shouldSendNow },
    { status: 201 }
  );
}

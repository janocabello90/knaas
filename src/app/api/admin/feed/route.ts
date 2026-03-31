import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Auto-create feed tables
async function ensureFeedTables() {
  try {
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
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS feed_replies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id UUID NOT NULL REFERENCES feed_topics(id) ON DELETE CASCADE,
        author_id VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_feed_replies_topic ON feed_replies(topic_id)
    `);
  } catch {
    // Tables might already exist
  }
}

// GET /api/admin/feed — List all topics
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await ensureFeedTables();

    const topics = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
      SELECT t.*,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.photo AS author_photo
      FROM feed_topics t
      LEFT JOIN users u ON u.id = t.author_id
      ORDER BY t.pinned DESC, t.created_at DESC
    `);

    return NextResponse.json({ topics });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/admin/feed error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// POST /api/admin/feed — Create a new topic
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await ensureFeedTables();

    const { title, body, category, pinned } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const result = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO feed_topics (title, body, category, pinned, author_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      title.trim(),
      body || "",
      category || null,
      pinned || false,
      user.id
    );

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/admin/feed error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

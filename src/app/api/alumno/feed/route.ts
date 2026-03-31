import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/alumno/feed — List all topics (for students)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const topics = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
      SELECT t.id, t.title, t.body, t.category, t.pinned,
        t.reply_count, t.last_reply_at, t.created_at,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.photo AS author_photo,
        u.role AS author_role
      FROM feed_topics t
      LEFT JOIN users u ON u.id = t.author_id
      ORDER BY t.pinned DESC, t.last_reply_at DESC NULLS LAST, t.created_at DESC
    `);

    return NextResponse.json({ topics });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    // If table doesn't exist yet, return empty
    if (errMsg.includes("does not exist")) {
      return NextResponse.json({ topics: [] });
    }
    console.error("GET /api/alumno/feed error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

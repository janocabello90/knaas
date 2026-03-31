import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/alumno/feed/[id] — Get topic + replies
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Get topic
    const topics = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
      SELECT t.*,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.photo AS author_photo,
        u.role AS author_role
      FROM feed_topics t
      LEFT JOIN users u ON u.id = t.author_id
      WHERE t.id = $1::uuid
    `, id);

    if (!topics?.length) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 });
    }

    // Get replies
    const replies = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
      SELECT r.*,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.photo AS author_photo,
        u.role AS author_role
      FROM feed_replies r
      LEFT JOIN users u ON u.id = r.author_id
      WHERE r.topic_id = $1::uuid
      ORDER BY r.created_at ASC
    `, id);

    return NextResponse.json({ topic: topics[0], replies });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/alumno/feed/[id] error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

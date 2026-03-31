import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/alumno/feed/[id]/reply — Reply to a topic
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { body } = await req.json();

    if (!body?.trim()) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    // Check topic exists
    const topics = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id FROM feed_topics WHERE id = $1::uuid`, id
    );
    if (!topics?.length) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 });
    }

    // Insert reply
    const reply = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO feed_replies (topic_id, author_id, body)
       VALUES ($1::uuid, $2, $3)
       RETURNING *`,
      id, user.id, body.trim()
    );

    // Update topic counters
    await prisma.$executeRawUnsafe(
      `UPDATE feed_topics SET reply_count = reply_count + 1, last_reply_at = NOW(), updated_at = NOW() WHERE id = $1::uuid`,
      id
    );

    return NextResponse.json(reply[0], { status: 201 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/alumno/feed/[id]/reply error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

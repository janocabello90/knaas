import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// PUT /api/admin/feed/[id] — Update topic
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { title, body, category, pinned } = await req.json();

    const updates: string[] = [];
    const values: unknown[] = [id];
    let p = 2;

    if (title !== undefined) { updates.push(`title = $${p}`); values.push(title); p++; }
    if (body !== undefined) { updates.push(`body = $${p}`); values.push(body); p++; }
    if (category !== undefined) { updates.push(`category = $${p}`); values.push(category); p++; }
    if (pinned !== undefined) { updates.push(`pinned = $${p}`); values.push(pinned); p++; }
    updates.push(`updated_at = NOW()`);

    const result = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE feed_topics SET ${updates.join(", ")} WHERE id = $1::uuid RETURNING *`,
      ...values
    );

    if (!result?.length) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// DELETE /api/admin/feed/[id] — Delete topic (cascades replies)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const result = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `DELETE FROM feed_topics WHERE id = $1::uuid RETURNING id`,
      id
    );

    if (!result?.length) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

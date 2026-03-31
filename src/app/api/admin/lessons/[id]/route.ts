import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/lessons/[id] - Get single lesson by id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const lesson = await prisma.$queryRawUnsafe(
      `SELECT * FROM lesson_content WHERE id = $1`,
      id
    );

    if (!lesson || lesson.length === 0) {
      return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });
    }

    return NextResponse.json(lesson[0]);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/admin/lessons/[id] error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// PUT /api/admin/lessons/[id] - Update lesson
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
    const body = await req.json();
    const { title, subtitle, blocks, published } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [id];
    let paramCount = 2;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }
    if (subtitle !== undefined) {
      updates.push(`subtitle = $${paramCount}`);
      values.push(subtitle);
      paramCount++;
    }
    if (blocks !== undefined) {
      updates.push(`blocks = $${paramCount}`);
      values.push(JSON.stringify(blocks));
      paramCount++;
    }
    if (published !== undefined) {
      updates.push(`published = $${paramCount}`);
      values.push(published);
      paramCount++;
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at was set
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const result = await prisma.$queryRawUnsafe(
      `UPDATE lesson_content SET ${updates.join(", ")} WHERE id = $1 RETURNING *`,
      ...values
    );

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("PUT /api/admin/lessons/[id] error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// DELETE /api/admin/lessons/[id] - Delete lesson
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const result = await prisma.$queryRawUnsafe(
      `DELETE FROM lesson_content WHERE id = $1 RETURNING *`,
      id
    );

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("DELETE /api/admin/lessons/[id] error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

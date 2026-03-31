import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/alumno/programa/paso/[step]/lessons - Get published lessons for a step
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ step: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ALUMNO" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { step } = await params;
    const stepNumber = parseInt(step, 10);

    if (isNaN(stepNumber)) {
      return NextResponse.json({ error: "step debe ser un número" }, { status: 400 });
    }

    // Get phase from query params, default to 'saber'
    const { searchParams } = new URL(req.url);
    const phase = searchParams.get("phase") || "saber";

    const lessons = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM lesson_content
       WHERE step_number = $1 AND phase = $2 AND published = true
       ORDER BY lesson_number ASC`,
      stepNumber,
      phase
    );

    return NextResponse.json({ lessons });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/alumno/programa/paso/[step]/lessons error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

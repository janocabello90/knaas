import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/lessons - List all lessons
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Auto-create lesson_content table if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS lesson_content (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          step_number INT NOT NULL,
          phase VARCHAR(20) NOT NULL DEFAULT 'saber',
          lesson_number INT NOT NULL DEFAULT 0,
          title VARCHAR(500) NOT NULL DEFAULT '',
          subtitle VARCHAR(500) DEFAULT '',
          blocks JSONB NOT NULL DEFAULT '[]',
          published BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(step_number, phase, lesson_number)
        )
      `);
    } catch (error) {
      // Table might already exist, which is fine
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const stepNumber = searchParams.get("stepNumber");
    const phase = searchParams.get("phase");

    interface WhereClause {
      step_number?: number;
      phase?: string;
    }

    const where: WhereClause = {};
    if (stepNumber) where.step_number = parseInt(stepNumber, 10);
    if (phase) where.phase = phase;

    const lessons = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM lesson_content ${
        Object.keys(where).length > 0
          ? `WHERE ${Object.entries(where)
              .map(([key, val]) => {
                if (key === "step_number") return `step_number = ${val}`;
                if (key === "phase") return `phase = '${val}'`;
                return "";
              })
              .filter(Boolean)
              .join(" AND ")}`
          : ""
      } ORDER BY step_number ASC, phase ASC, lesson_number ASC`
    );

    return NextResponse.json({ lessons });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/admin/lessons error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// POST /api/admin/lessons - Create new lesson
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { stepNumber, phase = "saber", lessonNumber = 0, title = "", subtitle = "", blocks = [], published = false } = body;

    if (stepNumber === undefined || stepNumber === null) {
      return NextResponse.json({ error: "stepNumber es requerido" }, { status: 400 });
    }

    const result = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO lesson_content (step_number, phase, lesson_number, title, subtitle, blocks, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      stepNumber,
      phase,
      lessonNumber,
      title,
      subtitle,
      JSON.stringify(blocks),
      published
    );

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/admin/lessons error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

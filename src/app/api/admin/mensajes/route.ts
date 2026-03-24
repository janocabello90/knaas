import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET - List all messages (sent by admins/mentors)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERADMIN" && user.role !== "MENTOR"))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cohortId = searchParams.get("cohortId");

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

  // Fetch cohorts for the filter dropdown
  const cohorts = await prisma.cohort.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, program: true },
  });

  return NextResponse.json({ messages, cohorts });
}

// POST - Send a new message (broadcast to cohort or direct to user)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERADMIN" && user.role !== "MENTOR"))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { subject, content, cohortId, toId } = body;

  if (!subject || !content) {
    return NextResponse.json({ error: "Asunto y mensaje son obligatorios" }, { status: 400 });
  }

  if (!cohortId && !toId) {
    return NextResponse.json({ error: "Debes elegir una cohorte o un destinatario" }, { status: 400 });
  }

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

  return NextResponse.json(message, { status: 201 });
}

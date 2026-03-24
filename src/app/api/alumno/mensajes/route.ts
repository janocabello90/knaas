import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET - Get messages for current student (direct + cohort broadcasts)
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Find student's cohort(s)
  const enrollments = user.enrollments || [];
  const cohortIds = enrollments.map((e) => e.cohortId);

  // Get messages: direct to this user OR broadcast to their cohort(s)
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { toId: user.id },
        { cohortId: { in: cohortIds }, toId: null },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      from: { select: { id: true, firstName: true, lastName: true, photo: true, role: true } },
      cohort: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ messages });
}

// POST - Mark message as read
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { messageId } = await req.json();
  if (!messageId) return NextResponse.json({ error: "messageId es obligatorio" }, { status: 400 });

  await prisma.message.update({
    where: { id: messageId },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

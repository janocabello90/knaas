import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - count of unread messages for current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ count: 0 });

  const isSuperAdmin = user.role === "SUPERADMIN";
  const enrollments = user.enrollments || [];
  const cohortIds = enrollments.map((e) => e.cohortId);

  const whereClause = isSuperAdmin && cohortIds.length === 0
    ? { readAt: null }
    : {
        readAt: null,
        OR: [
          { toId: user.id },
          ...(cohortIds.length > 0 ? [{ cohortId: { in: cohortIds }, toId: null }] : []),
          ...(isSuperAdmin ? [{ toId: null }] : []),
        ],
      };

  const count = await prisma.message.count({ where: whereClause });

  return NextResponse.json({ count });
}

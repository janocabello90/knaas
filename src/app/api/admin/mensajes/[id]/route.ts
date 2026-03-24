import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// DELETE - Remove a message
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPERADMIN" && user.role !== "MENTOR"))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  await prisma.message.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

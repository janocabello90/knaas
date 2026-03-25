import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check auth - SUPERADMIN only
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userRole?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { isActive, maxUses, expiresAt } = await request.json();

    // Build update data
    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (expiresAt !== undefined)
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    // Update invitation
    const invitation = await prisma.invitationLink.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cohort: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(invitation);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Invitation link not found" },
        { status: 404 }
      );
    }

    console.error("Error updating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check auth - SUPERADMIN only
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userRole?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete invitation
    await prisma.invitationLink.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Invitation link not found" },
        { status: 404 }
      );
    }

    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Generate unique 8-character code
function generateUniqueCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
}

export async function GET(request: NextRequest) {
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

    // Get all students with their enrollment and billing info
    const students = await prisma.user.findMany({
      where: { role: "ALUMNO" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        lastLogin: true,
        enrollments: {
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            subscriptionType: true,
            cohort: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        billingInfo: {
          select: {
            nifCif: true,
            fiscalName: true,
            businessType: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate payment summary for each student
    const studentsWithPaymentSummary = students.map((student) => {
      const totalPaid = student.payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + p.amount, 0);

      const pending = student.payments
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        ...student,
        paymentSummary: {
          totalPaid,
          pending,
        },
      };
    });

    // Get all invitation links with cohort info and usage stats
    const invitations = await prisma.invitationLink.findMany({
      select: {
        id: true,
        code: true,
        type: true,
        cohortId: true,
        cohort: {
          select: {
            id: true,
            name: true,
          },
        },
        email: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        isActive: true,
        price: true,
        installmentsOk: true,
        createdBy: true,
        createdAt: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const stats = {
      totalStudents: students.length,
      active: students.filter((s) =>
        s.enrollments.some((e) => e.status === "ACTIVE")
      ).length,
      pending: students.filter((s) =>
        s.enrollments.some((e) => e.status === "PENDING")
      ).length,
      totalRevenue: studentsWithPaymentSummary.reduce(
        (sum, s) => sum + s.paymentSummary.totalPaid,
        0
      ),
    };

    return NextResponse.json({
      students: studentsWithPaymentSummary,
      invitations,
      stats,
    });
  } catch (error) {
    console.error("Error fetching accesos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const {
      type,
      cohortId,
      email,
      maxUses,
      expiresAt,
      price,
      installmentsOk,
    } = await request.json();

    // Validate required fields
    if (!type || !cohortId || !maxUses) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["PAYMENT", "FREE"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid invitation type" },
        { status: 400 }
      );
    }

    // Generate unique code
    let code = generateUniqueCode();
    let existingCode = await prisma.invitationLink.findUnique({
      where: { code },
    });

    while (existingCode) {
      code = generateUniqueCode();
      existingCode = await prisma.invitationLink.findUnique({
        where: { code },
      });
    }

    // Create invitation link
    const invitation = await prisma.invitationLink.create({
      data: {
        code,
        type,
        cohortId,
        email: email || null,
        maxUses,
        usedCount: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        price: price || null,
        installmentsOk: installmentsOk || false,
        createdBy: user.id,
      },
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

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

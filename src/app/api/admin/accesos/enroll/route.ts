import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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

    const dbAdmin = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, role: true },
    });

    if (!dbAdmin || dbAdmin.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, firstName, lastName, cohortId, subscriptionType, paymentMethod } =
      await request.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !cohortId || !subscriptionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if cohort exists
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) {
      return NextResponse.json(
        { error: "Cohort not found" },
        { status: 404 }
      );
    }

    // Check if user exists
    let dbUser = await prisma.user.findUnique({
      where: { email },
    });

    // Create user if doesn't exist
    if (!dbUser) {
      // Generate temporary password
      const tempPassword = crypto.randomBytes(12).toString("hex");

      // Create auth user in Supabase
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: false,
          user_metadata: {
            firstName,
            lastName,
          },
        });

      if (authError || !authUser.user) {
        console.error("Error creating auth user:", authError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 400 }
        );
      }

      // Create database user
      dbUser = await prisma.user.create({
        data: {
          supabaseAuthId: authUser.user.id,
          email,
          firstName,
          lastName,
          role: "ALUMNO",
        },
      });
    }

    // Check if already enrolled in this cohort
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        cohortId,
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Student already enrolled in this cohort" },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: dbUser.id,
        cohortId,
        status: "ACTIVE",
        subscriptionType,
        paymentMethod: paymentMethod || null,
        enrolledAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        cohort: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

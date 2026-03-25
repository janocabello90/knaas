import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  sendTransferPending,
  sendTransferVerified,
  sendPaymentRefunded,
} from "@/lib/emails/send";

async function getAuthAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "SUPERADMIN") return null;
  return dbUser;
}

// GET — List all payments with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const method = searchParams.get("method"); // STRIPE | TRANSFERENCIA
    const cohortId = searchParams.get("cohortId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (method) where.method = method;
    if (cohortId) where.cohortId = cohortId;
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { nifCif: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        currency: true,
        type: true,
        method: true,
        status: true,
        installmentNumber: true,
        totalInstallments: true,
        stripePaymentIntentId: true,
        stripeSessionId: true,
        invoiceNumber: true,
        notes: true,
        paidAt: true,
        refundedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photo: true,
            nifCif: true,
            fiscalName: true,
            businessType: true,
          },
        },
        cohort: {
          select: { id: true, name: true },
        },
        enrollment: {
          select: { id: true, subscriptionType: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Cohorts for filter
    const cohorts = await prisma.cohort.findMany({
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    });

    // Stats
    const allPayments = await prisma.payment.findMany({
      select: { amount: true, status: true, method: true },
    });

    const stats = {
      totalRevenue: allPayments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: allPayments
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + p.amount, 0),
      totalPayments: allPayments.length,
      completedPayments: allPayments.filter((p) => p.status === "COMPLETED").length,
      pendingTransfers: allPayments.filter(
        (p) => p.status === "PENDING" && p.method === "TRANSFERENCIA"
      ).length,
      refundedAmount: allPayments
        .filter((p) => p.status === "REFUNDED")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    // Students for the create modal
    const students = await prisma.user.findMany({
      where: { role: "ALUMNO" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        enrollments: {
          select: {
            id: true,
            cohort: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { firstName: "asc" },
    });

    return NextResponse.json({ payments, cohorts, stats, students });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Create payment(s): single or installments, Stripe link or transfer
export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      cohortId,
      enrollmentId,
      totalAmount,
      method,       // "STRIPE" | "TRANSFERENCIA"
      type,         // "SINGLE" | "INSTALLMENT"
      installments, // 1-6
      invoicePrefix,
      notes,
    } = body;

    if (!userId || !totalAmount || !method) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (userId, totalAmount, method)" },
        { status: 400 }
      );
    }

    const numInstallments = type === "INSTALLMENT" && installments > 1 ? installments : 1;
    const perInstallment = Math.round((totalAmount / numInstallments) * 100) / 100;

    const createdPayments = [];

    for (let i = 1; i <= numInstallments; i++) {
      // Adjust last installment for rounding
      const amount = i === numInstallments
        ? Math.round((totalAmount - perInstallment * (numInstallments - 1)) * 100) / 100
        : perInstallment;

      const invoiceNumber = invoicePrefix
        ? `${invoicePrefix}-${String(i).padStart(2, "0")}`
        : null;

      const payment = await prisma.payment.create({
        data: {
          userId,
          cohortId: cohortId || null,
          enrollmentId: enrollmentId || null,
          amount,
          currency: "EUR",
          type: numInstallments > 1 ? "INSTALLMENT" : "SINGLE",
          method,
          status: "PENDING",
          installmentNumber: numInstallments > 1 ? i : null,
          totalInstallments: numInstallments > 1 ? numInstallments : null,
          invoiceNumber,
          notes: notes || null,
        },
      });

      createdPayments.push(payment);
    }

    // Send email notification for transfer payments
    if (method === "TRANSFERENCIA") {
      const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });
      const cohort = cohortId
        ? await prisma.cohort.findUnique({ where: { id: cohortId }, select: { name: true } })
        : null;

      if (student?.email) {
        // Send email for first payment (or single payment)
        const firstPayment = createdPayments[0];
        sendTransferPending(student.email, {
          firstName: student.firstName || "Alumno/a",
          amount: firstPayment.amount,
          currency: "EUR",
          cohortName: cohort?.name || undefined,
          invoiceNumber: firstPayment.invoiceNumber || undefined,
          installmentNumber: firstPayment.installmentNumber || undefined,
          totalInstallments: firstPayment.totalInstallments || undefined,
        }).catch((err) => console.error("[Email] Failed to send transfer pending:", err));
      }
    }

    return NextResponse.json(
      { payments: createdPayments, count: createdPayments.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — Verify a transfer payment (mark as COMPLETED) or generate Stripe link
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, action } = body;
    // action: "verify_transfer" | "mark_failed" | "refund"

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: "Faltan campos (paymentId, action)" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
        cohort: { select: { name: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    let updated;

    switch (action) {
      case "verify_transfer":
        updated = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "COMPLETED",
            paidAt: new Date(),
            notes: payment.notes
              ? `${payment.notes}\n✅ Transferencia verificada por admin`
              : "✅ Transferencia verificada por admin",
          },
        });
        // Send verification email
        if (payment.user?.email) {
          sendTransferVerified(payment.user.email, {
            firstName: payment.user.firstName || "Alumno/a",
            amount: payment.amount,
            currency: payment.currency,
            cohortName: payment.cohort?.name || undefined,
            invoiceNumber: payment.invoiceNumber || undefined,
          }).catch((err) => console.error("[Email] Failed to send transfer verified:", err));
        }
        break;

      case "mark_failed":
        updated = await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "FAILED" },
        });
        break;

      case "refund":
        updated = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
          },
        });
        // Send refund email
        if (payment.user?.email) {
          sendPaymentRefunded(payment.user.email, {
            firstName: payment.user.firstName || "Alumno/a",
            amount: payment.amount,
            currency: payment.currency,
            invoiceNumber: payment.invoiceNumber || undefined,
          }).catch((err) => console.error("[Email] Failed to send refund email:", err));
        }
        break;

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

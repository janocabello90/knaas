import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  sendTransferPending,
  sendTransferVerified,
  sendPaymentRefunded,
} from "@/lib/emails/send";

// IVA calculation: el importe se introduce SIN IVA, se añade el 21%
const IVA_RATE = 21; // %

function calculateIva(baseAmount: number) {
  const ivaAmount = Math.round((baseAmount * IVA_RATE / 100) * 100) / 100;
  const totalAmount = Math.round((baseAmount + ivaAmount) * 100) / 100;
  return { baseAmount, ivaRate: IVA_RATE, ivaAmount, totalAmount };
}

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
    const method = searchParams.get("method");
    const cohortId = searchParams.get("cohortId");
    const search = searchParams.get("search");

    // ── Payments (defensive — table/columns may not exist yet) ──
    let payments: unknown[] = [];
    let stats = {
      totalRevenue: 0, totalBase: 0, totalIva: 0,
      pendingAmount: 0, totalPayments: 0, completedPayments: 0,
      pendingTransfers: 0, refundedAmount: 0,
    };

    try {
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

      payments = await prisma.payment.findMany({
        where,
        select: {
          id: true,
          baseAmount: true,
          ivaRate: true,
          ivaAmount: true,
          totalAmount: true,
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

      // Stats from all payments
      const allPayments = await prisma.payment.findMany({
        select: { baseAmount: true, ivaAmount: true, totalAmount: true, status: true, method: true },
      });

      stats = {
        totalRevenue: allPayments
          .filter((p) => p.status === "COMPLETED")
          .reduce((sum, p) => sum + p.totalAmount, 0),
        totalBase: allPayments
          .filter((p) => p.status === "COMPLETED")
          .reduce((sum, p) => sum + p.baseAmount, 0),
        totalIva: allPayments
          .filter((p) => p.status === "COMPLETED")
          .reduce((sum, p) => sum + p.ivaAmount, 0),
        pendingAmount: allPayments
          .filter((p) => p.status === "PENDING")
          .reduce((sum, p) => sum + p.totalAmount, 0),
        totalPayments: allPayments.length,
        completedPayments: allPayments.filter((p) => p.status === "COMPLETED").length,
        pendingTransfers: allPayments.filter(
          (p) => p.status === "PENDING" && p.method === "TRANSFERENCIA"
        ).length,
        refundedAmount: allPayments
          .filter((p) => p.status === "REFUNDED")
          .reduce((sum, p) => sum + p.totalAmount, 0),
      };
    } catch (err) {
      console.error("[Facturación] Error fetching payments:", err instanceof Error ? err.message : err);
    }

    // ── Cohorts (independent query) ──
    let cohorts: unknown[] = [];
    try {
      cohorts = await prisma.cohort.findMany({
        select: { id: true, name: true },
        orderBy: { startDate: "desc" },
      });
    } catch (err) {
      console.error("[Facturación] Error fetching cohorts:", err instanceof Error ? err.message : err);
    }

    // ── Students for create modal (independent query) ──
    let students: unknown[] = [];
    try {
      students = await prisma.user.findMany({
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
    } catch (err) {
      console.error("[Facturación] Error fetching students:", err instanceof Error ? err.message : err);
    }

    return NextResponse.json({ payments, cohorts, stats, students });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : "";
    console.error("Error fetching payments:", errMsg);
    console.error("Stack:", errStack);
    return NextResponse.json(
      { error: `Error al cargar pagos: ${errMsg}` },
      { status: 500 }
    );
  }
}

// POST — Create payment(s): single or installments, Stripe link or transfer
// baseAmount from the form is SIN IVA — se añade 21% encima
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
      baseAmount: totalBase, // Importe SIN IVA
      method,       // "STRIPE" | "TRANSFERENCIA"
      type,         // "SINGLE" | "INSTALLMENT"
      installments, // 1-6
      invoicePrefix,
      notes,
    } = body;

    if (!userId || !totalBase || !method) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (userId, baseAmount, method)" },
        { status: 400 }
      );
    }

    const numInstallments = type === "INSTALLMENT" && installments > 1 ? installments : 1;
    const perInstallmentBase = Math.round((totalBase / numInstallments) * 100) / 100;

    const createdPayments = [];

    for (let i = 1; i <= numInstallments; i++) {
      // Adjust last installment for rounding
      const installmentBase = i === numInstallments
        ? Math.round((totalBase - perInstallmentBase * (numInstallments - 1)) * 100) / 100
        : perInstallmentBase;

      const iva = calculateIva(installmentBase);

      const invoiceNumber = invoicePrefix
        ? `${invoicePrefix}-${String(i).padStart(2, "0")}`
        : null;

      const payment = await prisma.payment.create({
        data: {
          userId,
          cohortId: cohortId || null,
          enrollmentId: enrollmentId || null,
          baseAmount: iva.baseAmount,
          ivaRate: iva.ivaRate,
          ivaAmount: iva.ivaAmount,
          totalAmount: iva.totalAmount,
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
        const firstPayment = createdPayments[0];
        sendTransferPending(student.email, {
          firstName: student.firstName || "Alumno/a",
          amount: firstPayment.totalAmount,
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

// PUT — Verify a transfer payment (mark as COMPLETED) or refund
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAuthAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, action } = body;

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
        if (payment.user?.email) {
          sendTransferVerified(payment.user.email, {
            firstName: payment.user.firstName || "Alumno/a",
            amount: payment.totalAmount,
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
        if (payment.user?.email) {
          sendPaymentRefunded(payment.user.email, {
            firstName: payment.user.firstName || "Alumno/a",
            amount: payment.totalAmount,
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

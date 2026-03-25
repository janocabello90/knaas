import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Disable body parsing — Stripe needs the raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata) return;

  const {
    invitation_code,
    invitation_id,
    cohort_id: cohortId,
    user_id: userId,
    type,
  } = metadata;

  // Create or update payment record
  const paymentData = {
    amount: (session.amount_total || 0) / 100, // Convert from cents
    currency: session.currency?.toUpperCase() || "EUR",
    type: (type === "INSTALLMENT" ? "INSTALLMENT" : "SINGLE") as "SINGLE" | "INSTALLMENT",
    status: "COMPLETED" as const,
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null,
    paidAt: new Date(),
    notes: `Pago vía Stripe Checkout — Invitación ${invitation_code}`,
  };

  if (userId) {
    // User exists — create payment and enrollment
    await prisma.payment.create({
      data: {
        ...paymentData,
        userId,
        cohortId: cohortId || null,
      },
    });

    // Create enrollment if not exists
    if (cohortId) {
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_cohortId: { userId, cohortId },
        },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            userId,
            cohortId,
            subscriptionType: "NORMAL",
            status: "ACTIVE",
          },
        });
      } else if (existingEnrollment.status !== "ACTIVE") {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "ACTIVE" },
        });
      }
    }

    // Update Stripe customer ID if not set
    if (session.customer) {
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }
  }

  // Increment invitation link usage
  if (invitation_id) {
    await prisma.invitationLink.update({
      where: { id: invitation_id },
      data: { usedCount: { increment: 1 } },
    });
  }

  console.log(
    `✅ Checkout completed: ${session.id}, user: ${userId}, cohort: ${cohortId}`
  );
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  // Update any pending payment matching this payment intent
  const existing = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (existing && existing.status !== "COMPLETED") {
    await prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: "COMPLETED",
        paidAt: new Date(),
      },
    });
  }

  console.log(`✅ PaymentIntent succeeded: ${paymentIntent.id}`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const existing = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (existing) {
    await prisma.payment.update({
      where: { id: existing.id },
      data: { status: "FAILED" },
    });
  }

  console.log(`❌ PaymentIntent failed: ${paymentIntent.id}`);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const existing = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (existing) {
    await prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
      },
    });
  }

  console.log(`🔄 Charge refunded: ${charge.id}`);
}

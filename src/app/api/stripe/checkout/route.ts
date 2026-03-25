import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST — Create a Stripe Checkout Session for an invitation link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationCode, email } = body;

    if (!invitationCode) {
      return NextResponse.json(
        { error: "Código de invitación requerido" },
        { status: 400 }
      );
    }

    // Find the invitation link
    const invitation = await prisma.invitationLink.findUnique({
      where: { code: invitationCode },
      include: {
        cohort: {
          select: {
            id: true,
            name: true,
            program: true,
            price: true,
            installmentPrice: true,
            installmentCount: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Enlace de invitación no encontrado" },
        { status: 404 }
      );
    }

    if (!invitation.isActive) {
      return NextResponse.json(
        { error: "Este enlace de invitación ya no está activo" },
        { status: 400 }
      );
    }

    if (invitation.usedCount >= invitation.maxUses) {
      return NextResponse.json(
        { error: "Este enlace de invitación ha alcanzado el máximo de usos" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Este enlace de invitación ha expirado" },
        { status: 400 }
      );
    }

    if (invitation.email && email && invitation.email !== email) {
      return NextResponse.json(
        { error: "Este enlace está restringido a un email diferente" },
        { status: 403 }
      );
    }

    // FREE type — no payment needed
    if (invitation.type === "FREE") {
      return NextResponse.json({
        type: "FREE",
        message: "Este enlace es de acceso gratuito. No requiere pago.",
        invitationId: invitation.id,
        cohortName: invitation.cohort.name,
      });
    }

    // PAYMENT type — create Stripe Checkout Session
    const price = invitation.price ?? invitation.cohort.price;
    if (!price) {
      return NextResponse.json(
        { error: "No hay precio configurado para esta cohorte" },
        { status: 400 }
      );
    }

    // Check if user is logged in (optional - they might not be yet)
    let userId: string | null = null;
    let stripeCustomerId: string | undefined;
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { supabaseAuthId: user.id },
          select: { id: true, stripeCustomerId: true, email: true, firstName: true, lastName: true },
        });
        if (dbUser) {
          userId = dbUser.id;
          if (dbUser.stripeCustomerId) {
            stripeCustomerId = dbUser.stripeCustomerId;
          } else {
            // Create Stripe customer
            const customer = await stripe.customers.create({
              email: dbUser.email,
              name: `${dbUser.firstName} ${dbUser.lastName}`,
              metadata: { knaas_user_id: dbUser.id },
            });
            stripeCustomerId = customer.id;
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { stripeCustomerId: customer.id },
            });
          }
        }
      }
    } catch {
      // User not logged in — that's ok for checkout
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://knaas.vercel.app";

    // Single payment checkout
    const sessionParams: Record<string, unknown> = {
      mode: "payment" as const,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${invitation.cohort.program} — ${invitation.cohort.name}`,
              description: `Matrícula programa ${invitation.cohort.program} de FisioReferentes`,
            },
            unit_amount: Math.round(price * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pago/cancelado`,
      metadata: {
        invitation_code: invitation.code,
        invitation_id: invitation.id,
        cohort_id: invitation.cohort.id,
        user_id: userId || "",
        type: "SINGLE",
      },
    };

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    return NextResponse.json({
      type: "PAYMENT",
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago" },
      { status: 500 }
    );
  }
}

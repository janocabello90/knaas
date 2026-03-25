import Stripe from "stripe";

// Lazy initialization — only throws when actually used at runtime,
// not during build/compile time
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience export for backward compat
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Get or create a Stripe customer for a user.
 * If the user already has a stripeCustomerId, return it.
 * Otherwise, create a new customer in Stripe and save the ID.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string,
  existingStripeId: string | null
): Promise<string> {
  if (existingStripeId) return existingStripeId;

  const s = getStripe();
  const customer = await s.customers.create({
    email,
    name,
    metadata: { knaas_user_id: userId },
  });

  // Update user with stripe customer id (done by caller to avoid circular deps)
  return customer.id;
}

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
  typescript: true,
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

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { knaas_user_id: userId },
  });

  // Update user with stripe customer id (done by caller to avoid circular deps)
  return customer.id;
}

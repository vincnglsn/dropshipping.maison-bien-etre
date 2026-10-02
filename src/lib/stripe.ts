import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

// Instancié à la première utilisation pour ne pas faire échouer le build
// quand STRIPE_SECRET_KEY n'est pas encore configurée.
export function getStripe(): Stripe {
  if (!cachedStripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    cachedStripe = new Stripe(secretKey);
  }
  return cachedStripe;
}

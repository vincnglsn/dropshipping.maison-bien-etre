import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProductBySlug } from "@/lib/products";

type CheckoutRequestItem = {
  slug: string;
  quantity: number;
};

export async function POST(request: NextRequest) {
  let body: { items?: CheckoutRequestItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const requestedItems = Array.isArray(body.items) ? body.items : [];
  if (requestedItems.length === 0) {
    return NextResponse.json({ error: "Le panier est vide" }, { status: 400 });
  }

  // Les prix sont toujours relus depuis la base : on ne fait jamais confiance
  // aux montants envoyés par le client.
  const lineItems = [];
  for (const requested of requestedItems) {
    const quantity = Math.max(1, Math.min(99, Math.floor(Number(requested.quantity) || 0)));
    const product = await getProductBySlug(String(requested.slug)).catch(() => null);
    if (!product || !product.in_stock) {
      return NextResponse.json(
        { error: `Produit indisponible : ${requested.slug}` },
        { status: 400 }
      );
    }
    lineItems.push({
      quantity,
      price_data: {
        currency: product.currency.toLowerCase(),
        unit_amount: product.price_cents,
        product_data: {
          name: product.name,
          ...(product.image_url ? { images: [product.image_url] } : {}),
        },
      },
    });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/panier`,
      shipping_address_collection: { allowed_countries: ["FR", "BE", "CH", "LU"] },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Session Stripe sans URL" }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

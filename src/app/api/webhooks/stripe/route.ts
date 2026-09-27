import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSql } from "@/lib/db";

// Stripe signe le corps brut de la requête : il ne faut donc jamais parser le
// JSON avant vérification, sous peine d'invalider la signature.
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook non configuré (signature ou secret manquant)" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide";
    return NextResponse.json({ error: `Webhook signature invalide : ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await recordOrder(stripe, session, event.livemode ? "live" : "test");
  }

  return NextResponse.json({ received: true });
}

async function recordOrder(stripe: Stripe, session: Stripe.Checkout.Session, mode: "test" | "live") {
  const sql = getSql();

  // Idempotence : un webhook Stripe peut être renvoyé plusieurs fois pour le
  // même événement, on ignore silencieusement une session déjà enregistrée.
  const existing = await sql`
    select id from orders where stripe_checkout_session_id = ${session.id} limit 1
  `;
  if (existing.length > 0) return;

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  const orderRows = (await sql`
    insert into orders (
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      status,
      mode,
      amount_total_cents,
      currency,
      customer_email,
      shipping_address
    )
    values (
      ${session.id},
      ${typeof session.payment_intent === "string" ? session.payment_intent : null},
      'paid',
      ${mode},
      ${session.amount_total ?? 0},
      ${(session.currency ?? "eur").toUpperCase()},
      ${session.customer_details?.email ?? null},
      ${session.collected_information?.shipping_details
        ? JSON.stringify(session.collected_information.shipping_details)
        : null}
    )
    returning id
  `) as unknown as { id: number }[];

  const orderId = orderRows[0].id;

  for (const item of lineItems.data) {
    const product =
      item.price?.product && typeof item.price.product === "object"
        ? (item.price.product as Stripe.Product)
        : null;
    const slug = product?.metadata?.slug ?? null;

    await sql`
      insert into order_items (order_id, product_slug, name, unit_amount_cents, quantity, currency)
      values (
        ${orderId},
        ${slug},
        ${item.description ?? product?.name ?? "Produit"},
        ${item.price?.unit_amount ?? 0},
        ${item.quantity ?? 1},
        ${(item.price?.currency ?? "eur").toUpperCase()}
      )
    `;
  }
}

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSql } from "@/lib/db";
import { createCjOrder } from "@/lib/cjdropshipping";

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
    const mode = event.livemode ? "live" : "test";
    const orderId = await recordOrder(stripe, session, mode);
    if (orderId) {
      await placeSupplierOrder(orderId, session, mode);
    }
  }

  return NextResponse.json({ received: true });
}

async function recordOrder(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  mode: "test" | "live"
): Promise<number | null> {
  const sql = getSql();

  // Idempotence : un webhook Stripe peut être renvoyé plusieurs fois pour le
  // même événement, on ignore silencieusement une session déjà enregistrée.
  const existing = await sql`
    select id from orders where stripe_checkout_session_id = ${session.id} limit 1
  `;
  if (existing.length > 0) return null;

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

  return orderId;
}

type ProductSupplierRow = {
  slug: string;
  cj_variant_id: string | null;
  cj_sku: string | null;
  cj_from_country_code: string;
  cj_logistic_name: string;
};

async function placeSupplierOrder(
  orderId: number,
  session: Stripe.Checkout.Session,
  mode: "test" | "live"
) {
  const sql = getSql();
  const shipping = session.collected_information?.shipping_details;
  const email = session.customer_details?.email ?? undefined;

  if (!shipping?.address) {
    await recordSupplierOrderFailure(orderId, mode, "Adresse de livraison manquante");
    return;
  }

  const items = (await sql`
    select product_slug, quantity from order_items where order_id = ${orderId}
  `) as unknown as { product_slug: string | null; quantity: number }[];

  const slugs = items.map((i) => i.product_slug).filter((s): s is string => Boolean(s));
  if (slugs.length === 0) {
    await recordSupplierOrderFailure(orderId, mode, "Aucun produit identifiable dans la commande");
    return;
  }

  const products = (await sql`
    select slug, cj_variant_id, cj_sku, cj_from_country_code, cj_logistic_name
    from products
    where slug = any(${slugs})
  `) as unknown as ProductSupplierRow[];

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const missingSlugs = slugs.filter((slug) => {
    const p = bySlug.get(slug);
    return !p || (!p.cj_variant_id && !p.cj_sku);
  });

  if (missingSlugs.length > 0) {
    await recordSupplierOrderFailure(
      orderId,
      mode,
      `Produit(s) non reliés à CJdropshipping : ${missingSlugs.join(", ")}`
    );
    return;
  }

  const cjProducts = items.map((item) => {
    const p = bySlug.get(item.product_slug as string)!;
    return {
      vid: p.cj_variant_id ?? undefined,
      sku: p.cj_sku ?? undefined,
      quantity: item.quantity,
    };
  });

  // Tous les articles partagent normalement la même route logistique ; on
  // prend celle du premier produit pour simplifier la commande fournisseur.
  const firstProduct = bySlug.get(items[0].product_slug as string)!;

  try {
    const result = await createCjOrder({
      orderNumber: session.id,
      shippingCountryCode: shipping.address.country ?? "",
      shippingCountry: shipping.address.country ?? "",
      shippingProvince: shipping.address.state ?? shipping.address.city ?? "",
      shippingCity: shipping.address.city ?? "",
      shippingCustomerName: shipping.name ?? "Client",
      shippingAddress: [shipping.address.line1, shipping.address.line2].filter(Boolean).join(" "),
      shippingZip: shipping.address.postal_code ?? undefined,
      email,
      fromCountryCode: firstProduct.cj_from_country_code,
      logisticName: firstProduct.cj_logistic_name,
      products: cjProducts,
      // En mode test Stripe, on force systématiquement une commande CJ
      // sandbox : jamais de vrai débit tant que le paiement client lui-même
      // n'est pas réel.
      isSandbox: mode !== "live",
    });

    await sql`
      insert into supplier_orders (order_id, provider, provider_order_id, status, is_sandbox)
      values (${orderId}, 'cjdropshipping', ${result.data.orderId}, 'placed', ${mode !== "live"})
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur CJdropshipping inconnue";
    await recordSupplierOrderFailure(orderId, mode, message);
  }
}

async function recordSupplierOrderFailure(orderId: number, mode: "test" | "live", message: string) {
  const sql = getSql();
  await sql`
    insert into supplier_orders (order_id, provider, status, error_message, is_sandbox)
    values (${orderId}, 'cjdropshipping', 'failed', ${message}, ${mode !== "live"})
  `;
}

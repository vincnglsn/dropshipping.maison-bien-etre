import { getSql } from "@/lib/db";

export type OrderItem = {
  name: string;
  unit_amount_cents: number;
  quantity: number;
  currency: string;
};

export type OrderStatus = {
  id: number;
  status: string;
  mode: string;
  amount_total_cents: number;
  currency: string;
  created_at: string;
  items: OrderItem[];
  tracking_number: string | null;
  supplier_status: string | null;
};

// La commande n'est renvoyée que si l'e-mail correspond : évite qu'un
// numéro de commande deviné permette de consulter la commande d'un tiers.
export async function getOrderForCustomer(
  orderId: number,
  email: string
): Promise<OrderStatus | null> {
  const sql = getSql();

  const orders = (await sql`
    select id, status, mode, amount_total_cents, currency, created_at
    from orders
    where id = ${orderId} and lower(customer_email) = lower(${email})
    limit 1
  `) as unknown as {
    id: number;
    status: string;
    mode: string;
    amount_total_cents: number;
    currency: string;
    created_at: string;
  }[];

  const order = orders[0];
  if (!order) return null;

  const items = (await sql`
    select name, unit_amount_cents, quantity, currency
    from order_items
    where order_id = ${orderId}
  `) as unknown as OrderItem[];

  const supplierOrders = (await sql`
    select status, tracking_number
    from supplier_orders
    where order_id = ${orderId}
    order by created_at desc
    limit 1
  `) as unknown as { status: string; tracking_number: string | null }[];

  return {
    ...order,
    items,
    tracking_number: supplierOrders[0]?.tracking_number ?? null,
    supplier_status: supplierOrders[0]?.status ?? null,
  };
}

export async function getOrderIdBySessionId(sessionId: string): Promise<number | null> {
  const sql = getSql();
  const rows = (await sql`
    select id from orders where stripe_checkout_session_id = ${sessionId} limit 1
  `) as unknown as { id: number }[];
  return rows[0]?.id ?? null;
}

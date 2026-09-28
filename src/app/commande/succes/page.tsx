import { getOrderIdBySessionId } from "@/lib/orders";
import { OrderSuccessClient } from "./OrderSuccessClient";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let orderId: number | null = null;
  if (sessionId) {
    orderId = await getOrderIdBySessionId(sessionId).catch(() => null);
  }

  return <OrderSuccessClient orderId={orderId} />;
}

import { NextRequest, NextResponse } from "next/server";
import { getOrderForCustomer } from "@/lib/orders";

export async function POST(request: NextRequest) {
  let body: { orderId?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const orderId = Number(body.orderId);
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!Number.isInteger(orderId) || orderId <= 0 || !email) {
    return NextResponse.json(
      { error: "Numéro de commande et e-mail requis" },
      { status: 400 }
    );
  }

  try {
    const order = await getOrderForCustomer(orderId, email);
    if (!order) {
      return NextResponse.json(
        { error: "Aucune commande trouvée avec ces informations" },
        { status: 404 }
      );
    }
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la recherche" }, { status: 500 });
  }
}

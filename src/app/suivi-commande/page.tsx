"use client";

import { useState } from "react";
import { LegalHeader } from "@/components/LegalHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPrice } from "@/lib/products";
import type { OrderStatus } from "@/lib/orders";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente de traitement",
  placed: "Commande transmise au fournisseur",
  failed: "Un problème est survenu, notre équipe a été notifiée",
};

export default function SuiviCommandePage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderStatus | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Erreur lors de la recherche");
      }
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <LegalHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="mb-2 text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
          Suivi de commande
        </h1>
        <p className="mb-8 text-stone-600 dark:text-stone-400">
          Renseignez le numéro de commande et l&apos;e-mail utilisés lors de l&apos;achat (ces
          informations figurent dans votre e-mail de confirmation).
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Numéro de commande (ex : 42)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
            className="flex-1 rounded-lg border border-stone-300 px-4 py-2 dark:border-stone-700 dark:bg-stone-900"
          />
          <input
            type="email"
            placeholder="Votre e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 rounded-lg border border-stone-300 px-4 py-2 dark:border-stone-700 dark:bg-stone-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-stone-900 px-6 py-2 font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {loading ? "Recherche…" : "Rechercher"}
          </button>
        </form>

        {error && (
          <p className="mt-6 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {order && (
          <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-stone-900 dark:text-stone-50">
                Commande n°{order.id}
              </h2>
              <span className="text-sm text-stone-500">
                {new Date(order.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>

            <ul className="mb-4 divide-y divide-stone-200 dark:divide-stone-800">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-stone-700 dark:text-stone-300">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="text-stone-900 dark:text-stone-50">
                    {formatPrice(item.unit_amount_cents * item.quantity, item.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mb-4 flex items-center justify-between border-t border-stone-200 pt-4 font-semibold text-stone-900 dark:border-stone-800 dark:text-stone-50">
              <span>Total</span>
              <span>{formatPrice(order.amount_total_cents, order.currency)}</span>
            </div>

            <div className="rounded-lg bg-stone-100 p-4 text-sm dark:bg-stone-800">
              <p className="font-medium text-stone-900 dark:text-stone-50">
                {STATUS_LABELS[order.supplier_status ?? ""] ?? "Traitement en cours"}
              </p>
              {order.tracking_number && (
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  Numéro de suivi : <strong>{order.tracking_number}</strong>
                </p>
              )}
              {!order.tracking_number && order.supplier_status === "placed" && (
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  Le numéro de suivi vous sera communiqué par e-mail dès l&apos;expédition du
                  colis.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

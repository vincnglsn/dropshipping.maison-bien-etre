"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteLogo } from "@/components/SiteLogo";

export default function CartPage() {
  const { items, removeItem, setQuantity, totalCents } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Erreur lors de la création de la commande");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <SiteLogo />
          <Link href="/" className="text-sm text-stone-600 dark:text-stone-400">
            ← Continuer mes achats
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="mb-8 text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
          Votre panier
        </h1>

        {items.length === 0 ? (
          <p className="text-stone-500">
            Votre panier est vide.{" "}
            <Link href="/" className="underline">
              Découvrir la boutique
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
              {items.map((item) => (
                <li key={item.slug} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex-1">
                    <p className="font-medium text-stone-900 dark:text-stone-50">{item.name}</p>
                    <p className="text-sm text-stone-500">
                      {formatPrice(item.priceCents, item.currency)} / unité
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.slug, Number(e.target.value))}
                    className="w-16 rounded-md border border-stone-300 px-2 py-1 text-center dark:border-stone-700 dark:bg-stone-800"
                  />
                  <p className="w-24 text-right font-medium text-stone-900 dark:text-stone-50">
                    {formatPrice(item.priceCents * item.quantity, item.currency)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.slug)}
                    className="text-sm text-stone-400 hover:text-red-600"
                    aria-label={`Retirer ${item.name}`}
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-stone-200 pt-6 dark:border-stone-800">
              <span className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                Total
              </span>
              <span className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                {formatPrice(totalCents, items[0]?.currency ?? "EUR")}
              </span>
            </div>

            {error && (
              <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="w-full rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              {loading ? "Redirection vers le paiement…" : "Passer commande"}
            </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

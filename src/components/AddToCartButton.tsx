"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export function AddToCartButton({
  slug,
  name,
  priceCents,
  currency,
  inStock = true,
}: {
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  inStock?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <button
        type="button"
        disabled
        className="mt-4 w-full cursor-not-allowed rounded-full bg-stone-300 px-6 py-3 font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-500"
      >
        Rupture de stock
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem({ slug, name, priceCents, currency });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="mt-4 w-full rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
    >
      {added ? "Ajouté ✓" : "Ajouter au panier"}
    </button>
  );
}

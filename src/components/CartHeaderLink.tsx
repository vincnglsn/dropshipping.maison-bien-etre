"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartHeaderLink() {
  const { itemCount } = useCart();

  return (
    <Link href="/panier" className="relative text-sm text-stone-600 dark:text-stone-400">
      Panier
      {itemCount > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-xs font-medium text-white dark:bg-stone-100 dark:text-stone-900">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

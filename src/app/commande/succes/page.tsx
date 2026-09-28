"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { SiteFooter } from "@/components/SiteFooter";

export default function OrderSuccessPage() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    // Le panier ne doit être vidé qu'une fois, au retour de Stripe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-stone-50 px-6 text-center dark:bg-stone-950">
      <h1 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
        Merci pour votre commande !
      </h1>
      <p className="mt-3 max-w-md text-stone-600 dark:text-stone-400">
        Votre paiement a bien été pris en compte. Vous recevrez un e-mail de
        confirmation de la part de Stripe.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-stone-900 px-6 py-3 font-medium text-white dark:bg-stone-100 dark:text-stone-900"
      >
        Retour à la boutique
      </Link>
      <div className="mt-auto w-full">
        <SiteFooter />
      </div>
    </div>
  );
}

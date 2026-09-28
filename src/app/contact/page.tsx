import type { Metadata } from "next";
import { LegalHeader } from "@/components/LegalHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Contact — Maison Bien-Être",
  description: "Contactez le service client de Maison Bien-Être.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <LegalHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="mb-6 text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
          Contact
        </h1>
        <div className="flex flex-col gap-4 text-stone-600 dark:text-stone-400">
          <p>
            Une question sur votre commande, un produit ou une livraison ? Écrivez-nous, nous
            répondons sous 48h ouvrées.
          </p>
          <p>
            <strong className="text-stone-900 dark:text-stone-50">E-mail :</strong>{" "}
            <a href="mailto:contact@whatelsebyvinc.com" className="underline">
              contact@whatelsebyvinc.com
            </a>
          </p>
          <p className="text-sm text-stone-500">
            Pour toute question relative à une commande, merci d&apos;indiquer votre numéro de
            commande (visible dans l&apos;e-mail de confirmation Stripe).
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

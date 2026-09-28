import type { Metadata } from "next";
import { LegalHeader } from "@/components/LegalHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Maison Bien-Être",
};

export default function ConfidentialitePage() {
  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <LegalHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="mb-6 text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
          Politique de confidentialité
        </h1>
        <div className="flex flex-col gap-6 text-stone-600 dark:text-stone-400">
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Données collectées
            </h2>
            <p>
              Lors d&apos;une commande, nous collectons via notre prestataire de paiement Stripe :
              votre nom, votre adresse e-mail, votre adresse postale de livraison et votre numéro
              de téléphone. Ces informations sont nécessaires pour traiter votre commande et
              organiser son expédition par notre fournisseur.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Utilisation des données
            </h2>
            <p>
              Vos données sont utilisées exclusivement pour traiter votre commande, l&apos;expédier
              et vous en informer. Elles sont transmises à Stripe (paiement) et à notre
              fournisseur logistique CJdropshipping (expédition), uniquement pour les besoins de
              la commande. Nous ne vendons ni ne louons vos données à des tiers.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">Conservation</h2>
            <p>
              Les données liées aux commandes sont conservées pendant la durée légale de
              conservation des documents commerciaux (10 ans), conformément au Code de commerce.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de
              suppression de vos données. Pour l&apos;exercer, contactez-nous à{" "}
              <a href="mailto:contact@whatelsebyvinc.com" className="underline">
                contact@whatelsebyvinc.com
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">Cookies</h2>
            <p>
              Ce site n&apos;utilise pas de cookies de suivi publicitaire ou analytique. Seuls des
              cookies techniques strictement nécessaires au fonctionnement du panier peuvent être
              utilisés.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

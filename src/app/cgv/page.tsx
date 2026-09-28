import type { Metadata } from "next";
import { LegalHeader } from "@/components/LegalHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Maison Bien-Être",
};

export default function CgvPage() {
  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <LegalHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="mb-6 text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
          Conditions générales de vente
        </h1>
        <div className="flex flex-col gap-6 text-stone-600 dark:text-stone-400">
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Article 1 — Objet
            </h2>
            <p>
              Les présentes conditions générales de vente régissent les relations contractuelles
              entre Maison Bien-Être et tout client effectuant un achat sur ce site.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Article 2 — Prix
            </h2>
            <p>
              Les prix sont indiqués en euros, toutes taxes comprises. Maison Bien-Être se réserve
              le droit de modifier ses prix à tout moment, les produits étant facturés sur la base
              du tarif en vigueur au moment de la validation de la commande.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Article 3 — Commande et paiement
            </h2>
            <p>
              Les commandes sont passées en ligne et réglées par carte bancaire via notre
              prestataire de paiement sécurisé Stripe. La commande n&apos;est considérée comme
              définitive qu&apos;après confirmation du paiement.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Article 4 — Livraison
            </h2>
            <p>
              Voir notre page{" "}
              <a href="/retours" className="underline">
                Livraison &amp; retours
              </a>{" "}
              pour le détail des délais et modalités.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Article 5 — Droit de rétractation
            </h2>
            <p>
              Conformément à la loi, le client dispose d&apos;un délai de 14 jours à compter de la
              réception de sa commande pour exercer son droit de rétractation, dans les conditions
              détaillées sur notre page Livraison &amp; retours.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Article 6 — Responsabilité
            </h2>
            <p>
              Maison Bien-Être ne saurait être tenue responsable des retards de livraison
              imputables au transporteur ou à des cas de force majeure.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Article 7 — Droit applicable
            </h2>
            <p>Les présentes CGV sont soumises au droit français.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

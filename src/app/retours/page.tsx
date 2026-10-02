import type { Metadata } from "next";
import { LegalHeader } from "@/components/LegalHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Livraison & retours — Maison Bien-Être",
};

export default function RetoursPage() {
  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <LegalHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="mb-6 text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
          Livraison &amp; retours
        </h1>
        <div className="flex flex-col gap-6 text-stone-600 dark:text-stone-400">
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">Livraison</h2>
            <p>
              Nos produits sont expédiés directement depuis nos entrepôts fournisseurs. Le délai
              de livraison moyen est de 7 à 20 jours ouvrés selon le produit et votre localisation.
              Un numéro de suivi vous est communiqué dès que le colis est pris en charge par le
              transporteur.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Droit de rétractation
            </h2>
            <p>
              Conformément aux articles L221-18 et suivants du Code de la consommation, vous
              disposez d&apos;un délai de 14 jours à compter de la réception de votre colis pour
              exercer votre droit de rétractation, sans avoir à justifier de motif.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Comment retourner un article
            </h2>
            <p>
              Contactez-nous à{" "}
              <a href="mailto:contact@whatelsebyvinc.com" className="underline">
                contact@whatelsebyvinc.com
              </a>{" "}
              en indiquant votre numéro de commande. Les frais de retour sont à la charge du
              client, sauf en cas de produit défectueux ou non conforme à la commande, où ils sont
              intégralement remboursés.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">Remboursement</h2>
            <p>
              Le remboursement est effectué sous 14 jours à compter de la réception de l&apos;article
              retourné, sur le même moyen de paiement que celui utilisé lors de l&apos;achat.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

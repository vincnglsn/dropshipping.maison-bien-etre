import type { Metadata } from "next";
import { LegalHeader } from "@/components/LegalHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "À propos — Maison Bien-Être",
  description: "Notre démarche : une sélection soignée d'objets de bien-être et de décoration.",
};

export default function AProposPage() {
  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <LegalHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="mb-6 text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
          À propos de Maison Bien-Être
        </h1>
        <div className="flex flex-col gap-4 text-stone-600 dark:text-stone-400">
          <p>
            Maison Bien-Être est née d&apos;une idée simple : proposer une sélection restreinte et
            réfléchie d&apos;objets qui aident à ralentir et à rendre le quotidien plus doux, plutôt
            qu&apos;un catalogue sans fin.
          </p>
          <p>
            Chaque produit est choisi pour sa qualité perçue et son utilité réelle — diffuseurs,
            veilleuses, plaids, accessoires de détente — dans l&apos;univers du bien-être et de la
            décoration d&apos;intérieur.
          </p>
          <p>
            Nos articles sont expédiés directement depuis nos entrepôts partenaires, ce qui nous
            permet de proposer des prix ajustés tout en gardant une équipe légère. Nous restons
            disponibles pour toute question via notre page{" "}
            <a href="/contact" className="underline">
              Contact
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

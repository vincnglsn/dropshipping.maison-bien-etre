import type { Metadata } from "next";
import { LegalHeader } from "@/components/LegalHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Mentions légales — Maison Bien-Être",
};

export default function MentionsLegalesPage() {
  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <LegalHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="mb-6 text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
          Mentions légales
        </h1>
        <div className="flex flex-col gap-6 text-stone-600 dark:text-stone-400">
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">Éditeur du site</h2>
            <p>
              Maison Bien-Être — Vincent Nageleisen, entrepreneur individuel.
              <br />
              SIREN : 434 368 221
              <br />
              Adresse : 159 allée des Vignes, 84810 Aubignan, France
              <br />
              E-mail : contact@whatelsebyvinc.com
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">Hébergement</h2>
            <p>
              Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
              États-Unis.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-stone-900 dark:text-stone-50">
              Propriété intellectuelle
            </h2>
            <p>
              L&apos;ensemble des contenus présents sur ce site (textes, visuels, logo) est la
              propriété de Maison Bien-Être, sauf mention contraire, et ne peut être reproduit
              sans autorisation préalable.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

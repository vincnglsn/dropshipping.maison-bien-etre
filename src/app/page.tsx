import Link from "next/link";
import { getCategoryTree, getProducts, type CategoryTree, type Product } from "@/lib/products";
import { CartHeaderLink } from "@/components/CartHeaderLink";
import { SiteFooter } from "@/components/SiteFooter";
import { CategoryNav } from "@/components/CategoryNav";
import { CategoryCards } from "@/components/CategoryCards";
import { GroupedProductGrid } from "@/components/ProductGrid";
import { SiteLogo } from "@/components/SiteLogo";

export const revalidate = 60;

export default async function Home() {
  let products: Product[] = [];
  let tree: CategoryTree[] = [];
  let dbError = false;

  try {
    [products, tree] = await Promise.all([getProducts(), getCategoryTree()]);
  } catch {
    dbError = true;
  }

  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <SiteLogo />
          <nav className="flex items-center gap-4 text-sm text-stone-600 dark:text-stone-400">
            <Link href="/">Boutique</Link>
            <CartHeaderLink />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <section className="mb-12 text-center">
          <h1 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-50">
            Une maison apaisée, un quotidien plus doux
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-stone-600 dark:text-stone-400">
            Une sélection d&apos;objets de bien-être et de décoration pour créer
            un intérieur serein.
          </p>
        </section>

        {dbError && (
          <p className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            La base de données n&apos;est pas encore accessible (variable{" "}
            <code>DATABASE_URL</code> manquante ou schéma non initialisé). Exécute{" "}
            <code>sql/schema.sql</code> sur ta base Neon puis recharge la page.
          </p>
        )}

        {!dbError && (
          <>
            <CategoryCards tree={tree} products={products} />

            <CategoryNav tree={tree} />

            {products.length === 0 ? (
              <p className="text-stone-500">Aucun produit disponible pour le moment.</p>
            ) : (
              <GroupedProductGrid products={products} />
            )}
          </>
        )}

        <section className="mt-16 grid grid-cols-1 gap-8 border-t border-stone-200 pt-12 text-center sm:grid-cols-3 dark:border-stone-800">
          <div>
            <p className="font-semibold text-stone-900 dark:text-stone-50">Paiement sécurisé</p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Transactions chiffrées via Stripe, aucune donnée bancaire stockée sur ce site.
            </p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 dark:text-stone-50">Livraison suivie</p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Numéro de suivi communiqué dès l&apos;expédition de votre commande.
            </p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 dark:text-stone-50">
              Rétractation 14 jours
            </p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Un produit ne convient pas ? Retour possible dans les 14 jours suivant réception.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { getProducts, formatPrice, type Product } from "@/lib/products";

export const revalidate = 60;

export default async function Home() {
  let products: Product[] = [];
  let dbError = false;

  try {
    products = await getProducts();
  } catch {
    dbError = true;
  }

  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <span className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-50">
            Maison Bien-Être
          </span>
          <nav className="text-sm text-stone-600 dark:text-stone-400">
            <Link href="/">Boutique</Link>
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

        {!dbError && products.length === 0 && (
          <p className="text-stone-500">Aucun produit disponible pour le moment.</p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/produits/${product.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex h-40 items-center justify-center bg-stone-100 text-stone-400 dark:bg-stone-800">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs">Image à venir</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <h2 className="font-medium text-stone-900 group-hover:underline dark:text-stone-50">
                  {product.name}
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                  {product.description}
                </p>
                <span className="mt-2 font-semibold text-stone-900 dark:text-stone-50">
                  {formatPrice(product.price_cents, product.currency)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500 dark:border-stone-800">
        © {new Date().getFullYear()} Maison Bien-Être
      </footer>
    </div>
  );
}

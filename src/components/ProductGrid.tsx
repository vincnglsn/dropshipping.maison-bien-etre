import Link from "next/link";
import Image from "next/image";
import { formatPrice, groupBySubcategory, type Product } from "@/lib/products";

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produits/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-stone-200 text-stone-400 dark:from-stone-800 dark:to-stone-900">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className={`scale-125 object-cover ${!product.in_stock ? "opacity-50 grayscale" : ""}`}
          />
        ) : (
          <span className="text-xs">Image à venir</span>
        )}
        {!product.in_stock && (
          <span className="absolute left-2 top-2 rounded-full bg-stone-900/90 px-2.5 py-1 text-xs font-medium text-white">
            Rupture de stock
          </span>
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
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function GroupedProductGrid({ products }: { products: Product[] }) {
  const groups = groupBySubcategory(products);
  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <section key={group.subcategory ?? "autres"}>
          <h2 className="mb-4 text-lg font-serif font-semibold text-stone-900 dark:text-stone-50">
            {group.label}
          </h2>
          <ProductGrid products={group.products} />
        </section>
      ))}
    </div>
  );
}

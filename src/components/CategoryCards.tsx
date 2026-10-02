import Link from "next/link";
import Image from "next/image";
import type { CategoryTree, Product } from "@/lib/products";

export function CategoryCards({
  tree,
  products,
}: {
  tree: CategoryTree[];
  products: Product[];
}) {
  const imageByCategory = new Map<string, string | null>();
  for (const product of products) {
    if (!imageByCategory.has(product.category)) {
      imageByCategory.set(product.category, product.image_url);
    }
  }

  return (
    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {tree.map((entry) => {
        const image = imageByCategory.get(entry.category);
        return (
          <Link
            key={entry.category}
            href={`/categorie/${entry.category}`}
            className="group relative flex h-48 items-end overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 dark:border-stone-800 dark:bg-stone-800"
          >
            {image && (
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="scale-110 object-cover transition duration-300 group-hover:scale-125"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="relative z-10 flex w-full items-center justify-between px-6 py-5">
              <div>
                <p className="font-serif text-xl font-semibold text-white">{entry.label}</p>
                <p className="text-sm text-white/80">
                  {entry.count} produit{entry.count > 1 ? "s" : ""}
                </p>
              </div>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-900 transition group-hover:bg-white">
                Découvrir →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

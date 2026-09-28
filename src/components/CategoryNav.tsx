import Link from "next/link";
import type { CategoryTree } from "@/lib/products";

export function CategoryNav({
  tree,
  activeCategory,
  activeSubcategory,
}: {
  tree: CategoryTree[];
  activeCategory?: string;
  activeSubcategory?: string;
}) {
  return (
    <nav className="mb-10 flex flex-col gap-3 border-b border-stone-200 pb-6 dark:border-stone-800">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/"
          className={`rounded-full px-4 py-1.5 transition ${
            !activeCategory
              ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          }`}
        >
          Tous les produits
        </Link>
        {tree.map((entry) => (
          <Link
            key={entry.category}
            href={`/categorie/${entry.category}`}
            className={`rounded-full px-4 py-1.5 transition ${
              activeCategory === entry.category
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
            }`}
          >
            {entry.label} ({entry.count})
          </Link>
        ))}
      </div>

      {activeCategory && (
        <div className="flex flex-wrap gap-2 text-xs">
          {tree
            .find((entry) => entry.category === activeCategory)
            ?.subcategories.map((sub) => (
              <Link
                key={sub.subcategory}
                href={`/categorie/${activeCategory}/${sub.subcategory}`}
                className={`rounded-full border px-3 py-1 transition ${
                  activeSubcategory === sub.subcategory
                    ? "border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100"
                    : "border-stone-300 text-stone-500 hover:border-stone-500 dark:border-stone-700 dark:text-stone-400"
                }`}
              >
                {sub.label} ({sub.count})
              </Link>
            ))}
        </div>
      )}
    </nav>
  );
}

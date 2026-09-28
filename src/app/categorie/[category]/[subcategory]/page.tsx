import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CATEGORY_LABELS,
  SUBCATEGORY_LABELS,
  categoryLabel,
  getCategoryTree,
  getProductsBySubcategory,
  subcategoryLabel,
  SITE_URL,
} from "@/lib/products";
import { CartHeaderLink } from "@/components/CartHeaderLink";
import { SiteFooter } from "@/components/SiteFooter";
import { CategoryNav } from "@/components/CategoryNav";
import { ProductGrid } from "@/components/ProductGrid";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}): Promise<Metadata> {
  const { category, subcategory } = await params;
  if (!(category in CATEGORY_LABELS) || !(subcategory in SUBCATEGORY_LABELS)) {
    return { title: "Catégorie introuvable — Maison Bien-Être" };
  }

  const catLabel = categoryLabel(category);
  const subLabel = subcategoryLabel(subcategory);
  const title = `${subLabel} — ${catLabel} — Maison Bien-Être`;
  const description = `Notre sélection ${subLabel.toLowerCase()} dans la catégorie ${catLabel.toLowerCase()} : produits choisis, livraison suivie et retour possible sous 14 jours.`;
  const url = `${SITE_URL}/categorie/${category}/${subcategory}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}) {
  const { category, subcategory } = await params;

  if (!(category in CATEGORY_LABELS) || !(subcategory in SUBCATEGORY_LABELS)) {
    notFound();
  }

  const [products, tree] = await Promise.all([
    getProductsBySubcategory(category, subcategory).catch(() => []),
    getCategoryTree().catch(() => []),
  ]);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Boutique", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel(category),
        item: `${SITE_URL}/categorie/${category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: subcategoryLabel(subcategory),
        item: `${SITE_URL}/categorie/${category}/${subcategory}`,
      },
    ],
  };

  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <JsonLd data={breadcrumbJsonLd} />
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <Link
            href="/"
            className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-50"
          >
            Maison Bien-Être
          </Link>
          <nav className="flex items-center gap-4 text-sm text-stone-600 dark:text-stone-400">
            <Link href="/">Boutique</Link>
            <CartHeaderLink />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p className="mb-1 text-sm text-stone-500">
          <Link href={`/categorie/${category}`} className="hover:underline">
            {categoryLabel(category)}
          </Link>
        </p>
        <h1 className="mb-6 text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
          {subcategoryLabel(subcategory)}
        </h1>

        <CategoryNav tree={tree} activeCategory={category} activeSubcategory={subcategory} />

        {products.length === 0 ? (
          <p className="text-stone-500">Aucun produit disponible dans cette sous-catégorie.</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

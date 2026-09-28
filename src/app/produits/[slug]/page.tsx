import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductBySlug,
  formatPrice,
  categoryLabel,
  subcategoryLabel,
  descriptionExcerpt,
  SITE_URL,
} from "@/lib/products";
import { CartHeaderLink } from "@/components/CartHeaderLink";
import { AddToCartButton } from "@/components/AddToCartButton";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);

  if (!product) {
    return { title: "Produit introuvable — Maison Bien-Être" };
  }

  const title = `${product.name} — Maison Bien-Être`;
  const description = descriptionExcerpt(product.description);
  const url = `${SITE_URL}/produits/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(product.image_url ? { images: [{ url: product.image_url }] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);

  if (!product) {
    notFound();
  }

  const productUrl = `${SITE_URL}/produits/${product.slug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Boutique", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel(product.category),
        item: `${SITE_URL}/categorie/${product.category}`,
      },
      ...(product.subcategory
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: subcategoryLabel(product.subcategory),
              item: `${SITE_URL}/categorie/${product.category}/${product.subcategory}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.subcategory ? 4 : 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: descriptionExcerpt(product.description, 500),
    ...(product.image_url ? { image: [product.image_url] } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: product.currency,
      price: (product.price_cents / 100).toFixed(2),
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={productJsonLd} />
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <Link
            href="/"
            className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-50"
          >
            Maison Bien-Être
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-stone-600 dark:text-stone-400">
              ← Retour à la boutique
            </Link>
            <CartHeaderLink />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-6 py-12 md:grid-cols-2">
        <div className="flex h-80 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-stone-200 text-stone-400 dark:from-stone-800 dark:to-stone-900">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={`${product.name} — ${categoryLabel(product.category)}`}
              className="h-full w-full scale-125 object-cover"
            />
          ) : (
            <span className="text-sm">Image à venir</span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-stone-500">
            <Link href={`/categorie/${product.category}`} className="hover:underline">
              {categoryLabel(product.category)}
            </Link>
            {product.subcategory && (
              <>
                {" "}
                ·{" "}
                <Link
                  href={`/categorie/${product.category}/${product.subcategory}`}
                  className="hover:underline"
                >
                  {subcategoryLabel(product.subcategory)}
                </Link>
              </>
            )}
          </p>
          <h1 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-50">
            {product.name}
          </h1>
          <p className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            {formatPrice(product.price_cents, product.currency)}
          </p>
          <p className="whitespace-pre-line text-stone-600 dark:text-stone-400">
            {product.description}
          </p>
          <AddToCartButton
            slug={product.slug}
            name={product.name}
            priceCents={product.price_cents}
            currency={product.currency}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

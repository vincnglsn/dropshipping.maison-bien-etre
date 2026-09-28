import { getSql } from "@/lib/db";

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  category: string;
  subcategory: string | null;
  in_stock: boolean;
};

export const CATEGORY_LABELS: Record<string, string> = {
  "bien-etre": "Bien-être",
  decoration: "Maison",
};

// Ordre d'affichage voulu pour les catégories (indépendant de l'ordre
// alphabétique des libellés).
const CATEGORY_ORDER = ["decoration", "bien-etre"];

export const SUBCATEGORY_LABELS: Record<string, string> = {
  "massage-detente": "Massage & Détente",
  "sommeil-repos": "Sommeil & Repos",
  "sport-posture": "Sport & Posture",
  "soin-rituel": "Soin & Rituel",
  "murs-textiles": "Murs & Textiles",
  "objets-zen": "Objets Zen",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function subcategoryLabel(subcategory: string): string {
  return SUBCATEGORY_LABELS[subcategory] ?? subcategory;
}

export function formatPrice(priceCents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(
    priceCents / 100
  );
}

// Les descriptions produit sont au format "accroche\n\nCe que vous
// obtenez :\n• ...\n\nphrase d'usage" : on ne garde que l'accroche pour les
// balises meta description, tronquée à une longueur adaptée aux SERP.
export function descriptionExcerpt(description: string, maxLength = 155): string {
  const hook = description.split("\n\n")[0].trim();
  if (hook.length <= maxLength) return hook;
  return `${hook.slice(0, maxLength - 1).trimEnd()}…`;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://home-wellness.whatelsebyvinc.com";

export async function getProducts(): Promise<Product[]> {
  const sql = getSql();
  return (await sql`
    select id, slug, name, description, price_cents, currency, image_url, category, subcategory, in_stock
    from products
    order by in_stock desc, (category = 'bien-etre'), subcategory nulls last, created_at desc
  `) as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, slug, name, description, price_cents, currency, image_url, category, subcategory, in_stock
    from products
    where slug = ${slug}
    limit 1
  `) as unknown as Product[];
  return rows[0] ?? null;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const sql = getSql();
  return (await sql`
    select id, slug, name, description, price_cents, currency, image_url, category, subcategory, in_stock
    from products
    where category = ${category}
    order by in_stock desc, subcategory nulls last, created_at desc
  `) as unknown as Product[];
}

export async function getProductsBySubcategory(
  category: string,
  subcategory: string
): Promise<Product[]> {
  const sql = getSql();
  return (await sql`
    select id, slug, name, description, price_cents, currency, image_url, category, subcategory, in_stock
    from products
    where category = ${category} and subcategory = ${subcategory}
    order by in_stock desc, created_at desc
  `) as unknown as Product[];
}

// Suggestions affichées sur la fiche produit : d'abord la même
// sous-catégorie, puis la même catégorie si besoin de compléter, en
// excluant toujours le produit courant et les ruptures de stock.
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, slug, name, description, price_cents, currency, image_url, category, subcategory, in_stock
    from products
    where slug != ${product.slug} and in_stock = true and category = ${product.category}
    order by
      case when subcategory is not distinct from ${product.subcategory} then 0 else 1 end,
      created_at desc
    limit ${limit}
  `) as unknown as Product[];
  return rows;
}

export type CategoryTree = {
  category: string;
  label: string;
  count: number;
  subcategories: { subcategory: string; label: string; count: number }[];
};

export async function getCategoryTree(): Promise<CategoryTree[]> {
  const sql = getSql();
  const rows = (await sql`
    select category, subcategory, count(*)::int as count
    from products
    where in_stock = true
    group by category, subcategory
  `) as unknown as { category: string; subcategory: string | null; count: number }[];

  const byCategory = new Map<string, CategoryTree>();
  for (const row of rows) {
    if (!byCategory.has(row.category)) {
      byCategory.set(row.category, {
        category: row.category,
        label: categoryLabel(row.category),
        count: 0,
        subcategories: [],
      });
    }
    const entry = byCategory.get(row.category)!;
    entry.count += row.count;
    if (row.subcategory) {
      entry.subcategories.push({
        subcategory: row.subcategory,
        label: subcategoryLabel(row.subcategory),
        count: row.count,
      });
    }
  }

  for (const entry of byCategory.values()) {
    entry.subcategories.sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }

  return Array.from(byCategory.values()).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );
}

export function groupBySubcategory(
  products: Product[]
): { subcategory: string | null; label: string; products: Product[] }[] {
  const groups = new Map<string | null, Product[]>();
  for (const product of products) {
    const key = product.subcategory;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(product);
  }
  return Array.from(groups.entries()).map(([subcategory, items]) => ({
    subcategory,
    label: subcategory ? subcategoryLabel(subcategory) : "Autres",
    products: items,
  }));
}

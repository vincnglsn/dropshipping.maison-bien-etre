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
  in_stock: boolean;
};

export function formatPrice(priceCents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(
    priceCents / 100
  );
}

export async function getProducts(): Promise<Product[]> {
  const sql = getSql();
  return (await sql`
    select id, slug, name, description, price_cents, currency, image_url, category, in_stock
    from products
    where in_stock = true
    order by created_at desc
  `) as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, slug, name, description, price_cents, currency, image_url, category, in_stock
    from products
    where slug = ${slug}
    limit 1
  `) as unknown as Product[];
  return rows[0] ?? null;
}

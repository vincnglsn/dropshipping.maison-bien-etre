import type { MetadataRoute } from "next";
import { getCategoryTree, getProducts } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://home-wellness.whatelsebyvinc.com";

  const staticRoutes = [
    "",
    "/panier",
    "/contact",
    "/a-propos",
    "/suivi-commande",
    "/mentions-legales",
    "/cgv",
    "/confidentialite",
    "/retours",
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const [products, tree] = await Promise.all([getProducts(), getCategoryTree()]);
    productRoutes = products.map((p) => ({
      url: `${base}/produits/${p.slug}`,
      lastModified: new Date(),
    }));
    categoryRoutes = tree.flatMap((entry) => [
      { url: `${base}/categorie/${entry.category}`, lastModified: new Date() },
      ...entry.subcategories.map((sub) => ({
        url: `${base}/categorie/${entry.category}/${sub.subcategory}`,
        lastModified: new Date(),
      })),
    ]);
  } catch {
    // Base de données indisponible au moment de la génération : on se
    // contente des routes statiques plutôt que de faire échouer le build.
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

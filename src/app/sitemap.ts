import type { MetadataRoute } from "next";
import { getCategoryTree, getProducts, SITE_URL } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: SITE_URL, changeFrequency: "daily", priority: 1 },
      { url: `${SITE_URL}/panier`, changeFrequency: "monthly", priority: 0.2 },
      { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}/a-propos`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}/suivi-commande`, changeFrequency: "yearly", priority: 0.2 },
      { url: `${SITE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.1 },
      { url: `${SITE_URL}/cgv`, changeFrequency: "yearly", priority: 0.1 },
      { url: `${SITE_URL}/confidentialite`, changeFrequency: "yearly", priority: 0.1 },
      { url: `${SITE_URL}/retours`, changeFrequency: "yearly", priority: 0.2 },
    ] as const
  ).map((route) => ({ ...route, lastModified: new Date() }));

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const [products, tree] = await Promise.all([getProducts(), getCategoryTree()]);
    productRoutes = products.map((p) => ({
      url: `${SITE_URL}/produits/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    categoryRoutes = tree.flatMap((entry) => [
      {
        url: `${SITE_URL}/categorie/${entry.category}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      ...entry.subcategories.map((sub) => ({
        url: `${SITE_URL}/categorie/${entry.category}/${sub.subcategory}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ]);
  } catch {
    // Base de données indisponible au moment de la génération : on se
    // contente des routes statiques plutôt que de faire échouer le build.
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

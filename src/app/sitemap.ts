import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://home-wellness.whatelsebyvinc.com";

  const staticRoutes = [
    "",
    "/panier",
    "/contact",
    "/mentions-legales",
    "/cgv",
    "/confidentialite",
    "/retours",
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productRoutes = products.map((p) => ({
      url: `${base}/produits/${p.slug}`,
      lastModified: new Date(),
    }));
  } catch {
    // Base de données indisponible au moment de la génération : on se
    // contente des routes statiques plutôt que de faire échouer le build.
  }

  return [...staticRoutes, ...productRoutes];
}

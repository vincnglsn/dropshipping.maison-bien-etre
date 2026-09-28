import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Police distincte pour le nom commercial "What else by Vinc" dans le logo,
// pour le différencier visuellement du nom du site.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://home-wellness.whatelsebyvinc.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Maison Bien-Être",
    template: "%s",
  },
  description: "Objets de bien-être et de décoration pour un intérieur serein.",
  openGraph: {
    title: "Maison Bien-Être",
    description: "Objets de bien-être et de décoration pour un intérieur serein.",
    url: siteUrl,
    siteName: "Maison Bien-Être",
    locale: "fr_FR",
    type: "website",
  },
  // Revendication du site sur Pinterest (What else by Vinc), pour
  // l'attribution des épingles créées depuis ce domaine.
  other: {
    "p:domain_verify": "e6daefef67e7e4c96fcddaf798cf5540",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
        <Analytics />
      </body>
    </html>
  );
}

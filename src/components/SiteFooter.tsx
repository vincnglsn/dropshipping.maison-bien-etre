import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-500 dark:border-stone-800">
      <nav className="mx-auto mb-3 flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6">
        <Link href="/contact" className="hover:underline">
          Contact
        </Link>
        <Link href="/mentions-legales" className="hover:underline">
          Mentions légales
        </Link>
        <Link href="/cgv" className="hover:underline">
          CGV
        </Link>
        <Link href="/confidentialite" className="hover:underline">
          Confidentialité
        </Link>
        <Link href="/retours" className="hover:underline">
          Livraison &amp; retours
        </Link>
      </nav>
      <p>© {new Date().getFullYear()} Maison Bien-Être</p>
    </footer>
  );
}

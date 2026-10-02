import Link from "next/link";
import { CartHeaderLink } from "@/components/CartHeaderLink";
import { SiteLogo } from "@/components/SiteLogo";

export function LegalHeader() {
  return (
    <header className="border-b border-stone-200 dark:border-stone-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <SiteLogo />
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-stone-600 dark:text-stone-400">
            ← Retour à la boutique
          </Link>
          <CartHeaderLink />
        </div>
      </div>
    </header>
  );
}

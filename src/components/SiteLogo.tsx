import Link from "next/link";

export function SiteLogo() {
  return (
    <Link href="/" className="flex flex-col leading-tight">
      <span className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-50">
        Maison Bien-Être
      </span>
      <span className="font-caveat text-base text-stone-500 dark:text-stone-400">
        par : What else by Vinc
      </span>
    </Link>
  );
}

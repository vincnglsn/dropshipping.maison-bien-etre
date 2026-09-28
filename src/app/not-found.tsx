import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-stone-50 px-6 text-center dark:bg-stone-950">
      <h1 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-50">
        Page introuvable
      </h1>
      <p className="max-w-md text-stone-600 dark:text-stone-400">
        Cette page n&apos;existe pas ou n&apos;est plus disponible.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-full bg-stone-900 px-6 py-3 font-medium text-white dark:bg-stone-100 dark:text-stone-900"
      >
        Retour à la boutique
      </Link>
    </div>
  );
}

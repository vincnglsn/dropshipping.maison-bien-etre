# Maison Bien-Être

Boutique en ligne (dropshipping) d'objets de bien-être et de décoration.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Neon](https://neon.tech) (Postgres serverless) via `@neondatabase/serverless`

## Démarrer en local

```bash
npm install
npm run dev
```

Le site attend une variable `DATABASE_URL` (voir `.env.local`, ignoré par git)
pointant vers la base Neon. Le schéma et des produits de démonstration sont
définis dans [`sql/schema.sql`](sql/schema.sql) ; applique-le sur ta base avec :

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

## Structure

- `src/app/page.tsx` — page d'accueil, liste des produits
- `src/app/produits/[slug]/page.tsx` — fiche produit
- `src/lib/db.ts` — client Neon
- `src/lib/products.ts` — accès aux données produits
- `sql/schema.sql` — schéma de la table `products` + jeu de données de démo

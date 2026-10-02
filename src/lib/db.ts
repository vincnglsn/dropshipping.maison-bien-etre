import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cachedSql: NeonQueryFunction<false, false> | null = null;

// Le client est instancié à la première requête plutôt qu'au chargement du module,
// pour ne pas faire échouer le build quand DATABASE_URL n'est pas encore défini (CI, etc.).
export function getSql(): NeonQueryFunction<false, false> {
  if (!cachedSql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    cachedSql = neon(connectionString);
  }
  return cachedSql;
}

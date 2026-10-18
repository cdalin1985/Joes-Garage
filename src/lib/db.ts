import { neon } from "@neondatabase/serverless";

/**
 * The website's own database: a Neon Postgres project ("joes-garage") that
 * holds online booking requests. Server-only — DATABASE_URL carries a
 * password and must never reach the browser.
 *
 * Callers take a plain `Query` function so the booking code doesn't depend on
 * the driver: (sql text with $1, $2 … placeholders, params) => rows.
 */
export type Row = Record<string, unknown>;
export type Query = (text: string, params?: unknown[]) => Promise<Row[]>;

/** Returns a query function, or null when DATABASE_URL isn't set. */
export function getDb(): Query | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const sql = neon(url);
  return (text, params = []) => sql.query(text, params) as Promise<Row[]>;
}

/** Postgres error code for a unique-constraint violation. */
export const UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === UNIQUE_VIOLATION;
}

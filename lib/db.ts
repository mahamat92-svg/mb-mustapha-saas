// =============================================================================
// MB Mustapha - Acces base de donnees (Prisma) avec repli automatique en DEMO
// -----------------------------------------------------------------------------
// Si DATABASE_URL est absent (ou si Prisma n'a pas ete genere), getPrisma()
// renvoie null et l'application sert des donnees de demonstration.
// Resultat : le projet demarre TOUJOURS, meme avant d'avoir cree la base.
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;
let tried = false;

export function baseConfiguree(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPrisma(): Promise<any | null> {
  if (!baseConfiguree()) return null;
  if (client) return client;
  if (tried) return null;
  tried = true;
  try {
    const mod = await import('@prisma/client');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PrismaClient = (mod as any).PrismaClient;
    if (!PrismaClient) return null;
    client = new PrismaClient({ log: ['error'] });
    return client;
  } catch (e) {
    console.warn('[MB Mustapha] Prisma indisponible -> mode demo actif.', (e as Error).message);
    return null;
  }
}

/**
 * Execute une requete base ; si la base est absente ou en erreur,
 * renvoie `fallback` (mode demo). Le SaaS ne plante jamais.
 */
export async function avecBase<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requete: (db: any) => Promise<T>,
  fallback: T,
): Promise<T> {
  const db = await getPrisma();
  if (!db) return fallback;
  try {
    return await requete(db);
  } catch (e) {
    console.error('[MB Mustapha] Erreur base de donnees :', (e as Error).message);
    return fallback;
  }
}

import { createClient } from '@vercel/edge-config';
import { Usuario, Visita } from '@/types/models';

export type Session = {
  id: string;
  userId: string;
  exp: number;
};

export type ResetToken = {
  email: string;
  token: string;
  exp: number;
};

export type DbSchema = {
  usuarios: Usuario[];
  visitas: Visita[];
  sessions: Session[];
  resetTokens: ResetToken[];
};

const EDGE_CONFIG_CONNECTION = process.env.EDGE_CONFIG || process.env.EDGE_CONFIG;
if (!EDGE_CONFIG_CONNECTION) {
  throw new Error('Defina EDGE_CONFIG com a connection string completa da Edge Config.');
}

const parsedUrl = new URL(EDGE_CONFIG_CONNECTION);
const EDGE_CONFIG_ID = parsedUrl.pathname.split('/').pop() || '';
const EDGE_CONFIG_TOKEN = parsedUrl.searchParams.get('token') || '';
const EDGE_CONFIG_WRITE_TOKEN = process.env.EDGE_CONFIG_WRITE_TOKEN ?? process.env.VERCEL_ACCESS_TOKEN ?? '';
const EDGE_CONFIG_TEAM_ID = process.env.VERCEL_TEAM_ID;
if (!EDGE_CONFIG_ID.startsWith('ecfg_') || !EDGE_CONFIG_TOKEN) {
  throw new Error('EDGE_CONFIG invalida: precisa conter ecfg_* e token=*.');
}

const rawEdgeKey = process.env.EDGE_CONFIG_KEY ?? 'portal_visitas_db';
const EDGE_CONFIG_KEY = rawEdgeKey.replace(/[^A-Za-z0-9_-]/g, '_');
const edgeClient = createClient(EDGE_CONFIG_CONNECTION);

const defaultVisitas: Visita[] = [
  {
    id: 'v1',
    titulo: 'Visita - Pediatria',
    hospital: 'Hospital Central',
    descricao: 'Apoio e recreacao para criancas internadas.',
    data: '2025-09-10',
    hora: '14:00',
    limiteVagas: 10,
    inscritosIds: [],
    status: 'ativa',
    cancelamentos: []
  }
];

const buildDefaultDb = async (): Promise<DbSchema> => {
  return {
    usuarios: [],
    visitas: defaultVisitas,
    sessions: [],
    resetTokens: []
  };
};

const seedDb = async () => {
  const existing = await edgeClient.get<DbSchema | null>(EDGE_CONFIG_KEY).catch((error) => {
    console.error('[storage] erro lendo Edge Config para seed', EDGE_CONFIG_KEY, error);
    return null;
  });
  if (existing) return;
  const initial = await buildDefaultDb();
  await writeEdgeConfig(initial);
};

export const readDb = async (): Promise<DbSchema> => {
  await seedDb();
  try {
    const stored = await edgeClient.get<DbSchema | null>(EDGE_CONFIG_KEY);
    if (!stored) {
      const fallback = await buildDefaultDb();
      await writeEdgeConfig(fallback);
      return fallback;
    }
    return stored;
  } catch (error) {
    console.error('[storage] erro lendo DB (Edge Config)', EDGE_CONFIG_KEY, error);
    throw error;
  }
};

export const writeDb = async (db: DbSchema) => {
  await writeEdgeConfig(db);
};

export const pruneExpiredSessions = (db: DbSchema) => {
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => s.exp > now);
  db.resetTokens = db.resetTokens.filter((t) => t.exp > now);
};

async function writeEdgeConfig(db: DbSchema) {
  const writeToken = EDGE_CONFIG_WRITE_TOKEN || EDGE_CONFIG_TOKEN;
  const teamQuery = EDGE_CONFIG_TEAM_ID ? `?teamId=${EDGE_CONFIG_TEAM_ID}` : '';
  const response = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items${teamQuery}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${writeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [
        {
          operation: 'upsert',
          key: EDGE_CONFIG_KEY,
          value: db
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[storage] erro escrevendo Edge Config', response.status, text);
    throw new Error(`Falha ao escrever Edge Config (${response.status})`);
  }
  console.log('[storage] wrote DB to Edge Config key', EDGE_CONFIG_KEY);
}

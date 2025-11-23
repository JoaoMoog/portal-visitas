import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { kv } from '@vercel/kv';
import { ADMIN_EMAIL } from '../constants';
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

let DATA_DIR =
  process.env.DATA_DIR ??
  (process.env.VERCEL ? path.join('/tmp', 'portal-visitas') : path.join(process.cwd(), 'data'));
let DB_FILE = process.env.DATA_FILE ?? path.join(DATA_DIR, 'db.json');
const USE_KV = Boolean(process.env.KV_REST_API_URL || process.env.KV_URL);
const KV_KEY = process.env.KV_KEY ?? 'portal-visitas:db';
const ADMIN_DEFAULT_PASSWORD = 'admin123';

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
  },
];

const ensureDir = async () => {
  if (USE_KV) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error: any) {
    if (error?.code === 'EROFS' || error?.code === 'EACCES') {
      // fallback para caminho gravavel (ex.: Vercel usa FS somente leitura fora de /tmp)
      DATA_DIR = path.join('/tmp', 'portal-visitas');
      DB_FILE = path.join(DATA_DIR, 'db.json');
      console.warn('[storage] permissao negada no caminho original, trocando para', DB_FILE);
      await fs.mkdir(DATA_DIR, { recursive: true });
    } else {
      throw error;
    }
  }
};

const fileExists = async (file: string) => {
  if (USE_KV) return false;
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const buildDefaultDb = async (): Promise<DbSchema> => {
  const senhaHash = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);
  const admin: Usuario = {
    id: 'admin-user',
    nome: 'Admin',
    email: ADMIN_EMAIL,
    telefone: '',
    senhaHash,
    role: 'admin'
  };

  return {
    usuarios: [admin],
    visitas: defaultVisitas,
    sessions: [],
    resetTokens: []
  };
};

const seedDb = async () => {
  if (USE_KV) {
    const exists = await kv.exists(KV_KEY);
    if (exists) return;
    const initial = await buildDefaultDb();
    await kv.set(KV_KEY, initial);
    return;
  }

  await ensureDir();
  if (await fileExists(DB_FILE)) return;

  const initial = await buildDefaultDb();
  await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
};

const ensureAdminUser = async (db: DbSchema) => {
  const adminEmail = ADMIN_EMAIL.toLowerCase();

  const idx = db.usuarios.findIndex((u) => u.email.toLowerCase() === adminEmail);
  if (idx === -1) {
    const senhaHash = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);
    const admin: Usuario = {
      id: 'admin-user',
      nome: 'Admin',
      email: ADMIN_EMAIL,
      telefone: '',
      senhaHash,
      role: 'admin'
    };
    db.usuarios.push(admin);
    await writeDb(db);
    console.warn('[storage] admin ausente; criado com senha de ambiente');
    return db;
  }

  // sempre sincroniza a senha com a env e garante role admin
  const existing = db.usuarios[idx];
  if (existing.role !== 'admin' || existing.email !== ADMIN_EMAIL) {
    db.usuarios[idx] = { ...existing, role: 'admin', email: ADMIN_EMAIL };
    await writeDb(db);
    console.warn('[storage] admin existente; role/email sincronizados');
  }
  return db;
};

export const readDb = async (): Promise<DbSchema> => {
  await seedDb();
  if (USE_KV) {
    try {
      const stored = await kv.get<DbSchema>(KV_KEY);
      if (!stored) {
        const fallback = await buildDefaultDb();
        await kv.set(KV_KEY, fallback);
        return fallback;
      }
      return await ensureAdminUser(stored);
    } catch (error) {
      console.error('[storage] erro lendo DB (KV)', KV_KEY, error);
      throw error;
    }
  }
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const db = JSON.parse(raw) as DbSchema;
    return await ensureAdminUser(db);
  } catch (error) {
    console.error('[storage] erro lendo DB', DB_FILE, error);
    throw error;
  }
};

export const writeDb = async (db: DbSchema) => {
  await ensureDir();
  if (USE_KV) {
    try {
      await kv.set(KV_KEY, db);
      console.log('[storage] wrote DB to KV key', KV_KEY);
      return;
    } catch (error) {
      console.error('[storage] erro escrevendo DB (KV)', KV_KEY, error);
      throw error;
    }
  }
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log('[storage] wrote DB to', DB_FILE);
  } catch (error) {
    console.error('[storage] erro escrevendo DB', DB_FILE, error);
    throw error;
  }
};

export const pruneExpiredSessions = (db: DbSchema) => {
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => s.exp > now);
  db.resetTokens = db.resetTokens.filter((t) => t.exp > now);
};

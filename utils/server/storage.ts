import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
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
  {
    id: 'v2',
    titulo: 'Visita - Oncologia',
    hospital: 'Hospital Vida',
    descricao: 'Conversa e leitura para pacientes oncologicos.',
    data: '2025-09-12',
    hora: '10:00',
    limiteVagas: 5,
    inscritosIds: [],
    status: 'ativa',
    cancelamentos: []
  },
  {
    id: 'v3',
    titulo: 'Visita - Geriatria',
    hospital: 'Hospital Esperanca',
    descricao: 'Companhia e atividades ludicas para idosos.',
    data: '2025-09-15',
    hora: '09:00',
    limiteVagas: 8,
    inscritosIds: [],
    status: 'ativa',
    cancelamentos: []
  },
  {
    id: 'v4',
    titulo: 'Visita - Maternidade',
    hospital: 'Hospital Central',
    descricao: 'Apoio a maes e recem-nascidos.',
    data: '2025-09-20',
    hora: '16:00',
    limiteVagas: 6,
    inscritosIds: [],
    status: 'ativa',
    cancelamentos: []
  }
];

const ensureDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error: any) {
    if (error?.code === 'EROFS' || error?.code === 'EACCES') {
      // fallback para caminho gravável (ex.: Vercel usa FS somente leitura fora de /tmp)
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
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const seedDb = async () => {
  await ensureDir();
  if (await fileExists(DB_FILE)) return;

  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  const senhaHash = await bcrypt.hash(adminPassword, 10);
  const admin: Usuario = {
    id: 'admin-user',
    nome: 'Admin',
    email: ADMIN_EMAIL,
    telefone: '',
    senhaHash,
    role: 'admin'
  };

  const initial: DbSchema = {
    usuarios: [admin],
    visitas: defaultVisitas,
    sessions: [],
    resetTokens: []
  };
  await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
};

export const readDb = async (): Promise<DbSchema> => {
  await seedDb();
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(raw) as DbSchema;
  } catch (error) {
    console.error('[storage] erro lendo DB', DB_FILE, error);
    throw error;
  }
};

export const writeDb = async (db: DbSchema) => {
  await ensureDir();
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

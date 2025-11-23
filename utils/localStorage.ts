'use client';

import { Role, Usuario, Visita } from '@/types/models';

export const ADMIN_EMAIL = 'admin@admin.com';

const USUARIOS_KEY = 'portal_visitas_usuarios';
const VISITAS_KEY = 'portal_visitas_visitas';
const USUARIO_LOGADO_KEY = 'portal_visitas_usuario_logado';
const RESET_TOKENS_KEY = 'portal_visitas_reset_tokens';
const LOGIN_ATTEMPTS_KEY = 'portal_visitas_login_attempts';
const SESSION_TTL_MS = 1000 * 60 * 120; // 2 horas
const RESET_TOKEN_TTL_MS = 1000 * 60 * 20; // 20 minutos
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 1000 * 60 * 15; // 15 minutos
const LOGIN_BLOCK_MS = 1000 * 60 * 10; // 10 minutos

const defaultUsuarios: Usuario[] = [];

const defaultVisitas: Visita[] = [
  {
    id: 'v1',
    titulo: 'Visita - Pediatria',
    hospital: 'Hospital Central',
    descricao: 'Apoio e recreacao para criancas internadas.',
    data: '2024-09-10',
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
    data: '2024-09-12',
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
    data: '2024-09-15',
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
    data: '2024-09-20',
    hora: '16:00',
    limiteVagas: 6,
    inscritosIds: [],
    status: 'ativa',
    cancelamentos: []
  }
];

const isBrowser = () => typeof window !== 'undefined';

const normalizeVisita = (visita: Visita | (Partial<Visita> & { id: string })): Visita => ({
  id: visita.id,
  titulo: visita.titulo ?? '',
  hospital: visita.hospital ?? '',
  descricao: visita.descricao,
  data: visita.data ?? '',
  hora: visita.hora ?? '',
  limiteVagas: visita.limiteVagas ?? 0,
  cancelamentos: visita.cancelamentos ?? [],
  inscritosIds: visita.inscritosIds ?? [],
  status: visita.status ?? 'ativa',
  recorrencia: visita.recorrencia
});

const getItem = <T,>(key: string): T | null => {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error('Erro ao ler localStorage', error);
    return null;
  }
};

const setItem = (key: string, value: unknown) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

type ResetToken = {
  email: string;
  token: string;
  exp: number;
};

type LoginAttempt = {
  count: number;
  firstAt: number;
  lockedUntil?: number;
};

const getResetTokens = (): ResetToken[] => getItem<ResetToken[]>(RESET_TOKENS_KEY) ?? [];
const saveResetTokens = (tokens: ResetToken[]) => setItem(RESET_TOKENS_KEY, tokens);

const getLoginAttempts = (): Record<string, LoginAttempt> => getItem<Record<string, LoginAttempt>>(LOGIN_ATTEMPTS_KEY) ?? {};
const saveLoginAttempts = (data: Record<string, LoginAttempt>) => setItem(LOGIN_ATTEMPTS_KEY, data);

export const isLoginBloqueado = (email: string): { bloqueado: boolean; restanteMs: number } => {
  const attempts = getLoginAttempts();
  const lower = email.toLowerCase();
  const entry = attempts[lower];
  if (!entry?.lockedUntil) return { bloqueado: false, restanteMs: 0 };
  const restante = entry.lockedUntil - Date.now();
  if (restante > 0) return { bloqueado: true, restanteMs: restante };
  delete attempts[lower];
  saveLoginAttempts(attempts);
  return { bloqueado: false, restanteMs: 0 };
};

export const registrarFalhaLogin = (email: string) => {
  const attempts = getLoginAttempts();
  const lower = email.toLowerCase();
  const now = Date.now();
  const atual: LoginAttempt = attempts[lower] ?? { count: 0, firstAt: now };

  if (atual.lockedUntil && atual.lockedUntil > now) {
    return;
  }

  if (now - atual.firstAt > LOGIN_WINDOW_MS) {
    atual.count = 0;
    atual.firstAt = now;
  }

  atual.count += 1;
  if (atual.count >= MAX_LOGIN_ATTEMPTS) {
    atual.lockedUntil = now + LOGIN_BLOCK_MS;
  }

  attempts[lower] = atual;
  saveLoginAttempts(attempts);
};

export const limparFalhasLogin = (email: string) => {
  const attempts = getLoginAttempts();
  const lower = email.toLowerCase();
  if (attempts[lower]) {
    delete attempts[lower];
    saveLoginAttempts(attempts);
  }
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const hashPassword = async (senha: string): Promise<string> => {
  if (!isBrowser() || !globalThis.crypto?.subtle) {
    throw new Error('Criptografia indisponivel no navegador.');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
};

export const seedInitialData = () => {
  if (!isBrowser()) return;
  if (!getItem<Usuario[]>(USUARIOS_KEY)) {
    setItem(USUARIOS_KEY, defaultUsuarios);
  }
  if (!getItem<Visita[]>(VISITAS_KEY)) {
    setItem(VISITAS_KEY, defaultVisitas);
  }
};

export const getUsuarios = (): Usuario[] => {
  seedInitialData();
  return getItem<Usuario[]>(USUARIOS_KEY) ?? [];
};

export const saveUsuarios = (usuarios: Usuario[]) => {
  setItem(USUARIOS_KEY, usuarios);
};

export const migrateSenhasPlanas = async () => {
  const usuarios = getUsuarios();
  let alterado = false;

  const atualizados: Usuario[] = [];

  for (const usuario of usuarios) {
    const senhaPlana = (usuario as unknown as { senha?: string }).senha;
    if (senhaPlana && !usuario.senhaHash) {
      const senhaHash = await hashPassword(senhaPlana);
      const { senha, ...resto } = usuario as unknown as Usuario & { senha?: string };
      atualizados.push({ ...resto, senhaHash });
      alterado = true;
    } else {
      atualizados.push(usuario);
    }
  }

  if (alterado) saveUsuarios(atualizados);
};

export const emailJaCadastrado = (email: string): boolean => {
  const usuarios = getUsuarios();
  return usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase());
};

export const gerarTokenReset = (email: string): ResetToken | null => {
  const usuarios = getUsuarios();
  const existe = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!existe) return null;
  const token = Math.random().toString(36).slice(2, 8).toUpperCase();
  const novo: ResetToken = { email: existe.email.toLowerCase(), token, exp: Date.now() + RESET_TOKEN_TTL_MS };
  const tokens = getResetTokens()
    .filter((t) => t.email !== novo.email || t.exp > Date.now())
    .concat([novo]);
  saveResetTokens(tokens);
  return novo;
};

export const validarTokenReset = (email: string, token: string): boolean => {
  const tokens = getResetTokens();
  const now = Date.now();
  return tokens.some((t) => t.email === email.toLowerCase() && t.token === token && t.exp > now);
};

export const consumirTokenReset = (email: string, token: string) => {
  const tokens = getResetTokens();
  const filtrados = tokens.filter((t) => !(t.email === email.toLowerCase() && t.token === token));
  saveResetTokens(filtrados);
};

export const registrarUsuario = async (nome: string, email: string, senha: string, role: Role): Promise<Usuario> => {
  const usuarios = getUsuarios();
  const senhaHash = await hashPassword(senha);
  const novo: Usuario = {
    id: crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
    nome,
    email,
    senhaHash,
    role
  };
  const atualizados = [...usuarios, novo];
  saveUsuarios(atualizados);
  return novo;
};

export const atualizarSenha = async (email: string, novaSenha: string): Promise<boolean> => {
  const usuarios = getUsuarios();
  const idx = usuarios.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return false;
  const senhaHash = await hashPassword(novaSenha);
  usuarios[idx] = { ...usuarios[idx], senhaHash };
  saveUsuarios(usuarios);
  return true;
};

export const getVisitas = (): Visita[] => {
  seedInitialData();
  const visitasArmazenadas = getItem<Visita[]>(VISITAS_KEY) ?? [];
  return visitasArmazenadas.map((visita) => normalizeVisita(visita));
};

export const saveVisitas = (visitas: Visita[]) => {
  setItem(VISITAS_KEY, visitas);
};

export const setUsuarioLogado = (usuario: Usuario | null) => {
  if (usuario) {
    setItem(USUARIO_LOGADO_KEY, { usuario, exp: Date.now() + SESSION_TTL_MS });
  } else if (isBrowser()) {
    window.localStorage.removeItem(USUARIO_LOGADO_KEY);
  }
};

export const getUsuarioLogado = (): Usuario | null => {
  const stored = getItem<{ usuario: Usuario; exp: number }>(USUARIO_LOGADO_KEY);
  if (!stored) return null;
  if (stored.exp && stored.exp > Date.now()) return stored.usuario;
  if (isBrowser()) window.localStorage.removeItem(USUARIO_LOGADO_KEY);
  return null;
};

export const inscreverUsuarioEmVisita = (usuarioId: string, visitaId: string): Visita[] => {
  const visitas = getVisitas();
  const visita = visitas.find((v) => v.id === visitaId);
  if (!visita) return visitas;
  if (visita.inscritosIds.includes(usuarioId)) return visitas;
  if (visita.inscritosIds.length >= visita.limiteVagas) return visitas;
  visita.inscritosIds = [...visita.inscritosIds, usuarioId];
  saveVisitas(visitas);
  return visitas;
};

export const cancelarInscricao = (usuarioId: string, visitaId: string, motivo?: string): Visita[] => {
  const visitas = getVisitas();
  const visita = visitas.find((v) => v.id === visitaId);
  if (!visita) return visitas;
  visita.inscritosIds = visita.inscritosIds.filter((id) => id !== usuarioId);
  const motivoTrim = motivo?.trim();
  if (motivoTrim) {
    visita.cancelamentos.push({
      usuarioId,
      motivo: motivoTrim,
      dataIso: new Date().toISOString()
    });
  }
  saveVisitas(visitas);
  return visitas;
};

export const cancelarVisita = (visitaId: string): Visita[] => {
  const visitas = getVisitas();
  const visita = visitas.find((v) => v.id === visitaId);
  if (!visita) return visitas;
  visita.status = 'cancelada';
  saveVisitas(visitas);
  return visitas;
};

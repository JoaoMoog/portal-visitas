import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies as nextCookies } from 'next/headers';
import { ADMIN_EMAIL, RESET_TOKEN_TTL_MS, SESSION_COOKIE, SESSION_TTL_MS } from '../constants';
import { Usuario } from '@/types/models';
import { DbSchema, ResetToken, Session, pruneExpiredSessions, readDb, writeDb } from './storage';

export const hashPassword = (senha: string) => bcrypt.hash(senha, 10);
export const verifyPassword = (senha: string, hash: string) => bcrypt.compare(senha, hash);

const removeSensitiveUser = (usuario: Usuario) => {
  const { senhaHash, ...rest } = usuario;
  return rest;
};

const getCookies = async () => nextCookies();

export const getSessionUser = async (): Promise<Usuario | null> => {
  const cookieStore = await getCookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = await readDb();
  pruneExpiredSessions(db);
  const session = db.sessions.find((s) => s.id === sessionId && s.exp > Date.now());
  if (!session) {
    cookieStore.delete(SESSION_COOKIE);
    await writeDb(db);
    return null;
  }
  const usuario = db.usuarios.find((u) => u.id === session.userId);
  if (!usuario) {
    cookieStore.delete(SESSION_COOKIE);
    await writeDb(db);
    return null;
  }
  return usuario;
};

export const setSession = async (userId: string) => {
  const cookieStore = await getCookies();
  const db = await readDb();
  pruneExpiredSessions(db);

  const session: Session = {
    id: crypto.randomUUID(),
    userId,
    exp: Date.now() + SESSION_TTL_MS
  };
  db.sessions.push(session);
  await writeDb(db);

  cookieStore.set({
    name: SESSION_COOKIE,
    value: session.id,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: Math.floor(SESSION_TTL_MS / 1000)
  });
};

export const clearSession = async () => {
  const cookieStore = await getCookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return;
  const db = await readDb();
  db.sessions = db.sessions.filter((s) => s.id !== sessionId);
  await writeDb(db);
  cookieStore.delete(SESSION_COOKIE);
};

export const ensureAdmin = (usuario: Usuario | null) => {
  if (!usuario || usuario.role !== 'admin') {
    const error = new Error('Unauthorized');
    // @ts-expect-error add status
    error.status = 401;
    throw error;
  }
};

export const registerUser = async (nome: string, email: string, telefone: string, senha: string) => {
  const emailLower = email.trim().toLowerCase();
  const db = await readDb();
  pruneExpiredSessions(db);

  if (db.usuarios.some((u) => u.email.toLowerCase() === emailLower)) {
    console.warn('[auth/registerUser] email duplicado', emailLower);
    return { ok: false, erro: 'Email ja cadastrado.' };
  }
  if (senha.length < 6) return { ok: false, erro: 'Senha deve ter pelo menos 6 caracteres.' };
  const telefoneDigits = telefone.replace(/\D/g, '');
  if (!telefoneDigits) return { ok: false, erro: 'Informe telefone valido.' };
  if (telefoneDigits.length > 11) return { ok: false, erro: 'Telefone deve ter no maximo 11 digitos.' };

  const senhaHash = await hashPassword(senha);
  const novo: Usuario = {
    id: crypto.randomUUID(),
    nome: nome.trim(),
    email: emailLower,
    telefone: telefoneDigits,
    senhaHash,
    role: emailLower === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'voluntario'
  };
  db.usuarios.push(novo);
  await writeDb(db);
  await setSession(novo.id);
  return { ok: true, usuario: removeSensitiveUser(novo) };
};

export const loginUser = async (email: string, senha: string) => {
  const emailLower = email.trim().toLowerCase();
  const db = await readDb();
  pruneExpiredSessions(db);
  const usuario = db.usuarios.find((u) => u.email.toLowerCase() === emailLower);
  if (!usuario) return { ok: false, erro: 'Credenciais invalidas.' };
  const ok = await verifyPassword(senha, usuario.senhaHash);
  if (!ok) return { ok: false, erro: 'Credenciais invalidas.' };
  await setSession(usuario.id);
  return { ok: true, usuario: removeSensitiveUser(usuario) };
};

export const requestResetToken = async (email: string): Promise<{ ok: boolean; token?: string; erro?: string }> => {
  const emailLower = email.trim().toLowerCase();
  const db = await readDb();
  pruneExpiredSessions(db);
  const usuario = db.usuarios.find((u) => u.email.toLowerCase() === emailLower);
  if (!usuario) return { ok: false, erro: 'Email nao encontrado.' };

  const token: ResetToken = {
    email: emailLower,
    token: crypto.randomBytes(3).toString('hex').toUpperCase(), // 6 chars
    exp: Date.now() + RESET_TOKEN_TTL_MS
  };
  db.resetTokens = db.resetTokens.filter((t) => t.email !== emailLower && t.exp > Date.now());
  db.resetTokens.push(token);
  await writeDb(db);
  return { ok: true, token: token.token };
};

export const consumeResetToken = async (email: string, token: string, novaSenha: string) => {
  const emailLower = email.trim().toLowerCase();
  const db = await readDb();
  pruneExpiredSessions(db);
  const match = db.resetTokens.find((t) => t.email === emailLower && t.token === token && t.exp > Date.now());
  if (!match) return { ok: false, erro: 'Token invalido ou expirado.' };
  const userIdx = db.usuarios.findIndex((u) => u.email.toLowerCase() === emailLower);
  if (userIdx === -1) return { ok: false, erro: 'Usuario nao encontrado.' };
  if (novaSenha.length < 6) return { ok: false, erro: 'Senha deve ter pelo menos 6 caracteres.' };

  db.usuarios[userIdx] = { ...db.usuarios[userIdx], senhaHash: await hashPassword(novaSenha) };
  db.resetTokens = db.resetTokens.filter((t) => !(t.email === emailLower && t.token === token));
  await writeDb(db);
  return { ok: true };
};

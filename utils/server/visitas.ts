'use server';

import crypto from 'crypto';
import { ensureAdmin } from './auth';
import { DbSchema, pruneExpiredSessions, readDb, writeDb } from './storage';
import { Visita, VisitaInput } from '@/types/models';

const normalizeVisita = (input: VisitaInput): Visita => ({
  id: input.id ?? crypto.randomUUID(),
  titulo: input.titulo ?? '',
  hospital: input.hospital ?? '',
  descricao: input.descricao,
  data: input.data ?? '',
  hora: input.hora ?? '',
  limiteVagas: Number(input.limiteVagas ?? 0),
  inscritosIds: [],
  cancelamentos: [],
  status: 'ativa',
  recorrencia: input.recorrencia
});

const saveDb = async (db: DbSchema) => {
  pruneExpiredSessions(db);
  await writeDb(db);
};

export const getVisitasDb = async (): Promise<Visita[]> => {
  const db = await readDb();
  pruneExpiredSessions(db);
  return db.visitas;
};

export const addVisitasDb = async (visitas: VisitaInput[]) => {
  const db = await readDb();
  pruneExpiredSessions(db);
  const novas = visitas.map((v) => normalizeVisita(v));
  db.visitas = [...db.visitas, ...novas];
  await saveDb(db);
  return db.visitas;
};

export const updateVisitaDb = async (visitaAtualizada: Partial<Visita> & { id: string }) => {
  const db = await readDb();
  pruneExpiredSessions(db);
  const idx = db.visitas.findIndex((v) => v.id === visitaAtualizada.id);
  if (idx === -1) return null;
  db.visitas[idx] = { ...db.visitas[idx], ...visitaAtualizada };
  await saveDb(db);
  return db.visitas;
};

export const deleteVisitaDb = async (id: string) => {
  const db = await readDb();
  pruneExpiredSessions(db);
  db.visitas = db.visitas.filter((v) => v.id !== id);
  await saveDb(db);
  return db.visitas;
};

export const cancelVisitaDb = async (id: string) => {
  const db = await readDb();
  pruneExpiredSessions(db);
  const visita = db.visitas.find((v) => v.id === id);
  if (!visita) return null;
  visita.status = 'cancelada';
  await saveDb(db);
  return db.visitas;
};

export const inscreverUsuario = async (visitaId: string, usuarioId: string) => {
  const db = await readDb();
  pruneExpiredSessions(db);
  const visita = db.visitas.find((v) => v.id === visitaId);
  if (!visita) return { ok: false, erro: 'Visita nao encontrada' };
  if (visita.status === 'cancelada') return { ok: false, erro: 'Visita cancelada' };
  if (visita.inscritosIds.includes(usuarioId)) return { ok: false, erro: 'Ja inscrito' };
  if (visita.inscritosIds.length >= visita.limiteVagas) return { ok: false, erro: 'Sem vagas' };
  visita.inscritosIds.push(usuarioId);
  await saveDb(db);
  return { ok: true, visitas: db.visitas };
};

export const cancelarInscricao = async (visitaId: string, usuarioId: string, motivo?: string) => {
  const db = await readDb();
  pruneExpiredSessions(db);
  const visita = db.visitas.find((v) => v.id === visitaId);
  if (!visita) return { ok: false, erro: 'Visita nao encontrada' };
  visita.inscritosIds = visita.inscritosIds.filter((id) => id !== usuarioId);
  const motivoTrim = motivo?.trim();
  if (motivoTrim) {
    visita.cancelamentos.push({
      usuarioId,
      motivo: motivoTrim,
      dataIso: new Date().toISOString()
    });
  }
  await saveDb(db);
  return { ok: true, visitas: db.visitas };
};

export const assertAdminUser = ensureAdmin;

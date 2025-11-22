'use client';

import { Usuario, Visita } from '@/types/models';

const USUARIOS_KEY = 'portal_visitas_usuarios';
const VISITAS_KEY = 'portal_visitas_visitas';
const USUARIO_LOGADO_KEY = 'portal_visitas_usuario_logado';

const defaultUsuarios: Usuario[] = [
  {
    id: '1',
    nome: 'Admin',
    email: 'admin@teste.com',
    senha: '123456',
    role: 'admin'
  },
  {
    id: '2',
    nome: 'Voluntário',
    email: 'voluntario@teste.com',
    senha: '123456',
    role: 'voluntario'
  }
];

const defaultVisitas: Visita[] = [
  {
    id: 'v1',
    titulo: 'Visita à Pediatria',
    hospital: 'Hospital Central',
    descricao: 'Apoio e recreação para crianças internadas.',
    data: '2024-09-10',
    hora: '14:00',
    limiteVagas: 10,
    inscritosIds: ['2'],
    status: 'ativa'
  },
  {
    id: 'v2',
    titulo: 'Visita à Oncologia',
    hospital: 'Hospital Vida',
    descricao: 'Conversa e leitura para pacientes oncológicos.',
    data: '2024-09-12',
    hora: '10:00',
    limiteVagas: 5,
    inscritosIds: [],
    status: 'ativa'
  },
  {
    id: 'v3',
    titulo: 'Visita à Geriatria',
    hospital: 'Hospital Esperança',
    descricao: 'Companhia e atividades lúdicas para idosos.',
    data: '2024-09-15',
    hora: '09:00',
    limiteVagas: 8,
    inscritosIds: [],
    status: 'ativa'
  },
  {
    id: 'v4',
    titulo: 'Visita à Maternidade',
    hospital: 'Hospital Central',
    descricao: 'Apoio a mães e recém-nascidos.',
    data: '2024-09-20',
    hora: '16:00',
    limiteVagas: 6,
    inscritosIds: [],
    status: 'ativa'
  }
];

const isBrowser = () => typeof window !== 'undefined';

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

export const getVisitas = (): Visita[] => {
  seedInitialData();
  return getItem<Visita[]>(VISITAS_KEY) ?? [];
};

export const saveVisitas = (visitas: Visita[]) => {
  setItem(VISITAS_KEY, visitas);
};

export const setUsuarioLogado = (usuario: Usuario | null) => {
  if (usuario) {
    setItem(USUARIO_LOGADO_KEY, usuario);
  } else if (isBrowser()) {
    window.localStorage.removeItem(USUARIO_LOGADO_KEY);
  }
};

export const getUsuarioLogado = (): Usuario | null => {
  return getItem<Usuario>(USUARIO_LOGADO_KEY);
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

export const cancelarInscricao = (usuarioId: string, visitaId: string): Visita[] => {
  const visitas = getVisitas();
  const visita = visitas.find((v) => v.id === visitaId);
  if (!visita) return visitas;
  visita.inscritosIds = visita.inscritosIds.filter((id) => id !== usuarioId);
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

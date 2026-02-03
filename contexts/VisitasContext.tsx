'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Visita, VisitaInput } from '@/types/models';

export type VisitasContextType = {
  visitas: Visita[];
  adicionarVisita: (visita: VisitaInput) => Promise<void>;
  adicionarVisitas: (novas: VisitaInput[]) => Promise<void>;
  atualizarVisita: (visitaAtualizada: Visita) => Promise<void>;
  cancelarVisita: (id: string) => Promise<void>;
  deletarVisita: (id: string) => Promise<void>;
  inscrever: (visitaId: string) => Promise<{ ok: boolean; erro?: string }>;
  removerInscricao: (visitaId: string, motivo: string) => Promise<{ ok: boolean; erro?: string }>;
  inscreverFotografo: (visitaId: string) => Promise<{ ok: boolean; erro?: string }>;
  removerFotografo: (visitaId: string) => Promise<{ ok: boolean; erro?: string }>;
};

const VisitasContext = createContext<VisitasContextType | undefined>(undefined);

const fetchJson = async <T,>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, { credentials: 'include', ...init });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const erro = (data as { error?: string }).error || 'Erro inesperado';
    throw new Error(erro);
  }
  return data;
};

export const VisitasProvider = ({ children }: { children: React.ReactNode }) => {
  const [visitas, setVisitas] = useState<Visita[]>([]);

  const carregarVisitas = async () => {
    try {
      const data = await fetchJson<{ visitas: Visita[] }>('/api/visitas');
      setVisitas(data.visitas);
    } catch (error) {
      console.error('Erro ao carregar visitas', error);
    }
  };

  useEffect(() => {
    void carregarVisitas();
  }, []);

  const adicionarVisita = async (visita: VisitaInput) => {
    const data = await fetchJson<{ visitas: Visita[] }>('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visita })
    });
    setVisitas(data.visitas);
  };

  const adicionarVisitas = async (novas: VisitaInput[]) => {
    if (novas.length === 0) return;
    const data = await fetchJson<{ visitas: Visita[] }>('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitas: novas })
    });
    setVisitas(data.visitas);
  };

  const atualizarVisita = async (visitaAtualizada: Visita) => {
    const data = await fetchJson<{ visitas: Visita[] }>(`/api/visitas/${visitaAtualizada.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitaAtualizada)
    });
    setVisitas(data.visitas);
  };

  const cancelarVisita = async (id: string) => {
    const data = await fetchJson<{ visitas: Visita[] }>(`/api/visitas/${id}/cancelar`, {
      method: 'POST'
    });
    setVisitas(data.visitas);
  };

  const deletarVisita = async (id: string) => {
    const data = await fetchJson<{ visitas: Visita[] }>(`/api/visitas/${id}`, {
      method: 'DELETE'
    });
    setVisitas(data.visitas);
  };

  const inscrever = async (visitaId: string) => {
    try {
      const data = await fetchJson<{ visitas: Visita[] }>(`/api/visitas/${visitaId}/inscricoes`, { method: 'POST' });
      setVisitas(data.visitas);
      return { ok: true };
    } catch (error) {
      return { ok: false, erro: (error as Error).message };
    }
  };

  const removerInscricao = async (visitaId: string, motivo: string) => {
    try {
      const data = await fetchJson<{ visitas: Visita[] }>(`/api/visitas/${visitaId}/cancelar-inscricao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      });
      setVisitas(data.visitas);
      return { ok: true };
    } catch (error) {
      return { ok: false, erro: (error as Error).message };
    }
  };

  const inscreverFotografo = async (visitaId: string) => {
    try {
      const data = await fetchJson<{ visita: Visita }>(`/api/visitas/${visitaId}/fotografo`, { method: 'POST' });
      setVisitas(prev => prev.map(v => v.id === visitaId ? data.visita : v));
      return { ok: true };
    } catch (error) {
      return { ok: false, erro: (error as Error).message };
    }
  };

  const removerFotografo = async (visitaId: string) => {
    try {
      const data = await fetchJson<{ visita: Visita }>(`/api/visitas/${visitaId}/fotografo`, { method: 'DELETE' });
      setVisitas(prev => prev.map(v => v.id === visitaId ? data.visita : v));
      return { ok: true };
    } catch (error) {
      return { ok: false, erro: (error as Error).message };
    }
  };

  const value = useMemo(
    () => ({
      visitas,
      adicionarVisita,
      adicionarVisitas,
      atualizarVisita,
      cancelarVisita,
      deletarVisita,
      inscrever,
      removerInscricao,
      inscreverFotografo,
      removerFotografo
    }),
    [visitas]
  );

  return <VisitasContext.Provider value={value}>{children}</VisitasContext.Provider>;
};

export const useVisitas = () => {
  const ctx = useContext(VisitasContext);
  if (!ctx) throw new Error('useVisitas deve ser usado dentro de VisitasProvider');
  return ctx;
};

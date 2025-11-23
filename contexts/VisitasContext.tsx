'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Visita } from '@/types/models';
import {
  cancelarInscricao,
  cancelarVisita,
  getVisitas,
  inscreverUsuarioEmVisita,
  saveVisitas
} from '@/utils/localStorage';

export type VisitasContextType = {
  visitas: Visita[];
  adicionarVisita: (visita: Visita) => void;
  adicionarVisitas: (novas: Visita[]) => void;
  atualizarVisita: (visitaAtualizada: Visita) => void;
  cancelarVisita: (id: string) => void;
  deletarVisita: (id: string) => void;
  inscrever: (usuarioId: string, visitaId: string) => void;
  removerInscricao: (usuarioId: string, visitaId: string, motivo: string) => void;
};

const VisitasContext = createContext<VisitasContextType | undefined>(undefined);

export const VisitasProvider = ({ children }: { children: React.ReactNode }) => {
  const [visitas, setVisitas] = useState<Visita[]>([]);

  useEffect(() => {
    setVisitas(getVisitas());
  }, []);

  const adicionarVisita = (visita: Visita) => {
    setVisitas((prev) => {
      const novas = [...prev, visita];
      saveVisitas(novas);
      return novas;
    });
  };

  const adicionarVisitas = (novasVisitas: Visita[]) => {
    if (novasVisitas.length === 0) return;
    setVisitas((prev) => {
      const novas = [...prev, ...novasVisitas];
      saveVisitas(novas);
      return novas;
    });
  };

  const atualizarVisita = (visitaAtualizada: Visita) => {
    setVisitas((prev) => {
      const novas = prev.map((v) => (v.id === visitaAtualizada.id ? visitaAtualizada : v));
      saveVisitas(novas);
      return novas;
    });
  };

  const cancelarVisitaHandler = (id: string) => {
    const novas = cancelarVisita(id);
    setVisitas([...novas]);
  };

  const deletarVisita = (id: string) => {
    setVisitas((prev) => {
      const novas = prev.filter((v) => v.id !== id);
      saveVisitas(novas);
      return novas;
    });
  };

  const inscrever = (usuarioId: string, visitaId: string) => {
    const novas = inscreverUsuarioEmVisita(usuarioId, visitaId);
    setVisitas([...novas]);
  };

  const removerInscricao = (usuarioId: string, visitaId: string, motivo: string) => {
    const novas = cancelarInscricao(usuarioId, visitaId, motivo);
    setVisitas([...novas]);
  };

  const value = useMemo(
    () => ({
      visitas,
      adicionarVisita,
      adicionarVisitas,
      atualizarVisita,
      cancelarVisita: cancelarVisitaHandler,
      deletarVisita,
      inscrever,
      removerInscricao
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

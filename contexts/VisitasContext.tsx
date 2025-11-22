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
  atualizarVisita: (visitaAtualizada: Visita) => void;
  cancelarVisita: (id: string) => void;
  inscrever: (usuarioId: string, visitaId: string) => void;
  removerInscricao: (usuarioId: string, visitaId: string) => void;
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

  const inscrever = (usuarioId: string, visitaId: string) => {
    const novas = inscreverUsuarioEmVisita(usuarioId, visitaId);
    setVisitas([...novas]);
  };

  const removerInscricao = (usuarioId: string, visitaId: string) => {
    const novas = cancelarInscricao(usuarioId, visitaId);
    setVisitas([...novas]);
  };

  const value = useMemo(
    () => ({ visitas, adicionarVisita, atualizarVisita, cancelarVisita: cancelarVisitaHandler, inscrever, removerInscricao }),
    [visitas]
  );

  return <VisitasContext.Provider value={value}>{children}</VisitasContext.Provider>;
};

export const useVisitas = () => {
  const ctx = useContext(VisitasContext);
  if (!ctx) throw new Error('useVisitas deve ser usado dentro de VisitasProvider');
  return ctx;
};

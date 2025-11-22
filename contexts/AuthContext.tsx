'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Usuario } from '@/types/models';
import { getUsuarioLogado, getUsuarios, seedInitialData, setUsuarioLogado } from '@/utils/localStorage';

export type AuthContextType = {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    seedInitialData();
    const logged = getUsuarioLogado();
    if (logged) setUsuario(logged);
    setCarregando(false);
  }, []);

  const login = async (email: string, senha: string) => {
    const usuarios = getUsuarios();
    const found = usuarios.find((u) => u.email === email && u.senha === senha);
    if (found) {
      setUsuario(found);
      setUsuarioLogado(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUsuario(null);
    setUsuarioLogado(null);
  };

  const value = useMemo(() => ({ usuario, carregando, login, logout }), [usuario, carregando]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};

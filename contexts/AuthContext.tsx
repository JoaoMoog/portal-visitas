'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { UsuarioPublico } from '@/types/models';

export type AuthContextType = {
  usuario: UsuarioPublico | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  registrar: (nome: string, email: string, telefone: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  solicitarReset: (email: string) => Promise<{ ok: boolean; erro?: string; token?: string }>;
  resetarSenha: (email: string, token: string, novaSenha: string) => Promise<{ ok: boolean; erro?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchJson = async <T,>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, { credentials: 'include', ...init });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const erro = (data as { error?: string }).error || 'Erro inesperado';
    throw new Error(erro);
  }
  return data;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await fetchJson<{ usuario: UsuarioPublico | null }>('/api/auth/me');
        setUsuario(data.usuario);
      } catch {
        setUsuario(null);
      } finally {
        setCarregando(false);
      }
    };
    void init();
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const data = await fetchJson<{ ok: boolean; usuario: UsuarioPublico }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      setUsuario(data.usuario);
      return { ok: true };
    } catch (error) {
      return { ok: false, erro: (error as Error).message };
    }
  };

  const registrar = async (nome: string, email: string, telefone: string, senha: string) => {
    try {
      const data = await fetchJson<{ ok: boolean; usuario: UsuarioPublico }>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, senha })
      });
      setUsuario(data.usuario);
      return { ok: true };
    } catch (error) {
      return { ok: false, erro: (error as Error).message };
    }
  };

  const solicitarReset = async (email: string) => {
    try {
      const data = await fetchJson<{ ok: boolean; token?: string }>('/api/auth/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return { ok: true, token: data.token };
    } catch (error) {
      return { ok: false, erro: (error as Error).message };
    }
  };

  const resetarSenha = async (email: string, token: string, novaSenha: string) => {
    try {
      await fetchJson('/api/auth/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, novaSenha })
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, erro: (error as Error).message };
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUsuario(null);
  };

  const value = useMemo(
    () => ({ usuario, carregando, login, registrar, solicitarReset, resetarSenha, logout }),
    [usuario, carregando]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};

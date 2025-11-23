'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Role, Usuario } from '@/types/models';
import {
  ADMIN_EMAIL,
  emailJaCadastrado,
  getUsuarioLogado,
  getUsuarios,
  hashPassword,
  isLoginBloqueado,
  limparFalhasLogin,
  migrateSenhasPlanas,
  registrarFalhaLogin,
  registrarUsuario,
  gerarTokenReset,
  validarTokenReset,
  atualizarSenha,
  consumirTokenReset,
  seedInitialData,
  setUsuarioLogado
} from '@/utils/localStorage';

export type AuthContextType = {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  registrar: (nome: string, email: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  solicitarReset: (email: string) => Promise<{ ok: boolean; erro?: string; token?: string }>;
  resetarSenha: (email: string, token: string, novaSenha: string) => Promise<{ ok: boolean; erro?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const init = async () => {
      seedInitialData();
      await migrateSenhasPlanas();
      const logged = getUsuarioLogado();
      if (logged) setUsuario(logged);
      setCarregando(false);
    };
    void init();
  }, []);

  const login = async (email: string, senha: string) => {
    const emailNormalizado = email.trim().toLowerCase();
    const { bloqueado, restanteMs } = isLoginBloqueado(emailNormalizado);
    if (bloqueado) {
      const minutos = Math.ceil(restanteMs / 60000);
      return { ok: false, erro: `Muitas tentativas. Tente novamente em ${minutos} min.` };
    }

    const usuarios = getUsuarios();
    const found = usuarios.find((u) => u.email.toLowerCase() === emailNormalizado);
    if (!found) {
      registrarFalhaLogin(emailNormalizado);
      return { ok: false, erro: 'Credenciais invalidas.' };
    }
    const senhaHash = await hashPassword(senha);
    if (found.senhaHash !== senhaHash) {
      registrarFalhaLogin(emailNormalizado);
      return { ok: false, erro: 'Credenciais invalidas.' };
    }
    limparFalhasLogin(emailNormalizado);
    setUsuario(found);
    setUsuarioLogado(found);
    return { ok: true };
  };

  const registrar = async (nome: string, email: string, senha: string) => {
    const emailNormalizado = email.trim();
    if (!nome || !emailNormalizado || !senha) {
      return { ok: false, erro: 'Preencha todos os campos.' };
    }
    if (senha.length < 6) return { ok: false, erro: 'Senha deve ter pelo menos 6 caracteres.' };

    if (emailJaCadastrado(emailNormalizado)) {
      return { ok: false, erro: 'Email já cadastrado.' };
    }

    const role: Role = emailNormalizado.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'voluntario';
    const novo = await registrarUsuario(nome.trim(), emailNormalizado.toLowerCase(), senha, role);
    setUsuario(novo);
    setUsuarioLogado(novo);
    return { ok: true };
  };

  const solicitarReset = async (email: string) => {
    const token = gerarTokenReset(email);
    if (!token) return { ok: false, erro: 'Email não encontrado.' };
    return { ok: true, token: token.token };
  };

  const resetarSenha = async (email: string, token: string, novaSenha: string) => {
    if (novaSenha.length < 6) return { ok: false, erro: 'Senha deve ter pelo menos 6 caracteres.' };
    const emailLower = email.toLowerCase();
    if (!validarTokenReset(emailLower, token)) {
      return { ok: false, erro: 'Token inválido ou expirado.' };
    }
    const ok = await atualizarSenha(emailLower, novaSenha);
    if (ok) {
      consumirTokenReset(emailLower, token);
      limparFalhasLogin(emailLower);
      return { ok: true };
    }
    return { ok: false, erro: 'Não foi possível atualizar a senha.' };
  };

  const logout = () => {
    setUsuario(null);
    setUsuarioLogado(null);
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

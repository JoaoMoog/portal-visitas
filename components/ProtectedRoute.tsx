'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { usuario, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push('/login');
    }
  }, [usuario, carregando, router]);

  if (carregando) return null;
  if (!usuario) return null;
  return <>{children}</>;
};

export const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { usuario, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;
    if (!usuario) {
      router.push('/login');
      return;
    }
    if (usuario.role !== 'admin') {
      router.push('/');
    }
  }, [usuario, carregando, router]);

  if (carregando) return null;
  if (!usuario || usuario.role !== 'admin') return null;
  return <>{children}</>;
};

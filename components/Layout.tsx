'use client';

import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const showNav = pathname !== '/login';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {showNav && (
        <AppBar position="static">
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography component={Link} href="/" variant="h6" sx={{ color: 'inherit', textDecoration: 'none' }}>
                Portal de Visitas
              </Typography>
              {usuario?.role === 'admin' && (
                <Button color="inherit" component={Link} href="/admin/visitas">
                  Admin
                </Button>
              )}
              <Button color="inherit" component={Link} href="/minhas-visitas">
                Minhas visitas
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {usuario && <Typography>{usuario.nome}</Typography>}
              <Button color="inherit" onClick={handleLogout}>
                Sair
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      )}
      <Container sx={{ py: 4 }}>{children}</Container>
    </Box>
  );
};

'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip,
  Stack,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  Collapse,
  Tooltip
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const DRAWER_WIDTH = 260;

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { usuario, carregando, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);

  useEffect(() => {
    if (carregando) return;
    if (!usuario && pathname !== '/login') {
      router.push('/login');
    }
  }, [carregando, usuario, pathname, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const showNav = pathname !== '/login';
  const isAdmin = usuario?.role === 'admin';
  const isActive = (path: string) => pathname === path;
  const isAdminSection = pathname.startsWith('/admin');

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography color="white" fontWeight={800} fontSize={18}>
              PV
            </Typography>
          </Box>
          <Stack spacing={-0.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              Portal de Visitas
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Painel Administrativo
            </Typography>
          </Stack>
        </Stack>
        {isMobile && (
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />

      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: isAdmin ? '#e11d48' : '#0d9488',
              fontSize: 16,
              fontWeight: 700
            }}
          >
            {usuario?.nome.charAt(0).toUpperCase()}
          </Avatar>
          <Stack spacing={-0.25}>
            <Typography variant="body2" fontWeight={600}>
              {usuario?.nome}
            </Typography>
            <Chip
              label={isAdmin ? 'Administrador' : 'Voluntário'}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                bgcolor: isAdmin ? 'rgba(225, 29, 72, 0.1)' : 'rgba(13, 148, 136, 0.1)',
                color: isAdmin ? '#e11d48' : '#0d9488',
                fontWeight: 600
              }}
            />
          </Stack>
        </Stack>
      </Box>
      <Divider />

      <List sx={{ flex: 1, px: 1 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            href="/"
            selected={isActive('/')}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': { bgcolor: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' }
            }}
            onClick={() => isMobile && setDrawerOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <HomeIcon color={isActive('/') ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Visitas Disponíveis" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            href="/minhas-visitas"
            selected={isActive('/minhas-visitas')}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': { bgcolor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }
            }}
            onClick={() => isMobile && setDrawerOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BookmarksIcon color={isActive('/minhas-visitas') ? 'inherit' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Minhas Inscrições" />
          </ListItemButton>
        </ListItem>

        {isAdmin && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontSize: 10 }}>
              Administração
            </Typography>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Gerenciamento" />
                {adminMenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>

            <Collapse in={adminMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 2 }}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    href="/admin"
                    selected={isActive('/admin')}
                    sx={{
                      borderRadius: 2,
                      py: 0.75,
                      '&.Mui-selected': { bgcolor: 'rgba(225, 29, 72, 0.1)', color: '#e11d48' }
                    }}
                    onClick={() => isMobile && setDrawerOpen(false)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <BarChartIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: 14 }} />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    href="/admin/visitas"
                    selected={isActive('/admin/visitas')}
                    sx={{
                      borderRadius: 2,
                      py: 0.75,
                      '&.Mui-selected': { bgcolor: 'rgba(225, 29, 72, 0.1)', color: '#e11d48' }
                    }}
                    onClick={() => isMobile && setDrawerOpen(false)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EventIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Listar Visitas" primaryTypographyProps={{ fontSize: 14 }} />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    href="/admin/visitas/nova"
                    selected={isActive('/admin/visitas/nova')}
                    sx={{
                      borderRadius: 2,
                      py: 0.75,
                      '&.Mui-selected': { bgcolor: 'rgba(225, 29, 72, 0.1)', color: '#e11d48' }
                    }}
                    onClick={() => isMobile && setDrawerOpen(false)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AddCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Nova Visita" primaryTypographyProps={{ fontSize: 14 }} />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    href="/admin/hospitais"
                    selected={isActive('/admin/hospitais')}
                    sx={{
                      borderRadius: 2,
                      py: 0.75,
                      '&.Mui-selected': { bgcolor: 'rgba(8, 145, 178, 0.1)', color: '#0891b2' }
                    }}
                    onClick={() => isMobile && setDrawerOpen(false)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <LocalHospitalIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Hospitais" primaryTypographyProps={{ fontSize: 14 }} />
                  </ListItemButton>
                </ListItem>
              </List>
            </Collapse>
          </>
        )}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderRadius: 2 }}
        >
          Sair do sistema
        </Button>
      </Box>
    </Box>
  );

  if (!showNav) {
    return <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>{children}</Box>;
  }

  // Admin usa drawer lateral, voluntário usa AppBar tradicional
  if (isAdmin) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        {/* Drawer fixo em desktop */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                borderRight: '1px solid #e2e8f0'
              }
            }}
          >
            {drawerContent}
          </Drawer>
        )}

        {/* Drawer temporário em mobile */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={toggleDrawer}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box'
              }
            }}
          >
            {drawerContent}
          </Drawer>
        )}

        {/* Conteúdo principal */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {isMobile && (
            <AppBar
              position="sticky"
              elevation={0}
              sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}
            >
              <Toolbar>
                <IconButton edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  Portal de Visitas
                </Typography>
              </Toolbar>
            </AppBar>
          )}
          <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
            {children}
          </Container>
        </Box>
      </Box>
    );
  }

  // Layout tradicional para voluntários
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Stack
              component={Link}
              href="/"
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ textDecoration: 'none', mr: 3 }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography color="white" fontWeight={800} fontSize={18}>
                  PV
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                Portal de Visitas
              </Typography>
            </Stack>

            <Button
              color="inherit"
              component={Link}
              href="/"
              startIcon={<HomeIcon />}
              sx={{
                bgcolor: isActive('/') ? 'rgba(255,255,255,0.2)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Visitas
            </Button>

            <Button
              color="inherit"
              component={Link}
              href="/minhas-visitas"
              startIcon={<BookmarksIcon />}
              sx={{
                bgcolor: isActive('/minhas-visitas') ? 'rgba(255,255,255,0.2)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Minhas inscrições
            </Button>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 700 }}>
                {usuario?.nome.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" fontWeight={600} color="white">
                {usuario?.nome}
              </Typography>
            </Stack>
            <Tooltip title="Sair do sistema">
              <IconButton color="inherit" onClick={handleLogout} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

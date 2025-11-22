'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from '@/contexts/AuthContext';
import { VisitasProvider } from '@/contexts/VisitasContext';
import { Layout } from '@/components/Layout';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    }
  }
});

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <VisitasProvider>
        <Layout>{children}</Layout>
      </VisitasProvider>
    </AuthProvider>
  </ThemeProvider>
);

'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from '@/contexts/AuthContext';
import { VisitasProvider } from '@/contexts/VisitasContext';
import { Layout } from '@/components/Layout';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#e11d48'
    },
    secondary: {
      main: '#f59e0b'
    },
    background: {
      default: '#f2f5f8'
    }
  },
  typography: {
    fontFamily: "'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          paddingInline: 18,
          paddingBlock: 10
        }
      }
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

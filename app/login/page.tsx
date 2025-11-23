'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, registrar, solicitarReset, resetarSenha } = useAuth();
  const router = useRouter();
  const [aba, setAba] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRegistro, setLoadingRegistro] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNovaSenha, setForgotNovaSenha] = useState('');
  const [forgotStep, setForgotStep] = useState<'solicitar' | 'resetar'>('solicitar');
  const [loadingReset, setLoadingReset] = useState(false);

  const titulo = useMemo(() => (aba === 'login' ? 'Entre para acompanhar' : 'Crie seu acesso de voluntário'), [aba]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setLoadingLogin(true);
    const result = await login(email, senha);
    setLoadingLogin(false);
    if (!result.ok) {
      setErro(result.erro ?? 'Email ou senha inválidos.');
      return;
    }
    router.push('/');
  };

  const handleRegistro = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setSucesso('');
    setLoadingRegistro(true);
    const resultado = await registrar(nome, email, telefone, senha);
    setLoadingRegistro(false);
    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Não foi possível registrar.');
      return;
    }
    setSucesso('Cadastro concluído! Já liberamos seu acesso.');
    router.push('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(140% 90% at 20% 20%, #ffe4e6 0%, #fff7ed 45%, #fef2f2 100%), linear-gradient(120deg, rgba(241, 195, 79, 0.2), rgba(225, 29, 72, 0.15))',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }
      }}
    >
      <Box
        sx={{
          p: { xs: 4, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 3
        }}
      >
        <Chip
          label="Trupe Os Cheios de Graça"
          color="primary"
          sx={{ alignSelf: 'flex-start', fontWeight: 700, px: 1.5, borderRadius: 9999 }}
        />
        <Typography variant="h3" fontWeight={800} sx={{ maxWidth: 520, lineHeight: 1.05 }}>
          Visitas leves, coloridas e cheias de alegria para transformar corredores em sorrisos.
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 520 }}>
          Portal único para os voluntários organizarem visitas.
        </Typography>
      </Box>

      <Box
        sx={{
          p: { xs: 3, md: 6 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #111827 0%, #1f2937 60%, #0f172a 100%)'
        }}
      >
        <Paper
          elevation={10}
          sx={{
            width: '100%',
            maxWidth: 460,
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            background: 'linear-gradient(150deg, #ffffff 0%, #fff7ed 80%)',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
            border: '1px solid #e2e8f0',
            backdropFilter: 'blur(6px)'
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700}>
                Portal
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {titulo}
              </Typography>
            </Box>
            <Tabs
              value={aba}
              onChange={(_, value: 'login' | 'registro') => setAba(value)}
              textColor="primary"
              indicatorColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Login" value="login" />
              <Tab label="Registro" value="registro" />
            </Tabs>

            {aba === 'login' ? (
              <Box component="form" onSubmit={handleLogin}>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    fullWidth
                  />
                  <Stack direction="row" spacing={1}>
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={loadingLogin}>
                      {loadingLogin ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
                    </Button>
                    <Button variant="text" onClick={() => setForgotOpen(true)}>
                      Esqueceu?
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleRegistro}>
                <Stack spacing={2}>
                  <TextField
                    label="Nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Telefone (WhatsApp)"
                    type="tel"
                    placeholder="(11) 98888-7777"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    fullWidth
                  />
                  <Button type="submit" variant="contained" size="large" disabled={loadingRegistro}>
                    {loadingRegistro ? <CircularProgress size={22} color="inherit" /> : 'Criar acesso'}
                  </Button>
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      </Box>

      <Snackbar
        open={Boolean(erro || sucesso)}
        autoHideDuration={4000}
        onClose={() => {
          setErro('');
          setSucesso('');
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {erro || sucesso ? (
          <Alert
            severity={erro ? 'error' : 'success'}
            onClose={() => {
              setErro('');
              setSucesso('');
            }}
            sx={{ width: '100%' }}
          >
            {erro || sucesso}
          </Alert>
        ) : undefined}
      </Snackbar>

      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Recuperar senha</DialogTitle>
        <DialogContent>
          {forgotStep === 'solicitar' && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Email cadastrado"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                fullWidth
              />
              <Typography variant="body2" color="text.secondary">
                Enviaremos um token de recuperação para seu email (Gmail).
              </Typography>
            </Stack>
          )}
          {forgotStep === 'resetar' && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Email" type="email" value={forgotEmail} disabled fullWidth />
              <TextField
                label="Token recebido"
                value={forgotToken}
                onChange={(e) => setForgotToken(e.target.value.toUpperCase())}
                fullWidth
              />
              <TextField
                label="Nova senha"
                type="password"
                value={forgotNovaSenha}
                onChange={(e) => setForgotNovaSenha(e.target.value)}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setForgotOpen(false)}>Fechar</Button>
          {forgotStep === 'solicitar' ? (
              <Button
                variant="contained"
                onClick={async () => {
                  setErro('');
                  setSucesso('');
                  setLoadingReset(true);
                  const resp = await solicitarReset(forgotEmail);
                  setLoadingReset(false);
                  if (!resp.ok || !resp.token) {
                    setErro(resp.erro ?? 'Email não encontrado.');
                    return;
                  }
                  setSucesso('Token enviado para seu email.');
                  setForgotStep('resetar');
                setForgotToken(resp.token ?? '');
                setForgotNovaSenha('');
              }}
              disabled={loadingReset || !forgotEmail}
            >
              {loadingReset ? <CircularProgress size={20} color="inherit" /> : 'Enviar token'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={async () => {
                setErro('');
                setSucesso('');
                setLoadingReset(true);
                const resp = await resetarSenha(forgotEmail, forgotToken, forgotNovaSenha);
                setLoadingReset(false);
                if (!resp.ok) {
                  setErro(resp.erro ?? 'Não foi possível redefinir.');
                  return;
                }
                  setSucesso('Senha redefinida. Faça login novamente.');
                  setForgotOpen(false);
                  setAba('login');
                }}
              disabled={loadingReset || !forgotToken || !forgotNovaSenha}
            >
              {loadingReset ? <CircularProgress size={20} color="inherit" /> : 'Redefinir senha'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

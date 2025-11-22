'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }
    const ok = await login(email, senha);
    if (!ok) {
      setErro('Email ou senha inválidos');
      return;
    }
    router.push('/');
  };

  const handleDemo = async (type: 'admin' | 'voluntario') => {
    const creds =
      type === 'admin'
        ? { email: 'admin@teste.com', senha: '123456' }
        : { email: 'voluntario@teste.com', senha: '123456' };
    const ok = await login(creds.email, creds.senha);
    if (ok) router.push('/');
  };

  return (
    <Box maxWidth={420} mx="auto" mt={6}>
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <Button type="submit" variant="contained">
          Entrar
        </Button>
      </Box>
      <Stack direction="row" spacing={2} mt={2}>
        <Button variant="outlined" onClick={() => handleDemo('voluntario')}>
          Login demo voluntário
        </Button>
        <Button variant="outlined" onClick={() => handleDemo('admin')}>
          Login demo admin
        </Button>
      </Stack>
      <Snackbar
        open={!!erro}
        autoHideDuration={4000}
        onClose={() => setErro('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErro('')} sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
    </Box>
  );
}

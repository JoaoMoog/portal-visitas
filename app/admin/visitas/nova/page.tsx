'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { RequireAdmin } from '@/components/ProtectedRoute';
import { useVisitas } from '@/contexts/VisitasContext';
import { Visita } from '@/types/models';

export default function NovaVisitaPage() {
  const { adicionarVisita } = useVisitas();
  const router = useRouter();
  const [form, setForm] = useState({
    titulo: '',
    hospital: '',
    descricao: '',
    data: '',
    hora: '',
    limiteVagas: 0
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const novaVisita: Visita = {
      id: `v${Date.now()}`,
      titulo: form.titulo,
      hospital: form.hospital,
      descricao: form.descricao,
      data: form.data,
      hora: form.hora,
      limiteVagas: Number(form.limiteVagas),
      inscritosIds: [],
      status: 'ativa'
    };
    adicionarVisita(novaVisita);
    router.push('/admin/visitas');
  };

  return (
    <RequireAdmin>
      <Box maxWidth={600}>
        <Typography variant="h4" gutterBottom>
          Nova visita
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label="Título" value={form.titulo} onChange={(e) => handleChange('titulo', e.target.value)} required />
            <TextField label="Hospital" value={form.hospital} onChange={(e) => handleChange('hospital', e.target.value)} required />
            <TextField
              label="Descrição"
              value={form.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              multiline
              rows={3}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Data"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.data}
                onChange={(e) => handleChange('data', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Horário"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.hora}
                onChange={(e) => handleChange('hora', e.target.value)}
                required
                fullWidth
              />
            </Stack>
            <TextField
              label="Limite de vagas"
              type="number"
              inputProps={{ min: 1 }}
              value={form.limiteVagas}
              onChange={(e) => handleChange('limiteVagas', e.target.value)}
              required
            />
            <Button type="submit" variant="contained">
              Salvar
            </Button>
          </Stack>
        </Box>
      </Box>
    </RequireAdmin>
  );
}

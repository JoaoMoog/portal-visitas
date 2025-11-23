'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { RequireAdmin } from '@/components/ProtectedRoute';
import { useVisitas } from '@/contexts/VisitasContext';
import { Visita } from '@/types/models';

export default function EditarVisitaPage() {
  const params = useParams();
  const { visitas, atualizarVisita } = useVisitas();
  const router = useRouter();
  const visitaId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
  const visita = visitas.find((v) => v.id === visitaId);

  const [form, setForm] = useState<Visita | null>(visita ?? null);

  useEffect(() => {
    if (visita) setForm(visita);
  }, [visita]);

  const handleChange = (field: keyof Visita, value: string | number) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    await atualizarVisita({ ...form, limiteVagas: Number(form.limiteVagas) });
    router.push('/admin/visitas');
  };

  if (!form) {
    return (
      <RequireAdmin>
        <Typography>Visita não encontrada.</Typography>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <Box maxWidth={600}>
        <Typography variant="h4" gutterBottom>
          Editar visita
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
              onChange={(e) => handleChange('limiteVagas', Number(e.target.value))}
              required
            />
            <Button type="submit" variant="contained">
              Salvar alterações
            </Button>
          </Stack>
        </Box>
      </Box>
    </RequireAdmin>
  );
}

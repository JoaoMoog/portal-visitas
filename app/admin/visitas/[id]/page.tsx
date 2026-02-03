'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import Link from 'next/link';
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
  const [salvo, setSalvo] = useState(false);

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
    setSalvo(true);
    setTimeout(() => router.push('/admin/visitas'), 1000);
  };

  if (!form) {
    return (
      <RequireAdmin>
        <Alert severity="warning">Visita não encontrada.</Alert>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <Stack spacing={3}>
        {/* Header */}
        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Tooltip title="Voltar para lista">
              <IconButton
                component={Link}
                href="/admin/visitas"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Stack>
              <Typography variant="h4" color="white" fontWeight={700}>
                Editar visita
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                {form.titulo} - {form.hospital}
              </Typography>
            </Stack>
          </Stack>
        </Card>

        {salvo && (
          <Alert severity="success">
            Visita salva com sucesso! Redirecionando...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EditIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>Dados da Visita</Typography>
                  </Stack>

                  <TextField
                    label="Título"
                    value={form.titulo}
                    onChange={(e) => handleChange('titulo', e.target.value)}
                    required
                    fullWidth
                  />
                  
                  <TextField
                    label="Hospital"
                    value={form.hospital}
                    onChange={(e) => handleChange('hospital', e.target.value)}
                    required
                    fullWidth
                  />
                  
                  <TextField
                    label="Descrição"
                    value={form.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
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
                    <TextField
                      label="Limite de vagas"
                      type="number"
                      inputProps={{ min: 1 }}
                      value={form.limiteVagas}
                      onChange={(e) => handleChange('limiteVagas', Number(e.target.value))}
                      required
                      fullWidth
                    />
                  </Stack>

                  <Alert severity="info">
                    Esta visita possui <strong>{form.inscritosIds.length}</strong> inscrições.
                    {form.inscritosIds.length > 0 && ' Altere com cuidado para não impactar os voluntários inscritos.'}
                  </Alert>
                </Stack>
              </CardContent>
            </Card>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                component={Link}
                href="/admin/visitas"
                size="large"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                sx={{ minWidth: 160 }}
              >
                Salvar alterações
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </RequireAdmin>
  );
}

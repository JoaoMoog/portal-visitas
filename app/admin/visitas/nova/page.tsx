'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, TextField, Typography, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import { RequireAdmin } from '@/components/ProtectedRoute';
import { useVisitas } from '@/contexts/VisitasContext';
import { Visita } from '@/types/models';

export default function NovaVisitaPage() {
  const { adicionarVisita, adicionarVisitas } = useVisitas();
  const router = useRouter();
  const [form, setForm] = useState({
    titulo: '',
    hospital: '',
    descricao: '',
    data: '',
    hora: '',
    limiteVagas: 0,
    recorrente: false,
    ocorrencias: 1,
    intervaloDias: 7,
    diaDaSemana: ''
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: string, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const datasGeradas = useMemo(() => {
    if (!form.data) return [];
    if (!form.recorrente) return [form.data];
    const baseDate = new Date(form.data);
    if (Number.isNaN(baseDate.getTime())) return [form.data];

    const targetDow = form.diaDaSemana === '' ? baseDate.getDay() : Number(form.diaDaSemana);
    // move baseDate to next target weekday (including same day)
    const diff = (targetDow - baseDate.getDay() + 7) % 7;
    if (diff !== 0) baseDate.setDate(baseDate.getDate() + diff);

    const datas: string[] = [];
    for (let i = 0; i < form.ocorrencias; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i * form.intervaloDias);
      datas.push(d.toISOString().slice(0, 10));
    }
    return datas;
  }, [form.data, form.intervaloDias, form.ocorrencias, form.recorrente]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.data) return;
    const baseId = `v${Date.now()}`;
    const visitasGeradas: Visita[] = datasGeradas.map((data, idx) => ({
      id: `${baseId}-${idx + 1}`,
      titulo: form.titulo,
      hospital: form.hospital,
      descricao: form.descricao,
      data,
      hora: form.hora,
      limiteVagas: Number(form.limiteVagas),
      inscritosIds: [],
      cancelamentos: [],
      status: 'ativa',
      recorrencia: form.recorrente
        ? {
            ocorrencias: form.ocorrencias,
            intervaloDias: form.intervaloDias,
            diaDaSemana: form.diaDaSemana === '' ? undefined : Number(form.diaDaSemana)
          }
        : undefined
    }));

    if (visitasGeradas.length > 1) {
      adicionarVisitas(visitasGeradas);
    } else {
      adicionarVisita(visitasGeradas[0]);
    }
    router.push('/admin/visitas');
  };

  return (
    <RequireAdmin>
      <Box maxWidth={720}>
        <Typography variant="h4" gutterBottom>
          Nova visita
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label="Titulo" value={form.titulo} onChange={(e) => handleChange('titulo', e.target.value)} required />
            <TextField label="Hospital" value={form.hospital} onChange={(e) => handleChange('hospital', e.target.value)} required />
            <TextField
              label="Descricao"
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
                label="Horario"
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
              onChange={(e) => handleNumberChange('limiteVagas', Number(e.target.value))}
              required
            />
            <Divider />
            <FormControlLabel
              control={<Switch checked={form.recorrente} onChange={(_, checked) => setForm((p) => ({ ...p, recorrente: checked }))} />}
              label="Ativar recorrencia"
            />
            {form.recorrente && (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Ocorrencias"
                    type="number"
                    inputProps={{ min: 1, max: 52 }}
                    value={form.ocorrencias}
                    onChange={(e) => handleNumberChange('ocorrencias', Number(e.target.value))}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Intervalo em dias"
                    type="number"
                    inputProps={{ min: 1, max: 365 }}
                    value={form.intervaloDias}
                    onChange={(e) => handleNumberChange('intervaloDias', Number(e.target.value))}
                    fullWidth
                    required
                  />
                </Stack>
                <FormControl fullWidth>
                  <InputLabel id="dia-da-semana-label">Dia da semana</InputLabel>
                  <Select
                    labelId="dia-da-semana-label"
                    label="Dia da semana"
                    value={form.diaDaSemana}
                    onChange={(e) => handleChange('diaDaSemana', e.target.value as string)}
                  >
                    <MenuItem value="">Usar dia da data inicial</MenuItem>
                    <MenuItem value={0}>Domingo</MenuItem>
                    <MenuItem value={1}>Segunda</MenuItem>
                    <MenuItem value={2}>Terca</MenuItem>
                    <MenuItem value={3}>Quarta</MenuItem>
                    <MenuItem value={4}>Quinta</MenuItem>
                    <MenuItem value={5}>Sexta</MenuItem>
                    <MenuItem value={6}>Sabado</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}
            {form.recorrente && datasGeradas.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Gerando {datasGeradas.length} visitas: {datasGeradas.join(', ')}
              </Typography>
            )}
            <Button type="submit" variant="contained" size="large">
              Salvar
            </Button>
          </Stack>
        </Box>
      </Box>
    </RequireAdmin>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Grid, TextField, MenuItem, Stack, Typography, Alert } from '@mui/material';
import { VisitCard } from '@/components/VisitCard';
import { useVisitas } from '@/contexts/VisitasContext';
import { RequireAuth } from '@/components/ProtectedRoute';

export default function HomePage() {
  const { visitas } = useVisitas();
  const [filtroHospital, setFiltroHospital] = useState('');
  const [filtroData, setFiltroData] = useState('');

  const hospitais = useMemo(() => Array.from(new Set(visitas.map((v) => v.hospital))), [visitas]);

  const visitasFiltradas = useMemo(() => {
    const ativas = visitas.filter((v) => v.status === 'ativa');
    return ativas.filter((v) => {
      const matchHospital = filtroHospital ? v.hospital === filtroHospital : true;
      const matchData = filtroData ? v.data === filtroData : true;
      return matchHospital && matchData;
    });
  }, [visitas, filtroHospital, filtroData]);

  const visitasOrdenadas = useMemo(() => {
    return [...visitasFiltradas].sort((a, b) => {
      const da = new Date(a.data).getTime();
      const db = new Date(b.data).getTime();
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return da - db;
    });
  }, [visitasFiltradas]);

  return (
    <RequireAuth>
      <Stack spacing={3}>
        <Typography variant="h4">Visitas disponiveis</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Hospital"
            value={filtroHospital}
            onChange={(e) => setFiltroHospital(e.target.value)}
            fullWidth
          >
            <MenuItem value="">Todos</MenuItem>
            {hospitais.map((h) => (
              <MenuItem key={h} value={h}>
                {h}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Data"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            fullWidth
          />
        </Stack>
            {visitasFiltradas.length === 0 ? (
          <Alert severity="info">Nenhuma visita encontrada.</Alert>
        ) : (
          <Grid container spacing={2} alignItems="stretch">
            {visitasOrdenadas.map((visita) => (
              <Grid item xs={12} sm={6} md={4} key={visita.id} sx={{ display: 'flex' }}>
                <VisitCard visita={visita} />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </RequireAuth>
  );
}

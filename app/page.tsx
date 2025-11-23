'use client';

import { useMemo, useState } from 'react';
import { Grid, TextField, MenuItem, Stack, Typography, Alert } from '@mui/material';
import { VisitCard } from '@/components/VisitCard';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitas } from '@/contexts/VisitasContext';
import { RequireAuth } from '@/components/ProtectedRoute';

export default function HomePage() {
  const { usuario } = useAuth();
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
          <Grid container spacing={2}>
            {visitasFiltradas.map((visita) => (
              <Grid item xs={12} sm={6} md={4} key={visita.id}>
                <VisitCard visita={visita} />
              </Grid>
            ))}
          </Grid>
        )}
        {!usuario && <Alert severity="warning">E necessario estar logado para se inscrever.</Alert>}
      </Stack>
    </RequireAuth>
  );
}

'use client';

import { useMemo, useState, useEffect } from 'react';
import { Grid, TextField, MenuItem, Stack, Typography, Alert, Card, Box, Chip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { VisitCard } from '@/components/VisitCard';
import { useVisitas } from '@/contexts/VisitasContext';
import { RequireAuth } from '@/components/ProtectedRoute';
import { Hospital } from '@/types/models';

export default function HomePage() {
  const { visitas } = useVisitas();
  const [hospitais, setHospitais] = useState<Hospital[]>([]);
  const [filtroHospital, setFiltroHospital] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'RJ' | 'SP'>('todos');

  useEffect(() => {
    fetch('/api/hospitais')
      .then(res => res.json())
      .then(data => setHospitais(data.hospitais || []))
      .catch(console.error);
  }, []);

  const hospitaisNomes = useMemo(() => Array.from(new Set(visitas.map((v) => v.hospital))), [visitas]);

  const visitasFiltradas = useMemo(() => {
    const ativas = visitas.filter((v) => v.status === 'ativa');
    return ativas.filter((v) => {
      const matchHospital = filtroHospital ? v.hospital === filtroHospital : true;
      const matchData = filtroData ? v.data === filtroData : true;
      // Filtrar por estado através do hospital
      let matchEstado = true;
      if (filtroEstado !== 'todos') {
        const hospital = hospitais.find(h => h.id === v.hospitalId);
        matchEstado = hospital ? hospital.estado === filtroEstado : true;
      }
      return matchHospital && matchData && matchEstado;
    });
  }, [visitas, filtroHospital, filtroData, filtroEstado, hospitais]);

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
        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <EventAvailableIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Stack>
              <Typography variant="h4" color="white" fontWeight={700}>
                Visitas disponíveis
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Encontre e inscreva-se nas próximas visitas
              </Typography>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            <Chip
              label={`${visitasFiltradas.length} visita${visitasFiltradas.length !== 1 ? 's' : ''}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
            />
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Filtro por estado */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Estado:
              </Typography>
              <ToggleButtonGroup
                value={filtroEstado}
                exclusive
                onChange={(_, val) => val && setFiltroEstado(val)}
                size="small"
              >
                <ToggleButton value="todos" sx={{ px: 2 }}>
                  Todos
                </ToggleButton>
                <ToggleButton value="RJ" sx={{ px: 2, color: filtroEstado === 'RJ' ? '#1e40af' : undefined }}>
                  Rio de Janeiro
                </ToggleButton>
                <ToggleButton value="SP" sx={{ px: 2, color: filtroEstado === 'SP' ? '#9d174d' : undefined }}>
                  São Paulo
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 1 }}>
                <SearchIcon />
              </Box>
              <TextField
                select
                label="Filtrar por hospital"
                value={filtroHospital}
                onChange={(e) => setFiltroHospital(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">Todos os hospitais</MenuItem>
                {hospitaisNomes.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Filtrar por data"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                fullWidth
                size="small"
              />
            </Stack>
          </Stack>
        </Card>

        {visitasFiltradas.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Nenhuma visita encontrada com os filtros selecionados.
          </Alert>
        ) : (
          <Grid container spacing={3} alignItems="stretch">
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

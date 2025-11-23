'use client';

import { Grid, Stack, Typography, Alert } from '@mui/material';
import { VisitCard } from '@/components/VisitCard';
import { RequireAuth } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitas } from '@/contexts/VisitasContext';

export default function MinhasVisitasPage() {
  const { usuario } = useAuth();
  const { visitas } = useVisitas();
  const minhas = visitas.filter((v) => (usuario ? v.inscritosIds.includes(usuario.id) : false));

  return (
    <RequireAuth>
      <Stack spacing={3}>
        <Typography variant="h4">Minhas visitas</Typography>
        {minhas.length === 0 ? (
          <Alert severity="info">Voce ainda nao esta inscrito em nenhuma visita.</Alert>
        ) : (
          <Grid container spacing={2}>
            {minhas.map((visita) => (
              <Grid item xs={12} sm={6} md={4} key={visita.id}>
                <VisitCard visita={visita} />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </RequireAuth>
  );
}

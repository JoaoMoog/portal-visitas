'use client';

import { Grid, Stack, Typography, Alert, Card, Box, Chip } from '@mui/material';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
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
        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}>
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
              <BookmarksIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Stack>
              <Typography variant="h4" color="white" fontWeight={700}>
                Minhas visitas
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Acompanhe suas inscrições nas visitas
              </Typography>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            <Chip
              label={`${minhas.length} inscriç${minhas.length !== 1 ? 'ões' : 'ão'}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
            />
          </Stack>
        </Card>

        {minhas.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Você ainda não está inscrito em nenhuma visita. Explore as visitas disponíveis!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {minhas.map((visita) => (
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

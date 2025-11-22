'use client';

import { Card, CardActions, CardContent, Typography, Button, Chip, Stack } from '@mui/material';
import { Visita } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitas } from '@/contexts/VisitasContext';

interface Props {
  visita: Visita;
}

export const VisitCard = ({ visita }: Props) => {
  const { usuario } = useAuth();
  const { inscrever, removerInscricao } = useVisitas();

  const lotado = visita.inscritosIds.length >= visita.limiteVagas;
  const inscrito = usuario ? visita.inscritosIds.includes(usuario.id) : false;

  const handleAction = () => {
    if (!usuario) return;
    if (inscrito) {
      removerInscricao(usuario.id, visita.id);
    } else {
      inscrever(usuario.id, visita.id);
    }
  };

  const statusLabel = visita.status === 'cancelada' ? 'Cancelada' : lotado ? 'Lotada' : 'Ativa';
  const statusColor = visita.status === 'cancelada' ? 'default' : lotado ? 'warning' : 'success';

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="h6">{visita.titulo}</Typography>
          <Chip label={statusLabel} color={statusColor} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {visita.hospital}
        </Typography>
        {visita.descricao && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {visita.descricao}
          </Typography>
        )}
        <Typography sx={{ mt: 1 }}>Data: {visita.data}</Typography>
        <Typography>Horário: {visita.hora}</Typography>
        <Typography sx={{ mt: 1 }}>
          Vagas: {visita.inscritosIds.length}/{visita.limiteVagas} vagas
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          fullWidth
          disabled={visita.status === 'cancelada' || (!inscrito && lotado)}
          onClick={handleAction}
        >
          {inscrito ? 'Cancelar inscrição' : 'Inscrever-se'}
        </Button>
      </CardActions>
    </Card>
  );
};

'use client';

import { useState } from 'react';
import { Card, CardActions, CardContent, Typography, Button, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Visita } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitas } from '@/contexts/VisitasContext';

interface Props {
  visita: Visita;
}

export const VisitCard = ({ visita }: Props) => {
  const { usuario } = useAuth();
  const { inscrever, removerInscricao } = useVisitas();
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [erroMotivo, setErroMotivo] = useState('');

  const lotado = visita.inscritosIds.length >= visita.limiteVagas;
  const inscrito = usuario ? visita.inscritosIds.includes(usuario.id) : false;

  const handleAction = () => {
    if (!usuario) return;
    if (inscrito) {
      setDialogAberto(true);
    } else {
      inscrever(usuario.id, visita.id);
    }
  };

  const confirmarCancelamento = () => {
    if (!usuario) return;
    const motivo = motivoCancelamento.trim();
    if (!motivo) {
      setErroMotivo('Informe o motivo do cancelamento');
      return;
    }
    removerInscricao(usuario.id, visita.id, motivo);
    setMotivoCancelamento('');
    setErroMotivo('');
    setDialogAberto(false);
  };

  const fecharDialog = () => {
    setDialogAberto(false);
    setErroMotivo('');
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
        <Typography>Horario: {visita.hora}</Typography>
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
          {inscrito ? 'Cancelar inscricao' : 'Inscrever-se'}
        </Button>
      </CardActions>
      <Dialog open={dialogAberto} onClose={fecharDialog} fullWidth maxWidth="sm">
        <DialogTitle>Motivo do cancelamento</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2">
              Compartilhe o motivo para podermos acompanhar os cancelamentos no painel administrativo.
            </Typography>
            <TextField
              label="Motivo"
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              error={!!erroMotivo}
              helperText={erroMotivo || 'Obrigatório'}
              multiline
              minRows={2}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialog}>Voltar</Button>
          <Button color="error" variant="contained" onClick={confirmarCancelamento}>
            Confirmar cancelamento
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

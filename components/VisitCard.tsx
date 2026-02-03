'use client';

import { useState, useEffect } from 'react';
import { Card, CardActions, CardContent, Typography, Button, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Divider, Tooltip, Alert } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PeopleIcon from '@mui/icons-material/People';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useRouter } from 'next/navigation';
import { Visita, Hospital, Usuario } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitas } from '@/contexts/VisitasContext';

interface Props {
  visita: Visita;
}

export const VisitCard = ({ visita }: Props) => {
  const { usuario } = useAuth();
  const { inscrever, removerInscricao, inscreverFotografo, removerFotografo } = useVisitas();
  const router = useRouter();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [fotografo, setFotografo] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  
  const formatDate = (dateIso: string) => {
    const [year, month, day] = dateIso.split('-');
    if (day && month && year) return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    return dateIso;
  };
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [erroMotivo, setErroMotivo] = useState('');

  // Busca dados do hospital e fotógrafo
  useEffect(() => {
    if (visita.hospitalId) {
      fetch(`/api/hospitais/${visita.hospitalId}`)
        .then(res => res.json())
        .then(data => setHospital(data.hospital))
        .catch(() => {});
    }
    if (visita.fotografoId) {
      fetch('/api/admin/usuarios')
        .then(res => res.json())
        .then(data => {
          const f = data.usuarios?.find((u: Usuario) => u.id === visita.fotografoId);
          setFotografo(f || null);
        })
        .catch(() => {});
    } else {
      setFotografo(null);
    }
  }, [visita.hospitalId, visita.fotografoId]);

  const lotado = visita.inscritosIds.length >= visita.limiteVagas;
  const inscrito = usuario ? visita.inscritosIds.includes(usuario.id) : false;
  const eFotografo = usuario ? visita.fotografoId === usuario.id : false;
  const podeSerfotografo = usuario && hospital ? hospital.fotografosIds.includes(usuario.id) : false;
  const jaTemFotografo = !!visita.fotografoId;

  const handleAction = () => {
    if (!usuario) {
      router.push('/login');
      return;
    }
    if (inscrito) {
      setDialogAberto(true);
    } else {
      void inscrever(visita.id);
    }
  };

  const confirmarCancelamento = () => {
    if (!usuario) return;
    const motivo = motivoCancelamento.trim();
    if (!motivo) {
      setErroMotivo('Informe o motivo do cancelamento');
      return;
    }
    void removerInscricao(visita.id, motivo);
    setMotivoCancelamento('');
    setErroMotivo('');
    setDialogAberto(false);
  };

  const fecharDialog = () => {
    setDialogAberto(false);
    setErroMotivo('');
  };

  const handleFotografo = async () => {
    if (!usuario) return;
    setLoading(true);
    if (eFotografo) {
      await removerFotografo(visita.id);
    } else {
      await inscreverFotografo(visita.id);
    }
    setLoading(false);
  };

  const statusLabel = visita.status === 'cancelada' ? 'Cancelada' : lotado ? 'Lotada' : 'Disponível';
  const statusColor = visita.status === 'cancelada' ? 'default' : lotado ? 'warning' : 'success';
  const vagasRestantes = visita.limiteVagas - visita.inscritosIds.length;
  const percentualOcupado = (visita.inscritosIds.length / visita.limiteVagas) * 100;

  return (
    <Card
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        '&::before': inscrito
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #10b981, #0d9488)',
              borderRadius: '16px 16px 0 0'
            }
          : {}
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
              {visita.titulo}
            </Typography>
            <Chip
              label={statusLabel}
              color={statusColor}
              size="small"
              sx={{ flexShrink: 0 }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <LocalHospitalIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {visita.hospital}
            </Typography>
            {hospital?.estado && (
              <Chip 
                label={hospital.estado} 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: 10,
                  bgcolor: hospital.estado === 'RJ' ? '#dbeafe' : '#fce7f3',
                  color: hospital.estado === 'RJ' ? '#1e40af' : '#9d174d',
                  fontWeight: 600
                }} 
              />
            )}
          </Stack>

          {fotografo && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: '#f0fdf4', px: 1.5, py: 0.75, borderRadius: 1 }}>
              <CameraAltIcon sx={{ fontSize: 16, color: '#059669' }} />
              <Typography variant="body2" color="#059669" fontWeight={500}>
                Fotógrafo: {fotografo.nome}
              </Typography>
            </Stack>
          )}

          {visita.descricao && (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {visita.descricao}
            </Typography>
          )}

          <Divider />

          <Stack direction="row" spacing={3}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <CalendarTodayIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={600}>
                {formatDate(visita.data)}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <AccessTimeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="body2" fontWeight={600}>
                {visita.hora}
              </Typography>
            </Stack>
          </Stack>

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {visita.inscritosIds.length}/{visita.limiteVagas} inscritos
                </Typography>
              </Stack>
              <Typography variant="caption" color={lotado ? 'warning.main' : 'success.main'} fontWeight={600}>
                {lotado ? 'Esgotado' : `${vagasRestantes} vaga${vagasRestantes !== 1 ? 's' : ''}`}
              </Typography>
            </Stack>
            <Box
              sx={{
                height: 6,
                bgcolor: '#e2e8f0',
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  width: `${Math.min(percentualOcupado, 100)}%`,
                  height: '100%',
                  bgcolor: lotado ? 'warning.main' : 'success.main',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }}
              />
            </Box>
          </Box>
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 3, pt: 0 }}>
        <Stack spacing={1} width="100%">
          <Button
            variant={inscrito ? 'outlined' : 'contained'}
            fullWidth
            size="large"
            disabled={visita.status === 'cancelada' || (!inscrito && lotado)}
            onClick={handleAction}
            color={inscrito ? 'error' : 'primary'}
            sx={{
              py: 1.25,
              fontWeight: 700
            }}
          >
            {inscrito ? 'Cancelar inscrição' : 'Inscrever-se'}
          </Button>
          
          {podeSerfotografo && visita.status !== 'cancelada' && (
            <Tooltip title={jaTemFotografo && !eFotografo ? 'Já existe um fotógrafo inscrito' : ''}>
              <span>
                <Button
                  variant={eFotografo ? 'outlined' : 'text'}
                  fullWidth
                  size="small"
                  disabled={loading || (jaTemFotografo && !eFotografo)}
                  onClick={handleFotografo}
                  color={eFotografo ? 'warning' : 'secondary'}
                  startIcon={<CameraAltIcon />}
                  sx={{ fontWeight: 600 }}
                >
                  {eFotografo ? 'Sair como fotógrafo' : 'Inscrever como fotógrafo'}
                </Button>
              </span>
            </Tooltip>
          )}
        </Stack>
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

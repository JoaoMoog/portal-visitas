'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Grid, Stack, Typography, Chip, Divider, Avatar, LinearProgress } from '@mui/material';
import { RequireAdmin } from '@/components/ProtectedRoute';
import { useVisitas } from '@/contexts/VisitasContext';
import { getUsuarios } from '@/utils/localStorage';
import { Usuario, Visita } from '@/types/models';

type UserStats = {
  usuario: Usuario;
  participacoes: number;
};

const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={700}>
          {value}
        </Typography>
      </Stack>
      <Box sx={{ position: 'relative', height: 10, bgcolor: '#e2e8f0', borderRadius: 9999 }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 9999, transition: 'width 0.3s ease' }} />
      </Box>
    </Stack>
  );
};

export default function AdminDashboardPage() {
  const { visitas } = useVisitas();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  useEffect(() => {
    setUsuarios(getUsuarios());
  }, []);

  const totalVisitas = visitas.length;
  const visitasAtivas = visitas.filter((v) => v.status === 'ativa');
  const visitasCanceladas = visitas.filter((v) => v.status === 'cancelada');
  const totalInscricoes = visitas.reduce((acc, v) => acc + v.inscritosIds.length, 0);

  const usuariosVoluntarios = usuarios.filter((u) => u.role === 'voluntario');

  const userStats: UserStats[] = useMemo(() => {
    return usuarios.map((usuario) => {
      const participacoes = visitas.reduce(
        (acc, visita) => acc + (visita.inscritosIds.includes(usuario.id) ? 1 : 0),
        0
      );
      return { usuario, participacoes };
    });
  }, [usuarios, visitas]);

  const topUsuarios = [...userStats].sort((a, b) => b.participacoes - a.participacoes).slice(0, 5);
  const topVisitas = [...visitas].sort((a, b) => b.inscritosIds.length - a.inscritosIds.length).slice(0, 5);

  const hospitalStats = useMemo(() => {
    const map = new Map<string, number>();
    visitas.forEach((v) => {
      map.set(v.hospital, (map.get(v.hospital) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [visitas]);
  const maxHospitalCount = Math.max(...hospitalStats.map(([, c]) => c), 0);

  const maxParticipacoes = Math.max(...userStats.map((u) => u.participacoes), 0);
  const maxInscritos = Math.max(...topVisitas.map((v) => v.inscritosIds.length), 0);
  const cancelamentos = useMemo(
    () =>
      visitas
        .flatMap((visita) =>
          visita.cancelamentos.map((canc) => ({
            ...canc,
            visitaId: visita.id,
            visitaTitulo: visita.titulo
          }))
        )
        .sort((a, b) => new Date(b.dataIso).getTime() - new Date(a.dataIso).getTime()),
    [visitas]
  );
  const cancelamentosRecentes = cancelamentos.slice(0, 6);

  return (
    <RequireAdmin>
      <Stack spacing={3}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h4">Dashboard administrativo</Typography>
          <Chip label="Trupe Os Cheios de Graça" color="primary" />
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="overline">Visitas ativas</Typography>
                <Typography variant="h4">{visitasAtivas.length}</Typography>
                <Chip label={`${visitasCanceladas.length} canceladas`} size="small" color="default" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="overline">Inscricoes totais</Typography>
                <Typography variant="h4">{totalInscricoes}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Media por visita: {totalVisitas ? (totalInscricoes / totalVisitas).toFixed(1) : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="overline">Voluntarios</Typography>
                <Typography variant="h4">{usuariosVoluntarios.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de usuarios: {usuarios.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="overline">Visitas criadas</Typography>
                <Typography variant="h4">{totalVisitas}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Hospitais atendidos: {hospitalStats.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Top voluntarios por participacao</Typography>
                  <Chip label="Ultimos dados" size="small" />
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {topUsuarios.length === 0 && <Typography>Nenhum usuario encontrado.</Typography>}
                  {topUsuarios.map((stat) => (
                    <Stack key={stat.usuario.id} direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: '#0d9488', width: 36, height: 36 }}>{stat.usuario.nome[0]}</Avatar>
                      <Stack flex={1}>
                        <Typography fontWeight={600}>{stat.usuario.nome}</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={maxParticipacoes ? (stat.participacoes / maxParticipacoes) * 100 : 0}
                          sx={{ height: 8, borderRadius: 9999 }}
                        />
                      </Stack>
                      <Typography fontWeight={700}>{stat.participacoes}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Visitas com mais inscritos</Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {topVisitas.length === 0 && <Typography>Nenhuma visita cadastrada.</Typography>}
                  {topVisitas.map((v) => (
                    <Bar key={v.id} label={v.titulo} value={v.inscritosIds.length} max={maxInscritos} color="#0d9488" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Visitas por hospital
            </Typography>
            <Stack spacing={1}>
              {hospitalStats.length === 0 && <Typography>Nenhum dado encontrado.</Typography>}
              {hospitalStats.map(([hospital, count]) => (
                <Bar key={hospital} label={hospital} value={count} max={maxHospitalCount} color="#1e293b" />
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Dados calculados localmente a partir das visitas e inscricoes.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cancelamentos de inscricoes
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {cancelamentosRecentes.length === 0 && <Typography>Nenhum cancelamento registrado.</Typography>}
              {cancelamentosRecentes.map((cancelamento) => {
                const usuario = usuariosPorId.get(cancelamento.usuarioId);
                const data = new Date(cancelamento.dataIso);
                return (
                  <Stack key={`${cancelamento.visitaId}-${cancelamento.usuarioId}-${cancelamento.dataIso}`} spacing={0.25}>
                    <Typography fontWeight={700}>{cancelamento.visitaTitulo}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {usuario ? usuario.nome : 'Voluntario'} • {isNaN(data.getTime()) ? 'Data indefinida' : data.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">Motivo: {cancelamento.motivo}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </RequireAdmin>
  );
}

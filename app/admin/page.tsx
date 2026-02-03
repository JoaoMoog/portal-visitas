'use client';

import { RequireAdmin } from '@/components/ProtectedRoute';
import { useVisitas } from '@/contexts/VisitasContext';
import { UsuarioPublico } from '@/types/models';
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  Button,
  Pagination,
  Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

type UserStats = {
  usuario: UsuarioPublico;
  participacoes: number;
};

export default function AdminDashboardPage() {
  const { visitas } = useVisitas();
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([]);
  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  useEffect(() => {
    fetch('/api/admin/usuarios', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setUsuarios(data.usuarios ?? []))
      .catch(() => setUsuarios([]));
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

  const topUsuariosOrdenados = useMemo(
    () => [...userStats].sort((a, b) => b.participacoes - a.participacoes),
    [userStats]
  );
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

  const formatCpf = (digits: string) => {
    const clean = digits.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return digits;
  };

  const formatTelefone = (digits: string) => {
    const clean = digits.replace(/\D/g, '');
    if (clean.length === 11) return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (clean.length === 10) return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return digits;
  };

  const [paginaVoluntarios, setPaginaVoluntarios] = useState(1);
  const itensPorPagina = 5;
  const totalPaginas = Math.max(1, Math.ceil(topUsuariosOrdenados.length / itensPorPagina));
  const topUsuarios = topUsuariosOrdenados.slice((paginaVoluntarios - 1) * itensPorPagina, paginaVoluntarios * itensPorPagina);

  useEffect(() => {
    if (paginaVoluntarios > totalPaginas) setPaginaVoluntarios(1);
  }, [totalPaginas, paginaVoluntarios]);

  const handleExportUsuarios = () => {
    const dados = usuarios.map((u) => ({
      Nome: u.nome,
      Email: u.email,
      Telefone: formatTelefone(u.telefone || ''),
      CPF: formatCpf(u.cpf || '')
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'usuarios.xlsx');
  };

  return (
    <RequireAdmin>
      <Stack spacing={3}>
        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <DashboardIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Stack>
                <Typography variant="h4" color="white" fontWeight={700}>
                  Dashboard administrativo
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label="Trupe Os Cheios de Graça"
                    size="small"
                    sx={{ bgcolor: 'rgba(225, 29, 72, 0.3)', color: '#fb7185', fontWeight: 600 }}
                  />
                </Stack>
              </Stack>
            </Stack>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportUsuarios}
              disabled={usuarios.length === 0}
              sx={{ bgcolor: 'white', color: '#1e293b', '&:hover': { bgcolor: '#f1f5f9' } }}
            >
              Exportar usuários (Excel)
            </Button>
          </Stack>
        </Card>

        {/* Cards de Ação Rápida */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2, px: 1 }}>
            ⚡ Ações Rápidas
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                component={Link}
                href="/admin/visitas/nova"
                sx={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  height: '100%',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.5)'
                  }
                }}
              >
                <CardActionArea sx={{ p: 2.5, height: '100%' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(16, 185, 129, 0.15)', 
                      borderRadius: 2,
                      border: '2px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      <AddCircleIcon sx={{ fontSize: 28, color: '#065f46' }} />
                    </Box>
                    <Stack>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#065f46' }}>Nova Visita</Typography>
                      <Typography variant="body2" sx={{ color: '#047857' }}>Criar agendamento</Typography>
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                component={Link}
                href="/admin/visitas"
                sx={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  height: '100%',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.5)'
                  }
                }}
              >
                <CardActionArea sx={{ p: 2.5, height: '100%' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(59, 130, 246, 0.15)', 
                      borderRadius: 2,
                      border: '2px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      <EventIcon sx={{ fontSize: 28, color: '#1e3a8a' }} />
                    </Box>
                    <Stack>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#1e3a8a' }}>Gerenciar</Typography>
                      <Typography variant="body2" sx={{ color: '#1e40af' }}>Ver todas visitas</Typography>
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                component={Link}
                href="/"
                sx={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                  height: '100%',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.5)'
                  }
                }}
              >
                <CardActionArea sx={{ p: 2.5, height: '100%' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(139, 92, 246, 0.15)', 
                      borderRadius: 2,
                      border: '2px solid rgba(139, 92, 246, 0.3)'
                    }}>
                      <PeopleIcon sx={{ fontSize: 28, color: '#581c87' }} />
                    </Box>
                    <Stack>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#581c87' }}>Inscrever-se</Typography>
                      <Typography variant="body2" sx={{ color: '#6b21a8' }}>Ver disponíveis</Typography>
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                component={Link}
                href="/admin/hospitais"
                sx={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(245, 158, 11, 0.5)'
                  }
                }}
              >
                <CardActionArea sx={{ p: 2.5, height: '100%' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(245, 158, 11, 0.15)', 
                      borderRadius: 2,
                      border: '2px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      <LocalHospitalIcon sx={{ fontSize: 28, color: '#78350f' }} />
                    </Box>
                    <Stack>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#78350f' }}>Hospitais</Typography>
                      <Typography variant="body2" sx={{ color: '#92400e' }}>Gerenciar locais</Typography>
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* KPIs com ícones */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
            📊 Visão Geral
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                border: '2px solid #dcfce7', 
                bgcolor: '#f0fdf4',
                boxShadow: 'none'
              }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, bgcolor: '#16a34a', borderRadius: 2 }}>
                      <CheckCircleIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Stack>
                      <Typography variant="overline" color="text.secondary" fontWeight={600}>Visitas ativas</Typography>
                      <Typography variant="h4" fontWeight={700} color="#16a34a">{visitasAtivas.length}</Typography>
                    </Stack>
                  </Stack>
                  <Chip 
                    label={`${visitasCanceladas.length} canceladas`} 
                    size="small" 
                    sx={{ mt: 1.5, bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 600 }} 
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                border: '2px solid #dbeafe', 
                bgcolor: '#eff6ff',
                boxShadow: 'none'
              }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, bgcolor: '#2563eb', borderRadius: 2 }}>
                      <PeopleIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Stack>
                      <Typography variant="overline" color="text.secondary" fontWeight={600}>Inscrições totais</Typography>
                      <Typography variant="h4" fontWeight={700} color="#2563eb">{totalInscricoes}</Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Média: <strong>{totalVisitas ? (totalInscricoes / totalVisitas).toFixed(1) : 0}</strong> por visita
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                border: '2px solid #f3e8ff', 
                bgcolor: '#faf5ff',
                boxShadow: 'none'
              }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, bgcolor: '#7c3aed', borderRadius: 2 }}>
                      <PeopleIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Stack>
                      <Typography variant="overline" color="text.secondary" fontWeight={600}>Voluntários</Typography>
                      <Typography variant="h4" fontWeight={700} color="#7c3aed">{usuariosVoluntarios.length}</Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Total de usuários: <strong>{usuarios.length}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                border: '2px solid #fce7f3', 
                bgcolor: '#fdf2f8',
                boxShadow: 'none'
              }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, bgcolor: '#db2777', borderRadius: 2 }}>
                      <LocalHospitalIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Stack>
                      <Typography variant="overline" color="text.secondary" fontWeight={600}>Hospitais</Typography>
                      <Typography variant="h4" fontWeight={700} color="#db2777">{hospitalStats.length}</Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    <strong>{totalVisitas}</strong> visitas criadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Card>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>🏆 Top Voluntários</Typography>
                  <Chip label="Por participação" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1' }} />
                </Stack>
                <Stack spacing={1.5}>
                  {topUsuarios.length === 0 && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>Nenhum usuário encontrado.</Alert>
                  )}
                  {topUsuarios.map((stat, index) => (
                    <Box 
                      key={stat.usuario.id} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: index === 0 ? '#fef3c7' : '#f8fafc',
                        border: index === 0 ? '2px solid #fbbf24' : '1px solid #e2e8f0'
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ 
                          bgcolor: index === 0 ? '#f59e0b' : '#0d9488', 
                          width: 40, 
                          height: 40,
                          fontWeight: 700
                        }}>
                          {stat.usuario.nome[0]}
                        </Avatar>
                        <Stack flex={1} spacing={0.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography fontWeight={600}>{stat.usuario.nome}</Typography>
                            <Chip 
                              label={`${stat.participacoes} visitas`} 
                              size="small" 
                              sx={{ 
                                bgcolor: index === 0 ? '#f59e0b' : '#0d9488', 
                                color: 'white',
                                fontWeight: 700
                              }} 
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            CPF: {formatCpf(stat.usuario.cpf || '')}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={maxParticipacoes ? (stat.participacoes / maxParticipacoes) * 100 : 0}
                            sx={{ 
                              height: 6, 
                              borderRadius: 9999,
                              bgcolor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: index === 0 ? '#f59e0b' : '#0d9488'
                              }
                            }}
                          />
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
                {topUsuariosOrdenados.length > itensPorPagina && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      count={totalPaginas}
                      page={paginaVoluntarios}
                      onChange={(_, page) => setPaginaVoluntarios(page)}
                      size="small"
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>🔥 Visitas Mais Populares</Typography>
                  <Chip label="Por inscrições" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a' }} />
                </Stack>
                <Stack spacing={1.5}>
                  {topVisitas.length === 0 && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>Nenhuma visita cadastrada.</Alert>
                  )}
                  {topVisitas.map((v, index) => (
                    <Box 
                      key={v.id}
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: index === 0 ? '#dcfce7' : '#f8fafc',
                        border: index === 0 ? '2px solid #16a34a' : '1px solid #e2e8f0'
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight={600} sx={{ flex: 1 }}>{v.titulo}</Typography>
                          <Chip 
                            label={`${v.inscritosIds.length}/${v.limiteVagas}`}
                            size="small"
                            sx={{ 
                              bgcolor: index === 0 ? '#16a34a' : '#0d9488', 
                              color: 'white',
                              fontWeight: 700,
                              minWidth: 60
                            }}
                          />
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(v.inscritosIds.length / v.limiteVagas) * 100}
                          sx={{ 
                            height: 6, 
                            borderRadius: 9999,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: index === 0 ? '#16a34a' : '#0d9488'
                            }
                          }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>🏥 Visitas por Hospital</Typography>
              <Chip label={`${hospitalStats.length} hospitais`} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626' }} />
            </Stack>
            <Stack spacing={1.5}>
              {hospitalStats.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>Nenhum dado encontrado.</Alert>
              )}
              {hospitalStats.map(([hospital, count]) => (
                <Box 
                  key={hospital}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocalHospitalIcon sx={{ fontSize: 18, color: '#64748b' }} />
                        <Typography fontWeight={600}>{hospital}</Typography>
                      </Stack>
                      <Chip 
                        label={`${count} visitas`}
                        size="small"
                        sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 600 }}
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={maxHospitalCount ? (count / maxHospitalCount) * 100 : 0}
                      sx={{ 
                        height: 6, 
                        borderRadius: 9999,
                        bgcolor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': { bgcolor: '#1e293b' }
                      }}
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>❌ Cancelamentos Recentes</Typography>
              <Chip label={`${cancelamentos.length} total`} size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e' }} />
            </Stack>
            <Stack spacing={1.5}>
              {cancelamentosRecentes.length === 0 && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  🎉 Nenhum cancelamento registrado. Ótimo!
                </Alert>
              )}
              {cancelamentosRecentes.map((cancelamento) => {
                const usuario = usuariosPorId.get(cancelamento.usuarioId);
                const data = new Date(cancelamento.dataIso);
                return (
                  <Box 
                    key={`${cancelamento.visitaId}-${cancelamento.usuarioId}-${cancelamento.dataIso}`}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: '#fef2f2',
                      border: '1px solid #fecaca'
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography fontWeight={700} color="#991b1b">{cancelamento.visitaTitulo}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {isNaN(data.getTime()) ? 'Data indefinida' : data.toLocaleDateString('pt-BR')}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        👤 {usuario ? usuario.nome : 'Voluntário desconhecido'}
                        {usuario?.telefone && ` • 📱 ${formatTelefone(usuario.telefone)}`}
                      </Typography>
                      <Box sx={{ 
                        mt: 1, 
                        p: 1.5, 
                        borderRadius: 1.5, 
                        bgcolor: 'white',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Typography variant="body2">
                          <strong>Motivo:</strong> {cancelamento.motivo}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </RequireAdmin>
  );
}

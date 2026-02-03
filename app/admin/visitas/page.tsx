'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAdmin } from '@/components/ProtectedRoute';
import { useVisitas } from '@/contexts/VisitasContext';
import { UsuarioPublico } from '@/types/models';
import * as XLSX from 'xlsx';

export default function AdminVisitasPage() {
  const { visitas, cancelarVisita, deletarVisita } = useVisitas();
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([]);
  const [visitaSelecionada, setVisitaSelecionada] = useState<string | null>(null);
  const [visitaParaExcluir, setVisitaParaExcluir] = useState<string | null>(null);
  const [visitaParaCancelar, setVisitaParaCancelar] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/usuarios', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setUsuarios(data.usuarios ?? []))
      .catch(() => setUsuarios([]));
  }, []);

  const visitaDialog = useMemo(() => visitas.find((v) => v.id === visitaSelecionada), [visitas, visitaSelecionada]);

  return (
    <RequireAdmin>
      <Stack spacing={3}>
        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack>
              <Typography variant="h4" color="white" fontWeight={700}>
                Gerenciar visitas
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Crie, edite e gerencie todas as visitas cadastradas
              </Typography>
            </Stack>
            <Button
              variant="contained"
              component={Link}
              href="/admin/visitas/nova"
              startIcon={<AddIcon />}
              sx={{ bgcolor: 'white', color: '#1e293b', '&:hover': { bgcolor: '#f1f5f9' } }}
            >
              Nova visita
            </Button>
          </Stack>
        </Card>
        {visitas.length === 0 ? (
          <Alert severity="info">Nenhuma visita cadastrada.</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hospital</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Horário</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Vagas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Inscritos</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitas.map((visita) => (
                  <TableRow key={visita.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{visita.titulo}</TableCell>
                    <TableCell>{visita.hospital}</TableCell>
                    <TableCell>{visita.data}</TableCell>
                    <TableCell>{visita.hora}</TableCell>
                    <TableCell align="center">{visita.limiteVagas}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={visita.inscritosIds.length}
                        size="small"
                        color={visita.inscritosIds.length >= visita.limiteVagas ? 'warning' : 'primary'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={visita.status === 'cancelada' ? 'Cancelada' : 'Ativa'}
                        size="small"
                        color={visita.status === 'cancelada' ? 'default' : 'success'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => router.push(`/admin/visitas/${visita.id}`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver inscritos">
                          <IconButton size="small" color="primary" onClick={() => setVisitaSelecionada(visita.id)}>
                            <PeopleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar visita">
                          <IconButton
                            size="small"
                            color="warning"
                            disabled={visita.status === 'cancelada'}
                            onClick={() => setVisitaParaCancelar(visita.id)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton size="small" color="error" onClick={() => setVisitaParaExcluir(visita.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Dialog open={!!visitaSelecionada} onClose={() => setVisitaSelecionada(null)} fullWidth maxWidth="md">
          <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PeopleIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>Lista de Inscritos</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {visitaDialog ? (
              <Stack spacing={0}>
                {visitaDialog.inscritosIds.length === 0 ? (
                  <Box sx={{ p: 3 }}>
                    <Typography color="text.secondary">Nenhum inscrito nesta visita.</Typography>
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>CPF</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {visitaDialog.inscritosIds.map((id, index) => {
                            const inscrito = usuarios.find((u) => u.id === id);
                            return (
                              <TableRow key={id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{inscrito?.nome || `Usuário ${id}`}</TableCell>
                                <TableCell>{inscrito?.cpf || '-'}</TableCell>
                                <TableCell>{inscrito?.email || '-'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                          const dados = visitaDialog.inscritosIds.map((id, index) => {
                            const inscrito = usuarios.find((u) => u.id === id);
                            return {
                              '#': index + 1,
                              Nome: inscrito?.nome || `Usuário ${id}`,
                              CPF: inscrito?.cpf || '',
                              Email: inscrito?.email || ''
                            };
                          });
                          const ws = XLSX.utils.json_to_sheet(dados);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, 'Inscritos');
                          XLSX.writeFile(wb, `inscritos_${visitaDialog.titulo.replace(/\s+/g, '_')}.xlsx`);
                        }}
                      >
                        Baixar lista (Excel)
                      </Button>
                    </Box>
                  </>
                )}
              </Stack>
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography>Nenhuma visita selecionada.</Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
        {/* Dialog de Cancelar Visita */}
        <Dialog open={!!visitaParaCancelar} onClose={() => setVisitaParaCancelar(null)}>
          <DialogTitle sx={{ bgcolor: '#fef3c7', color: '#92400e' }}>
            ⚠️ Cancelar visita
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography>
              Tem certeza que deseja <strong>cancelar</strong> esta visita?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Os voluntários inscritos serão notificados e a visita ficará marcada como cancelada.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setVisitaParaCancelar(null)}>
              Voltar
            </Button>
            <Button
              color="warning"
              variant="contained"
              onClick={async () => {
                if (visitaParaCancelar) {
                  await cancelarVisita(visitaParaCancelar);
                  setSnackbar({ open: true, message: 'Visita cancelada com sucesso!', severity: 'success' });
                }
                setVisitaParaCancelar(null);
              }}
            >
              Confirmar cancelamento
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de Excluir Visita */}
        <Dialog open={!!visitaParaExcluir} onClose={() => setVisitaParaExcluir(null)}>
          <DialogTitle sx={{ bgcolor: '#fee2e2', color: '#991b1b' }}>
            🗑️ Excluir visita permanentemente
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography>
              Tem certeza que deseja <strong>excluir permanentemente</strong> esta visita?
            </Typography>
            <Alert severity="error" sx={{ mt: 2 }}>
              Esta ação é irreversível! A visita e todas as inscrições serão removidas.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setVisitaParaExcluir(null)}>
              Voltar
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={async () => {
                if (visitaParaExcluir) {
                  await deletarVisita(visitaParaExcluir);
                  setSnackbar({ open: true, message: 'Visita excluída com sucesso!', severity: 'success' });
                }
                setVisitaParaExcluir(null);
              }}
            >
              Excluir permanentemente
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar de feedback */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Stack>
    </RequireAdmin>
  );
}

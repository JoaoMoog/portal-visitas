'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAdmin } from '@/components/ProtectedRoute';
import { useVisitas } from '@/contexts/VisitasContext';
import { UsuarioPublico } from '@/types/models';

export default function AdminVisitasPage() {
  const { visitas, cancelarVisita, deletarVisita } = useVisitas();
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([]);
  const [visitaSelecionada, setVisitaSelecionada] = useState<string | null>(null);
  const [visitaParaExcluir, setVisitaParaExcluir] = useState<string | null>(null);
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
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Gerenciar visitas</Typography>
          <Button variant="contained" component={Link} href="/admin/visitas/nova">
            Nova visita
          </Button>
        </Stack>
        {visitas.length === 0 ? (
          <Alert severity="info">Nenhuma visita cadastrada.</Alert>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titulo</TableCell>
                  <TableCell>Hospital</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell>Limite</TableCell>
                  <TableCell>Inscritos</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitas.map((visita) => (
                  <TableRow key={visita.id}>
                    <TableCell>{visita.titulo}</TableCell>
                    <TableCell>{visita.hospital}</TableCell>
                    <TableCell>{visita.data}</TableCell>
                    <TableCell>{visita.hora}</TableCell>
                    <TableCell>{visita.limiteVagas}</TableCell>
                    <TableCell>{visita.inscritosIds.length}</TableCell>
                    <TableCell>{visita.status === 'cancelada' ? 'Cancelada' : 'Ativa'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => router.push(`/admin/visitas/${visita.id}`)}>
                        Editar
                      </Button>
                        <Button size="small" variant="outlined" onClick={() => setVisitaSelecionada(visita.id)}>
                          Ver inscritos
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          disabled={visita.status === 'cancelada'}
                          onClick={() => void cancelarVisita(visita.id)}
                        >
                          Cancelar visita
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          onClick={() => setVisitaParaExcluir(visita.id)}
                        >
                          Excluir
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        <Dialog open={!!visitaSelecionada} onClose={() => setVisitaSelecionada(null)} fullWidth>
          <DialogTitle>Inscritos</DialogTitle>
          <DialogContent>
            {visitaDialog ? (
              <Stack spacing={1}>
                {visitaDialog.inscritosIds.length === 0 && <Typography>Nenhum inscrito.</Typography>}
                {visitaDialog.inscritosIds.length > 0 && (
                  <ul>
                    {visitaDialog.inscritosIds.map((id) => {
                      const inscrito = usuarios.find((u) => u.id === id);
                      return (
                        <li key={id}>
                          {inscrito ? (
                            <>
                              {inscrito.nome}
                              {inscrito.telefone ? ` • WhatsApp: ${inscrito.telefone}` : ''}
                            </>
                          ) : (
                            `Usuário ${id}`
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Stack>
            ) : (
              <Typography>Nenhuma visita selecionada.</Typography>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={!!visitaParaExcluir} onClose={() => setVisitaParaExcluir(null)}>
          <DialogTitle>Excluir visita</DialogTitle>
          <DialogContent>
            <Typography>Tem certeza? Esta ação removerá a visita e suas inscrições.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVisitaParaExcluir(null)}>Cancelar</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => {
                if (visitaParaExcluir) void deletarVisita(visitaParaExcluir);
                setVisitaParaExcluir(null);
              }}
            >
              Excluir
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </RequireAdmin>
  );
}

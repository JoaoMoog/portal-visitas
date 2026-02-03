'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Autocomplete,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { RequireAdmin } from '@/components/ProtectedRoute';
import { Hospital, Usuario, Estado } from '@/types/models';

export default function HospitaisPage() {
  const [hospitais, setHospitais] = useState<Hospital[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fotografoDialogOpen, setFotografoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [form, setForm] = useState({
    nome: '',
    estado: 'RJ' as Estado,
    endereco: ''
  });

  const fetchHospitais = useCallback(async () => {
    try {
      const res = await fetch('/api/hospitais');
      const data = await res.json();
      setHospitais(data.hospitais || []);
    } catch (error) {
      console.error('Erro ao carregar hospitais:', error);
    }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/usuarios');
      const data = await res.json();
      setUsuarios(data.usuarios || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchHospitais(), fetchUsuarios()]).finally(() => setLoading(false));
  }, [fetchHospitais, fetchUsuarios]);

  const handleOpenDialog = (hospital?: Hospital) => {
    if (hospital) {
      setEditingHospital(hospital);
      setForm({
        nome: hospital.nome,
        estado: hospital.estado,
        endereco: hospital.endereco || ''
      });
    } else {
      setEditingHospital(null);
      setForm({ nome: '', estado: 'RJ', endereco: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHospital(null);
  };

  const handleSave = async () => {
    try {
      if (editingHospital) {
        await fetch(`/api/hospitais/${editingHospital.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        setSnackbar({ open: true, message: 'Hospital atualizado com sucesso!', severity: 'success' });
      } else {
        await fetch('/api/hospitais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        setSnackbar({ open: true, message: 'Hospital criado com sucesso!', severity: 'success' });
      }
      await fetchHospitais();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar hospital:', error);
      setSnackbar({ open: true, message: 'Erro ao salvar hospital', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!selectedHospital) return;
    try {
      await fetch(`/api/hospitais/${selectedHospital.id}`, { method: 'DELETE' });
      setSnackbar({ open: true, message: 'Hospital excluído com sucesso!', severity: 'success' });
      await fetchHospitais();
      setDeleteDialogOpen(false);
      setSelectedHospital(null);
    } catch (error) {
      console.error('Erro ao excluir hospital:', error);
      setSnackbar({ open: true, message: 'Erro ao excluir hospital', severity: 'error' });
    }
  };

  const handleOpenFotografoDialog = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setFotografoDialogOpen(true);
  };

  const handleAddFotografo = async (usuarioId: string) => {
    if (!selectedHospital) return;
    try {
      await fetch(`/api/hospitais/${selectedHospital.id}/fotografos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId })
      });
      await fetchHospitais();
      setSnackbar({ open: true, message: 'Fotógrafo adicionado!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao adicionar fotógrafo:', error);
    }
  };

  const handleRemoveFotografo = async (usuarioId: string) => {
    if (!selectedHospital) return;
    try {
      await fetch(`/api/hospitais/${selectedHospital.id}/fotografos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId })
      });
      await fetchHospitais();
      setSnackbar({ open: true, message: 'Fotógrafo removido!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao remover fotógrafo:', error);
    }
  };

  const hospitaisRJ = hospitais.filter(h => h.estado === 'RJ');
  const hospitaisSP = hospitais.filter(h => h.estado === 'SP');

  const getFotografosDoHospital = (hospital: Hospital) => {
    return usuarios.filter(u => hospital.fotografosIds.includes(u.id));
  };

  const getUsuariosDisponiveis = () => {
    if (!selectedHospital) return [];
    return usuarios.filter(u => !selectedHospital.fotografosIds.includes(u.id));
  };

  // Atualiza selectedHospital quando hospitais muda
  useEffect(() => {
    if (selectedHospital) {
      const updated = hospitais.find(h => h.id === selectedHospital.id);
      if (updated) setSelectedHospital(updated);
    }
  }, [hospitais, selectedHospital]);

  return (
    <RequireAdmin>
      <Stack spacing={3}>
        {/* Header */}
        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={2}>
              <LocalHospitalIcon sx={{ fontSize: 40, color: 'white' }} />
              <Stack>
                <Typography variant="h4" color="white" fontWeight={700}>
                  Hospitais
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                  Gerencie hospitais e fotógrafos autorizados
                </Typography>
              </Stack>
            </Stack>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: 'white', color: '#0891b2', '&:hover': { bgcolor: '#f0f9ff' } }}
            >
              Novo Hospital
            </Button>
          </Stack>
        </Card>

        {/* Stats */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Card sx={{ flex: 1, p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#dbeafe' }}>
                <LocalHospitalIcon sx={{ color: '#2563eb' }} />
              </Box>
              <Stack>
                <Typography variant="h4" fontWeight={700}>{hospitaisRJ.length}</Typography>
                <Typography variant="body2" color="text.secondary">Rio de Janeiro</Typography>
              </Stack>
            </Stack>
          </Card>
          <Card sx={{ flex: 1, p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fce7f3' }}>
                <LocalHospitalIcon sx={{ color: '#db2777' }} />
              </Box>
              <Stack>
                <Typography variant="h4" fontWeight={700}>{hospitaisSP.length}</Typography>
                <Typography variant="body2" color="text.secondary">São Paulo</Typography>
              </Stack>
            </Stack>
          </Card>
        </Stack>

        {loading ? (
          <Typography>Carregando...</Typography>
        ) : (
          <>
            {/* Rio de Janeiro */}
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip label="RJ" color="primary" size="small" />
                    <Typography variant="h6" fontWeight={600}>Rio de Janeiro</Typography>
                  </Stack>
                  {hospitaisRJ.length === 0 ? (
                    <Alert severity="info">Nenhum hospital cadastrado no Rio de Janeiro</Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Nome</strong></TableCell>
                            <TableCell><strong>Endereço</strong></TableCell>
                            <TableCell><strong>Fotógrafos</strong></TableCell>
                            <TableCell align="right"><strong>Ações</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {hospitaisRJ.map((hospital) => (
                            <TableRow key={hospital.id}>
                              <TableCell>{hospital.nome}</TableCell>
                              <TableCell>{hospital.endereco || '-'}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                  {getFotografosDoHospital(hospital).map(f => (
                                    <Chip key={f.id} label={f.nome} size="small" icon={<CameraAltIcon />} />
                                  ))}
                                  {hospital.fotografosIds.length === 0 && (
                                    <Typography variant="caption" color="text.secondary">Nenhum</Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Gerenciar fotógrafos">
                                  <IconButton size="small" onClick={() => handleOpenFotografoDialog(hospital)}>
                                    <CameraAltIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editar">
                                  <IconButton size="small" onClick={() => handleOpenDialog(hospital)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir">
                                  <IconButton size="small" color="error" onClick={() => { setSelectedHospital(hospital); setDeleteDialogOpen(true); }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* São Paulo */}
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip label="SP" color="secondary" size="small" />
                    <Typography variant="h6" fontWeight={600}>São Paulo</Typography>
                  </Stack>
                  {hospitaisSP.length === 0 ? (
                    <Alert severity="info">Nenhum hospital cadastrado em São Paulo</Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Nome</strong></TableCell>
                            <TableCell><strong>Endereço</strong></TableCell>
                            <TableCell><strong>Fotógrafos</strong></TableCell>
                            <TableCell align="right"><strong>Ações</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {hospitaisSP.map((hospital) => (
                            <TableRow key={hospital.id}>
                              <TableCell>{hospital.nome}</TableCell>
                              <TableCell>{hospital.endereco || '-'}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                  {getFotografosDoHospital(hospital).map(f => (
                                    <Chip key={f.id} label={f.nome} size="small" icon={<CameraAltIcon />} />
                                  ))}
                                  {hospital.fotografosIds.length === 0 && (
                                    <Typography variant="caption" color="text.secondary">Nenhum</Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Gerenciar fotógrafos">
                                  <IconButton size="small" onClick={() => handleOpenFotografoDialog(hospital)}>
                                    <CameraAltIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editar">
                                  <IconButton size="small" onClick={() => handleOpenDialog(hospital)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir">
                                  <IconButton size="small" color="error" onClick={() => { setSelectedHospital(hospital); setDeleteDialogOpen(true); }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </>
        )}

        {/* Dialog Criar/Editar Hospital */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingHospital ? 'Editar Hospital' : 'Novo Hospital'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nome do Hospital"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                fullWidth
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={form.estado}
                  label="Estado"
                  onChange={(e) => setForm({ ...form, estado: e.target.value as Estado })}
                >
                  <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                  <MenuItem value="SP">São Paulo</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Endereço (opcional)"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave} disabled={!form.nome}>
              {editingHospital ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Gerenciar Fotógrafos */}
        <Dialog open={fotografoDialogOpen} onClose={() => setFotografoDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CameraAltIcon />
              <span>Fotógrafos - {selectedHospital?.nome}</span>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Adicionar fotógrafo */}
              <Autocomplete
                options={getUsuariosDisponiveis()}
                getOptionLabel={(option) => `${option.nome} (${option.email})`}
                onChange={(_, value) => value && handleAddFotografo(value.id)}
                renderInput={(params) => (
                  <TextField {...params} label="Adicionar fotógrafo" placeholder="Buscar usuário..." />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonAddIcon fontSize="small" color="primary" />
                      <span>{option.nome}</span>
                      <Typography variant="caption" color="text.secondary">({option.email})</Typography>
                    </Stack>
                  </Box>
                )}
              />

              {/* Lista de fotógrafos atuais */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Fotógrafos autorizados ({selectedHospital?.fotografosIds.length || 0}):
                </Typography>
                {selectedHospital && getFotografosDoHospital(selectedHospital).length === 0 ? (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Nenhum fotógrafo cadastrado neste hospital
                  </Alert>
                ) : (
                  <List dense>
                    {selectedHospital && getFotografosDoHospital(selectedHospital).map((fotografo) => (
                      <ListItem key={fotografo.id} sx={{ bgcolor: '#f8fafc', borderRadius: 1, mb: 0.5 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#10b981', width: 32, height: 32 }}>
                            <CameraAltIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={fotografo.nome}
                          secondary={fotografo.email}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Remover fotógrafo">
                            <IconButton edge="end" size="small" onClick={() => handleRemoveFotografo(fotografo.id)}>
                              <PersonRemoveIcon fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFotografoDialogOpen(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Confirmar Exclusão */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza que deseja excluir o hospital <strong>{selectedHospital?.nome}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Stack>
    </RequireAdmin>
  );
}

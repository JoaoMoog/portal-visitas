'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Autocomplete
} from '@mui/material';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EventIcon from '@mui/icons-material/Event';
import RepeatIcon from '@mui/icons-material/Repeat';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import Link from 'next/link';
import { RequireAdmin } from '@/components/ProtectedRoute';
import { useVisitas } from '@/contexts/VisitasContext';
import { Visita, Hospital } from '@/types/models';

export default function NovaVisitaPage() {
  const { adicionarVisita, adicionarVisitas } = useVisitas();
  const router = useRouter();
  const [hospitais, setHospitais] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [form, setForm] = useState({
    titulo: '',
    hospital: '',
    hospitalId: '',
    descricao: '',
    data: '',
    hora: '',
    limiteVagas: 0,
    recorrente: false,
    ocorrencias: 1,
    intervaloDias: 7,
    diaDaSemana: ''
  });

  useEffect(() => {
    fetch('/api/hospitais')
      .then(res => res.json())
      .then(data => setHospitais(data.hospitais || []))
      .catch(console.error);
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: string, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const datasGeradas = useMemo(() => {
    if (!form.data) return [];
    if (!form.recorrente) return [form.data];
    const baseDate = new Date(form.data);
    if (Number.isNaN(baseDate.getTime())) return [form.data];

    const targetDow = form.diaDaSemana === '' ? baseDate.getDay() : Number(form.diaDaSemana);
    // move baseDate to next target weekday (including same day)
    const diff = (targetDow - baseDate.getDay() + 7) % 7;
    if (diff !== 0) baseDate.setDate(baseDate.getDate() + diff);

    const datas: string[] = [];
    for (let i = 0; i < form.ocorrencias; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i * form.intervaloDias);
      datas.push(d.toISOString().slice(0, 10));
    }
    return datas;
  }, [form.data, form.intervaloDias, form.ocorrencias, form.recorrente, form.diaDaSemana]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.data) return;
    const baseId = `v${Date.now()}`;
    const visitasGeradas: Visita[] = datasGeradas.map((data, idx) => ({
      id: `${baseId}-${idx + 1}`,
      titulo: form.titulo,
      hospital: form.hospital,
      hospitalId: form.hospitalId,
      descricao: form.descricao,
      data,
      hora: form.hora,
      limiteVagas: Number(form.limiteVagas),
      inscritosIds: [],
      cancelamentos: [],
      status: 'ativa',
      recorrencia: form.recorrente
        ? {
            ocorrencias: form.ocorrencias,
            intervaloDias: form.intervaloDias,
            diaDaSemana: form.diaDaSemana === '' ? undefined : Number(form.diaDaSemana)
          }
        : undefined
    }));

    if (visitasGeradas.length > 1) {
      await adicionarVisitas(visitasGeradas);
    } else {
      await adicionarVisita(visitasGeradas[0]);
    }
    router.push('/admin/visitas');
  };

  return (
    <RequireAdmin>
      <Stack spacing={3}>
        {/* Header com navegação */}
        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Tooltip title="Voltar para lista">
              <IconButton
                component={Link}
                href="/admin/visitas"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Stack>
              <Typography variant="h4" color="white" fontWeight={700}>
                Nova visita
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Preencha os dados para criar uma nova visita
              </Typography>
            </Stack>
          </Stack>
        </Card>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Informações Básicas */}
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EventIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>Informações da Visita</Typography>
                  </Stack>
                  
                  <TextField
                    label="Título da visita"
                    placeholder="Ex: Visita ao Hospital Santa Casa"
                    value={form.titulo}
                    onChange={(e) => handleChange('titulo', e.target.value)}
                    required
                    fullWidth
                    helperText="Nome que aparecerá para os voluntários"
                  />
                  
                  <Autocomplete
                    options={hospitais.sort((a, b) => a.estado.localeCompare(b.estado))}
                    groupBy={(option) => option.estado === 'RJ' ? 'Rio de Janeiro' : 'São Paulo'}
                    getOptionLabel={(option) => option.nome}
                    value={selectedHospital}
                    onChange={(_, value) => {
                      setSelectedHospital(value);
                      setForm(prev => ({
                        ...prev,
                        hospital: value?.nome || '',
                        hospitalId: value?.id || ''
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Hospital"
                        required
                        helperText="Selecione o hospital onde a visita será realizada"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <LocalHospitalIcon color="action" sx={{ ml: 1, mr: 0.5 }} />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    renderGroup={(params) => (
                      <li key={params.key}>
                        <Box sx={{ 
                          bgcolor: params.group === 'Rio de Janeiro' ? '#dbeafe' : '#fce7f3', 
                          px: 2, 
                          py: 0.5,
                          fontWeight: 600,
                          fontSize: 14,
                          color: params.group === 'Rio de Janeiro' ? '#1e40af' : '#9d174d'
                        }}>
                          {params.group}
                        </Box>
                        <ul style={{ padding: 0 }}>{params.children}</ul>
                      </li>
                    )}
                    noOptionsText="Nenhum hospital encontrado. Cadastre em Hospitais."
                    fullWidth
                  />
                  
                  <TextField
                    label="Descrição (opcional)"
                    placeholder="Detalhes adicionais sobre a visita..."
                    value={form.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    helperText="Informações extras que os voluntários devem saber"
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Data"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={form.data}
                      onChange={(e) => handleChange('data', e.target.value)}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Horário"
                      type="time"
                      InputLabelProps={{ shrink: true }}
                      value={form.hora}
                      onChange={(e) => handleChange('hora', e.target.value)}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Limite de vagas"
                      type="number"
                      inputProps={{ min: 1 }}
                      value={form.limiteVagas}
                      onChange={(e) => handleNumberChange('limiteVagas', Number(e.target.value))}
                      required
                      fullWidth
                      helperText="Máximo de voluntários"
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Recorrência */}
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <RepeatIcon color="secondary" />
                      <Typography variant="h6" fontWeight={600}>Recorrência</Typography>
                      <Tooltip title="Crie múltiplas visitas automáticas em datas sequenciais">
                        <HelpOutlineIcon fontSize="small" color="action" />
                      </Tooltip>
                    </Stack>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.recorrente}
                          onChange={(_, checked) => setForm((p) => ({ ...p, recorrente: checked }))}
                          color="secondary"
                        />
                      }
                      label={form.recorrente ? 'Ativada' : 'Desativada'}
                    />
                  </Stack>

                  {!form.recorrente && (
                    <Alert severity="info" icon={<InfoIcon />}>
                      Ative a recorrência para criar várias visitas de uma só vez (ex: toda semana).
                    </Alert>
                  )}

                  {form.recorrente && (
                    <Stack spacing={2}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          label="Quantidade de ocorrências"
                          type="number"
                          inputProps={{ min: 1, max: 52 }}
                          value={form.ocorrencias}
                          onChange={(e) => handleNumberChange('ocorrencias', Number(e.target.value))}
                          fullWidth
                          required
                          helperText="Quantas visitas criar"
                        />
                        <TextField
                          label="Intervalo em dias"
                          type="number"
                          inputProps={{ min: 1, max: 365 }}
                          value={form.intervaloDias}
                          onChange={(e) => handleNumberChange('intervaloDias', Number(e.target.value))}
                          fullWidth
                          required
                          helperText="Dias entre cada visita"
                        />
                      </Stack>
                      
                      <FormControl fullWidth>
                        <InputLabel id="dia-da-semana-label">Dia da semana</InputLabel>
                        <Select
                          labelId="dia-da-semana-label"
                          label="Dia da semana"
                          value={form.diaDaSemana}
                          onChange={(e) => handleChange('diaDaSemana', e.target.value as string)}
                        >
                          <MenuItem value="">Usar dia da data inicial</MenuItem>
                          <MenuItem value={0}>Domingo</MenuItem>
                          <MenuItem value={1}>Segunda-feira</MenuItem>
                          <MenuItem value={2}>Terça-feira</MenuItem>
                          <MenuItem value={3}>Quarta-feira</MenuItem>
                          <MenuItem value={4}>Quinta-feira</MenuItem>
                          <MenuItem value={5}>Sexta-feira</MenuItem>
                          <MenuItem value={6}>Sábado</MenuItem>
                        </Select>
                      </FormControl>

                      {datasGeradas.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0fdf4' }}>
                          <Typography variant="subtitle2" color="success.dark" gutterBottom>
                            ✅ Serão criadas {datasGeradas.length} visitas:
                          </Typography>
                          <Stack direction="row" flexWrap="wrap" gap={1}>
                            {datasGeradas.map((data) => (
                              <Chip
                                key={data}
                                label={new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        </Paper>
                      )}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                component={Link}
                href="/admin/visitas"
                size="large"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                sx={{ minWidth: 160 }}
              >
                {form.recorrente && datasGeradas.length > 1
                  ? `Criar ${datasGeradas.length} visitas`
                  : 'Criar visita'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </RequireAdmin>
  );
}

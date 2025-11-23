export type Role = 'admin' | 'voluntario';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  role: Role;
};

export type VisitaStatus = 'ativa' | 'cancelada';

export type CancelamentoInscricao = {
  usuarioId: string;
  motivo: string;
  dataIso: string;
};

export type Visita = {
  id: string;
  titulo: string;
  hospital: string;
  descricao?: string;
  data: string;
  hora: string;
  limiteVagas: number;
  inscritosIds: string[];
  status: VisitaStatus;
  cancelamentos: CancelamentoInscricao[];
  recorrencia?: {
    ocorrencias: number;
    intervaloDias: number;
    diaDaSemana?: number; // 0=domingo ... 6=sabado
  };
};

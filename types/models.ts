export type Role = 'admin' | 'voluntario';

export type Estado = 'RJ' | 'SP';

export type Hospital = {
  id: string;
  nome: string;
  estado: Estado;
  endereco?: string;
  fotografosIds: string[]; // usuários habilitados como fotógrafos neste hospital
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  senhaHash: string;
  role: Role;
};

export type UsuarioPublico = Omit<Usuario, 'senhaHash'>;

export type VisitaStatus = 'ativa' | 'cancelada';

export type CancelamentoInscricao = {
  usuarioId: string;
  motivo: string;
  dataIso: string;
};

export type Visita = {
  id: string;
  titulo: string;
  hospitalId: string; // referência ao hospital
  hospital: string; // nome do hospital (para retrocompatibilidade)
  descricao?: string;
  data: string;
  hora: string;
  limiteVagas: number;
  inscritosIds: string[];
  fotografoId?: string; // usuário inscrito como fotógrafo (máximo 1 por visita)
  status: VisitaStatus;
  cancelamentos: CancelamentoInscricao[];
  recorrencia?: {
    ocorrencias: number;
    intervaloDias: number;
    diaDaSemana?: number; // 0=domingo ... 6=sabado
  };
};

export type VisitaInput = Omit<Visita, 'id' | 'inscritosIds' | 'status' | 'cancelamentos' | 'fotografoId'> & { id?: string };

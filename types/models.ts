export type Role = 'admin' | 'voluntario';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: Role;
};

export type VisitaStatus = 'ativa' | 'cancelada';

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
};

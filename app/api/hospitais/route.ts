import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/utils/server/storage';
import { getSessionUser } from '@/utils/server/auth';
import { Hospital } from '@/types/models';

// GET /api/hospitais - lista todos os hospitais
export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json({ hospitais: db.hospitais ?? [] });
  } catch (error) {
    console.error('[hospitais] erro ao listar', error);
    return NextResponse.json({ error: 'Erro ao listar hospitais' }, { status: 500 });
  }
}

// POST /api/hospitais - cria novo hospital (admin only)
export async function POST(request: NextRequest) {
  try {
    const usuario = await getSessionUser();
    if (!usuario) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const db = await readDb();
    if (!usuario || usuario.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, estado, endereco } = body as { nome: string; estado: 'RJ' | 'SP'; endereco?: string };

    if (!nome || !estado) {
      return NextResponse.json({ error: 'Nome e estado são obrigatórios' }, { status: 400 });
    }

    if (!['RJ', 'SP'].includes(estado)) {
      return NextResponse.json({ error: 'Estado deve ser RJ ou SP' }, { status: 400 });
    }

    const novoHospital: Hospital = {
      id: `h${Date.now()}`,
      nome,
      estado,
      endereco,
      fotografosIds: []
    };

    db.hospitais = db.hospitais ?? [];
    db.hospitais.push(novoHospital);
    await writeDb(db);

    return NextResponse.json({ hospitais: db.hospitais, hospital: novoHospital });
  } catch (error) {
    console.error('[hospitais] erro ao criar', error);
    return NextResponse.json({ error: 'Erro ao criar hospital' }, { status: 500 });
  }
}

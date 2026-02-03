import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/utils/server/storage';
import { getSessionUser } from '@/utils/server/auth';

// GET /api/hospitais/[id] - obtém um hospital
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDb();
    const hospital = db.hospitais?.find((h) => h.id === id);
    
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ hospital });
  } catch (error) {
    console.error('[hospitais] erro ao obter', error);
    return NextResponse.json({ error: 'Erro ao obter hospital' }, { status: 500 });
  }
}

// PATCH /api/hospitais/[id] - atualiza hospital (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getSessionUser();
    if (!usuario) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (usuario.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const db = await readDb();
    const { id } = await params;
    const hospitalIndex = db.hospitais?.findIndex((h) => h.id === id) ?? -1;
    
    if (hospitalIndex === -1) {
      return NextResponse.json({ error: 'Hospital não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { nome, estado, endereco } = body as { nome?: string; estado?: 'RJ' | 'SP'; endereco?: string };

    if (estado && !['RJ', 'SP'].includes(estado)) {
      return NextResponse.json({ error: 'Estado deve ser RJ ou SP' }, { status: 400 });
    }

    const hospital = db.hospitais![hospitalIndex];
    if (nome) hospital.nome = nome;
    if (estado) hospital.estado = estado;
    if (endereco !== undefined) hospital.endereco = endereco;

    await writeDb(db);

    return NextResponse.json({ hospital });
  } catch (error) {
    console.error('[hospitais] erro ao atualizar', error);
    return NextResponse.json({ error: 'Erro ao atualizar hospital' }, { status: 500 });
  }
}

// DELETE /api/hospitais/[id] - exclui hospital (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getSessionUser();
    if (!usuario) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (usuario.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const db = await readDb();
    const { id } = await params;
    db.hospitais = db.hospitais?.filter((h) => h.id !== id) ?? [];
    await writeDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[hospitais] erro ao excluir', error);
    return NextResponse.json({ error: 'Erro ao excluir hospital' }, { status: 500 });
  }
}

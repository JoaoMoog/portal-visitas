import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/utils/server/storage';
import { getSessionUser } from '@/utils/server/auth';

// POST /api/hospitais/[id]/fotografos - adiciona fotógrafo ao hospital
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const hospital = db.hospitais?.find((h) => h.id === id);
    
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { usuarioId } = body as { usuarioId: string };

    if (!usuarioId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Verifica se usuário existe
    const usuarioFotografo = db.usuarios.find((u) => u.id === usuarioId);
    if (!usuarioFotografo) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Adiciona se não existir
    if (!hospital.fotografosIds.includes(usuarioId)) {
      hospital.fotografosIds.push(usuarioId);
      await writeDb(db);
    }

    return NextResponse.json({ hospital });
  } catch (error) {
    console.error('[hospitais/fotografos] erro ao adicionar', error);
    return NextResponse.json({ error: 'Erro ao adicionar fotógrafo' }, { status: 500 });
  }
}

// DELETE /api/hospitais/[id]/fotografos - remove fotógrafo do hospital
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
    const hospital = db.hospitais?.find((h) => h.id === id);
    
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { usuarioId } = body as { usuarioId: string };

    if (!usuarioId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    hospital.fotografosIds = hospital.fotografosIds.filter((fid) => fid !== usuarioId);
    await writeDb(db);

    return NextResponse.json({ hospital });
  } catch (error) {
    console.error('[hospitais/fotografos] erro ao remover', error);
    return NextResponse.json({ error: 'Erro ao remover fotógrafo' }, { status: 500 });
  }
}

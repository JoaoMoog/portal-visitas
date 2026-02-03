import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/utils/server/storage';
import { getSessionUser } from '@/utils/server/auth';

// POST /api/visitas/[id]/fotografo - inscrever como fotógrafo
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getSessionUser();
    if (!usuario) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const db = await readDb();
    
    const visita = db.visitas.find((v) => v.id === id);
    if (!visita) {
      return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 });
    }

    if (visita.status === 'cancelada') {
      return NextResponse.json({ error: 'Visita cancelada' }, { status: 400 });
    }

    // Verifica se usuário é fotógrafo autorizado para este hospital
    const hospital = db.hospitais?.find((h) => h.id === visita.hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital não encontrado' }, { status: 404 });
    }

    if (!hospital.fotografosIds.includes(usuario.id)) {
      return NextResponse.json({ error: 'Você não está autorizado como fotógrafo neste hospital' }, { status: 403 });
    }

    // Verifica se já tem fotógrafo
    if (visita.fotografoId) {
      return NextResponse.json({ error: 'Esta visita já tem um fotógrafo inscrito' }, { status: 400 });
    }

    visita.fotografoId = usuario.id;
    await writeDb(db);

    return NextResponse.json({ visita });
  } catch (error) {
    console.error('[visitas/fotografo] erro ao inscrever', error);
    return NextResponse.json({ error: 'Erro ao inscrever como fotógrafo' }, { status: 500 });
  }
}

// DELETE /api/visitas/[id]/fotografo - remover inscrição como fotógrafo
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getSessionUser();
    if (!usuario) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const db = await readDb();
    
    const visita = db.visitas.find((v) => v.id === id);
    if (!visita) {
      return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 });
    }

    const isAdmin = usuario.role === 'admin';

    // Permite remover se for o próprio fotógrafo ou admin
    if (visita.fotografoId !== usuario.id && !isAdmin) {
      return NextResponse.json({ error: 'Você não é o fotógrafo desta visita' }, { status: 403 });
    }

    visita.fotografoId = undefined;
    await writeDb(db);

    return NextResponse.json({ visita });
  } catch (error) {
    console.error('[visitas/fotografo] erro ao remover', error);
    return NextResponse.json({ error: 'Erro ao remover fotógrafo' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/utils/server/auth';
import { assertAdminUser, deleteVisitaDb, updateVisitaDb } from '@/utils/server/visitas';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const usuario = await getSessionUser();
  try {
    assertAdminUser(usuario);
  } catch {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
  const visitas = await updateVisitaDb({ ...body, id });
  if (!visitas) return NextResponse.json({ error: 'Visita nao encontrada' }, { status: 404 });
  return NextResponse.json({ ok: true, visitas });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const usuario = await getSessionUser();
  try {
    assertAdminUser(usuario);
  } catch {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }
  const visitas = await deleteVisitaDb(id);
  return NextResponse.json({ ok: true, visitas });
}

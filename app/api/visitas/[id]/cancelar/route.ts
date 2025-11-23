import { NextResponse } from 'next/server';
import { getSessionUser } from '@/utils/server/auth';
import { assertAdminUser, cancelVisitaDb } from '@/utils/server/visitas';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const usuario = await getSessionUser();
  try {
    assertAdminUser(usuario);
  } catch {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }
  const visitas = await cancelVisitaDb(id);
  if (!visitas) return NextResponse.json({ error: 'Visita nao encontrada' }, { status: 404 });
  return NextResponse.json({ ok: true, visitas });
}

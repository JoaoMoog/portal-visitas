import { NextResponse } from 'next/server';
import { getSessionUser } from '@/utils/server/auth';
import { inscreverUsuario } from '@/utils/server/visitas';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const usuario = await getSessionUser();
  if (!usuario) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  const result = await inscreverUsuario(id, usuario.id);
  if (!result.ok) return NextResponse.json({ error: result.erro }, { status: 400 });
  return NextResponse.json({ ok: true, visitas: result.visitas });
}

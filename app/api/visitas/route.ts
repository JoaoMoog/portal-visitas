import { NextResponse } from 'next/server';
import { getSessionUser } from '@/utils/server/auth';
import { addVisitasDb, getVisitasDb, assertAdminUser } from '@/utils/server/visitas';
import { VisitaInput } from '@/types/models';

export async function GET() {
  const visitas = await getVisitasDb();
  return NextResponse.json({ visitas });
}

export async function POST(req: Request) {
  const usuario = await getSessionUser();
  try {
    assertAdminUser(usuario);
  } catch {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const visita: VisitaInput | undefined = body?.visita;
  const visitas: VisitaInput[] | undefined = body?.visitas;

  const payload = visitas ?? (visita ? [visita] : []);
  if (!payload.length) return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });

  const novas = await addVisitasDb(payload);
  return NextResponse.json({ ok: true, visitas: novas });
}

import { NextResponse } from 'next/server';
import { registerUser } from '@/utils/server/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const nome = body?.nome as string | undefined;
  const email = body?.email as string | undefined;
  const telefone = body?.telefone as string | undefined;
  const senha = body?.senha as string | undefined;

  if (!nome || !email || !senha || !telefone) {
    return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
  }

  const result = await registerUser(nome, email, telefone, senha);
  if (!result.ok) return NextResponse.json({ error: result.erro ?? 'Nao foi possivel registrar.' }, { status: 400 });
  return NextResponse.json({ ok: true, usuario: result.usuario });
}

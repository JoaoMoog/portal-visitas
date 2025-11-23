import { NextResponse } from 'next/server';
import { loginUser } from '@/utils/server/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const senha = body?.senha as string | undefined;
  if (!email || !senha) {
    return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
  }

  const result = await loginUser(email, senha);
  if (!result.ok) return NextResponse.json({ error: result.erro ?? 'Credenciais invalidas.' }, { status: 401 });
  return NextResponse.json({ ok: true, usuario: result.usuario });
}

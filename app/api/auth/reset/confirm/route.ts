import { NextResponse } from 'next/server';
import { consumeResetToken } from '@/utils/server/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const token = body?.token as string | undefined;
  const novaSenha = body?.novaSenha as string | undefined;

  if (!email || !token || !novaSenha) {
    return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
  }

  const result = await consumeResetToken(email, token, novaSenha);
  if (!result.ok) return NextResponse.json({ error: result.erro ?? 'Nao foi possivel redefinir.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}

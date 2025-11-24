import { NextResponse } from 'next/server';
import { registerUser } from '@/utils/server/auth';

export async function POST(req: Request) {
  console.log('[auth/register] nova requisicao');
  const body = await req.json().catch((error) => {
    console.error('[auth/register] erro parse json', error);
    return null;
  });
  const nome = body?.nome as string | undefined;
  const email = body?.email as string | undefined;
  const telefone = body?.telefone as string | undefined;
  const cpf = body?.cpf as string | undefined;
  const senha = body?.senha as string | undefined;

  if (!nome || !email || !senha || !telefone || !cpf) {
    console.warn('[auth/register] dados invalidos', {
      nome: !!nome,
      email: !!email,
      senha: !!senha,
      telefone: !!telefone,
      cpf: !!cpf
    });
    return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
  }

  try {
    const result = await registerUser(nome, email, telefone, cpf, senha);
    if (!result.ok) {
      console.warn('[auth/register] falha negocio', result.erro);
      return NextResponse.json({ error: result.erro ?? 'Nao foi possivel registrar.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, usuario: result.usuario });
  } catch (error) {
    console.error('[auth/register] erro inesperado', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
export const runtime = 'nodejs';

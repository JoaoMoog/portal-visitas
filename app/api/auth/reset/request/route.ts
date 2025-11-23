import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requestResetToken } from '@/utils/server/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  if (!email) return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 });

  const result = await requestResetToken(email);
  if (!result.ok || !result.token) {
    return NextResponse.json({ error: result.erro ?? 'Nao foi possivel gerar token.' }, { status: 400 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/login`;

  if (user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
      await transporter.sendMail({
        from: `"Portal de Visitas" <${user}>`,
        to: email,
        subject: 'Recuperacao de senha',
        html: `<p>Seu token: <strong>${result.token}</strong></p><p>Acesse ${resetUrl}</p>`
      });
    } catch (error) {
      console.error('Erro ao enviar email', error);
      // segue retornando token para desenvolvimento
    }
  }

  return NextResponse.json({ ok: true, token: result.token, devHint: user ? undefined : 'Env vars GMAIL_USER/PASS ausentes; token retornado na resposta.' });
}

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const token = body?.token as string | undefined;

  if (!email || !token) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) {
    return NextResponse.json({ error: 'Env vars GMAIL_USER e GMAIL_PASS não configuradas.' }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 16px;">
      <h2>Recuperação de senha - Trupe Os Cheios de Graça</h2>
      <p>Recebemos um pedido para redefinir sua senha.</p>
      <p><strong>Token:</strong> ${token}</p>
      <p>Use esse token na tela de recuperação e defina uma nova senha. Se você não solicitou, ignore este email.</p>
      <p><a href="${resetUrl}" style="color:#e11d48;">Acessar portal</a></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Portal de Visitas" <${user}>`,
      to: email,
      subject: 'Recuperação de senha',
      html
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao enviar email', error);
    return NextResponse.json({ error: 'Falha ao enviar email.' }, { status: 500 });
  }
}

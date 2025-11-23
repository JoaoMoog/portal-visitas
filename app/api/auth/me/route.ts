import { NextResponse } from 'next/server';
import { getSessionUser } from '@/utils/server/auth';

export async function GET() {
  const usuario = await getSessionUser();
  if (!usuario) return NextResponse.json({ usuario: null }, { status: 200 });
  const { senhaHash, ...safe } = usuario;
  return NextResponse.json({ usuario: safe });
}

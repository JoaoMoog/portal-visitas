import { NextResponse } from 'next/server';
import { clearSession } from '@/utils/server/auth';

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

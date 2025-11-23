import { NextResponse } from 'next/server';
import { getSessionUser } from '@/utils/server/auth';
import { assertAdminUser } from '@/utils/server/visitas';
import { readDb, pruneExpiredSessions } from '@/utils/server/storage';
import { UsuarioPublico } from '@/types/models';

export async function GET() {
  const usuario = await getSessionUser();
  try {
    assertAdminUser(usuario);
  } catch {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }
  const db = await readDb();
  pruneExpiredSessions(db);
  const usuarios: UsuarioPublico[] = db.usuarios.map(({ senhaHash, ...rest }) => rest);
  return NextResponse.json({ usuarios });
}

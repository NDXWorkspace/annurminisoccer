import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { COOKIE_NAME, sessionSecretBytes } from './session';
import type { Role } from './admin-users';

const SESSION_DURATION = 12 * 60 * 60; // 12 hours in seconds

export interface SessionPayload {
  sub: string;       // admin_users.id
  username: string;
  role: Role;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ username: payload.username, role: payload.role })
    .setSubject(payload.sub)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(sessionSecretBytes());
  return token;
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecretBytes());
    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    const username = typeof payload.username === 'string' ? payload.username : '';
    const role = payload.role === 'superadmin' ? 'superadmin' : 'admin';
    if (!sub || !username) return null;
    return { sub, username, role };
  } catch {
    return null;
  }
}

/** Sesi dari cookie, null bila tidak sah / tidak ada. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session?.value) return null;
  return verifyToken(session.value);
}

/** Back-compat: banyak route lama hanya butuh boolean "sudah login". */
export async function getSessionFromCookies(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  return getSession();
}

export async function requireSuperAdmin(): Promise<SessionPayload | null> {
  const s = await getSession();
  return s && s.role === 'superadmin' ? s : null;
}

export { COOKIE_NAME, SESSION_DURATION };

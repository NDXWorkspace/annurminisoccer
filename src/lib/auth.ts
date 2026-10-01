import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { COOKIE_NAME, sessionSecretBytes } from './session';

const SESSION_SECRET = sessionSecretBytes();
const SESSION_DURATION = 12 * 60 * 60; // 12 hours in seconds

export async function createSession(): Promise<string> {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SESSION_SECRET);
  return token;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SESSION_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function getSessionFromCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session?.value) return false;
  return verifySession(session.value);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !password) return false;

  // If password stored in env is a bcrypt hash
  if (adminPassword.startsWith('$2a$') || adminPassword.startsWith('$2b$')) {
    try {
      return await bcrypt.compare(password, adminPassword);
    } catch {
      return false;
    }
  }

  // Bandingkan hash SHA-256 supaya panjang input tidak bocor lewat
  // perbandingan panjang awal (timingSafeEqual butuh panjang sama).
  try {
    const a = crypto.createHash('sha256').update(password).digest();
    const b = crypto.createHash('sha256').update(adminPassword).digest();
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export { COOKIE_NAME, SESSION_DURATION };

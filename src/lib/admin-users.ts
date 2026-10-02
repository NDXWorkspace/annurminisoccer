import bcrypt from 'bcryptjs';
import { getServiceSupabase, isServiceRoleConfigured } from './supabase';

export type Role = 'superadmin' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  role: Role;
  active: boolean;
  created_at: string;
}

const SUPERADMIN_BOOTSTRAP = (process.env.ADMIN_PASSWORD || '').trim();

/** Hash a password for storage. New users are always bcrypt. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyUserPassword(user: AdminUser, password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, user.password_hash);
  } catch {
    return false;
  }
}

export async function findUserByUsername(username: string): Promise<AdminUser | null> {
  if (!isServiceRoleConfigured()) return null;
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .maybeSingle<AdminUser>();
  if (error) throw error;
  return data ?? null;
}

/**
 * Saat tabel admin_users masih kosong (deploy pertama), buat satu superadmin
 * "admin" dari ADMIN_PASSWORD agar tidak terkunci keluar. Setelahnya, ADMIN_PASSWORD
 * tidak lagi dipakai untuk login biasa.
 */
export async function ensureBootstrapSuperadmin(): Promise<void> {
  if (!isServiceRoleConfigured() || !SUPERADMIN_BOOTSTRAP) return;
  const sb = getServiceSupabase();
  const { count, error } = await sb
    .from('admin_users')
    .select('*', { count: 'exact', head: true });
  if (error) return;
  if ((count ?? 0) > 0) return;
  const password_hash = await hashPassword(SUPERADMIN_BOOTSTRAP);
  await sb.from('admin_users').insert({ username: 'admin', password_hash, role: 'superadmin' });
}

export async function listUsers(): Promise<Omit<AdminUser, 'password_hash'>[]> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from('admin_users')
    .select('id,username,role,active,created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Omit<AdminUser, 'password_hash'>[];
}

export async function setUserRole(id: string, role: Role) {
  const sb = getServiceSupabase();
  const { error } = await sb.from('admin_users').update({ role }).eq('id', id);
  if (error) throw error;
}

export async function setUserActive(id: string, active: boolean) {
  const sb = getServiceSupabase();
  const { error } = await sb.from('admin_users').update({ active }).eq('id', id);
  if (error) throw error;
}

export async function deleteUser(id: string) {
  const sb = getServiceSupabase();
  const { error } = await sb.from('admin_users').delete().eq('id', id);
  if (error) throw error;
}

/** Tulis satu baris audit. Gagal audit tidak boleh membatalkan operasi. */
export async function audit(
  actor: { id?: string; sub?: string; username?: string } | null,
  action: string,
  target?: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    const sb = getServiceSupabase();
    await sb.from('audit_log').insert({
      user_id: actor?.sub ?? actor?.id ?? null,
      username: actor?.username ?? null,
      action,
      target: target ?? null,
      payload: payload ?? null,
    });
  } catch (e) {
    console.error('audit gagal:', e);
  }
}

import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { listUsers, setUserActive, setUserRole, deleteUser, audit, hashPassword } from '@/lib/admin-users';
import { getServiceSupabase, isServiceRoleConfigured, SUPABASE_MISSING_SERVICE_KEY_MESSAGE } from '@/lib/supabase';
import { parseJsonBody } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ success: false, error: 'Hanya superadmin.' }, { status: 403 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
  try {
    const users = await listUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (e) {
    console.error('List users error:', e);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ success: false, error: 'Hanya superadmin.' }, { status: 403 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
  try {
    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const { username, password, role } = parsedBody.body;
    if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Username wajib, password minimal 8 karakter.' }, { status: 400 });
    }
    const r = role === 'superadmin' ? 'superadmin' : 'admin';
    const sb = getServiceSupabase();
    const password_hash = await hashPassword(password);
    const { data, error } = await sb
      .from('admin_users')
      .insert({ username: username.trim(), password_hash, role: r })
      .select('id,username,role,active,created_at')
      .single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ success: false, error: 'Username sudah dipakai.' }, { status: 409 });
      throw error;
    }
    await audit(admin, 'create_user', 'admin_users', { username: username.trim(), role: r });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Create user error:', e);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ success: false, error: 'Hanya superadmin.' }, { status: 403 });
  try {
    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const { id, role, active } = parsedBody.body;
    if (typeof id !== 'string') return NextResponse.json({ success: false, error: 'id wajib.' }, { status: 400 });
    if (id === admin.sub && (active === false || role === 'admin')) {
      return NextResponse.json({ success: false, error: 'Tidak bisa menurunkan diri sendiri.' }, { status: 400 });
    }
    if (role === 'superadmin' || role === 'admin') await setUserRole(id, role);
    if (typeof active === 'boolean') await setUserActive(id, active);
    await audit(admin, 'update_user', 'admin_users', { id, role, active });
    return NextResponse.json({ success: true, data: null });
  } catch (e) {
    console.error('Update user error:', e);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ success: false, error: 'Hanya superadmin.' }, { status: 403 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id wajib.' }, { status: 400 });
    if (id === admin.sub) return NextResponse.json({ success: false, error: 'Tidak bisa menghapus diri sendiri.' }, { status: 400 });
    await deleteUser(id);
    await audit(admin, 'delete_user', 'admin_users', { id });
    return NextResponse.json({ success: true, data: null });
  } catch (e) {
    console.error('Delete user error:', e);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

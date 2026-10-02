import { NextResponse } from 'next/server';
import { supabase, getServiceSupabase, isSupabaseConfigured, isServiceRoleConfigured, SUPABASE_MISCONFIGURED_MESSAGE, SUPABASE_MISSING_SERVICE_KEY_MESSAGE } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/admin-users';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ success: false, error: 'ID tim tidak valid.' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISCONFIGURED_MESSAGE }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
       
    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Tim tidak ditemukan.' }, { status: 404 });
      }
      throw error;
    }
    if (!data) return NextResponse.json({ success: false, error: 'Tidak ditemukan' }, { status: 404 });
    
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Fetch team error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesi berakhir, masuk kembali.' }, { status: 401 });
    }
    await audit(session, 'update_team', 'teams');

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ success: false, error: 'ID tim tidak valid.' }, { status: 400 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const body = await request.json();
    const update: Record<string, string | null> = {};

    if (body?.name !== undefined) {
      const v = typeof body.name === 'string' ? body.name.trim() : '';
      if (!v) return NextResponse.json({ success: false, error: 'Nama tim wajib diisi.' }, { status: 400 });
      update.name = v;
    }
    if (body?.short_name !== undefined) {
      const v = typeof body.short_name === 'string' ? body.short_name.trim().toUpperCase() : '';
      if (v.length !== 3) return NextResponse.json({ success: false, error: 'Singkatan (short_name) harus 3 karakter' }, { status: 400 });
      update.short_name = v;
    }
    if (body?.group_name !== undefined) {
      const v = typeof body.group_name === 'string' ? body.group_name.trim() : '';
      if (!v) return NextResponse.json({ success: false, error: 'Grup wajib diisi.' }, { status: 400 });
      update.group_name = v;
    }
    if (body?.logo_url !== undefined) {
      const v = typeof body.logo_url === 'string' ? body.logo_url.trim() : '';
      if (v) {
        try {
          const parsed = new URL(v);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return NextResponse.json({ success: false, error: 'URL logo harus diawali http:// atau https://' }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ success: false, error: 'URL logo tidak valid.' }, { status: 400 });
        }
        update.logo_url = v;
      } else {
        update.logo_url = null;
      }
    }
    if (body?.color !== undefined) {
      const v = typeof body.color === 'string' ? body.color.trim() : '';
      if (v && !/^#[0-9a-fA-F]{6}$/.test(v)) {
        return NextResponse.json({ success: false, error: 'Warna harus format hex seperti #0B3D91.' }, { status: 400 });
      }
      update.color = v || null;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada perubahan untuk disimpan.' }, { status: 400 });
    }
    
    const adminSupabase = getServiceSupabase();
    const { data, error } = await adminSupabase
      .from('teams')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Update team error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesi berakhir, masuk kembali.' }, { status: 401 });
    }
    await audit(session, 'update_team', 'teams');

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ success: false, error: 'ID tim tidak valid.' }, { status: 400 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const adminSupabase = getServiceSupabase();
    
    const { count: matchesAsTeamA } = await adminSupabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('team_a_id', id);
      
    const { count: matchesAsTeamB } = await adminSupabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('team_b_id', id);
      
    if ((matchesAsTeamA && matchesAsTeamA > 0) || (matchesAsTeamB && matchesAsTeamB > 0)) {
      return NextResponse.json({ success: false, error: 'Tim tidak bisa dihapus karena sudah memiliki pertandingan' }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: null });
  } catch (error: unknown) {
    console.error('Delete team error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}

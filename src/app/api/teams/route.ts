import { NextResponse } from 'next/server';
import {
  supabase,
  getServiceSupabase,
  isSupabaseConfigured,
  isServiceRoleConfigured,
  SUPABASE_MISCONFIGURED_MESSAGE,
  SUPABASE_MISSING_SERVICE_KEY_MESSAGE,
} from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { parseJsonBody } from '@/lib/http';
import { audit } from '@/lib/admin-users';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!isSupabaseConfigured()) {
    console.warn(SUPABASE_MISCONFIGURED_MESSAGE);
    return NextResponse.json(
      { success: false, data: [], error: SUPABASE_MISCONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('group_name')
      .order('name');
      
    if (error) {
      console.warn('Database warning fetching teams:', (error as Error).message);
      return NextResponse.json({ success: false, data: [], error: (error as Error).message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    console.error('Fetch teams error:', error);
    return NextResponse.json({ success: false, data: [], error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesi berakhir, masuk kembali.' }, { status: 401 });
    }
    await audit(session, 'create_team', 'teams');

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.body;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const short_name = typeof body?.short_name === 'string' ? body.short_name.trim().toUpperCase() : '';
    const group_name = typeof body?.group_name === 'string' ? body.group_name.trim() : '';
    const logo_url = typeof body?.logo_url === 'string' && body.logo_url.trim() ? body.logo_url.trim() : null;
    const color = typeof body?.color === 'string' && body.color.trim() ? body.color.trim() : null;
    const category = typeof body?.category === 'string' ? body.category.trim().toUpperCase() : '';

    if (!name || !short_name || !group_name) {
      return NextResponse.json({ success: false, error: 'Data tidak lengkap' }, { status: 400 });
    }

    if (category !== 'U10' && category !== 'U12') {
      return NextResponse.json({ success: false, error: 'Kategori harus U10 atau U12.' }, { status: 400 });
    }
    
    if (short_name.length !== 3) {
      return NextResponse.json({ success: false, error: 'Singkatan (short_name) harus 3 karakter' }, { status: 400 });
    }

    if (logo_url) {
      try {
        const parsed = new URL(logo_url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return NextResponse.json({ success: false, error: 'URL logo harus diawali http:// atau https://' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ success: false, error: 'URL logo tidak valid.' }, { status: 400 });
      }
    }

    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json({ success: false, error: 'Warna harus format hex seperti #0B3D91.' }, { status: 400 });
    }

    const adminSupabase = getServiceSupabase();
    const { data, error } = await adminSupabase
      .from('teams')
      .insert({ name, short_name, group_name, logo_url, color, category })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Create team error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServiceSupabase, isServiceRoleConfigured, SUPABASE_MISSING_SERVICE_KEY_MESSAGE } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isAdmin = await getSessionFromCookies();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Sesi berakhir, masuk kembali.' }, { status: 401 });
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ success: false, error: 'ID pertandingan tidak valid.' }, { status: 400 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const body = await request.json();
    const updateData: Record<string, number | string> = {};

    if (body?.score_a !== undefined) {
      if (!Number.isInteger(body.score_a) || body.score_a < 0 || body.score_a > 99) {
        return NextResponse.json({ success: false, error: 'Skor harus bilangan bulat 0–99.' }, { status: 400 });
      }
      updateData.score_a = body.score_a;
    }
    if (body?.score_b !== undefined) {
      if (!Number.isInteger(body.score_b) || body.score_b < 0 || body.score_b > 99) {
        return NextResponse.json({ success: false, error: 'Skor harus bilangan bulat 0–99.' }, { status: 400 });
      }
      updateData.score_b = body.score_b;
    }
    if (body?.status !== undefined) {
      const allowed = ['scheduled', 'live', 'halftime', 'finished'];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Status tidak valid.' }, { status: 400 });
      }
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada skor atau status untuk disimpan.' }, { status: 400 });
    }

    const adminSupabase = getServiceSupabase();
    const { data, error } = await adminSupabase
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Update match score error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}

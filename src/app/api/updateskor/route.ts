import { NextResponse } from 'next/server';
import { getServiceSupabase, isServiceRoleConfigured, SUPABASE_MISSING_SERVICE_KEY_MESSAGE } from '@/lib/supabase';
import { parseJsonBody } from '@/lib/http';

/**
 * API publik untuk update skor real-time TANPA autentikasi.
 * Dipakai oleh halaman /updateskor yang khusus untuk wasit/panitia lapangan.
 *
 * KEAMANAN: Hanya bisa update skor dan status (bukan create/delete).
 * Disarankan diakses dari jaringan lokal tournament (bukan internet publik).
 */
export async function PUT(request: Request) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid.' }, { status: 400 });
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.body;

    const updateData: Record<string, number | string> = {};
    const allowedStatuses = ['scheduled', 'live', 'halftime', 'finished'];

    if (body?.score_a !== undefined) {
      const sa = Number(body.score_a);
      if (!Number.isInteger(sa) || sa < 0 || sa > 99) {
        return NextResponse.json({ success: false, error: 'Skor harus 0-99.' }, { status: 400 });
      }
      updateData.score_a = sa;
    }

    if (body?.score_b !== undefined) {
      const sb = Number(body.score_b);
      if (!Number.isInteger(sb) || sb < 0 || sb > 99) {
        return NextResponse.json({ success: false, error: 'Skor harus 0-99.' }, { status: 400 });
      }
      updateData.score_b = sb;
    }

    if (body?.status !== undefined) {
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Status tidak valid.' }, { status: 400 });
      }
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data untuk disimpan.' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select('*, team_a:teams!team_a_id(name, short_name), team_b:teams!team_b_id(name, short_name)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update skor error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getServiceSupabase, isServiceRoleConfigured, SUPABASE_MISSING_SERVICE_KEY_MESSAGE } from '@/lib/supabase';
import { parseJsonBody } from '@/lib/http';
import { parseMatchEvent } from '@/lib/events';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * API publik untuk update skor real-time TANPA autentikasi.
 * Dipakai oleh halaman /updateskor yang khusus untuk wasit/panitia lapangan.
 *
 * KEAMANAN: hanya menyentuh skor, status, dan catatan kejadian pada satu
 * pertandingan (bukan create/delete baris pertandingan/tim).
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

    if (!UUID_RE.test(id)) {
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

/**
 * Catat kejadian pertandingan (kartu kuning/merah, pelanggaran, penalti,
 * cedera, catatan). Tanpa autentikasi — sama seperti skor, hanya untuk
 * jaringan lapangan. Tim yang dipilih wajib salah satu peserta laga.
 */
export async function POST(request: Request) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.body;

    const matchId = typeof body?.match_id === 'string' ? body.match_id.trim() : '';
    if (!UUID_RE.test(matchId)) {
      return NextResponse.json({ success: false, error: 'ID pertandingan tidak valid.' }, { status: 400 });
    }

    const admin = getServiceSupabase();
    const { data: match, error: matchErr } = await admin
      .from('matches')
      .select('id, team_a_id, team_b_id')
      .eq('id', matchId)
      .single();
    if (matchErr || !match) {
      return NextResponse.json({ success: false, error: 'Pertandingan tidak ditemukan.' }, { status: 404 });
    }

    const parsed = parseMatchEvent(body, {
      matchId: match.id,
      teamAId: match.team_a_id,
      teamBId: match.team_b_id,
    });
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const { data: created, error: insertErr } = await admin
      .from('match_events')
      .insert(parsed.value)
      .select('*')
      .single();
    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Create match event error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}

/** Koreksi salah catat: hapus satu kejadian berdasarkan event_id. */
export async function DELETE(request: Request) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    if (!eventId || !UUID_RE.test(eventId)) {
      return NextResponse.json({ success: false, error: 'ID kejadian tidak valid.' }, { status: 400 });
    }

    const admin = getServiceSupabase();
    const { data: removed, error } = await admin
      .from('match_events')
      .delete()
      .eq('id', eventId)
      .select('id');
    if (error) throw error;
    if (!removed || removed.length === 0) {
      return NextResponse.json({ success: false, error: 'Catatan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Delete match event error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
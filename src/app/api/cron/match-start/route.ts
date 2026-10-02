import { NextResponse } from 'next/server';
import { getServiceSupabase, isServiceRoleConfigured, SUPABASE_MISSING_SERVICE_KEY_MESSAGE } from '@/lib/supabase';

/**
 * Cron endpoint (Vercel Cron) — otomatis set status 'live' untuk pertandingan
 * yang tanggal + jam tendangnya sudah tercapai (zona WIB = UTC+7).
 *
 * Dipanggil setiap menit oleh vercel.json. Aman: dijaga oleh CRON_SECRET.
 */
export async function GET(request: Request) {
  try {
    // Vercel Cron mengirim Authorization: Bearer <CRON_SECRET>.
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const sb = getServiceSupabase();
    const now = new Date();

    // Ambil semua match yang masih 'scheduled', lalu filter berdasarkan
    // datetime lengkap (match_date + kickoff_time) dalam zona WIB (UTC+7).
    const { data: candidates, error: fetchErr } = await sb
      .from('matches')
      .select('id, match_date, kickoff_time, status, group_name')
      .eq('status', 'scheduled');

    if (fetchErr) throw fetchErr;

    const due = (candidates ?? []).filter((m) => {
      const kickoff = new Date(`${m.match_date}T${m.kickoff_time}+07:00`);
      return kickoff.getTime() <= now.getTime();
    });

    if (due.length === 0) {
      return NextResponse.json({ success: true, started: 0 });
    }

    const ids = due.map((m) => m.id);
    const { error: updateErr } = await sb
      .from('matches')
      .update({ status: 'live', updated_at: now.toISOString() })
      .in('id', ids);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      started: due.length,
      matches: due.map((m) => ({ id: m.id, kickoff: `${m.match_date} ${m.kickoff_time}` })),
    });
  } catch (error) {
    console.error('Cron match-start error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

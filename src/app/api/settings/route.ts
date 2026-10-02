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
import { audit } from '@/lib/admin-users';

const defaultSettings = {
  id: 'default',
  event_name: 'An-Nur Mini Soccer',
  start_date: '2026-10-09',
  end_date: '2026-10-10',
  location: 'Lapangan An-Nur',
  map_url: null,
  rules_text: null,
  tiebreak_rules: 'poin â†’ selisih gol â†’ gol masuk',
  contact_info: null,
};

/** The only columns a client is allowed to write. `id` is deliberately excluded. */
const WRITABLE = [
  'event_name',
  'start_date',
  'end_date',
  'location',
  'map_url',
  'rules_text',
  'tiebreak_rules',
  'contact_info',
] as const;

/** Fields that must contain a value, and the 400 message if they don't. */
const REQUIRED: Record<(typeof WRITABLE)[number], string> = {
  event_name: 'Nama acara wajib diisi.',
  start_date: 'Tanggal mulai wajib diisi.',
  end_date: 'Tanggal selesai wajib diisi.',
  location: 'Lokasi wajib diisi.',
  map_url: '',
  rules_text: '',
  tiebreak_rules: 'Aturan tie-break wajib diisi.',
  contact_info: '',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whitelist + normalise the incoming body.
 * Empty optional strings become null so the column is cleared instead of
 * storing "". Throws an Error whose message is safe to show the user.
 */
function sanitiseSettings(input: unknown): Record<string, string | null> {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Bad Request');
  }

  const src = input as Record<string, unknown>;
  const out: Record<string, string | null> = {};

  for (const field of WRITABLE) {
    const raw = src[field];

    if (raw === undefined || raw === null) {
      // Absent value: leave it alone rather than wiping a stored setting.
      continue;
    }

    if (typeof raw !== 'string') {
      throw new Error('Bad Request');
    }

    const value = raw.trim();

    if (REQUIRED[field] && value.length === 0) {
      throw new Error(REQUIRED[field]);
    }

    if (field === 'start_date' || field === 'end_date') {
      if (!ISO_DATE.test(value)) throw new Error('Format tanggal tidak valid.');
    }

    if (field === 'map_url' && value.length > 0) {
      let parsed: URL;
      try {
        parsed = new URL(value);
      } catch {
        throw new Error('URL peta tidak valid.');
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('URL peta harus diawali http:// atau https://');
      }
    }

    // Optional text fields: blank means "clear this"
    out[field] = value.length === 0 && !REQUIRED[field] ? null : value;
  }

  if (Object.keys(out).length === 0) {
    throw new Error('Tidak ada pengaturan untuk disimpan.');
  }

  if (out.start_date && out.end_date && out.start_date > out.end_date) {
    throw new Error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
  }

  return out;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!isSupabaseConfigured()) {
    console.warn(SUPABASE_MISCONFIGURED_MESSAGE);
    // Still hand back a usable payload so the public site renders its copy,
    // but flag the failure so the UI can say the data is not live.
    return NextResponse.json(
      { success: false, data: defaultSettings, error: SUPABASE_MISCONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('event_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Database warning fetching settings, using defaults:', (error as Error).message);
      return NextResponse.json({ success: false, data: defaultSettings, error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || defaultSettings });
  } catch (error: unknown) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ success: false, data: defaultSettings, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesi berakhir, masuk kembali.' }, { status: 401 });
    }
    await audit(session, 'update_settings', 'event_settings');

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    let payload: Record<string, string | null>;
    try {
      payload = sanitiseSettings(await request.json());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Permintaan tidak valid.';
      if (message === 'Bad Request') {
        return NextResponse.json(
          { success: false, error: 'Format data tidak dikenali.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const adminSupabase = getServiceSupabase();

    const { data: existing, error: lookupError } = await adminSupabase
      .from('event_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error('Settings lookup error:', lookupError);
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menghubungi database.' },
        { status: 502 }
      );
    }

    let result;
    if (existing?.id) {
      result = await adminSupabase
        .from('event_settings')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await adminSupabase
        .from('event_settings')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Update settings error:', result.error);
      let message: string;

      if (result.error.code === '42P01') {
        message = 'Tabel event_settings belum ada. Jalankan supabase-schema.sql di Supabase SQL Editor.';
      } else if (result.error.code === '23505') {
        message = 'Pengaturan sudah ada dan tidak dapat dibuat ganda.';
      } else if (result.error.code === '22P02') {
        message = 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.';
      } else {
        message = 'Database menolak perubahan. Periksa kolom dan coba lagi.';
      }

      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: unknown) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message || 'Terjadi kesalahan saat menyimpan pengaturan' },
      { status: 500 }
    );
  }
}

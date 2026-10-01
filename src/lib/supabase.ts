import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Placeholder text that ships in .env.local.example or is left behind by a
 * half-finished setup. Matched case-insensitively as a substring so
 * "PASTE_SERVICE_ROLE_KEY_HERE" and "your-service-role-key" both trip it.
 */
const PLACEHOLDERS = [
  'your-project',
  'your-anon-key',
  'your-service-role-key',
  'placeholder',
  'paste_service_role',
  'paste-service-role',
  'xxxxxxxx',
  'todo',
];

const isPlaceholder = (value: string) =>
  value.length === 0 || PLACEHOLDERS.some((p) => value.toLowerCase().includes(p));

/** True only when the anon key is a real credential — reads depend on it. */
export function isSupabaseConfigured(): boolean {
  return !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);
}

/**
 * True only when a real service-role key is present.
 *
 * Writes deliberately do NOT fall back to the anon key: the anon key is public
 * (it is inlined into the browser bundle via NEXT_PUBLIC_*) and the RLS write
 * policies are scoped to service_role, so falling back would produce a confusing
 * RLS rejection instead of an honest "you forgot the key" message.
 */
export function isServiceRoleConfigured(): boolean {
  return isSupabaseConfigured() && !isPlaceholder(rawServiceKey);
}

const serviceKey = rawServiceKey;

/** Shown to the user and logged on the server. */
export const SUPABASE_MISCONFIGURED_MESSAGE =
  'Database belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local, lalu jalankan supabase-schema.sql.';

export const SUPABASE_MISSING_SERVICE_KEY_MESSAGE =
  'SUPABASE_SERVICE_ROLE_KEY belum diisi. Buka Supabase Dashboard > Project Settings > API > service_role, lalu tempel ke .env.local agar operasi tulis (tim, jadwal, skor, pengaturan) bisa dilakukan.';

/** Abort any Supabase call that has not answered within this window. */
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Wrap global fetch so a dead/unreachable database cannot stall a request
 * for the OS default TCP timeout (which was ~7s per call and caused the
 * browser to abort its own polls with "TypeError: fetch failed").
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Honour a caller-supplied signal alongside our own timeout.
  if (init?.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

function buildClient(key: string) {
  return createClient(supabaseUrl || 'https://placeholder.supabase.co', key || 'placeholder', {
    global: { fetch: fetchWithTimeout },
  });
}

// Client-side Supabase client (read-only with RLS)
export const supabase = buildClient(supabaseAnonKey);

// Server-side Supabase client with service role (full access)
export function getServiceSupabase() {
  return buildClient(serviceKey);
}

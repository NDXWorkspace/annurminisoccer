'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ApiResponse,
  EventSettings,
  MatchWithTeams,
  Player,
  Team,
} from './types';
import { SEED_MATCHES, SEED_SETTINGS, SEED_TEAMS } from './seed';

/**
 * Satu lapisan data untuk seluruh aplikasi.
 *
 * Sebelumnya setiap halaman punya `setInterval` sendiri dengan interval
 * berbeda (3s, 5s, 8s, 10s, 15s, 30s) untuk endpoint yang sama. Akibatnya
 * dua bagian halaman bisa menampilkan data berbeda di detik yang sama, dan
 * tiap pembukaan halaman menembak beberapa permintaan sekaligus.
 *
 * Di sini satu sumber per sumber data. Semua pemanggil berbagi satu
 * salinan data dan satu koneksi.
 *
 * Pembaruan masuk lewat dua jalur:
 *  1. Supabase Realtime (utama). begitucommittee atau wasit menyimpan, baris
 *     yang berubah dikirim lewat websocket ke semua tab yang terbuka.
 *  2. Polling (jaring pengaman). Jika realtime tidak tersambung, tetap
 *     ditarik tiap 5 detik. Setelah realtime hidup, polling diturunkan
 *     menjadi 60 detik supaya tidak membebani database tanpa alasan.
 */

const POLL_FALLBACK_MS = 5_000;
const POLL_IDLE_MS = 60_000;
const STALE_AFTER_MS = 20_000;

/** Jeda sangat singkat untuk menggabungkan beberapa event yang beruntun. */
const COALESCE_MS = 120;

type Listener = () => void;

class Resource<T> {
  private data: T;
  private url: string;
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running: Promise<void> | null = null;
  private coalesceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastOkAt = 0;
  private loaded = false;

  constructor(url: string, seed: T) {
    this.url = url;
    this.data = seed;
    // Dihitung dari sekarang, bukan 0, supaya kegagalan tarik pertama tetap
    // bisa memunculkan indikasi koneksi terputus setelah ambang terlampaui.
    this.lastOkAt = Date.now();
    registry.add(this);
  }

  get = (): T => this.data;

  /**
   * Pernah berhasil menarik data asli dari server.
   *
   * seed hanya illustrious supaya halaman punya bentuk saat render pertama di
   * server. Kalau seed ikut tampil setelah hydration, penonton sempat melihat
   * skor karangan (0-0, 0-12) sebelum angka asli datang. Karena itu halaman
   * menampilkan kerangka sampai tanda ini berubah jadi true.
   */
  isLoaded = (): boolean => this.loaded;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    if (this.listeners.size === 1) {
      void this.refresh();
      this.schedule();
    }
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0) this.unschedule();
    };
  };

  /**
   * Ambil ulang dari server. Permintaan yang tumpang tindih tidak dilumpuk
   * menjadi permintaan baru, melainkan menunggu yang sedang berjalan supaya
   * data akhirnya selalu sama dengan keadaan database terakhir.
   */
  refresh = async (): Promise<void> => {
    if (this.running) return this.running;

    this.running = (async () => {
      try {
        const res = await fetch(this.url, { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const payload = (await res.json()) as ApiResponse<T>;
        if (payload.success && payload.data !== undefined) {
          this.lastOkAt = Date.now();
          const berubah =
            JSON.stringify(this.data) !== JSON.stringify(payload.data);
          // Pemanggil perlu diberi tahu meski isinya sama persis, kalau ini
          // tarik pertama: mereka menunggu tanda ini untuk berhenti
          // menampilkan kerangka.
          if (berubah || !this.loaded) {
            this.data = payload.data;
            this.loaded = true;
            this.notify();
          } else {
            this.loaded = true;
          }
        }
      } catch {
        // Jaringan putus atau server salah: pertahankan data terakhir. Layar
        // publik menampilkan indikasi "koneksi terputus" dari lastOkAt.
      } finally {
        this.running = null;
      }
    })();

    return this.running;
  };

  /**
   * Ambil ulang yang digabung. Satu committeesimpan beberapa field sekaligus
   * akan memicu beberapa event; ini memastikan hanya satu permintaan yang hijau.
   */
  refreshSoon = (): void => {
    if (this.coalesceTimer) return;
    this.coalesceTimer = setTimeout(() => {
      this.coalesceTimer = null;
      void this.refresh();
    }, COALESCE_MS);
  };

  /** Terapkan perubahan lokal seketika, lalu konfirmasi ke server. */
  apply = (fn: (current: T) => T): void => {
    const next = fn(this.data);
    if (next === this.data) return;
    this.data = next;
    this.notify();
    this.refreshSoon();
  };

  private schedule() {
    this.unschedule();
    this.timer = setTimeout(async () => {
      await this.refresh();
      if (this.listeners.size > 0) this.schedule();
    }, wire.isLive() ? POLL_IDLE_MS : POLL_FALLBACK_MS);
  }

  /** Dipanggil ulang saat status realtime berubah. */
  retune(): void {
    if (this.listeners.size > 0) this.schedule();
  }

  private unschedule() {
    if (this.timer) clearTimeout(this.timer);
    if (this.coalesceTimer) clearTimeout(this.coalesceTimer);
    this.coalesceTimer = null;
    this.timer = null;
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  /** True kalau data sudah basi melewati ambang. */
  isStale = (): boolean => this.lastOkAt > 0 && Date.now() - this.lastOkAt > STALE_AFTER_MS;
}

/** Hanya bagian store yang perlu-careuh saat status realtime berubah. */
interface Retunable {
  retune(): void;
}

const registry = new Set<Retunable>();

export const matchesStore = new Resource<MatchWithTeams[]>('/api/matches', SEED_MATCHES);
export const teamsStore = new Resource<Team[]>('/api/teams', SEED_TEAMS);
export const settingsStore = new Resource<EventSettings>('/api/settings', SEED_SETTINGS);

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------

export type WireState = 'connecting' | 'live' | 'offline';

/** Baris pemain tidak punya store global; pemanggil didaftarkan di sini. */
const playerListeners = new Set<Listener>();

export function onPlayersChanged(fn: Listener): () => void {
  playerListeners.add(fn);
  return () => playerListeners.delete(fn);
}

type Row = Record<string, unknown>;

interface ChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Row;
  old: Row;
}

const asNumber = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);

/**
 * Skor dan status bisa langsung ditempel dari payload realtime supaya angka di
 * layar berubah tanpa menunggu bolak-balik ke server. Waktu dan tanggal
 * sengaja tidak disentuh: formatnya berbeda antara Postgres (`HH:MM:SS`) dan
 * API (`HH:MM`), jadi itu urusan permintaan penuh.
 */
function patchMatchFromRow(row: Row): void {
  const id = row.id;
  if (typeof id !== 'string') return;
  const status = row.status;
  matchesStore.apply((current) => {
    let touched = false;
    const next = current.map((m) => {
      if (m.id !== id) return m;
      const scoreA = asNumber(row.score_a, m.score_a);
      const scoreB = asNumber(row.score_b, m.score_b);
      const nextStatus =
        typeof status === 'string' ? (status as MatchWithTeams['status']) : m.status;
      if (scoreA === m.score_a && scoreB === m.score_b && nextStatus === m.status) return m;
      touched = true;
      return { ...m, score_a: scoreA, score_b: scoreB, status: nextStatus };
    });
    return touched ? next : current;
  });
}

const WIRE: Record<string, (payload: ChangePayload) => void> = {
  matches: (payload) => {
    if (payload.eventType === 'UPDATE') patchMatchFromRow(payload.new);
    else matchesStore.refreshSoon();
    // Selalu konfirmasi ke server: payload hanya memuat kolom yang berubah
    // dan tidak membawa relasi tim.
    matchesStore.refreshSoon();
  },
  teams: () => teamsStore.refreshSoon(),
  event_settings: () => settingsStore.refreshSoon(),
  // Kejadian (kartu, pelanggaran) selalu ikut memuat ulang daftar pertandingan:
  // embedded events datang bersama row matches.
  match_events: () => matchesStore.refreshSoon(),
  players: () => {
    for (const fn of playerListeners) fn();
  },
};

const wire = (() => {
  let channel: { unsubscribe: () => void } | null = null;
  let opening = false;
  let users = 0;
  let state: WireState = 'connecting';
  const listeners = new Set<Listener>();

  const publish = (next: WireState) => {
    if (state === next) return;
    state = next;
    for (const fn of listeners) fn();
    // Status berubah berarti kecepatan polling berubah juga.
    for (const store of registry) store.retune();
  };

  const open = async () => {
    if (channel || opening) return;
    opening = true;
    publish('connecting');
    try {
      // Dimuat saat dibutuhkan supaya @supabase/supabase-js tidak masuk ke
      // bundel awal semua halaman.
      const { supabase } = await import('./supabase');
      const chan = supabase.channel('annur-db');
      for (const [table, handler] of Object.entries(WIRE)) {
        chan.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload: ChangePayload) => handler(payload)
        );
      }
      chan.subscribe((status) => {
        if (status === 'SUBSCRIBED') publish('live');
        // CHANNEL_ERROR / TIMED_OUT / CLOSED: supabase-js mencoba sambung
        // sendiri. Polling yang aktif selama itu menjadi jaring pengaman.
        else publish('offline');
      });
      channel = chan;
    } catch {
      publish('offline');
    } finally {
      opening = false;
    }
  };

  const close = () => {
    if (!channel) return;
    const dead = channel;
    channel = null;
    void dead.unsubscribe();
  };

  return {
    isLive: () => state === 'live',
    get: () => state,
    listen(fn: Listener) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    attach() {
      users += 1;
      void open();
      let disposed = false;
      return () => {
        if (disposed) return;
        disposed = true;
        users -= 1;
        if (users <= 0) {
          close();
          publish('connecting');
        }
      };
    },
  };
})();

/** Status koneksi realtime: 'connecting' | 'live' | 'offline'. */
export function useWire(): WireState {
  const [state, setState] = useState<WireState>(wire.get());

  useEffect(() => {
    const unsubscribe = wire.listen(() => setState(wire.get()));
    const detach = wire.attach();
    return () => {
      unsubscribe();
      detach();
    };
  }, []);

  return state;
}

// ---------------------------------------------------------------------------
// antar tab di perangkat yang sama
// ---------------------------------------------------------------------------

/**
 * Tab lain memberi tahu ada yang berubah (committee menyimpan, wasit mengetik
 * skor). Realtime sudah menutup kesenjangan antar perangkat; ini hanya
 * membuat tab lain di HP yang sama ikut bergerak seketika.
 */
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('annur') : null;

export function announceChange() {
  channel?.postMessage({ type: 'changed' });
}

if (channel) {
  channel.onmessage = () => {
    matchesStore.refreshSoon();
    teamsStore.refreshSoon();
    settingsStore.refreshSoon();
    for (const fn of playerListeners) fn();
  };
}

if (typeof window !== 'undefined') {
  // Fallback untuk browser tanpa BroadcastChannel: event storage menyeberang
  // antar tab.
  window.addEventListener('storage', (e) => {
    if (e.key === 'annur-ping') {
      matchesStore.refreshSoon();
      teamsStore.refreshSoon();
      settingsStore.refreshSoon();
      for (const fn of playerListeners) fn();
    }
  });
}

export function announceChangeEverywhere() {
  announceChange();
  try {
    window.localStorage.setItem('annur-ping', String(Date.now()));
  } catch {
    // penyimpanan diblokir — andalkan BroadcastChannel saja
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook: kembalikan data terbaru dari store, status koneksi, muat ulang, dan
 * tanda apakah data asli sudah pernah datang.
 *
 * Elemen keempat wajib dipakai halaman: selama `loaded` masih false, isi store
 * hanyalah data seed dan tidak boleh ditampilkan.
 */
export function useResource<T>(
  store: Resource<T>
): [T, boolean, () => void, boolean] {
  const [data, setData] = useState<T>(store.get());
  const [online, setOnline] = useState(true);
  const [loaded, setLoaded] = useState(() => store.isLoaded());
  const alive = useRef(true);

  // Menyambungkan realtime selama ada satu saja yang membaca store ini.
  useWire();

  useEffect(() => {
    alive.current = true;

    const sync = () => {
      if (!alive.current) return;
      setData(store.get());
      setOnline(!store.isStale());
      setLoaded(store.isLoaded());
    };

    sync();
    const unsubscribe = store.subscribe(sync);
    // Indikator "koneksi terputus" dicek terpisah supaya tidak bergantung
    // pada kapan data terakhir benar-benar berubah.
    const clock = setInterval(sync, 3_000);

    return () => {
      alive.current = false;
      clearInterval(clock);
      unsubscribe();
    };
  }, [store]);

  const reload = useCallback(() => {
    void store.refresh().then(() => {
      if (!alive.current) return;
      setData(store.get());
      setOnline(!store.isStale());
      setLoaded(store.isLoaded());
    });
  }, [store]);

  return [data, online, reload, loaded];
}

/** Hook untuk pemain satu tim. */
export function usePlayers(teamId: string): [Player[], boolean, () => void] {
  const [players, setPlayers] = useState<Player[]>([]);
  const [online, setOnline] = useState(true);
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!teamId) {
      setPlayers([]);
      return;
    }
    try {
      const res = await fetch(`/api/players?team_id=${teamId}`, { cache: 'no-store' });
      const data: ApiResponse<Player[]> = await res.json();
      if (!alive.current) return;
      if (data.success && data.data) setPlayers(data.data);
      setOnline(true);
    } catch {
      if (alive.current) setOnline(false);
    }
  }, [teamId]);

  useEffect(() => {
    alive.current = true;
    void load();

    // Realtime pemain + tab lain di perangkat ini.
    const onChange = () => void load();
    const offPlayers = onPlayersChanged(onChange);
    channel?.addEventListener('message', onChange);
    // Polling hanya menjadi pengaman; realtime yang mengarahkan.
    const id = setInterval(() => void load(), 60_000);

    return () => {
      alive.current = false;
      clearInterval(id);
      offPlayers();
      channel?.removeEventListener('message', onChange);
    };
  }, [load]);

  return [players, online, load];
}

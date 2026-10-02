import { NextResponse } from 'next/server';

/**
 * Parse body JSON dengan aman. Kalau rusak/bukan JSON, kembalikan response 400
 * (ditinggalkan oleh caller lewat `if (!parsed.ok) return parsed.response`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParsedBody = any;

export async function parseJsonBody(
  request: Request
): Promise<{ ok: true; body: ParsedBody } | { ok: false; response: NextResponse }> {
  try {
    // request.json() mengembalikan Promise<any> — caller memvalidasi field sendiri,
    // setara dengan perilaku `await request.json()` sebelumnya.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Body permintaan harus JSON yang valid.' },
        { status: 400 }
      ),
    };
  }
}

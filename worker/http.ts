const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS,
      ...extra,
    },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) return json({ ok: false, code: error.code, message: error.message }, error.status);
  console.error('etaad_api_error', error instanceof Error ? error.message : String(error));
  return json({ ok: false, code: 'SERVER_ERROR', message: 'حدث خطأ غير متوقع. حاول مرة أخرى.' }, 500);
}

/** الطلبات التي تغيّر بيانات يجب أن تأتي من نفس الموقع (حماية CSRF). */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  const own = new URL(request.url).origin;
  if (!origin || origin !== own) throw new HttpError(403, 'ORIGIN', 'مصدر الطلب غير مسموح.');
}

export async function readJson(request: Request, maxBytes = 16_000): Promise<unknown> {
  const type = request.headers.get('Content-Type') ?? '';
  if (!type.includes('application/json')) throw new HttpError(415, 'CONTENT_TYPE', 'نوع البيانات غير مدعوم.');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'TOO_LARGE', 'البيانات أكبر من المسموح.');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'البيانات غير صالحة.');
  }
}

export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** مقارنة ثابتة الزمن عبر مقارنة البصمات. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export function randomToken(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!headers.has(k)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

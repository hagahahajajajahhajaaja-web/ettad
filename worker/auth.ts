import type { D1Database, Env } from './types';
import { HttpError, randomToken, safeEqual, sha256Hex } from './http';

export const SESSION_COOKIE = 'etaad_admin';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function cookie(value: string, maxAgeSeconds: number) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

/** يتحقق من مفتاح لوحة التحكم (Secret في Cloudflare) وينشئ جلسة بكوكي HttpOnly. */
export async function login(db: D1Database, env: Env, key: unknown, now = Date.now()): Promise<string> {
  const expected = (env.ADMIN_KEY ?? '').trim();
  if (expected.length < 12) throw new HttpError(503, 'ADMIN_KEY_MISSING', 'مفتاح لوحة التحكم لم يُضبط في إعدادات Cloudflare بعد.');
  if (typeof key !== 'string' || !(await safeEqual(key.trim(), expected))) {
    throw new HttpError(401, 'BAD_KEY', 'المفتاح غير صحيح.');
  }
  const token = randomToken();
  await db.batch([
    db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now),
    db.prepare('INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)').bind(await sha256Hex(token), now, now + SESSION_TTL_MS),
  ]);
  return cookie(token, Math.floor(SESSION_TTL_MS / 1000));
}

export async function isAdmin(db: D1Database, request: Request, now = Date.now()): Promise<boolean> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || token.length < 20 || token.length > 100) return false;
  const row = await db
    .prepare('SELECT expires_at FROM admin_sessions WHERE token_hash = ?')
    .bind(await sha256Hex(token))
    .first<{ expires_at: number }>();
  return Boolean(row && row.expires_at > now);
}

export async function requireAdmin(db: D1Database, request: Request) {
  if (!(await isAdmin(db, request))) throw new HttpError(401, 'UNAUTHORIZED', 'سجّل الدخول إلى لوحة التحكم أولًا.');
}

export async function logout(db: D1Database, request: Request): Promise<string> {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  return cookie('', 0);
}

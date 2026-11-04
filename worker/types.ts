/** أنواع مختصرة لواجهات Cloudflare المستخدمة (D1 و ASSETS) — بدون اعتماد على حزمة أنواع خارجية. */
export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: { changes?: number; last_row_id?: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(sql: string): Promise<unknown>;
}

export interface Env {
  ASSETS?: { fetch(request: Request): Promise<Response> };
  /** قاعدة بيانات D1 — اسم الربط في Cloudflare: ETAAD_DB */
  ETAAD_DB?: D1Database;
  /** مفتاح دخول لوحة التحكم — يُحفظ كـ Secret في Cloudflare فقط */
  ADMIN_KEY?: string;
  /** رقم واتساب المتجر (965XXXXXXXX) لرسالة متابعة الطلب — اختياري */
  WHATSAPP_NUMBER?: string;
}

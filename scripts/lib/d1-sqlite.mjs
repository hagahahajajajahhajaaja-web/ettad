/**
 * محاكاة واجهة Cloudflare D1 فوق node:sqlite — للاختبارات وخادم e2e المحلي فقط.
 * تدعم: prepare().bind().first()/all()/run()، batch()، exec().
 */
import { DatabaseSync } from 'node:sqlite';

class Statement {
  constructor(db, sql, params = []) {
    this.db = db;
    this.sql = sql;
    this.params = params;
  }
  bind(...values) {
    for (const v of values) if (v === undefined) throw new TypeError('D1_TYPE_ERROR: undefined bind value');
    return new Statement(this.db, this.sql, values.map((v) => (typeof v === 'boolean' ? Number(v) : v)));
  }
  async first(column) {
    const row = this.db.prepare(this.sql).get(...this.params) ?? null;
    if (row && column) return row[column] ?? null;
    return row ? { ...row } : null;
  }
  async all() {
    const results = this.db.prepare(this.sql).all(...this.params).map((r) => ({ ...r }));
    return { results, success: true, meta: {} };
  }
  async run() {
    const info = this.db.prepare(this.sql).run(...this.params);
    return { results: [], success: true, meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) } };
  }
}

export function createD1(filename = ':memory:') {
  const db = new DatabaseSync(filename);
  return {
    raw: db,
    prepare: (sql) => new Statement(db, sql),
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        db.exec('COMMIT');
        return out;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    async exec(sql) {
      db.exec(sql);
      return { count: 1 };
    },
  };
}

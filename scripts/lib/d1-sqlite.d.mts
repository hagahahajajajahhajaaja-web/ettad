import type { D1Database } from '../../worker/types';
export function createD1(filename?: string): D1Database & { raw: unknown };

import { z } from 'zod';

// بيئات Cloudflare وصفحات claude.ai تمنع توليد الكود (eval) — نشغّل zod بدون JIT
z.config({ jitless: true });

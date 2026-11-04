/**
 * محاكاة محلية لـ Cloudflare Pages: كل طلب يمر عبر out/_worker.js (إن وُجد) كما في الإنتاج،
 * و env.ASSETS يخدم الملفات الثابتة بنفس سلوك Pages (مجلد ← index.html، إضافة / للمسارات، 404.html).
 * للتطوير والاختبارات فقط.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export function createAssets(root) {
  async function file(p) {
    try {
      const info = await stat(p);
      return info.isFile() ? p : null;
    } catch {
      return null;
    }
  }
  return {
    async fetch(request) {
      const url = new URL(request.url);
      const rel = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
      const target = path.join(root, rel);
      if (!target.startsWith(root)) return new Response('Forbidden', { status: 403 });
      if (!path.extname(url.pathname) && !url.pathname.endsWith('/') && (await file(path.join(target, 'index.html')))) {
        return new Response(null, { status: 308, headers: { Location: `${url.pathname}/${url.search}` } });
      }
      const found = (await file(target)) ?? (await file(path.join(target, 'index.html')));
      if (!found) {
        const notFound = await readFile(path.join(root, '404.html')).catch(() => 'Not found');
        return new Response(notFound, { status: 404, headers: { 'Content-Type': TYPES['.html'] } });
      }
      return new Response(await readFile(found), { headers: { 'Content-Type': TYPES[path.extname(found)] ?? 'application/octet-stream' } });
    },
  };
}

export async function startLocalPages({ outDir, port, env = {}, rewriteIp }) {
  const root = path.resolve(outDir);
  const assets = createAssets(root);
  const workerPath = path.join(root, '_worker.js');
  const worker = existsSync(workerPath) ? (await import(pathToFileURL(workerPath).href)).default : null;
  const fullEnv = { ...env, ASSETS: assets };

  const server = createServer(async (req, res) => {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
      headers.set('CF-Connecting-IP', rewriteIp ? rewriteIp(req) : req.socket.remoteAddress ?? 'local');
      const request = new Request(`http://localhost:${port}${req.url}`, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(chunks),
      });
      const response = worker ? await worker.fetch(request, fullEnv) : await assets.fetch(request);
      const out = {};
      response.headers.forEach((v, k) => {
        if (k !== 'set-cookie') out[k] = v;
      });
      const cookies = response.headers.getSetCookie?.() ?? [];
      if (cookies.length) out['set-cookie'] = cookies;
      res.writeHead(response.status, out);
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' }).end(String(error));
    }
  });
  await new Promise((resolve) => server.listen(port, resolve));
  return server;
}

import app from '../server/index.js';

export default function handler(req, res) {
  const requestUrl = new URL(req.url || '/', 'http://localhost');

  if (!requestUrl.pathname.startsWith('/api/')) {
    const pathname = requestUrl.pathname === '/' ? '/api' : `/api${requestUrl.pathname}`;
    req.url = `${pathname}${requestUrl.search}`;
  }

  return app(req, res);
}
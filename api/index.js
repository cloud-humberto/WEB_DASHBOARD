import app from '../server/index.js';

export default function handler(req, res) {
  const requestUrl = new URL(req.url || '/', 'http://localhost');

  let pathname = requestUrl.pathname;
  if (!pathname.startsWith('/api')) {
    pathname = `/api${pathname.startsWith('/') ? '' : '/'}${pathname}`;
  }
  req.url = `${pathname}${requestUrl.search}`;

  return app(req, res);
}

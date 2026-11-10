// Servidor estático mínimo para pré-visualização local.
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || f.includes(path.sep + '.claude')) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => e ? (res.writeHead(404), res.end('not found')) : (res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }), res.end(d)));
}).listen(8765);

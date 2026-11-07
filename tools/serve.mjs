import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png','.json':'application/json'};
http.createServer(async (req,res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = path.resolve(root, '.' + (urlPath === '/' ? '/index.html' : urlPath));
    if (!target.startsWith(root) || /(?:^|[\\/])\.(?!well-known)/.test(urlPath)) {res.writeHead(403); return res.end();}
    const data = await readFile(target);
    res.writeHead(200, {'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT || 4178), '0.0.0.0', () => console.log('Tháp Vô Tận: http://localhost:' + (process.env.PORT || 4178)));

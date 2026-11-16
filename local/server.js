const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const api = require('../api/index');
const root = path.resolve(__dirname, '../public');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    if (url.pathname === '/admin' || url.pathname === '/api/index') {
      req.query = Object.fromEntries(url.searchParams);
      if (url.pathname === '/admin') req.query.screen = 'admin';
      return await api(req,res);
    }
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405); return res.end();}
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(root,'.'+relative);
    if (!file.startsWith(root+path.sep)) {res.writeHead(403); return res.end();}
    const data = await fs.readFile(file);
    res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (err) {
    if (!res.headersSent) res.statusCode = err.code === 'ENOENT' ? 404 : 500;
    res.end();
  }
});
const port = Number(process.env.PORT || 3180);
server.listen(port,'127.0.0.1',()=>console.log('Food Store en http://127.0.0.1:'+port));


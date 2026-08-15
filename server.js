const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const port = process.env.PORT || 8137;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const file = path.join(root, url === '/' ? '/pet.html' : url);
  fs.readFile(file, (e, d) => {
    if (e) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(d);
  });
}).listen(port, () => console.log('moodie-pet preview on ' + port));

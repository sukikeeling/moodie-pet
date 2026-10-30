const http = require('http');
const fs = require('fs');
const path = require('path');
const { SystemSensorEngine } = require('./system-sensor');

const root = __dirname;
const port = Number(process.env.PORT) || 8137;
const sensorPort = Number(process.env.MOODIE_PORT) || 17530;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const sensor = new SystemSensorEngine({ port: sensorPort, autoSense: true });
sensor.start().then((info) => {
  console.log(`moodie-pet system-sensor listening on http://127.0.0.1:${info.port}`);
});

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const file = path.join(root, url === '/' ? '/pet.html' : url);
  fs.readFile(file, (e, d) => {
    if (e) {
      res.writeHead(404);
      res.end('404');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream'
    });
    res.end(d);
  });
}).listen(port, () => console.log(`moodie-pet preview on http://127.0.0.1:${port}`));

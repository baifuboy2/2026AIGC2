// Railway 服务器 — 静态文件 + 支付代理
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 8080;
const ZHIFU = 'https://api-4yyy23efihhc.zhifu.fm.it88168.com/api';

http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // 代理 startOrder
  if (req.url.indexOf('/start') === 0) {
    var url = ZHIFU + '/startOrder' + req.url.substring(6);
    fetch(url, { method: 'POST' }).then(function(r) { return r.json() }).then(function(d) {
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(d));
    }).catch(function(e) { res.writeHead(502); res.end(JSON.stringify({ error: e.message })); });
    return;
  }

  // 代理 queryOrder
  if (req.url.indexOf('/query') === 0) {
    var url = ZHIFU + '/queryOrder' + req.url.substring(6);
    fetch(url, { method: 'POST' }).then(function(r) { return r.json() }).then(function(d) {
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(d));
    }).catch(function(e) { res.writeHead(502); res.end(JSON.stringify({ error: e.message })); });
    return;
  }

  // 静态文件
  var fp = req.url === '/' ? '/pay.html' : req.url.split('?')[0];
  fp = path.join(__dirname, fp);
  if (!fp.startsWith(__dirname)) { res.writeHead(403); res.end(); return; }
  try {
    var mime = { '.html':'text/html','.js':'text/javascript','.css':'text/css' };
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'text/plain' });
    res.end(fs.readFileSync(fp));
  } catch(e) { res.writeHead(404); res.end('not found'); }
}).listen(PORT, function() { console.log('Railway on port ' + PORT); });

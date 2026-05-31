// Railway 服务器 — 静态文件 + 支付代理 + 回调接收
var http = require('http');
var fs = require('fs');
var path = require('path');
var PORT = process.env.PORT || 8080;
var ZHIFU = 'https://api-4yyy23efihhc.zhifu.fm.it88168.com/api';

// 内存存储支付状态（重启会丢失，但够用了）
var paidOrders = {};

http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // ====== zhifu 回调通知 ======
  if (req.url.indexOf('/notify') === 0 && req.method === 'POST') {
    var body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', function() {
      console.log('NOTIFY:', body);
      try {
        var params = new URLSearchParams(body);
        var orderNo = params.get('orderNo') || '';
        if (orderNo) { paidOrders[orderNo] = true; console.log('Paid:', orderNo); }
      } catch(e) {}
      res.writeHead(200); res.end('success');
    });
    return;
  }

  // ====== 页面查询支付状态（轮询） ======
  if (req.url.indexOf('/check') === 0) {
    var url = new URL(req.url, 'http://localhost');
    var orderNo = url.searchParams.get('orderNo') || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ paid: !!paidOrders[orderNo] }));
    return;
  }

  // ====== 代理 startOrder（创建订单） ======
  if (req.url.indexOf('/start') === 0) {
    var startUrl = ZHIFU + '/startOrder' + req.url.substring(6);
    fetch(startUrl, { method: 'POST' }).then(function(r) { return r.json(); }).then(function(d) {
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(d));
    }).catch(function(e) { res.writeHead(502); res.end(JSON.stringify({ error: e.message })); });
    return;
  }

  // ====== 静态文件 ======
  var fp = req.url === '/' ? '/pay.html' : req.url.split('?')[0];
  fp = path.join(__dirname, fp);
  if (!fp.startsWith(__dirname)) { res.writeHead(403); res.end(); return; }
  try {
    var mime = { '.html':'text/html','.js':'text/javascript','.css':'text/css' };
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'text/plain' });
    res.end(fs.readFileSync(fp));
  } catch(e) { res.writeHead(404); res.end('not found'); }
}).listen(PORT, function() { console.log('Running on port ' + PORT); });

var http = require('http');
var fs = require('fs');
var path = require('path');
var PORT = process.env.PORT || 8080;
var ZHIFU = 'https://api-4yyy23efihhc.zhifu.fm.it88168.com/api';
var paidOrders = {};

http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // zhifu 回调通知 — 同时接受 GET 和 POST
  if (req.url.indexOf('/notify') === 0) {
    // GET 回调（默认模式）：参数在 URL
    if (req.method === 'GET') {
      var m = req.url.match(/(?:orderNo|order_no|out_trade_no|oid)=([^&]+)/i);
      if (m) { paidOrders[m[1]] = true; paidOrders['__last'] = req.url; console.log('PAID(GET):', m[1]); }
      res.writeHead(200); res.end('success');
      return;
    }
    // POST 回调（apiMode=post_form）
    var body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', function() {
      paidOrders['__last'] = body; console.log('NOTIFY POST:', body);
      var m = body.match(/(?:orderNo|order_no|out_trade_no|oid)=([^&]+)/i);
      if (m) { paidOrders[m[1]] = true; console.log('PAID:', m[1]); }
      res.writeHead(200); res.end('success');
    });
    return;
  }

  // 查询支付状态 + 查看最近回调日志
  if (req.url.indexOf('/check') === 0) {
    var m = req.url.match(/orderNo=([^&]+)/);
    var orderNo = m ? decodeURIComponent(m[1]) : '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ paid: !!paidOrders[orderNo], lastNotify: paidOrders['__last'] || '(none)' }));
    return;
  }

  // 代理 startOrder
  if (req.url.indexOf('/start') === 0) {
    var startUrl = ZHIFU + '/startOrder' + req.url.substring(6);
    fetch(startUrl, { method: 'POST' }).then(function(r) { return r.json(); }).then(function(d) {
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
}).listen(PORT, function() { console.log('Running on port ' + PORT); });

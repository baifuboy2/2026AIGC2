// Vercel Serverless 函数 — 代理 zhifu API
// 部署后得到 https://xxx.vercel.app/api/proxy

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const ZHIFU = 'https://api-4yyy23efihhc.zhifu.fm.it88168.com/api';

  // /api/proxy?action=start&merchantNum=...
  const { action, ...params } = req.query;

  if (action === 'start') {
    const url = ZHIFU + '/startOrder?' + new URLSearchParams(params).toString();
    try {
      const r = await fetch(url, { method: 'POST' });
      res.status(200).json(await r.json());
    } catch(e) {
      res.status(502).json({ error: e.message });
    }
    return;
  }

  if (action === 'query') {
    const url = ZHIFU + '/queryOrder?' + new URLSearchParams(params).toString();
    try {
      const r = await fetch(url, { method: 'POST' });
      res.status(200).json(await r.json());
    } catch(e) {
      res.status(502).json({ error: e.message });
    }
    return;
  }

  res.status(400).json({ error: 'action must be start or query' });
}

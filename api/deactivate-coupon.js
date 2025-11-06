// Vercel serverless function: PATCH /api/deactivate-coupon
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const shared = process.env.SHARED_SECRET || '';
    if (shared && req.headers['x-shared-secret'] !== shared) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Missing code' });

    const siteId = process.env.WIX_SITE_ID;
    const apiKey = process.env.WIX_API_KEY;

    const url = `https://www.wixapis.com/stores/v2/sites/${siteId}/coupons/${encodeURIComponent(
      code
    )}`;

    const r = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: false })
    });

    const data = await r.json();

    if (!r.ok) {
      console.error('Wix deactivate coupon failed:', data);
      return res.status(r.status).json({ error: 'Deactivate failed', details: data });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Proxy deactivate error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

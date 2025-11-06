// Vercel serverless function: POST /api/create-coupon
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Optional shared secret protection
    const shared = process.env.SHARED_SECRET || '';
    if (shared && req.headers['x-shared-secret'] !== shared) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, memberId } = req.body || {};
    if (!amount || amount <= 0 || !memberId) {
      return res.status(400).json({ error: 'Invalid amount or memberId' });
    }

    const siteId = process.env.WIX_SITE_ID;
    const apiKey = process.env.WIX_API_KEY;

    const code = `EC-${String(memberId).slice(0, 6)}-${Date.now()
      .toString()
      .slice(-4)}`;

    const now = new Date();

    const couponData = {
      code,
      name: `EarthCredits ${code}`,
      active: true,
      discount: { type: 'AMOUNT', value: Number(amount) },
      scope: { type: 'ORDER' },
      usageLimit: 1,
      startTime: now.toISOString()
      // no expiration → one-time + deactivation handles cleanup
    };

    const url = `https://www.wixapis.com/stores/v2/sites/${siteId}/coupons`;

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(couponData)
    });

    const data = await r.json();

    if (!r.ok) {
      console.error('Wix create coupon failed:', data);
      return res.status(r.status).json({ error: 'Create failed', details: data });
    }

    return res.status(200).json({ code: data.code || code });
  } catch (err) {
    console.error('Proxy create error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

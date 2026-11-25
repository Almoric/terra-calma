// Terra Calma — AI concept image (server side, keeps GEMINI_API_KEY secret)
// Netlify Functions v2. Env vars: GEMINI_API_KEY (required), GEMINI_IMAGE_MODEL (optional), ALLOWED_ORIGIN (optional)

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image';
const MAX_LEN = 400;
const LIMIT_PER_HOUR = 8; // per IP, best effort (resets when the function cold-starts)
const hits = new Map();

const STYLE = [
  'Photorealistic studio product photograph of a handmade ceramic piece by the small studio "Terra Calma".',
  'Brand style: organic minimalism, raw clay, natural glazes in earth tones and pastel mint, hand-thrown, subtle imperfections, speckled and marbled glazes.',
  'Soft natural window light, white linen or light stone surface, warm neutral background, shallow depth of field, calm and airy composition.',
  'Show only the ceramic piece(s); no people, no hands, no logos, no watermarks.',
  'Do not add any text or lettering unless the customer explicitly asks for lettering on the piece; if they do, render it exactly as written (it may be Hebrew).',
].join(' ');

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default async (req, context) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && req.headers.get('origin') && req.headers.get('origin') !== allowed) return json(403, { error: 'Forbidden' });
  if (!process.env.GEMINI_API_KEY) return json(500, { error: 'missing key' });

  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon';
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (list.length >= LIMIT_PER_HOUR) return json(429, { error: 'הגעתם למספר ההדמיות לשעה. אפשר לשלוח את התיאור ישירות בווטסאפ.' });
  list.push(now); hits.set(ip, list);

  let prompt = '';
  try { prompt = String((await req.json()).prompt || '').trim().slice(0, MAX_LEN); } catch {}
  if (prompt.length < 4) return json(400, { error: 'כתבו כמה מילים על הכלי שתרצו לראות.' });

  const body = {
    contents: [{ parts: [{ text: `${STYLE}\n\nCustomer request (may be in Hebrew): """${prompt}"""` }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('Gemini error', r.status, JSON.stringify(data).slice(0, 500));
      return json(502, { error: 'upstream' });
    }
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const img = parts.map((p) => p.inlineData || p.inline_data).find((d) => d && d.data);
    if (!img) return json(422, { error: 'לא הצלחנו ליצור הדמיה מהתיאור הזה. נסו לנסח אחרת, או שלחו אותו בווטסאפ.' });
    return json(200, { image: img.data, mimeType: img.mimeType || img.mime_type || 'image/png' });
  } catch (e) {
    console.error(e);
    return json(502, { error: 'upstream' });
  }
};

export const config = { path: '/api/concept' };

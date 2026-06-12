// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP SENDER — Soilbuild Annual Dinner 2026
// File location: /api/send-whatsapp.js  (project ROOT, NOT inside src/)
//
// Required Vercel environment variable:
//   TWILIO_AUTH_TOKEN = your auth token from console.twilio.com
// ═══════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // CORS headers (so the browser fetch always works)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Allow GET for quick browser testing: /api/send-whatsapp?to=+60...&test=1
  let payload = {};
  if (req.method === "GET") {
    payload = req.query || {};
  } else if (req.method === "POST") {
    // Body may arrive parsed (object) or raw (string) depending on runtime
    if (typeof req.body === "string") {
      try { payload = JSON.parse(req.body); } catch (e) { payload = {}; }
    } else {
      payload = req.body || {};
    }
  } else {
    return res.status(405).json({ success: false, error: "Use POST or GET" });
  }

  const { to, name, uniqueId, pax, guestId, eventDate, eventTime, venue } = payload;

  const sid   = "AC9279029bf0d6a18b0816666f87114b3e";
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!token) {
    return res.status(500).json({ success: false, error: "TWILIO_AUTH_TOKEN not set in Vercel env vars" });
  }
  if (!to) {
    return res.status(400).json({ success: false, error: "Missing 'to' phone number" });
  }

  // QR code image (same format the app uses): uniqueId|name|pax|guestId
  const qrData = `${uniqueId || "SE000"}|${name || "Guest"}|${pax || 1}|${guestId || ""}`;
  const qrUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=" +
    encodeURIComponent(qrData);

  const message = `🎉 Hi ${name || "there"}!

Your registration for the Soilbuild Annual Dinner 2026 is confirmed.

🎫 Registration ID: ${uniqueId || ""}
👥 Pax: ${pax || 1}
📅 ${eventDate || ""}
🕕 ${eventTime || ""}
📍 ${venue || ""}

⬆️ Your entry QR code is attached above — please show it at the entrance.

See you there!
— Soilbuild Group Holdings Ltd`;

  const params = new URLSearchParams();
  params.append("To", "whatsapp:" + String(to).replace(/^whatsapp:/, "").replace(/\s/g, ""));
  params.append("From", "whatsapp:+14155238886");
  params.append("Body", message);
  params.append("MediaUrl", qrUrl);

  try {
    const r = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
        },
        body: params,
      }
    );
    const data = await r.json();
    if (data.sid) {
      return res.status(200).json({ success: true, sid: data.sid, status: data.status });
    }
    return res.status(400).json({ success: false, error: data.message || "Twilio error", code: data.code });
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) });
  }
}
// ═══════════════════════════════════════════════════════════════════════════
// EVENT REMINDER — runs automatically every day via Vercel Cron
// File location in your project: api/send-reminders.js
//
// HOW IT WORKS:
//   1. Vercel Cron calls this endpoint once a day (see vercel.json)
//   2. It checks: is the event TOMORROW?
//   3. If yes → fetches all CONFIRMED guests from Supabase
//   4. Sends each one a WhatsApp reminder with their QR code
//
// Required Vercel environment variable:
//   TWILIO_AUTH_TOKEN = your auth token from console.twilio.com
// ═══════════════════════════════════════════════════════════════════════════

// ⚙️ SET YOUR EVENT DATE HERE (format: YYYY-MM-DD)
const EVENT_DATE = "2026-10-23";

const EVENT_INFO = {
  title: "Annual Dinner 2026",
  date: "Friday, 23 October 2026",
  time: "6:00 PM — Registration",
  venue: "Hilton Singapore Orchard",
};

const SUPABASE_URL = "https://zsjbjwxyofgrdyhxlcjj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzamJqd3h5b2ZncmR5aHhsY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTM4NjcsImV4cCI6MjA5NDgyOTg2N30.O0-uolysivbUak-DGbHmG7orv93iTEgGOgCGEHAcQNs";

const TWILIO_SID = "AC9279029bf0d6a18b0816666f87114b3e";

export default async function handler(req, res) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "TWILIO_AUTH_TOKEN not set" });
  }

  // ── Is the event tomorrow? (Singapore timezone) ───────────────────────────
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" }));
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD

  // Allow manual testing with ?force=1 in the URL
  const force = req.query?.force === "1";

  if (tomorrowStr !== EVENT_DATE && !force) {
    return res.status(200).json({
      sent: 0,
      message: `Event is ${EVENT_DATE}, tomorrow is ${tomorrowStr} — no reminders today.`,
    });
  }

  // ── Fetch all confirmed guests with a mobile number from Supabase ─────────
  const supaRes = await fetch(
    `${SUPABASE_URL}/rest/v1/employees?rsvpStatus=eq.confirmed&select=id,name,mobile,uniqueId,pax`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const guests = await supaRes.json();
  if (!Array.isArray(guests)) {
    return res.status(500).json({ error: "Could not fetch guests", detail: guests });
  }

  const withMobile = guests.filter((g) => g.mobile && g.mobile.trim());
  const results = [];

  // ── Send reminder to each guest ───────────────────────────────────────────
  for (const g of withMobile) {
    const qrData = `${g.uniqueId}|${g.name}|${g.pax || 1}|${g.id}`;
    const qrUrl =
      "https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=" +
      encodeURIComponent(qrData);

    const message = `⏰ Reminder — TOMORROW! 🎉

Hi ${g.name}, the ${EVENT_INFO.title} is tomorrow!

🎫 Your Registration ID: ${g.uniqueId}
📅 ${EVENT_INFO.date}
🕕 ${EVENT_INFO.time}
📍 ${EVENT_INFO.venue}

⬆️ Your entry QR code is attached — save it and show it at the door.

See you tomorrow!
— Soilbuild Group Holdings Ltd`;

    const params = new URLSearchParams();
    params.append("To", "whatsapp:" + String(g.mobile).replace(/^whatsapp:/, "").replace(/\s/g, ""));
    params.append("From", "whatsapp:+14155238886");
    params.append("Body", message);
    params.append("MediaUrl", qrUrl);

    try {
      const r = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + Buffer.from(TWILIO_SID + ":" + token).toString("base64"),
          },
          body: params,
        }
      );
      const data = await r.json();
      results.push({ name: g.name, to: g.mobile, ok: !!data.sid, error: data.message || null });
      // small delay between sends so Twilio doesn't rate-limit
      await new Promise((r2) => setTimeout(r2, 400));
    } catch (e) {
      results.push({ name: g.name, to: g.mobile, ok: false, error: String(e) });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return res.status(200).json({
    sent,
    failed: results.length - sent,
    total: withMobile.length,
    results,
  });
}
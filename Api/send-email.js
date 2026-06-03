// Vercel Serverless Function — /api/send-email
// The Resend API key lives here on the SERVER, never sent to the browser

const RESEND_KEY = process.env.RESEND_KEY;
const FROM_EMAIL = "Soilbuild RSVP - 50 Years Anniversary Dinner <onboarding@resend.dev>";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Basic origin check — only allow requests from your own site
  const origin = req.headers.origin || "";
  const allowed = [
    "https://soildbulde-50.vercel.app",
    "https://soilbuild-dinner.vercel.app",
    "http://localhost:3000",
  ];
  // Allow any vercel preview URL too
  const isAllowed = allowed.some(a => origin.startsWith(a)) ||
                    origin.includes("vercel.app") ||
                    origin.includes("github.io");

  if (!isAllowed && process.env.NODE_ENV === "production") {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const { to, name, pax, tableName, drawNumber, dietary, subject, body,
          date, time, venue, dressCode, title, year } = req.body;

  if (!to || !name || !subject) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  // Build HTML email
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#2C1A0E;padding:28px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#F5C518;margin:0;font-size:22px">${title || "Annual Dinner"} ${year || "2026"}</h1>
        <p style="color:rgba(245,240,232,0.7);margin:6px 0 0;font-size:13px">50 Years Anniversary</p>
      </div>
      <div style="background:#F5F0E8;padding:28px;border-radius:0 0 12px 12px">
        <p style="font-size:15px;color:#2C1A0E">Dear <strong>${name}</strong>,</p>
        <p style="color:#5C3D1E">Thank you for confirming your attendance!</p>
        <div style="background:#fff;border-radius:8px;padding:18px;margin:16px 0;border-left:4px solid #2D8B3E">
          <p style="margin:0 0 8px">📅 <b>${date || ""}</b></p>
          <p style="margin:0 0 8px">🕕 <b>${time || ""}</b></p>
          <p style="margin:0 0 8px">📍 <b>${venue || ""}</b></p>
          <p style="margin:0 0 8px">👔 <b>${dressCode || ""}</b></p>
          <p style="margin:0 0 8px">👥 Pax: <b>${pax || 1}</b></p>
          <p style="margin:0 0 8px">🍽 Dietary: <b>${dietary || "Not specified"}</b></p>
          ${drawNumber ? `<p style="margin:0">🎰 Draw No: <b>#${drawNumber}</b></p>` : ""}
        </div>
        <p style="color:#5C3D1E;font-size:13px">Please present your QR code at the entrance.</p>
        <hr style="border:none;border-top:1px solid #E8DFD0;margin:20px 0"/>
        <p style="color:#888;font-size:11px;text-align:center">Soilbuild Group Holdings Ltd · Annual Dinner 2026</p>
      </div>
    </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        text: body || subject,
      }),
    });

    const data = await response.json();

    if (data.id) {
      return res.status(200).json({ ok: true, id: data.id });
    } else {
      console.error("Resend error:", data);
      return res.status(200).json({ ok: false, error: data.message || "Send failed" });
    }
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ ok: false, error: String(error) });
  }
}
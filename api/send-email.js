// Vercel Serverless Function — /api/send-email
const RESEND_KEY = process.env.RESEND_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "SoilBuild 50th Anniversary <rsvp@smartsolutionsevent.my>";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
  if (!RESEND_KEY) return res.status(500).json({ ok:false, error:"RESEND_KEY missing in Vercel env vars" });

  const { to, name, uniqueId, pax, tableName, dietary, allergies, qrData,
          subject, body, date, time, venue, dressCode, title, year } = req.body || {};
  if (!to || !name) return res.status(400).json({ ok:false, error:"Missing to or name" });

  const esc = (v) => String(v == null ? "" : v).replace(/[<>&]/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;" }[c]));
  const qr  = encodeURIComponent(qrData || uniqueId || name);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&margin=8&data=${qr}`;
  const emailSubject = subject || `RSVP Confirmed \u2014 SoilBuild 50 Years & Beyond`;

  const row = (label, value) => value ? `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid rgba(184,134,11,0.18);font:12px Helvetica,Arial,sans-serif;color:#8A7F6E;letter-spacing:1px;text-transform:uppercase;width:38%">${esc(label)}</td>
      <td style="padding:9px 0;border-bottom:1px solid rgba(184,134,11,0.18);font:15px Helvetica,Arial,sans-serif;color:#2E2A24;font-weight:600">${esc(value)}</td>
    </tr>` : "";

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#EFE7D8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#EFE7D8;padding:26px 12px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:linear-gradient(180deg,#FCF8F0 0%,#F5EFE3 100%);border:1px solid #B8860B;border-radius:14px;overflow:hidden">

  <tr><td align="center" style="padding:34px 30px 10px">
    <div style="font:13px Georgia,serif;letter-spacing:6px;color:#B8860B">YOU'RE INVITED</div>
    <div style="font:700 46px Georgia,serif;color:#B8860B;line-height:1.05;margin-top:14px">50</div>
    <div style="font:12px Georgia,serif;letter-spacing:5px;color:#B8860B;margin-top:2px">YEARS &amp; BEYOND</div>
    <div style="font:700 26px Georgia,serif;color:#8B6914;margin-top:16px;line-height:1.2">SoilBuild 50<br/>Years &amp; Beyond</div>
    <div style="height:1px;background:#B8860B;opacity:.4;width:120px;margin:18px auto"></div>
  </td></tr>

  <tr><td style="padding:0 34px">
    <p style="font:15px Helvetica,Arial,sans-serif;color:#2E2A24;margin:0 0 6px">Dear <strong>${esc(name)}</strong>,</p>
    <p style="font:14px Helvetica,Arial,sans-serif;color:#4A443C;line-height:1.6;margin:0 0 20px">
      Your attendance is confirmed. We look forward to celebrating this milestone with you.
    </p>
  </td></tr>

  <tr><td style="padding:0 34px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFDF7;border:1px solid rgba(184,134,11,0.45);border-radius:10px;padding:6px 18px">
      ${row("Registration ID", uniqueId)}
      ${row("Date", date)}
      ${row("Time", time)}
      ${row("Venue", venue)}
      ${row("Table", tableName)}
      ${row("Pax", pax)}
      ${row("Dietary", dietary)}
      ${row("Allergies", allergies)}
      ${row("Attire", dressCode)}
    </table>
  </td></tr>

  <tr><td align="center" style="padding:26px 34px 8px">
    <div style="font:11px Helvetica,Arial,sans-serif;letter-spacing:3px;color:#8A7F6E;text-transform:uppercase;margin-bottom:12px">Entry QR Code</div>
    <img src="${qrUrl}" width="220" height="220" alt="Entry QR ${esc(uniqueId)}" style="display:block;border:8px solid #fff;border-radius:10px;box-shadow:0 4px 14px rgba(92,61,30,0.14)"/>
    <div style="font:12px Helvetica,Arial,sans-serif;color:#6B6154;margin-top:12px">Please present this QR code at the entrance.</div>
    <div style="font:700 18px 'Courier New',monospace;color:#B8860B;letter-spacing:4px;margin-top:6px">${esc(uniqueId)}</div>
  </td></tr>

  <tr><td align="center" style="padding:24px 34px 30px">
    <div style="height:1px;background:#B8860B;opacity:.3;width:100%;margin-bottom:16px"></div>
    <div style="font:11px Helvetica,Arial,sans-serif;color:#8A7F6E">SoilBuild Group Holdings Ltd &middot; ${esc(title || "Annual Dinner")} ${esc(year || "2026")}</div>
  </td></tr>

</table>
</td></tr></table></body></html>`;

  const text = [
    `Dear ${name},`, ``,
    `Your attendance is confirmed.`, ``,
    `Registration ID: ${uniqueId || ""}`,
    `Date : ${date || ""}`,
    `Time : ${time || ""}`,
    `Venue: ${venue || ""}`,
    `Table: ${tableName || "To be assigned"}`,
    `Pax  : ${pax || 1}`,
    `Dietary: ${dietary || "-"}`, ``,
    `Please present your QR code at the entrance.`, ``,
    `SoilBuild Group Holdings Ltd`,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: emailSubject, html, text: body || text }),
    });
    const raw = await response.text();
    let data = {}; try { data = JSON.parse(raw); } catch (e) { data = { raw }; }
    if (response.ok && data.id) return res.status(200).json({ ok:true, id:data.id, to });
    console.error("Resend error:", response.status, raw);
    return res.status(200).json({ ok:false, error: data.message || `Resend error ${response.status}` });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ ok:false, error:String(error) });
  }
}

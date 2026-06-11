
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { to, contentVariables } = req.body;
  const sid   = "AC9279029bf0d6a18b0816666f87114b3e";
  const token = process.env.TWILIO_AUTH_TOKEN; // set in Vercel env settings
  const params = new URLSearchParams();
  params.append("To", "whatsapp:" + String(to).replace(/^whatsapp:/, ""));
  params.append("From", "whatsapp:+14155238886");
  params.append("ContentSid", "HXb5b62575e6e4ff6129ad7c8efe1f983e");
  params.append("ContentVariables", JSON.stringify(contentVariables || {}));
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
    },
    body: params,
  });
  const data = await r.json();
  if (data.sid) return res.status(200).json({ success: true, sid: data.sid });
  return res.status(400).json({ success: false, error: data.message });
}

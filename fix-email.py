import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

st=s.index('async function sendConfirmationEmail(')
j=s.index('{',s.index(')',st)); d=0; k=j
while True:
    if s[k]=='{': d+=1
    elif s[k]=='}':
        d-=1
        if d==0: break
    k+=1

NEW = '''async function sendConfirmationEmail({ to, name, uniqueId, tableName, pax, dietary, allergies, eventInfo, guestId }) {
  try {
    if (!to) return { success:false, error:"no_email" };
    const qrData = `${uniqueId}|${name}|${pax||1}|${guestId||""}`;
    const r = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to, name, uniqueId, tableName, pax: pax||1, dietary, allergies, qrData,
        date: eventInfo.date, time: eventInfo.time, venue: eventInfo.venue,
        dressCode: eventInfo.dressCode, title: eventInfo.title, year: eventInfo.year,
      }),
    });
    const d = await r.json();
    return d.ok ? { success:true, to } : { success:false, error:d.error||"failed", to };
  } catch (e) { return { success:false, error:String(e), to }; }
}'''
s=s[:st]+NEW+s[k+1:]

n=s.count('allergies:guest.allergies, eventInfo })')
s=s.replace('allergies:guest.allergies, eventInfo })','allergies:guest.allergies, eventInfo, guestId:guest.id })')
io.open(p,'w',encoding='utf-8').write(s)
print("OK  client -> /api/send-email  (guestId passed in %d places)"%n)

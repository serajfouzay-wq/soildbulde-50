import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]
def rep(old,new,label,count=1):
    global s,ok
    n=s.count(old)
    if n: s=s.replace(old,new,count if count else n); ok+=1; print("  OK   %s (%d)"%(label,n))
    else: miss.append(label); print("  MISS "+label)

# 1) tiny bus so the form can report the send result to the card
rep('function SoilbuildLogo(',
    'const emailBus = { cb: null };\nfunction SoilbuildLogo(', "email bus")

# 2) forms report success/failure
rep('allergies:guest.allergies, eventInfo }).then(r => {',
    'allergies:guest.allergies, eventInfo }).then(r => { emailBus.cb && emailBus.cb(r.success?"sent":"failed", guest.email);',
    "form emits result", count=0)
rep('    if (guest.email) {',
    '    if (!guest.email && emailBus.cb) emailBus.cb("none","");\n    if (guest.email) {',
    "no-email case", count=0)

# 3) status state in RSVPPage
rep('  const [confirmed, setConfirmed] = useState(null);',
'''  const [confirmed, setConfirmed] = useState(null);
  const [emailStatus, setEmailStatus] = useState({ state:"sending", to:"" });
  useEffect(() => {
    emailBus.cb = (state, to) => setEmailStatus({ state, to:to||"" });
    return () => { emailBus.cb = null; };
  }, []);''', "status state")

rep('const reset = () => { setStep("choose"); setConfirmed(null); };',
    'const reset = () => { setStep("choose"); setConfirmed(null); setEmailStatus({ state:"sending", to:"" }); };',
    "reset clears status")

# 4) logo -> 50 + gold-masked SoilBuild (same as home)
PU='${process.env.PUBLIC_URL||""}'
rep('<div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><SoilbuildLogo size={44} dark /></div>',
'''<div style={{ marginBottom:12, display:"flex", flexDirection:"column", alignItems:"center" }}>
              <img src={`'''+PU+'''/img-fifty.png`} alt="50 Years & Beyond" style={{ height:84, width:"auto", display:"block" }} />
              <div aria-label="SoilBuild" style={{ height:24, width:148, marginTop:6,
                background:"linear-gradient(180deg,#D4AF37 0%,#B8860B 52%,#8B6914 100%)",
                WebkitMaskImage:`url('''+PU+'''/img-sb-logo.png)`, maskImage:`url('''+PU+'''/img-sb-logo.png)`,
                WebkitMaskRepeat:"no-repeat", maskRepeat:"no-repeat",
                WebkitMaskPosition:"center", maskPosition:"center",
                WebkitMaskSize:"contain", maskSize:"contain" }} />
            </div>''', "card logo")

# 5) email status line under the QR
rep('letterSpacing:2, textTransform:"uppercase" }}>Present at entrance</p>',
'''letterSpacing:2, textTransform:"uppercase" }}>Present at entrance</p>
              <div style={{ marginTop:14, width:"100%", maxWidth:340, padding:"10px 14px", borderRadius:10, boxSizing:"border-box",
                background: emailStatus.state==="sent" ? "rgba(34,197,94,0.10)" : emailStatus.state==="failed"||emailStatus.state==="none" ? "rgba(193,39,45,0.09)" : "rgba(184,134,11,0.08)",
                border: `1px solid ${emailStatus.state==="sent" ? "rgba(34,197,94,0.45)" : emailStatus.state==="failed"||emailStatus.state==="none" ? "rgba(193,39,45,0.4)" : "rgba(184,134,11,0.35)"}` }}>
                <div style={{ fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:12, fontWeight:600, lineHeight:1.45,
                  color: emailStatus.state==="sent" ? "#15803D" : emailStatus.state==="failed"||emailStatus.state==="none" ? "#B0202A" : "#8B6914" }}>
                  {emailStatus.state==="sent"    && `\\u2713 Confirmation email sent${emailStatus.to ? " to "+emailStatus.to : ""}`}
                  {emailStatus.state==="failed"  && "\\u26A0 Email could not be sent \\u2014 please screenshot this page"}
                  {emailStatus.state==="none"    && "\\u26A0 No email address given \\u2014 please screenshot this page"}
                  {emailStatus.state==="sending" && "Sending confirmation email\\u2026"}
                </div>
              </div>''', "status line")

# 6) card theme: dark -> champagne, matching home
a=s.index('<div id="rsvp-card-print"')
b=s.index('<div style={{ display:"flex", gap:12, marginTop:20, flexWrap:"wrap"', a)
c=s[a:b]
for o,n in [
 ('linear-gradient(135deg, ${T.dark} 0%, ${T.inkDark} 100%)','linear-gradient(160deg, #FCF8F0 0%, #F5EFE3 55%, #EFE6D4 100%)'),
 ('rgba(212,175,55,0.4)`','rgba(184,134,11,0.55)`'),
 ('boxShadow:"0 32px 80px rgba(0,0,0,0.2)"','boxShadow:"0 24px 60px rgba(92,61,30,0.16)"'),
 ('rgba(212,175,55,0.05)','rgba(184,134,11,0.06)'),
 ('rgba(245,240,232,0.85)','#3F3A34'),
 ('rgba(245,240,232,0.8)','#3F3A34'),
 ('rgba(245,240,232,0.55)','#6B6154'),
 ('rgba(245,240,232,0.4)','#8A7F6E'),
 ('rgba(245,240,232,0.35)','#8A7F6E'),
 ('rgba(245,240,232,0.25)','#9A8F7E'),
 ('color:"#F5F0E8"','color:"#2E2A24"'),
 ('rgba(212,175,55,0.08)','rgba(184,134,11,0.07)'),
 ('rgba(212,175,55,0.25)','rgba(184,134,11,0.3)'),
 ('rgba(212,175,55,0.15)','rgba(184,134,11,0.14)'),
 ('color:T.yellow','color:"#B8860B"'),
 ('background:T.yellow','background:"#B8860B"'),
]:
    c=c.replace(o,n)
s=s[:a]+c+s[b:]
print("  OK   card theme -> champagne gold")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))

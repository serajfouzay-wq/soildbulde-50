import io, sys
p = 'src/App.jsx'
s = io.open(p, encoding='utf-8').read()
io.open(p + '.bak', 'w', encoding='utf-8').write(s)

start = s.index('function HomePage(')
i = s.index('(', start); d = 0
while True:
    if s[i] == '(': d += 1
    elif s[i] == ')':
        d -= 1
        if d == 0: break
    i += 1
j = s.index('{', i); d = 0; k = j
while True:
    if s[k] == '{': d += 1
    elif s[k] == '}':
        d -= 1
        if d == 0: break
    k += 1
end = k + 1

NEW = r'''function HomePage({ setPage, eventInfo, autoRole }) {
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [wide, setWide] = useState(typeof window !== "undefined" && window.innerWidth > 900);
  useEffect(() => {
    const onR = () => setWide(window.innerWidth > 900);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  useEffect(() => {
    if (autoRole && !autoTriggered) { setAutoTriggered(true); setPage("rsvp"); }
  }, [autoRole]);

  const P = process.env.PUBLIC_URL || "";
  const GOLD = "#B8860B", GOLD_L = "#D4AF37", GOLD_D = "#8B6914";

  return (
    <div style={{ minHeight:"100vh", width:"100%",
      backgroundImage:`url(${P}/${wide ? "bg-home.png" : "bg-home-p.png"})`,
      backgroundSize:"cover", backgroundPosition:"center", backgroundRepeat:"no-repeat",
      backgroundColor:"#F7F0E4", display:"flex", alignItems:"center", justifyContent:"center",
      padding:"clamp(28px,7vw,70px) clamp(18px,6vw,52px)" }}>

      <div style={{ width:"100%", maxWidth:600, textAlign:"center", animation:"fadeInUp 0.9s ease-out both" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:8 }}>
          <div style={{ height:1, flex:1, maxWidth:64, background:`linear-gradient(90deg,transparent,${GOLD})` }} />
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(12px,2.3vw,19px)", letterSpacing:"0.34em", color:GOLD }}>YOU'RE INVITED</div>
          <div style={{ height:1, flex:1, maxWidth:64, background:`linear-gradient(90deg,${GOLD},transparent)` }} />
        </div>
        <div style={{ color:GOLD, fontSize:11, marginBottom:6 }}>&#10022;</div>

        <img src={`${P}/img-fifty.png`} alt="50" style={{ width:"min(280px,52vw)", display:"block", margin:"0 auto" }} />

        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(13px,2.7vw,23px)", letterSpacing:"0.26em", color:GOLD, margin:"2px 0 18px" }}>YEARS &amp; BEYOND</div>

        <img src={`${P}/img-sb-logo.png`} alt="SoilBuild" style={{ width:"min(225px,44vw)", display:"block", margin:"0 auto 20px" }} />

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"clamp(33px,7.4vw,60px)", lineHeight:1.08, margin:"0 0 14px",
          background:`linear-gradient(180deg,${GOLD_L} 0%,${GOLD} 52%,${GOLD_D} 100%)`,
          WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          SoilBuild 50<br />Years &amp; Beyond
        </h1>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:14 }}>
          <div style={{ height:1, width:"22%", background:`linear-gradient(90deg,transparent,${GOLD})` }} />
          <span style={{ color:GOLD, fontSize:10 }}>&#10022;</span>
          <div style={{ height:1, width:"22%", background:`linear-gradient(90deg,${GOLD},transparent)` }} />
        </div>

        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(13px,2.2vw,17px)", lineHeight:1.6, color:"#3F3A34", margin:"0 auto 26px", maxWidth:420 }}>
          Join us as we celebrate a remarkable milestone and look ahead to the future.
        </p>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:10 }}>
          <div style={{ height:1, width:"16%", background:GOLD, opacity:0.5 }} />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(11px,2vw,15px)", letterSpacing:"0.26em", color:GOLD }}>EVENT DETAILS</span>
          <div style={{ height:1, width:"16%", background:GOLD, opacity:0.5 }} />
        </div>

        <div style={{ border:`1px solid ${GOLD}`, borderRadius:4, padding:"6px 16px", margin:"0 auto 24px", maxWidth:450, background:"rgba(255,252,244,0.4)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 6px", borderBottom:"1px solid rgba(184,134,11,0.25)" }}>
            <span style={{ fontSize:19 }}>&#128197;</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(14px,2.4vw,18px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.date}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 6px" }}>
            <span style={{ fontSize:19 }}>&#128205;</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(14px,2.4vw,18px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.venue}</span>
          </div>
        </div>

        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(12px,2vw,15px)", color:"#4A443C", marginBottom:14 }}>
          Kindly confirm your attendance.
        </div>

        <button onClick={() => setPage("rsvp")}
          style={{ width:"min(410px,90%)", padding:"16px 24px", border:`1px solid ${GOLD_L}`, borderRadius:8,
            background:`linear-gradient(180deg,${GOLD_L} 0%,${GOLD} 55%,${GOLD_D} 100%)`, color:"#FFFAEE",
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"clamp(15px,2.6vw,20px)",
            letterSpacing:"0.14em", cursor:"pointer", boxShadow:"0 8px 24px rgba(184,134,11,0.35)", transition:"transform .2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          RSVP NOW
        </button>

        <div style={{ marginTop:16, fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:"clamp(11px,1.9vw,14px)", color:"#6B6154" }}>
          Further event details will be shared soon.
        </div>
      </div>
    </div>
  );
}'''

s = s[:start] + NEW + s[end:]
io.open(p, 'w', encoding='utf-8').write(s)
print("OK  HomePage replaced. backup: src/App.jsx.bak")

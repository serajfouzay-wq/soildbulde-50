import io
p='src/App.jsx'
s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

# --- 1. hide Nav on home ---
if '{showNav && <Nav' in s:
    s=s.replace('{showNav && <Nav','{showNav && page!=="home" && <Nav',1)
    print("OK  Nav hidden on home")
else:
    print("!!  Nav line not found - check manually")

# --- 2. replace HomePage ---
start=s.index('function HomePage(')
i=s.index('(',start); d=0
while True:
    if s[i]=='(': d+=1
    elif s[i]==')':
        d-=1
        if d==0: break
    i+=1
j=s.index('{',i); d=0; k=j
while True:
    if s[k]=='{': d+=1
    elif s[k]=='}':
        d-=1
        if d==0: break
    k+=1
end=k+1

NEW=r'''function HomePage({ setPage, eventInfo, autoRole }) {
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
  const blend = { mixBlendMode: "multiply" };

  return (
    <div style={{ height:"100vh", width:"100%", overflow:"hidden", boxSizing:"border-box",
      backgroundImage:`url(${P}/${wide ? "bg-home.png" : "bg-home-p.png"})`,
      backgroundSize:"cover", backgroundPosition:"center", backgroundRepeat:"no-repeat",
      backgroundColor:"#F7F0E4", display:"flex", alignItems:"center", justifyContent:"center",
      padding:"2vh 5vw" }}>

      <div style={{ width:"100%", maxWidth:560, textAlign:"center", animation:"fadeInUp 0.9s ease-out both" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
          <div style={{ height:1, flex:1, maxWidth:56, background:`linear-gradient(90deg,transparent,${GOLD})` }} />
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(10px,1.9vh,17px)", letterSpacing:"0.32em", color:GOLD }}>YOU'RE INVITED</div>
          <div style={{ height:1, flex:1, maxWidth:56, background:`linear-gradient(90deg,${GOLD},transparent)` }} />
        </div>

        <img src={`${P}/img-fifty.png`} alt="50 Years & Beyond"
          style={{ ...blend, height:"min(30vh,240px)", width:"auto", maxWidth:"78%", display:"block", margin:"0.6vh auto 0" }} />

        <img src={`${P}/img-sb-logo.png`} alt="SoilBuild"
          style={{ ...blend, height:"min(6.5vh,52px)", width:"auto", display:"block", margin:"0 auto 1.4vh" }} />

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"clamp(26px,5.4vh,54px)", lineHeight:1.06, margin:"0 0 1vh",
          background:`linear-gradient(180deg,${GOLD_L} 0%,${GOLD} 52%,${GOLD_D} 100%)`,
          WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          SoilBuild 50<br />Years &amp; Beyond
        </h1>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:"1.2vh" }}>
          <div style={{ height:1, width:"20%", background:`linear-gradient(90deg,transparent,${GOLD})` }} />
          <span style={{ color:GOLD, fontSize:9 }}>&#10022;</span>
          <div style={{ height:1, width:"20%", background:`linear-gradient(90deg,${GOLD},transparent)` }} />
        </div>

        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(12px,1.9vh,16px)", lineHeight:1.55, color:"#3F3A34", margin:"0 auto 2vh", maxWidth:400 }}>
          Join us as we celebrate a remarkable milestone and look ahead to the future.
        </p>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:"0.9vh" }}>
          <div style={{ height:1, width:"15%", background:GOLD, opacity:0.5 }} />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(10px,1.7vh,14px)", letterSpacing:"0.24em", color:GOLD }}>EVENT DETAILS</span>
          <div style={{ height:1, width:"15%", background:GOLD, opacity:0.5 }} />
        </div>

        <div style={{ border:`1px solid ${GOLD}`, borderRadius:4, padding:"0 14px", margin:"0 auto 1.8vh", maxWidth:420, background:"rgba(255,252,244,0.45)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"1.2vh 4px", borderBottom:"1px solid rgba(184,134,11,0.25)" }}>
            <span style={{ fontSize:"clamp(14px,2vh,18px)" }}>&#128197;</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(13px,2vh,17px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.date}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"1.2vh 4px" }}>
            <span style={{ fontSize:"clamp(14px,2vh,18px)" }}>&#128205;</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(13px,2vh,17px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.venue}</span>
          </div>
        </div>

        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(11px,1.7vh,14px)", color:"#4A443C", marginBottom:"1.1vh" }}>
          Kindly confirm your attendance.
        </div>

        <button onClick={() => setPage("rsvp")}
          style={{ width:"min(390px,88%)", padding:"clamp(11px,1.9vh,17px) 20px", border:`1px solid ${GOLD_L}`, borderRadius:8,
            background:`linear-gradient(180deg,${GOLD_L} 0%,${GOLD} 55%,${GOLD_D} 100%)`, color:"#FFFAEE",
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"clamp(14px,2.2vh,19px)",
            letterSpacing:"0.13em", cursor:"pointer", boxShadow:"0 8px 24px rgba(184,134,11,0.35)", transition:"transform .2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          RSVP NOW
        </button>

        <div style={{ marginTop:"1.2vh", fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:"clamp(10px,1.6vh,13px)", color:"#6B6154" }}>
          Further event details will be shared soon.
        </div>
      </div>
    </div>
  );
}'''

s=s[:start]+NEW+s[end:]
io.open(p,'w',encoding='utf-8').write(s)
print("OK  HomePage v2 written. backup: src/App.jsx.bak")

import io,re
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

# 1) remap theme to champagne gold (keys unchanged -> every page shifts)
GOLD_T = '''const T = {
  green: "#B8860B", greenDark: "#8B6914", greenLight: "#D4AF37",
  yellow: "#D4AF37", yellowDark: "#B8860B", yellowLight: "#E8C766",
  dark: "#3F3A34", darkGreen: "#6B5A3E",
  white: "#FFFFFF", charcoal: "#2E2A24",
  red: "#C1272D", gray: "#6B6154",
  grayLight: "#F7F2E8", border: "#E3D7C0",
  beige: "#F5EFE3", beigeLight: "#FCF8F0", beigeDark: "#DDCDB0",
  inkDark: "#2E2A24", inkMid: "#6B5A3E",
};'''
a=s.index('const T = {'); b=s.index('};',a)+2
s=s[:a]+GOLD_T+s[b:]; print("OK  theme -> gold")

# 2) kill nav bar on every page
s=re.sub(r'\{showNav && [^\n]*?<Nav ', '{false && <Nav ', s, count=1)
print("OK  nav removed everywhere")

# 3) hidden hash routes so admin is still reachable
anch='if (window.location.hash==="#audience") setPage("draw-audience");'
s=s.replace(anch, anch+'''
    if (window.location.hash==="#admin")    { setPendingPage("admin"); setPage("login"); }
    if (window.location.hash==="#checkin")  { setPendingPage("qr-scanner"); setPage("login"); }
    if (window.location.hash==="#helpdesk") setPage("helpdesk");''',1)
print("OK  hash routes: #admin  #checkin  #helpdesk  #audience")

# 4) HomePage with ornate double frame
st=s.index('function HomePage('); i=s.index('(',st); d=0
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
  const G = "#B8860B", GL = "#D4AF37", GD = "#8B6914";
  const dia = <span style={{ color:G, fontSize:"0.7em", verticalAlign:"middle" }}>&#10022;</span>;

  return (
    <div style={{ height:"100vh", width:"100%", overflow:"hidden", boxSizing:"border-box",
      backgroundImage:`url(${P}/${wide ? "bg-home.png" : "bg-home-p.png"})`,
      backgroundSize:"cover", backgroundPosition:"center", backgroundColor:"#F7F0E4",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"2.5vh 4vw" }}>

      <div style={{ position:"relative", width:"100%", maxWidth:600, height:"95vh", boxSizing:"border-box",
        border:`1.5px solid ${G}`, padding:"clamp(14px,2.6vh,30px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        animation:"fadeInUp 0.9s ease-out both" }}>
        <div style={{ position:"absolute", inset:7, border:`1px solid ${G}`, opacity:0.5, pointerEvents:"none" }} />

        <div style={{ width:"100%", textAlign:"center" }}>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
            <div style={{ height:1, flex:1, maxWidth:60, background:`linear-gradient(90deg,transparent,${G})` }} />
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(10px,1.9vh,17px)", letterSpacing:"0.32em", color:G }}>YOU'RE INVITED</div>
            <div style={{ height:1, flex:1, maxWidth:60, background:`linear-gradient(90deg,${G},transparent)` }} />
          </div>
          <div style={{ marginTop:2 }}>{dia}</div>

          <img src={`${P}/img-fifty.png`} alt="50 Years & Beyond"
            style={{ height:"min(29vh,236px)", width:"auto", maxWidth:"76%", display:"block", margin:"0.4vh auto 0.8vh" }} />

          <img src={`${P}/img-sb-logo.png`} alt="SoilBuild"
            style={{ height:"min(6vh,48px)", width:"auto", display:"block", margin:"0 auto 1.4vh" }} />

          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"clamp(26px,5.3vh,54px)", lineHeight:1.06, margin:"0 0 0.8vh",
            background:`linear-gradient(180deg,${GL} 0%,${G} 52%,${GD} 100%)`,
            WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            SoilBuild 50<br />Years &amp; Beyond
          </h1>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:"1.2vh" }}>
            <div style={{ height:1, width:"26%", background:`linear-gradient(90deg,transparent,${G})` }} />
            {dia}
            <div style={{ height:1, width:"26%", background:`linear-gradient(90deg,${G},transparent)` }} />
          </div>

          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(12px,1.9vh,16px)", lineHeight:1.55, color:"#3F3A34", margin:"0 auto 1.9vh", maxWidth:400 }}>
            Join us as we celebrate a remarkable milestone and look ahead to the future.
          </p>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:9, marginBottom:"0.9vh" }}>
            <div style={{ height:1, width:"14%", background:G, opacity:0.5 }} />
            {dia}
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(10px,1.7vh,14px)", letterSpacing:"0.24em", color:G }}>EVENT DETAILS</span>
            {dia}
            <div style={{ height:1, width:"14%", background:G, opacity:0.5 }} />
          </div>

          <div style={{ position:"relative", border:`1px solid ${G}`, borderRadius:2, padding:"0 16px", margin:"0 auto 1.7vh", maxWidth:430, background:"rgba(255,252,244,0.35)" }}>
            <div style={{ position:"absolute", inset:4, border:`1px solid ${G}`, opacity:0.35, pointerEvents:"none" }} />
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"1.25vh 6px", borderBottom:`1px solid rgba(184,134,11,0.28)` }}>
              <span style={{ fontSize:"clamp(14px,2vh,18px)" }}>&#128197;</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(13px,2vh,17px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.date}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"1.25vh 6px" }}>
              <span style={{ fontSize:"clamp(14px,2vh,18px)" }}>&#128205;</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(13px,2vh,17px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.venue}</span>
            </div>
          </div>

          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(11px,1.7vh,14px)", color:"#4A443C", marginBottom:"1.1vh" }}>
            Kindly confirm your attendance.
          </div>

          <button onClick={() => setPage("rsvp")}
            style={{ width:"min(400px,86%)", padding:"clamp(11px,1.9vh,17px) 20px", border:`1.5px solid ${GL}`, borderRadius:10,
              background:`linear-gradient(180deg,${GL} 0%,${G} 55%,${GD} 100%)`, color:"#FFFAEE",
              fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"clamp(14px,2.2vh,19px)",
              letterSpacing:"0.13em", cursor:"pointer",
              boxShadow:`0 6px 20px rgba(184,134,11,0.38), inset 0 1px 0 rgba(255,255,255,0.45)`, transition:"transform .2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            RSVP NOW
          </button>

          <div style={{ marginTop:"1.1vh", fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:"clamp(10px,1.6vh,13px)", color:"#6B6154" }}>
            Further event details will be shared soon.
          </div>
        </div>
      </div>
    </div>
  );
}'''

s=s[:st]+NEW+s[k+1:]
io.open(p,'w',encoding='utf-8').write(s)
print("OK  HomePage v3 (framed)")

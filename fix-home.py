import io,re
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

# --- font: add Poppins ---
s2=re.sub(r'(fonts\.googleapis\.com/css2\?)', r'\1family=Poppins:wght@300;400;500;600;700&', s, count=1)
if s2!=s: s=s2; print("OK  Poppins imported")
else: print("!!  google fonts url not found - font unchanged")
s=s.replace("'DM Sans',sans-serif", "'Poppins','DM Sans',sans-serif")
print("OK  body font -> Poppins")

# --- logo: filter -> gold mask ---
OLD_LOGO = '''<img src={`${P}/img-sb-logo.png`} alt="SoilBuild"
            style={{ height:"min(4.6vh,38px)", width:"auto", display:"block", margin:"0 auto 1.1vh", filter:"sepia(1) saturate(2.6) hue-rotate(-12deg) brightness(1.05)" }} />'''
NEW_LOGO = '''<div aria-label="SoilBuild" style={{ height:"min(4.8vh,40px)", width:"min(230px,50%)", margin:"0 auto 1.1vh",
            background:`linear-gradient(180deg,${GL} 0%,${G} 52%,${GD} 100%)`,
            WebkitMaskImage:`url(${P}/img-sb-logo.png)`, maskImage:`url(${P}/img-sb-logo.png)`,
            WebkitMaskRepeat:"no-repeat", maskRepeat:"no-repeat",
            WebkitMaskPosition:"center", maskPosition:"center",
            WebkitMaskSize:"contain", maskSize:"contain" }} />'''
if OLD_LOGO in s: s=s.replace(OLD_LOGO,NEW_LOGO,1); print("OK  logo -> gold mask")
else: print("!!  logo block not matched")

# --- event box: CSS box + label -> PNG frame with live text ---
a=s.index('<div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:9, marginBottom:"0.9vh" }}>')
b=s.index('<div style={{ fontFamily:"\'Poppins\',\'DM Sans\',sans-serif", fontSize:"clamp(11px,1.7vh,14px)", color:"#4A443C"', a)
NEW_BOX = '''<div style={{ position:"relative", width:"min(470px,96%)", margin:"0 auto 1.5vh" }}>
            <img src={`${P}/img-eventbox.png`} alt="" style={{ width:"100%", display:"block" }} />
            <div style={{ position:"absolute", left:"27%", top:"41%", transform:"translateY(-50%)", textAlign:"left",
              fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:"clamp(11px,1.85vh,16px)", color:"#2E2A24", fontWeight:500, whiteSpace:"nowrap" }}>
              {eventInfo.date}
            </div>
            <div style={{ position:"absolute", left:"27%", top:"73%", transform:"translateY(-50%)", textAlign:"left",
              fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:"clamp(11px,1.85vh,16px)", color:"#2E2A24", fontWeight:500, whiteSpace:"nowrap" }}>
              {eventInfo.venue}
            </div>
          </div>

          '''
s=s[:a]+NEW_BOX+s[b:]
io.open(p,'w',encoding='utf-8').write(s)
print("OK  event box -> PNG frame + live text")

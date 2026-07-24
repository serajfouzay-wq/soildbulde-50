import io,re
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]
def rep(old,new,label):
    global s,ok
    if old in s: s=s.replace(old,new,1); ok+=1; print("  OK   "+label)
    else: miss.append(label); print("  MISS "+label)

# 1) card logo: mask -> plain img (PDF-safe)
a=s.find('<div aria-label="SoilBuild" style={{ height:24, width:148, marginTop:6,')
if a>0:
    b=s.index('maskSize:"contain" }} />',a)+len('maskSize:"contain" }} />')
    s=s[:a]+'<img src={`${process.env.PUBLIC_URL||""}/img-sb-logo.png`} alt="SoilBuild" style={{ height:26, width:"auto", marginTop:6, display:"block" }} />'+s[b:]
    ok+=1; print("  OK   card logo -> plain img (PDF safe)")
else:
    miss.append("card logo"); print("  MISS card logo")

# 2) hash navigation works any time, not just on load
rep('''    if (window.location.hash==="#admin")    { setPendingPage("admin"); setPage("login"); }''',
'''    const routeHash = () => {
      const h = window.location.hash;
      if (h==="#audience") setPage("draw-audience");
      else if (h==="#admin")    { setPendingPage("admin"); setPage(adminLoggedIn?"admin":"login"); }
      else if (h==="#checkin")  { setPendingPage("qr-scanner"); setPage(adminLoggedIn?"qr-scanner":"login"); }
      else if (h==="#helpdesk") setPage("helpdesk");
      else if (h==="#home" || h==="") setPage("home");
    };
    window.addEventListener("hashchange", routeHash);
    window.__routeHash = routeHash;
    if (window.location.hash==="#admin")    { setPendingPage("admin"); setPage("login"); }''',
    "hashchange listener")

# 3) small floating access button (not the old nav bar)
rep('      {showNav && page!=="home" && {false && <Nav ',
    '      {false && page!=="home" && {false && <Nav ', "nav stays off")

rep('''      {page==="home"         && <HomePage    setPage={navSetPage}''',
'''      {(page==="home"||page==="rsvp"||page==="helpdesk") && (
        <div style={{ position:"fixed", top:12, right:12, zIndex:9999, display:"flex", gap:7 }}>
          {[["Helpdesk","helpdesk"],["Check-In","qr-scanner"],["Admin","admin"]].map(([lbl,pg])=>(
            <button key={pg} onClick={()=>navSetPage(pg)}
              style={{ background:"rgba(255,252,244,0.82)", color:"#8B6914", border:"1px solid rgba(184,134,11,0.45)",
                borderRadius:20, padding:"6px 14px", fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:11,
                fontWeight:600, cursor:"pointer", backdropFilter:"blur(6px)", boxShadow:"0 2px 8px rgba(92,61,30,0.12)" }}>
              {lbl}
            </button>
          ))}
        </div>
      )}
      {page==="home"         && <HomePage    setPage={navSetPage}''',
    "floating access pills")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))

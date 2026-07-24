import io,re
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]
def rep(o,n,l):
    global s,ok
    if o in s: s=s.replace(o,n,1); ok+=1; print("  OK   "+l)
    else: miss.append(l); print("  MISS "+l)

# 1) gear -> invisible 5-tap, no counter, no hint
a=s.index('function StaffAccess({ go }) {'); b=s.index('function validSession(')
s=s[:a]+'''function StaffAccess({ go }) {
  const [shown, setShown] = useState(false);
  const taps = useRef([]); const hideRef = useRef(null);
  const hit = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter(t => now - t < 3000), now];
    if (taps.current.length >= 5) {
      taps.current = []; setShown(true);
      clearTimeout(hideRef.current);
      hideRef.current = setTimeout(() => setShown(false), 25000);
    }
  };
  useEffect(() => () => clearTimeout(hideRef.current), []);
  return (
    <>
      <div onClick={hit} onTouchStart={hit}
        style={{ position:"fixed", bottom:0, right:0, width:90, height:90, zIndex:9998,
          background:"transparent", WebkitTapHighlightColor:"transparent" }} />
      {shown && (
        <div style={{ position:"fixed", bottom:16, right:16, zIndex:9999, display:"flex", gap:7, alignItems:"center" }}>
          {[["Helpdesk","helpdesk"],["Check-In","qr-scanner"],["Admin","admin"]].map(([lbl,pg])=>(
            <button key={pg} onClick={()=>{ setShown(false); go(pg); }}
              style={{ background:"rgba(255,252,244,0.96)", color:"#8B6914", border:"1px solid rgba(184,134,11,0.55)",
                borderRadius:20, padding:"9px 16px", fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:12,
                fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(92,61,30,0.2)" }}>{lbl}</button>
          ))}
        </div>
      )}
    </>
  );
}
'''+s[b:]
ok+=1; print("  OK   invisible 5-tap restored")

# 2) remove password hint block
i=s.find('Demo:')
if i>0:
    st=s.rfind('<div',0,i); d=0; j=st
    while j<len(s):
        if s.startswith('<div',j): d+=1
        elif s.startswith('</div>',j):
            d-=1
            if d==0: j+=6; break
        j+=1
    s=s[:st]+s[j:]; ok+=1; print("  OK   password hint removed")
else: miss.append("password hint"); print("  MISS password hint")

# 3) PDF wash: solid bg, no circle, no animation on print element
rep('linear-gradient(160deg, #FCF8F0 0%, #F5EFE3 55%, #EFE6D4 100%)','#FDFAF3',"card solid bg")
rep(', position:"relative", overflow:"hidden", animation:"cardReveal 0.8s ease-out" }}',', position:"relative", overflow:"hidden" }}',"no capture animation")
c=re.sub(r'\n\s*<div style=\{\{ position:"absolute", top:-50, right:-50[^\n]*?/>','',s)
if c!=s: s=c; ok+=1; print("  OK   decorative circle removed")
else: print("  MISS decorative circle")
rep('background:"rgba(184,134,11,0.07)"','background:"#FFFDF7"',"details box solid")

# 4) stale draw state -> idle
rep('SUPA.from("draw_state").select("*").eq("id",1).single().then(({data})=>{ if(data) setDs(p=>({...p,...data})); });',
'''SUPA.from("draw_state").select("*").eq("id",1).single().then(({data})=>{
      if(!data) return;
      const age = data.ts ? (Date.now() - new Date(data.ts).getTime()) : Infinity;
      if (age > 900000) { setDs({ active:false, spinning:false, winners:[], countdown:null, revealedCount:0, spinDisplay:"SE000" }); return; }
      setDs(p=>({...p,...data}));
    });''', "stale draw state ignored")

# 5) global back button
rep('{(page==="home"||page==="rsvp"||page==="invitation") && <StaffAccess go={navSetPage} />}',
'''{(page==="home"||page==="rsvp"||page==="invitation") && <StaffAccess go={navSetPage} />}
      {page!=="home" && page!=="draw-audience" && (
        <button onClick={()=>navSetPage(page==="qr-scanner"||page==="draw-admin" ? "admin" : "home")}
          style={{ position:"fixed", top:14, left:14, zIndex:9999, background:"rgba(255,252,244,0.94)",
            color:"#8B6914", border:"1px solid rgba(184,134,11,0.5)", borderRadius:20, padding:"8px 16px",
            fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer",
            boxShadow:"0 3px 10px rgba(92,61,30,0.15)" }}>&larr; Back</button>
      )}''', "global back button")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))

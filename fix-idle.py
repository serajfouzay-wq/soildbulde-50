import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0

# 1) audience always opens on standby unless a draw is genuinely mid-flight
a=s.find('SUPA.from("draw_state").select("*").eq("id",1)')
if a>0:
    b=s.index('});', s.index('.then(', a))+3
    s=s[:a]+'''SUPA.from("draw_state").select("*").eq("id",1).single().then(({data})=>{
      const idle = { active:false, spinning:false, winners:[], countdown:null, revealedCount:0, spinDisplay:"SE000" };
      if(!data) { setDs(idle); return; }
      const age  = data.ts ? (Date.now() - new Date(data.ts).getTime()) : Infinity;
      const live = (data.spinning || (data.countdown!==null && data.countdown!==undefined)) && age < 90000;
      if (!live) { setDs(idle); return; }
      setDs(p=>({...p,...data}));
    });'''+s[b:]
    ok+=1; print("  OK   audience opens on standby")
else: print("  MISS draw_state fetch")

# 2) sharp gold logo from the full-res PNG
a=s.index('function SoilbuildLogo(')
b=s.index('}', s.index('return (', a))
b=s.index('\n}', a)+2
s=s[:a]+'''function SoilbuildLogo({ size = 60, dark = false }) {
  const src = `${process.env.PUBLIC_URL||""}/img-sb-logo.png`;
  return (
    <div aria-label="SoilBuild" role="img"
      style={{ height:size, width:size*4, display:"block",
        background:"linear-gradient(180deg,#D4AF37 0%,#B8860B 50%,#8B6914 100%)",
        WebkitMaskImage:`url(${src})`, maskImage:`url(${src})`,
        WebkitMaskRepeat:"no-repeat", maskRepeat:"no-repeat",
        WebkitMaskPosition:"center", maskPosition:"center",
        WebkitMaskSize:"contain", maskSize:"contain" }} />
  );
}
'''+s[b:]
ok+=1; print("  OK   logo -> full-res gold mask")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied"%ok)

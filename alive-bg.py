import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]
def rep(old,new,label):
    global s,ok
    if old in s: s=s.replace(old,new,1); ok+=1; print("  OK   "+label)
    else: miss.append(label); print("  MISS "+label)

A='@keyframes waveBreathe{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:0.85;transform:scale(1.045)}}'
rep(A, A + '''
      @keyframes bgKen{0%{transform:scale(1.03) translate(0,0)}100%{transform:scale(1.09) translate(-1.6%,-1.1%)}}
      @keyframes bloomA{0%,100%{opacity:0.16;transform:translate(0,0) scale(1)}50%{opacity:0.44;transform:translate(3%,-2.5%) scale(1.13)}}
      @keyframes streak{0%{transform:translateX(-45%) rotate(9deg);opacity:0}18%{opacity:0.55}78%{opacity:0.55}100%{transform:translateX(150%) rotate(9deg);opacity:0}}
      @keyframes mote{0%{transform:translateY(10vh) scale(0.55);opacity:0}18%{opacity:0.8}100%{transform:translateY(-92vh) scale(1.15);opacity:0}}''',
    "keyframes")

rep('backgroundImage:`url(${P}/${wide ? "bg-home.png" : "bg-home-p.png"})`,\n      ', '', "bg moved off container")
rep('backgroundSize:"cover", backgroundPosition:"center", backgroundColor:"#F7F0E4",',
    'backgroundColor:"#F7F0E4", position:"relative",', "container relative")

rep('<div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>',
'''<div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>

        <div style={{ position:"absolute", inset:"-6%",
          backgroundImage:`url(${P}/${wide ? "bg-home.png" : "bg-home-p.png"})`,
          backgroundSize:"cover", backgroundPosition:"center",
          animation:"bgKen 44s ease-in-out infinite alternate" }} />

        <div style={{ position:"absolute", left:"-10%", bottom:"-14%", width:"62%", height:"70%",
          background:"radial-gradient(circle,rgba(255,252,242,0.8) 0%,rgba(255,250,235,0.3) 42%,transparent 68%)",
          filter:"blur(14px)", animation:"bloomA 13s ease-in-out infinite" }} />
        <div style={{ position:"absolute", right:"-12%", top:"5%", width:"58%", height:"78%",
          background:"radial-gradient(circle,rgba(255,251,238,0.72) 0%,rgba(255,248,228,0.26) 45%,transparent 70%)",
          filter:"blur(16px)", animation:"bloomA 17s ease-in-out 3s infinite" }} />
        <div style={{ position:"absolute", left:"22%", top:"-10%", width:"46%", height:"58%",
          background:"radial-gradient(circle,rgba(255,253,246,0.6) 0%,transparent 66%)",
          filter:"blur(18px)", animation:"bloomA 21s ease-in-out 7s infinite" }} />

        {[0,1,2].map(i=>(
          <div key={"st"+i} style={{ position:"absolute", top:"-20%", left:0, width:"17%", height:"142%",
            background:"linear-gradient(90deg,transparent,rgba(255,247,220,0.6),transparent)",
            filter:"blur(11px)", mixBlendMode:"soft-light",
            animation:`streak ${26+i*9}s linear ${i*8}s infinite` }} />
        ))}

        {Array.from({length:15}).map((_,i)=>{
          const x=(i*47+13)%94, sz=3+((i*13)%7);
          return <div key={"mt"+i} style={{ position:"absolute", left:x+"%", bottom:"-8vh", width:sz, height:sz, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(255,255,255,0.95),rgba(255,240,200,0.4) 58%,transparent 72%)",
            boxShadow:"0 0 11px rgba(255,244,210,0.85)",
            animation:`mote ${22+(i%6)*4}s linear ${(i*1.7)%22}s infinite` }} />;
        })}
''', "living background layers")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))

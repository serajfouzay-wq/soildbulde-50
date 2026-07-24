import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]
def rep(old,new,label):
    global s,ok
    if old in s: s=s.replace(old,new,1); ok+=1; print("  OK   "+label)
    else: miss.append(label); print("  MISS "+label)

# ---- keyframes ----
A='@keyframes haloPulse{0%,100%{opacity:0.25;transform:translate(-50%,-50%) scale(1)}50%{opacity:0.55;transform:translate(-50%,-50%) scale(1.15)}}'
rep(A, A + '''
      @keyframes driftR{0%{transform:translateX(-6%) scale(1.06)}100%{transform:translateX(6%) scale(1.06)}}
      @keyframes driftL{0%{transform:translateX(6%) scale(1.08)}100%{transform:translateX(-6%) scale(1.08)}}
      @keyframes twinkle{0%,100%{opacity:0;transform:scale(0.4)}50%{opacity:1;transform:scale(1.25)}}
      @keyframes rayTurn{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
      @keyframes bokeh{0%{transform:translateY(12vh) scale(0.75);opacity:0}18%{opacity:0.55}82%{opacity:0.45}100%{transform:translateY(-96vh) scale(1.25);opacity:0}}
      @keyframes waveBreathe{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:0.85;transform:scale(1.045)}}''',
    "keyframes")

# ---- HOME living background ----
rep('padding:"2.5vh 4vw" }}>',
'''padding:"2.5vh 4vw" }}>

      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
        <img src={`${P}/img-clouds.png`} alt="" style={{ position:"absolute", bottom:"-4%", left:0, width:"120%", opacity:0.5, animation:"driftR 46s ease-in-out infinite alternate" }} />
        <img src={`${P}/img-clouds.png`} alt="" style={{ position:"absolute", top:"-6%", right:0, width:"105%", opacity:0.32, transform:"scaleY(-1)", animation:"driftL 62s ease-in-out infinite alternate" }} />
        <img src={`${P}/img-wave-l.png`} alt="" style={{ position:"absolute", top:0, left:0, height:"100%", opacity:0.55, animation:"waveBreathe 11s ease-in-out infinite" }} />
        <img src={`${P}/img-wave-r.png`} alt="" style={{ position:"absolute", top:0, right:0, height:"100%", opacity:0.55, animation:"waveBreathe 13s ease-in-out 1.5s infinite" }} />
        <div style={{ position:"absolute", top:"38%", left:"50%", width:"165vmax", height:"165vmax",
          background:"conic-gradient(from 0deg, transparent 0deg, rgba(255,242,205,0.5) 8deg, transparent 17deg, transparent 45deg, rgba(255,238,190,0.38) 53deg, transparent 62deg, transparent 120deg, rgba(255,244,215,0.42) 128deg, transparent 137deg, transparent 200deg, rgba(255,240,200,0.34) 208deg, transparent 217deg, transparent 300deg)",
          mixBlendMode:"soft-light", animation:"rayTurn 110s linear infinite" }} />
        {Array.from({length:26}).map((_,i)=>{
          const x=(i*37+11)%96, y=(i*53+7)%92, sz=2+((i*17)%5);
          return <div key={i} style={{ position:"absolute", left:x+"%", top:y+"%", width:sz, height:sz, borderRadius:"50%",
            background:"#FFF8E2", boxShadow:"0 0 9px 2px rgba(255,240,195,0.95)",
            animation:`twinkle ${2.4+(i%6)*0.45}s ease-in-out ${(i*0.31)%4.5}s infinite` }} />;
        })}
      </div>
''', "home living background")

rep('<div style={{ position:"relative", width:"100%", maxWidth:600, height:"94vh", boxSizing:"border-box",',
    '<div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:600, height:"94vh", boxSizing:"border-box",',
    "home card above layers")

# ---- DRAW living background ----
rep('<Particles count={60} color={T.yellow} />',
'''<Particles count={60} color={T.yellow} />
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"46%", left:"50%", width:"175vmax", height:"175vmax",
          background:"conic-gradient(from 0deg, transparent 0deg, rgba(212,175,55,0.16) 7deg, transparent 15deg, transparent 60deg, rgba(212,175,55,0.11) 67deg, transparent 75deg, transparent 150deg, rgba(212,175,55,0.14) 157deg, transparent 165deg, transparent 250deg, rgba(212,175,55,0.09) 257deg, transparent 265deg)",
          animation:"rayTurn 85s linear infinite" }} />
        {Array.from({length:16}).map((_,i)=>{
          const x=(i*61+9)%95, sz=14+((i*23)%46);
          return <div key={i} style={{ position:"absolute", left:x+"%", bottom:"-14vh", width:sz, height:sz, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(212,175,55,0.5) 0%,rgba(212,175,55,0.06) 65%,transparent 72%)",
            animation:`bokeh ${17+(i%7)*3.5}s linear ${(i*1.35)%17}s infinite` }} />;
        })}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 45%, transparent 42%, rgba(0,0,0,0.55) 100%)" }} />
      </div>''',
    "draw rays + bokeh + vignette")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))

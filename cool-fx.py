import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]
def rep(old,new,label):
    global s,ok
    if old in s: s=s.replace(old,new,1); ok+=1; print("  OK   "+label)
    else: miss.append(label); print("  MISS "+label)

A='@keyframes mote{0%{transform:translateY(10vh) scale(0.55);opacity:0}18%{opacity:0.8}100%{transform:translateY(-92vh) scale(1.15);opacity:0}}'
rep(A, A + '''
      @keyframes comet{0%{transform:translate(-12vw,-14vh) rotate(34deg);opacity:0}6%{opacity:1}46%{opacity:1}62%{opacity:0}100%{transform:translate(88vw,74vh) rotate(34deg);opacity:0}}
      @keyframes flake{0%{transform:translateY(-12vh) rotate(0deg);opacity:0}12%{opacity:0.9}86%{opacity:0.65}100%{transform:translateY(106vh) rotate(430deg);opacity:0}}
      @keyframes glint{0%,72%,100%{opacity:0;transform:translate(-50%,-50%) scale(0.25) rotate(0deg)}84%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(45deg)}}
      @keyframes btnShine{0%{transform:translateX(-170%) skewX(-22deg)}100%{transform:translateX(330%) skewX(-22deg)}}
      @keyframes orbitGlint{0%{top:-4px;left:0%}25%{top:-4px;left:99%}50%{top:99%;left:99%}75%{top:99%;left:0%}100%{top:-4px;left:0%}}''',
    "keyframes")

# ---- comets + flakes + star glints on home ----
rep('{Array.from({length:15}).map((_,i)=>{',
'''{[0,1,2].map(i=>(
          <div key={"cm"+i} style={{ position:"absolute", top:0, left:0, width:"clamp(90px,13vw,190px)", height:2, borderRadius:2,
            background:"linear-gradient(90deg,transparent,rgba(255,252,238,0.95),rgba(255,238,190,0.5),transparent)",
            boxShadow:"0 0 14px 3px rgba(255,246,214,0.85)",
            animation:`comet ${9+i*5}s linear ${i*6.5}s infinite` }} />
        ))}

        {Array.from({length:22}).map((_,i)=>{
          const x=(i*43+7)%97, sz=3+((i*11)%6);
          return <div key={"fk"+i} style={{ position:"absolute", left:x+"%", top:0, width:sz, height:sz*1.7, borderRadius:"40%",
            background:"linear-gradient(160deg,#FFF6DC,#E2BE62)", boxShadow:"0 0 8px rgba(226,190,98,0.9)",
            animation:`flake ${13+(i%7)*3}s linear ${(i*1.1)%14}s infinite` }} />;
        })}

        {[[16,26],[82,19],[71,74],[27,83],[52,12]].map(([x,y],i)=>(
          <div key={"gl"+i} style={{ position:"absolute", left:x+"%", top:y+"%", width:"clamp(26px,4vw,54px)", height:"clamp(26px,4vw,54px)",
            background:"conic-gradient(from 0deg,transparent 0deg,rgba(255,253,244,0.95) 4deg,transparent 12deg,transparent 84deg,rgba(255,253,244,0.95) 90deg,transparent 98deg,transparent 174deg,rgba(255,253,244,0.95) 180deg,transparent 188deg,transparent 264deg,rgba(255,253,244,0.95) 270deg,transparent 278deg)",
            animation:`glint ${6+i*1.7}s ease-in-out ${i*2.3}s infinite` }} />
        ))}

        {Array.from({length:15}).map((_,i)=>{''',
    "comets + flakes + star glints")

# ---- glint travelling around the card frame ----
rep('<div style={{ position:"absolute", inset:7, border:`1px solid ${G}`, opacity:0.5, pointerEvents:"none" }} />',
'''<div style={{ position:"absolute", inset:7, border:`1px solid ${G}`, opacity:0.5, pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:8, height:8, borderRadius:"50%", marginLeft:-4, pointerEvents:"none",
          background:"radial-gradient(circle,#FFFDF2 0%,rgba(255,240,200,0.85) 40%,transparent 70%)",
          boxShadow:"0 0 18px 6px rgba(255,240,200,0.9)",
          animation:"orbitGlint 9s linear infinite" }} />''',
    "frame orbit glint")

# ---- button shine wipe ----
rep('animation:"btnGlow 2.9s ease-in-out infinite" }}',
    'animation:"btnGlow 2.9s ease-in-out infinite", position:"relative", overflow:"hidden" }}',
    "button relative")
rep('''            RSVP NOW
          </button>''',
'''            <span style={{ position:"absolute", top:0, bottom:0, width:"38%", pointerEvents:"none",
              background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)",
              animation:"btnShine 3.4s ease-in-out infinite" }} />
            <span style={{ position:"relative" }}>RSVP NOW</span>
          </button>''',
    "button shine wipe")

# ---- mouse parallax on card content ----
rep('const P = process.env.PUBLIC_URL || "";',
'''const [tilt, setTilt] = useState({ x:0, y:0 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x:((e.clientX-r.left)/r.width-0.5)*2, y:((e.clientY-r.top)/r.height-0.5)*2 });
  };
  const P = process.env.PUBLIC_URL || "";''', "parallax state")
rep('padding:"2.5vh 4vw" }}>', 'padding:"2.5vh 4vw" }} onMouseMove={onMove} onMouseLeave={()=>setTilt({x:0,y:0})}>', "parallax handler")
rep('<div style={{ width:"100%", textAlign:"center" }}>',
    '<div style={{ width:"100%", textAlign:"center", transform:`perspective(1400px) rotateY(${tilt.x*2.2}deg) rotateX(${-tilt.y*2.2}deg) translateZ(0)`, transition:"transform 0.35s cubic-bezier(.2,.8,.3,1)" }}>',
    "parallax tilt")

# ---- comets on the draw screen too ----
rep('animation:"rayTurn 85s linear infinite" }} />',
'''animation:"rayTurn 85s linear infinite" }} />
        {[0,1].map(i=>(
          <div key={"dc"+i} style={{ position:"absolute", top:0, left:0, width:"clamp(110px,15vw,230px)", height:2, borderRadius:2,
            background:"linear-gradient(90deg,transparent,rgba(255,236,180,0.95),transparent)",
            boxShadow:"0 0 16px 4px rgba(212,175,55,0.8)",
            animation:`comet ${11+i*7}s linear ${i*9}s infinite` }} />
        ))}''',
    "draw comets")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))

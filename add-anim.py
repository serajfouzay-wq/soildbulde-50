import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]

def rep(old,new,label):
    global s,ok
    if old in s: s=s.replace(old,new,1); ok+=1; print("  OK   "+label)
    else: miss.append(label); print("  MISS "+label)

# ---- 1. new keyframes ----
ANCH='@keyframes cardReveal{from{opacity:0;transform:scale(0.9) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}'
KF = ANCH + '''
      @keyframes shimmer{0%{background-position:220% 0}100%{background-position:-120% 0}}
      @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
      @keyframes btnGlow{0%,100%{box-shadow:0 6px 20px rgba(184,134,11,0.35),inset 0 1px 0 rgba(255,255,255,0.45)}50%{box-shadow:0 10px 38px rgba(212,175,55,0.75),inset 0 1px 0 rgba(255,255,255,0.6)}}
      @keyframes breathe{0%,100%{opacity:0.84;text-shadow:0 0 22px rgba(212,175,55,0.35)}50%{opacity:1;text-shadow:0 0 55px rgba(212,175,55,0.8)}}
      @keyframes glowPulse{0%,100%{text-shadow:0 0 40px rgba(212,175,55,0.55);transform:scale(1)}50%{text-shadow:0 0 95px rgba(212,175,55,0.95);transform:scale(1.04)}}
      @keyframes cardFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
      @keyframes sweep{0%{transform:translateX(-130%) skewX(-18deg);opacity:0}30%{opacity:0.55}60%{opacity:0.55}100%{transform:translateX(240%) skewX(-18deg);opacity:0}}
      @keyframes haloPulse{0%,100%{opacity:0.25;transform:translate(-50%,-50%) scale(1)}50%{opacity:0.55;transform:translate(-50%,-50%) scale(1.15)}}'''
rep(ANCH, KF, "keyframes added")

# ---- 2. HOME: shimmering headline ----
try:
    i=s.index('WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent"')
    j=s.rfind('background:`linear-gradient',0,i)
    k=s.index('`,',j+30)+2
    s=s[:j]+'background:`linear-gradient(100deg,${GD} 0%,${G} 18%,#F5E9C0 38%,${GL} 50%,${G} 66%,${GD} 100%)`, backgroundSize:"260% 100%", animation:"shimmer 6.5s linear infinite",'+s[k:]
    ok+=1; print("  OK   home headline shimmer")
except Exception as e:
    miss.append("headline shimmer"); print("  MISS headline shimmer")

# ---- 3. HOME: floating 50 + glowing button ----
rep('margin:"0.3vh auto 0.6vh" }} />',
    'margin:"0.3vh auto 0.6vh", animation:"floatY 5.5s ease-in-out infinite" }} />',
    "home 50 float")
rep('inset 0 1px 0 rgba(255,255,255,0.45)`, transition:"transform .2s" }}',
    'inset 0 1px 0 rgba(255,255,255,0.45)`, transition:"transform .2s", animation:"btnGlow 2.9s ease-in-out infinite" }}',
    "home RSVP button glow")

# ---- 4. DRAW: idle title breathing ----
rep('fontSize:"clamp(24px,4vw,44px)", color:T.yellow, fontWeight:700, marginBottom:10 }}',
    'fontSize:"clamp(24px,4vw,44px)", color:T.yellow, fontWeight:700, marginBottom:10, animation:"breathe 3.6s ease-in-out infinite" }}',
    "draw idle title breathe")

# ---- 5. DRAW: spotlight sweep + halo on reveal ----
rep('<Confetti active={showWinners} />',
    '''<Confetti active={showWinners} />
      {showWinners && (
        <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"50%", left:"50%", width:"70vw", height:"70vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,0.20) 0%,transparent 62%)", animation:"haloPulse 3.4s ease-in-out infinite" }} />
          <div style={{ position:"absolute", top:0, bottom:0, width:"26%", background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.17),transparent)", animation:"sweep 3.6s ease-in-out infinite" }} />
        </div>
      )}''',
    "draw spotlight sweep + halo")

# ---- 6. DRAW: congratulations pulse + winner cards float ----
n=s.count('animation:"winnerReveal 0.8s ease-out"')
s=s.replace('animation:"winnerReveal 0.8s ease-out"','animation:"winnerReveal 0.8s ease-out, glowPulse 2.4s ease-in-out 0.9s infinite"')
print("  OK   congrats glow pulse (%d)"%n); ok+=n
rep('animation:`winnerReveal 0.9s cubic-bezier(0.34,1.56,0.64,1) ${i*150}ms both`',
    'animation:`winnerReveal 0.9s cubic-bezier(0.34,1.56,0.64,1) ${i*150}ms both, cardFloat 5.5s ease-in-out ${i*150+900}ms infinite`',
    "winner cards float")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))

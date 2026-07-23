import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

a = s.index('<div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:9, marginBottom:"0.9vh" }}>')
b = s.index('<div style={{ fontFamily:"\'Poppins\',\'DM Sans\',sans-serif", fontSize:"clamp(11px,1.7vh,14px)", color:"#4A443C"', a)

BOX = '''<div style={{ position:"relative", width:"min(440px,94%)", margin:"1.4vh auto 1.5vh", paddingTop:"1.1vh" }}>

            <svg viewBox="0 0 400 110" preserveAspectRatio="none" style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
              <g fill="none" stroke={G} vectorEffect="non-scaling-stroke">
                <path d="M14,4 H386 Q396,4 396,14 V96 Q396,106 386,106 H14 Q4,106 4,96 V14 Q4,4 14,4 Z" strokeWidth="1"/>
                <path d="M20,10 H380 Q390,10 390,20 V90 Q390,100 380,100 H20 Q10,100 10,90 V20 Q10,10 20,10 Z" strokeWidth="0.7" opacity="0.55"/>
                <path d="M4,22 Q12,15 22,4"   strokeWidth="1"/>
                <path d="M396,22 Q388,15 378,4" strokeWidth="1"/>
                <path d="M4,88 Q12,95 22,106"   strokeWidth="1"/>
                <path d="M396,88 Q388,95 378,106" strokeWidth="1"/>
              </g>
            </svg>

            <div style={{ position:"absolute", top:0, left:"50%", transform:"translate(-50%,-50%)", display:"flex", alignItems:"center", gap:9, background:"#F8F1E4", padding:"0 12px", whiteSpace:"nowrap" }}>
              {dia}
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(10px,1.7vh,14px)", letterSpacing:"0.24em", color:G }}>EVENT DETAILS</span>
              {dia}
            </div>

            <div style={{ position:"relative", padding:"1.4vh clamp(16px,4%,26px) 1.4vh" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"0.9vh 0" }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5" style={{ flexShrink:0 }}>
                  <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
                  <rect x="6.5" y="13" width="2" height="2" fill={G} stroke="none"/>
                  <rect x="11" y="13" width="2" height="2" fill={G} stroke="none"/>
                  <rect x="15.5" y="13" width="2" height="2" fill={G} stroke="none"/>
                </svg>
                <span style={{ fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:"clamp(12px,1.9vh,16px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.date}</span>
              </div>

              <div style={{ height:1, background:`linear-gradient(90deg,transparent,${G},transparent)`, opacity:0.5 }} />

              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"0.9vh 0" }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5" style={{ flexShrink:0 }}>
                  <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>
                </svg>
                <span style={{ fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:"clamp(12px,1.9vh,16px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.venue}</span>
              </div>
            </div>
          </div>

          '''

s = s[:a] + BOX + s[b:]
io.open(p,'w',encoding='utf-8').write(s)
print("OK  event box -> SVG ornate frame + gold icons + live text")

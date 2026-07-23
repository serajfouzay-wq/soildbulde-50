import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

a = s.index('<div style={{ position:"relative", width:"min(470px,96%)", margin:"0 auto 1.5vh" }}>')
b = s.index('<div style={{ fontFamily:"\'Poppins\',\'DM Sans\',sans-serif", fontSize:"clamp(11px,1.7vh,14px)", color:"#4A443C"', a)

BOX = '''<div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:9, marginBottom:"0.9vh" }}>
            <div style={{ height:1, width:"14%", background:G, opacity:0.5 }} />
            {dia}
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(10px,1.7vh,14px)", letterSpacing:"0.24em", color:G }}>EVENT DETAILS</span>
            {dia}
            <div style={{ height:1, width:"14%", background:G, opacity:0.5 }} />
          </div>

          <div style={{ position:"relative", border:`1px solid ${G}`, borderRadius:2, padding:"0 16px", margin:"0 auto 1.4vh", maxWidth:420, background:"rgba(255,252,244,0.35)" }}>
            <div style={{ position:"absolute", inset:4, border:`1px solid ${G}`, opacity:0.35, pointerEvents:"none" }} />
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"1.05vh 6px", borderBottom:`1px solid rgba(184,134,11,0.28)` }}>
              <span style={{ fontSize:"clamp(14px,2vh,18px)" }}>&#128197;</span>
              <span style={{ fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:"clamp(12px,1.9vh,16px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.date}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"1.05vh 6px" }}>
              <span style={{ fontSize:"clamp(14px,2vh,18px)" }}>&#128205;</span>
              <span style={{ fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:"clamp(12px,1.9vh,16px)", color:"#2E2A24", fontWeight:500 }}>{eventInfo.venue}</span>
            </div>
          </div>

          '''

s = s[:a] + BOX + s[b:]
io.open(p,'w',encoding='utf-8').write(s)
print("OK  event box -> CSS frame restored")

import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak2','w',encoding='utf-8').write(s)
ok=0

# --- 1. repair the broken draw_state block ---
BAD = '''    }); return; }
      setDs(p=>({...p,...data}));
    });'''
if BAD in s:
    s=s.replace(BAD,'    });',1); ok+=1; print("  OK   syntax repaired")
else:
    print("  MISS syntax (check manually)")

# --- 2. check-in header: gold, branded, bigger ---
OLD_H = '''      <div style={{background:`linear-gradient(135deg,${T.greenDark} 0%,${T.green} 100%)`,padding:"18px 24px"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#fff",fontWeight:700}}>📷 QR Check-In Scanner</div>
      </div>'''
NEW_H = '''      <div style={{background:"linear-gradient(135deg,#8B6914 0%,#B8860B 45%,#D4AF37 100%)",padding:"20px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#FFFDF4",fontWeight:700,letterSpacing:0.5}}>SoilBuild 50 &middot; Guest Check-In</div>
          <div style={{fontFamily:"'Poppins','DM Sans',sans-serif",fontSize:11,color:"rgba(255,253,244,0.75)",letterSpacing:3,textTransform:"uppercase",marginTop:3}}>Years &amp; Beyond</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <span style={{width:9,height:9,borderRadius:"50%",background:cameraOn?"#4ADE80":"#FCA5A5",boxShadow:cameraOn?"0 0 10px #4ADE80":"none"}} />
          <span style={{fontFamily:"'Poppins','DM Sans',sans-serif",fontSize:12,color:"#FFFDF4",fontWeight:600}}>{cameraOn?"Scanner live":"Scanner off"}</span>
        </div>
      </div>'''
if OLD_H in s: s=s.replace(OLD_H,NEW_H,1); ok+=1; print("  OK   header redesigned")
else: print("  MISS header")

# --- 3. bigger result panel, guest-readable ---
OLD_R = '''<div style={{fontSize:18,marginBottom:5}}>{scanResult.found&&!scanResult.already?"✅":scanResult.already?"⚠️":"❌"}</div>'''
NEW_R = '''<div style={{fontSize:40,marginBottom:8,lineHeight:1}}>{scanResult.found&&!scanResult.already?"\\u2705":scanResult.already?"\\u26A0\\uFE0F":"\\u274C"}</div>'''
if OLD_R in s: s=s.replace(OLD_R,NEW_R,1); ok+=1; print("  OK   bigger status icon")
else: print("  MISS status icon")

for o,n,l in [
 ('fontSize:17,fontWeight:700,color:T.inkDark,marginBottom:2}}>{scanResult.emp.name}',
  'fontSize:34,fontWeight:700,color:T.inkDark,marginBottom:4,lineHeight:1.1}}>{scanResult.emp.name}', "guest name larger"),
 ('fontSize:12,fontWeight:700,color:T.greenDark,background:"#DCFCE7",borderRadius:5,padding:"2px 9px"',
  'fontSize:17,fontWeight:700,color:"#fff",background:"#B8860B",borderRadius:7,padding:"6px 16px"', "table badge bigger"),
 ('fontSize:12,fontWeight:700,color:scanResult.already?T.yellowDark:T.green}}',
  'fontSize:16,fontWeight:700,marginTop:6,color:scanResult.already?"#B45309":"#15803D"}}', "checked-in text bigger"),
 ('borderRadius:10,padding:13,border:`1px solid ${scanResult.found',
  'borderRadius:14,padding:"22px 20px",textAlign:"center",border:`2px solid ${scanResult.found', "result panel padding"),
 ('paddingBottom:"72%"','paddingBottom:"80%"', "taller camera"),
]:
    if o in s: s=s.replace(o,n,1); ok+=1; print("  OK   "+l)
    else: print("  MISS "+l)

io.open(p,'w',encoding='utf-8').write(s)
print("\\n%d applied"%ok)

import io, re
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

R = [
 # 50 logo: much smaller
 ('height:"min(29vh,236px)", width:"auto", maxWidth:"76%", display:"block", margin:"0.4vh auto 0.8vh"',
  'height:"min(19vh,158px)", width:"auto", maxWidth:"58%", display:"block", margin:"0.3vh auto 0.6vh"'),
 # SoilBuild wordmark: smaller + gold tint
 ('height:"min(6vh,48px)", width:"auto", display:"block", margin:"0 auto 1.4vh"',
  'height:"min(4.6vh,38px)", width:"auto", display:"block", margin:"0 auto 1.1vh", filter:"sepia(1) saturate(2.6) hue-rotate(-12deg) brightness(1.05)"'),
 # headline tighter
 ('fontSize:"clamp(26px,5.3vh,54px)", lineHeight:1.06, margin:"0 0 0.8vh"',
  'fontSize:"clamp(24px,4.6vh,46px)", lineHeight:1.04, margin:"0 0 0.7vh"'),
 # card breathing room
 ('height:"95vh", boxSizing:"border-box"', 'height:"94vh", boxSizing:"border-box"'),
 ('padding:"clamp(14px,2.6vh,30px)"', 'padding:"clamp(12px,2.2vh,24px)"'),
 # tighten gaps
 ('margin:"0 auto 1.9vh", maxWidth:400', 'margin:"0 auto 1.5vh", maxWidth:390'),
 ('padding:"1.25vh 6px", borderBottom', 'padding:"1.05vh 6px", borderBottom'),
 ('gap:12, padding:"1.25vh 6px" }}', 'gap:12, padding:"1.05vh 6px" }}'),
 ('margin:"0 auto 1.7vh", maxWidth:430', 'margin:"0 auto 1.4vh", maxWidth:420'),
 ('padding:"clamp(11px,1.9vh,17px) 20px"', 'padding:"clamp(10px,1.6vh,15px) 20px"'),
 ('marginBottom:"1.2vh" }}>\n            <div style={{ height:1, width:"26%"',
  'marginBottom:"1.0vh" }}>\n            <div style={{ height:1, width:"26%"'),
]
n=0
for a,b in R:
    if a in s: s=s.replace(a,b,1); n+=1
    else: print("MISS:", a[:52])
io.open(p,'w',encoding='utf-8').write(s)
print("OK  %d/%d replacements applied" % (n,len(R)))

import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0
def rep(o,n,l):
    global s,ok
    if o in s: s=s.replace(o,n,1); ok+=1; print("  OK   "+l)
    else: print("  MISS "+l)

rep('width:"100%", maxWidth:600, height:"94vh", boxSizing:"border-box",',
    'width:"100%", maxWidth:560, height:"auto", maxHeight:"94vh", boxSizing:"border-box",',
    "card hugs content")

rep('border:`1.5px solid ${G}`, padding:"clamp(12px,2.2vh,24px)",\n        display:"flex", alignItems:"center", justifyContent:"center",',
    'border:`1.5px solid ${G}`, padding:"clamp(20px,3.4vh,38px) clamp(16px,3vw,34px)",\n        display:"flex", alignItems:"center", justifyContent:"center",',
    "breathing padding")

# scale content off the smaller of width/height so it fills at any zoom
for o,n,l in [
 ('height:"min(19vh,158px)", width:"auto", maxWidth:"58%"',
  'height:"min(21vh,20vw,190px)", width:"auto", maxWidth:"64%"', "50 logo scale"),
 ('height:"min(4.8vh,40px)", width:"min(230px,50%)"',
  'height:"min(5.4vh,5vw,46px)", width:"min(250px,56%)"', "wordmark scale"),
 ('fontSize:"clamp(24px,4.6vh,46px)"','fontSize:"clamp(26px,min(5vh,4.6vw),50px)"', "headline scale"),
 ('fontSize:"clamp(12px,1.9vh,16px)", lineHeight:1.55','fontSize:"clamp(13px,min(2vh,1.7vw),17px)", lineHeight:1.55', "subtitle scale"),
]:
    rep(o,n,l)

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied"%ok)

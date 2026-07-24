import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]
def rep(o,n,l):
    global s,ok
    if o in s: s=s.replace(o,n,1); ok+=1; print("  OK   "+l)
    else: miss.append(l); print("  MISS "+l)

# 1) gold logo everywhere (mask = gold gradient through the PNG shape)
rep('''    <img
      src={LOGO_DATA}
      alt="SoilBuild"
      style={{ height:size, width:"auto", objectFit:"contain", display:"block", background:"none" }}
    />''',
'''    <div aria-label="SoilBuild" role="img"
      style={{ height:size, width:size*3.1, display:"block",
        background:"linear-gradient(180deg,#D4AF37 0%,#B8860B 52%,#8B6914 100%)",
        WebkitMaskImage:`url(${LOGO_DATA})`, maskImage:`url(${LOGO_DATA})`,
        WebkitMaskRepeat:"no-repeat", maskRepeat:"no-repeat",
        WebkitMaskPosition:"center", maskPosition:"center",
        WebkitMaskSize:"contain", maskSize:"contain" }} />''', "gold logo")

# 2) scanner: never stop camera; cooldown so one code isn't read 60x/sec
rep('if (code?.data) { stopCamera(); processGuest(code.data); return; }',
'''if (code?.data) {
          const now = Date.now();
          if (code.data !== lastCode.current || now - lastAt.current > 3000) {
            lastCode.current = code.data; lastAt.current = now;
            processGuest(code.data);
          }
        }''', "continuous scanning")

rep('  const [refreshing, setRefreshing] = useState(false);',
'''  const lastCode = useRef(""); const lastAt = useRef(0);
  const [refreshing, setRefreshing] = useState(false);''', "scan cooldown refs")

# 3) queue counter so staff see it is live
rep('{scanResult.found?(<>','{scanResult.found?(<>',"(noop)")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))

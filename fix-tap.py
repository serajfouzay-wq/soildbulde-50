import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0
def rep(o,n,l):
    global s,ok
    if o in s: s=s.replace(o,n,1); ok+=1; print("  OK   "+l)
    else: print("  MISS "+l)

rep('const [shown, setShown] = useState(false);\n  const taps = useRef([]);',
    'const [shown, setShown] = useState(false);\n  const [count, setCount] = useState(0);\n  const taps = useRef([]);', "count state")

rep('''    taps.current = [...taps.current.filter(t => now - t < 2500), now];
    if (taps.current.length >= 5) {''',
'''    taps.current = [...taps.current.filter(t => now - t < 3000), now];
    setCount(taps.current.length);
    setTimeout(()=>setCount(0), 3000);
    if (taps.current.length >= 5) {''', "tap feedback")

rep('style={{ position:"fixed", bottom:0, right:0, width:64, height:64, zIndex:9998, cursor:"default", background:"transparent" }} />',
'''style={{ position:"fixed", bottom:0, right:0, width:110, height:110, zIndex:99999, cursor:"default",
          background: count>0 ? "rgba(184,134,11,0.14)" : "transparent",
          borderRadius:"100% 0 0 0", transition:"background .2s", WebkitTapHighlightColor:"transparent" }}>
        {count>0 && <div style={{ position:"absolute", bottom:14, right:16, fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700, color:"#8B6914" }}>{count}/5</div>}
      </div>''', "bigger zone + counter")

rep('      <div onClick={hit} title=""\n', '      <div onClick={hit} onTouchStart={hit} title=""\n', "touch support")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied"%ok)

import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0

# 1) self-contained secret-access component
COMP = '''function StaffAccess({ go }) {
  const [shown, setShown] = useState(false);
  const taps = useRef([]);
  const hideRef = useRef(null);
  const hit = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter(t => now - t < 2500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      setShown(true);
      clearTimeout(hideRef.current);
      hideRef.current = setTimeout(() => setShown(false), 20000);
    }
  };
  useEffect(() => () => clearTimeout(hideRef.current), []);
  return (
    <>
      <div onClick={hit} title=""
        style={{ position:"fixed", bottom:0, right:0, width:64, height:64, zIndex:9998, cursor:"default", background:"transparent" }} />
      {shown && (
        <div style={{ position:"fixed", bottom:14, right:14, zIndex:9999, display:"flex", gap:7, animation:"fadeInUp 0.35s ease-out both" }}>
          {[["Helpdesk","helpdesk"],["Check-In","qr-scanner"],["Admin","admin"]].map(([lbl,pg])=>(
            <button key={pg} onClick={()=>{ setShown(false); go(pg); }}
              style={{ background:"rgba(255,252,244,0.95)", color:"#8B6914", border:"1px solid rgba(184,134,11,0.55)",
                borderRadius:20, padding:"8px 16px", fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:12,
                fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(92,61,30,0.2)" }}>
              {lbl}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
function validSession('''
if 'function StaffAccess(' not in s:
    s=s.replace('function validSession(', COMP, 1); ok+=1; print("  OK   StaffAccess component")

# 2) swap the visible pills for the hidden trigger
a=s.find('{(page==="home"||page==="rsvp"||page==="helpdesk") && (')
if a>0:
    b=s.index('      )}\n', a)+len('      )}\n')
    s=s[:a]+'<StaffAccess go={navSetPage} />\n      '+s[b:]
    ok+=1; print("  OK   pills -> hidden 5-tap trigger")
else:
    print("  MISS pills block (may already be replaced)")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied"%ok)

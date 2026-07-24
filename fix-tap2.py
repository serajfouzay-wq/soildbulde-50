import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

a=s.index('function StaffAccess({ go }) {')
b=s.index('function validSession(')

NEW = '''function StaffAccess({ go }) {
  const [shown, setShown] = useState(false);
  const hideRef = useRef(null);
  const open = () => {
    setShown(true);
    clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setShown(false), 30000);
  };
  useEffect(() => () => clearTimeout(hideRef.current), []);
  return (
    <>
      {!shown && (
        <button onClick={open} aria-label="Staff menu"
          style={{ position:"fixed", bottom:16, right:16, zIndex:9999,
            width:38, height:38, borderRadius:"50%", cursor:"pointer",
            background:"rgba(255,252,244,0.9)", border:"1px solid rgba(184,134,11,0.55)",
            color:"#8B6914", fontSize:16, lineHeight:1, padding:0,
            boxShadow:"0 3px 10px rgba(92,61,30,0.18)" }}>
          &#9881;
        </button>
      )}
      {shown && (
        <div style={{ position:"fixed", bottom:16, right:16, zIndex:9999, display:"flex", gap:7, alignItems:"center", animation:"fadeInUp 0.3s ease-out both" }}>
          {[["Helpdesk","helpdesk"],["Check-In","qr-scanner"],["Admin","admin"]].map(([lbl,pg])=>(
            <button key={pg} onClick={()=>{ clearTimeout(hideRef.current); setShown(false); go(pg); }}
              style={{ background:"rgba(255,252,244,0.96)", color:"#8B6914", border:"1px solid rgba(184,134,11,0.55)",
                borderRadius:20, padding:"9px 16px", fontFamily:"'Poppins','DM Sans',sans-serif", fontSize:12,
                fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(92,61,30,0.2)" }}>
              {lbl}
            </button>
          ))}
          <button onClick={()=>{ clearTimeout(hideRef.current); setShown(false); }}
            style={{ background:"transparent", color:"#8B6914", border:"none", fontSize:20, cursor:"pointer", padding:"0 4px", lineHeight:1 }}>&times;</button>
        </div>
      )}
    </>
  );
}
'''
s=s[:a]+NEW+s[b:]

# only show it on guest-facing pages, never over admin/scanner/draw
s=s.replace('<StaffAccess go={navSetPage} />',
  '{(page==="home"||page==="rsvp"||page==="invitation") && <StaffAccess go={navSetPage} />}',1)

io.open(p,'w',encoding='utf-8').write(s)
print("OK  visible gear button; no invisible overlay; hidden on admin pages")

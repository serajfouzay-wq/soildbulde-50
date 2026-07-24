import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0; miss=[]
def rep(old,new,label):
    global s,ok
    if old in s: s=s.replace(old,new,1); ok+=1; print("  OK   "+label)
    else: miss.append(label); print("  MISS "+label)

rep('  const [error, setError]         = useState("");',
'''  const [error, setError]         = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync]     = useState("");
  const refreshGuests = async () => {
    setRefreshing(true);
    try {
      const rows = await dbAll("employees");
      if (rows && rows.length) {
        setEmployees(rows);
        setLastSync(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
        return rows;
      }
    } catch (e) { console.warn("refresh failed", e); }
    finally { setRefreshing(false); }
    return null;
  };
  useEffect(() => { refreshGuests(); }, []);''', "refresh helper")

rep('''    if (!emp) { setScanResult({found:false,raw}); return; }''',
'''    if (!emp) {
      setScanResult({ found:false, raw, checking:true });
      const fresh = await refreshGuests();
      const emp2 = (fresh||[]).find(e=>(idScan&&e.id===idScan)||(uidScan&&e.uniqueId===uidScan)||(nameScan&&e.name.toLowerCase()===nameScan.toLowerCase()));
      if (!emp2) { setScanResult({ found:false, raw }); return; }
      if (emp2.attended) { setScanResult({ found:true, already:true, emp:emp2 }); return; }
      const u2 = { ...emp2, attended:true, attendedAt:nowTime() };
      await dbUpsert("employees", u2);
      setEmployees(prev => prev.map(e => e.id===u2.id ? u2 : e));
      setScanResult({ found:true, already:false, emp:u2 });
      return;
    }''', "auto-retry on miss")

rep('''{error&&<div style={{background:"#FEE2E2"''',
'''<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
              <button onClick={refreshGuests} disabled={refreshing}
                style={{flex:1,background:refreshing?"#E8DFD0":"#B8860B",color:"#fff",border:"none",borderRadius:7,padding:"8px 10px",fontFamily:"'Poppins','DM Sans',sans-serif",fontSize:12,fontWeight:700,cursor:refreshing?"wait":"pointer"}}>
                {refreshing?"Refreshing…":"↻ Refresh Guest List"}
              </button>
              {lastSync&&<span style={{fontSize:10,color:T.gray,whiteSpace:"nowrap"}}>synced {lastSync}</span>}
            </div>
            {error&&<div style={{background:"#FEE2E2"''', "refresh button")

rep('''<div style={{fontSize:11,color:T.red}}>Not in confirmed guest list.</div>''',
'''<div style={{fontSize:11,color:T.red}}>{scanResult.checking?"Checking latest guest list…":"Not in confirmed guest list."}</div>''',
    "checking message")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied, %d missed %s"%(ok,len(miss),miss if miss else ""))

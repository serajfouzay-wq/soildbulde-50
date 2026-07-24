import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)
ok=0

OLD = '''          const lines = ev.target.result.split("\\n").filter(l=>l.trim());
          const headers = lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));
          rows = lines.slice(1).map(line => {
            const vals = line.split(",").map(v=>v.trim().replace(/^"|"$/g,""));
            const obj = {}; headers.forEach((h,i)=>{ obj[h]=vals[i]||""; }); return obj;
          });'''

NEW = '''          const splitCSV = (line) => {
            const out=[]; let cur=""; let q=false;
            for (let i=0;i<line.length;i++) {
              const ch=line[i];
              if (ch === '"') {
                if (q && line[i+1] === '"') { cur+='"'; i++; }
                else q = !q;
              } else if (ch === "," && !q) { out.push(cur); cur=""; }
              else cur += ch;
            }
            out.push(cur);
            return out.map(v=>v.replace(/\\r/g,"").trim());
          };
          const lines = ev.target.result.replace(/\\r\\n/g,"\\n").split("\\n").filter(l=>l.trim());
          const headers = splitCSV(lines[0]).map(h=>h.replace(/^\\ufeff/,""));
          rows = lines.slice(1).map(line => {
            const vals = splitCSV(line);
            const obj = {}; headers.forEach((h,i)=>{ obj[h]=vals[i]||""; }); return obj;
          });'''

if OLD in s:
    s=s.replace(OLD,NEW,1); ok+=1; print("  OK   CSV parser: quotes + CRLF + BOM")
else:
    print("  MISS CSV parser")

# trim stray whitespace/CR on every parsed field
O2='          if (!name) return null;\n          return { name, employeeNumber, email, mobile, department, company, pax, type, dietary };'
N2='          if (!name) return null;\n          const clean = (v) => String(v||"").replace(/\\r/g,"").trim();\n          return { name:clean(name), employeeNumber:clean(employeeNumber), email:clean(email).toLowerCase(), mobile:clean(mobile), department:clean(department), company:clean(company), pax, type, dietary:clean(dietary)||"Chinese" };'
if O2 in s:
    s=s.replace(O2,N2,1); ok+=1; print("  OK   field cleaning")
else:
    print("  MISS field cleaning")

io.open(p,'w',encoding='utf-8').write(s)
print("\n%d applied"%ok)

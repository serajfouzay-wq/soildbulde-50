import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

n=0
while '{/* Pax */}' in s:
    a=s.index('{/* Pax */}')
    b=s.index('{/* Dietary */}', a)
    ls=s.rfind('\n', 0, a)+1          # keep indentation clean
    s=s[:ls]+s[b-6:] if s[b-6:b]=='      ' else s[:ls]+s[b:]
    n+=1
    if n>5: break

io.open(p,'w',encoding='utf-8').write(s)
print("OK  removed %d pax blocks (employee + VIP)" % n)

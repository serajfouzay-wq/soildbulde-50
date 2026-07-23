import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

# --- employee form: single <F label="Mobile" ... /> line ---
n=0
while '<F label="Mobile"' in s:
    a=s.index('<F label="Mobile"')
    ls=s.rfind('\n',0,a)+1
    le=s.index('\n',a)+1
    s=s[:ls]+s[le:]; n+=1
    if n>4: break
print("OK  employee mobile field removed (%d)"%n)

# --- VIP form: array element containing "Mobile Number" ---
m=0
while '"Mobile Number"' in s:
    q=s.index('"Mobile Number"')
    i=q; d=0; start=None
    while i>0:
        i-=1; c=s[i]
        if c in ']}': d+=1
        elif c in '[{':
            if d==0: start=i; break
            d-=1
    if start is None: print("!!  VIP element start not found"); break
    op=s[start]; cl=']' if op=='[' else '}'
    j=start; d=0
    while j<len(s):
        if s[j]==op: d+=1
        elif s[j]==cl:
            d-=1
            if d==0: break
        j+=1
    end=j+1
    while end<len(s) and s[end] in ' ,\n': 
        if s[end]==',': end+=1; break
        end+=1
    s=s[:start]+s[end:]; m+=1
    if m>4: break
print("OK  VIP mobile field removed (%d)"%m)

io.open(p,'w',encoding='utf-8').write(s)

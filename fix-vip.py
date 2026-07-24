import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

st=s.index('function VIPForm(')
i=s.index('(',st); d=0
while True:
    if s[i]=='(': d+=1
    elif s[i]==')':
        d-=1
        if d==0: break
    i+=1
j=s.index('{',i); d=0; k=j
while True:
    if s[k]=='{': d+=1
    elif s[k]=='}':
        d-=1
        if d==0: break
    k+=1
c=s[st:k+1]; before=c

R=[
 # dark panels -> light champagne
 ('rgba(255,255,255,0.08)','#fff'),
 ('rgba(255,255,255,0.07)','#F5F0E8'),
 ('rgba(212,175,55,0.08)','#fff'),
 ('rgba(212,175,55,0.25)','rgba(184,134,11,0.14)'),
 ('rgba(212,175,55,0.3)','#DDCDB0'),
 ('rgba(212,175,55,0.6)','#B8860B'),
 ('rgba(212,175,55,0.5)','rgba(184,134,11,0.45)'),
 ('rgba(212,175,55,0.4)','rgba(184,134,11,0.35)'),
 ('rgba(255,255,255,0.15)','#DDCDB0'),
 # text
 ('rgba(245,240,232,0.65)','#6B5A3E'),
 ('rgba(245,240,232,0.7)','#5C3D1E'),
 ('rgba(245,240,232,0.5)','#6B6154'),
 ('rgba(245,240,232,0.45)','#8A7F6E'),
 ('"#F5F0E8"','"#2E2A24"'),
 # accents
 ('color:T.yellow','color:"#B8860B"'),
 ('background:T.yellow','background:"#B8860B"'),
 ('borderColor=T.yellow','borderColor="#B8860B"'),
 ('borderColor="rgba(184,134,11,0.14)"','borderColor="#DDCDB0"'),
 ('color:"#2C1A0E"','color:"#FFFAEE"'),
 ('rgba(212,175,55,0.3)":T.yellow','rgba(184,134,11,0.3)":"#B8860B"'),
 ('boxShadow:"0 4px 16px rgba(212,175,55,0.3)"','boxShadow:"0 4px 16px rgba(184,134,11,0.32)"'),
]
for o,n in R: c=c.replace(o,n)

# page background: dark -> beige (first container div in VIPForm)
c=c.replace('background:`linear-gradient(135deg, ${T.dark} 0%, ${T.inkDark} 100%)`','background:T.beige',1)
c=c.replace('background:"rgba(255,255,255,0.05)"','background:T.beigeLight')

s=s[:st]+c+s[k+1:]
io.open(p,'w',encoding='utf-8').write(s)
print("OK  VIPForm -> champagne gold (%d chars changed)"%abs(len(c)-len(before)))
print("remaining dark refs in VIPForm:", c.count('245,240,232'))

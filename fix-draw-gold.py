import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

st=s.index('function AudienceScreen(')
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
c=s[st:k+1]; n=0

R=[
 # background -> gold landscape
 ('background:`radial-gradient(ellipse at 50% 45%, #1C1710 0%, #0D0D0A 55%, #060605 100%)`',
  'backgroundImage:`url(${process.env.PUBLIC_URL||""}/bg-home.png)`, backgroundSize:"cover", backgroundPosition:"center", backgroundColor:"#F7F0E4"'),
 # vignette -> soft light wash instead of black
 ('radial-gradient(ellipse at 50% 45%, transparent 42%, rgba(0,0,0,0.55) 100%)',
  'radial-gradient(ellipse at 50% 45%, rgba(255,253,246,0.55) 0%, rgba(255,250,235,0.15) 45%, transparent 72%)'),
 # slot reels -> cream with gold rims
 ('linear-gradient(180deg,#1F1608 0%,#0C0904 100%)','linear-gradient(180deg,#FFFDF6 0%,#F3E9D2 100%)'),
 ('linear-gradient(180deg,#2E2210 0%,#1A1308 50%,#2E2210 100%)','linear-gradient(180deg,#FFFEFA 0%,#F7EFDC 50%,#FFFEFA 100%)'),
 ('linear-gradient(180deg,rgba(0,0,0,0.55),transparent)','linear-gradient(180deg,rgba(184,134,11,0.18),transparent)'),
 ('linear-gradient(0deg,rgba(0,0,0,0.55),transparent)','linear-gradient(0deg,rgba(184,134,11,0.18),transparent)'),
 # white text -> dark ink
 ('color:"#fff"','color:"#2E2A24"'),
 ('color:"#F5F0E8"','color:"#2E2A24"'),
 ('rgba(255,255,255,0.5)','#6B6154'),
 ('rgba(255,255,255,0.42)','#6B6154'),
 ('rgba(255,255,255,0.36)','#6B6154'),
 ('rgba(255,255,255,0.35)','#6B6154'),
 ('rgba(255,255,255,0.3)','#7A705F'),
 ('rgba(255,255,255,0.26)','#8A7F6E'),
 ('rgba(255,255,255,0.23)','#8A7F6E'),
 ('rgba(255,255,255,0.2)','#8A7F6E'),
 ('rgba(255,255,255,0.07)','rgba(255,253,246,0.72)'),
 ('rgba(255,255,255,0.15)','rgba(184,134,11,0.35)'),
 # gold accents -> deeper gold (readable on pale)
 ('color:T.yellow','color:"#8B6914"'),
 ('background:T.yellow','background:"#B8860B"'),
 # glows -> warm shadow, not blown-out light
 ('textShadow:`0 0 120px rgba(212,175,55,0.9)`','textShadow:"0 3px 18px rgba(139,105,20,0.35)"'),
 ('textShadow:`0 0 50px rgba(212,175,55,0.7)`','textShadow:"0 2px 12px rgba(139,105,20,0.3)"'),
 ('textShadow:"0 0 40px rgba(212,175,55,0.5)"','textShadow:"0 2px 10px rgba(139,105,20,0.28)"'),
 ('boxShadow:"0 0 70px rgba(212,175,55,0.32),inset 0 0 30px rgba(0,0,0,0.5)"','boxShadow:"0 10px 40px rgba(139,105,20,0.28), inset 0 0 24px rgba(184,134,11,0.10)"'),
 ('boxShadow:`0 0 48px rgba(212,175,55,0.18)`','boxShadow:"0 8px 30px rgba(139,105,20,0.20)"'),
 ('boxShadow:"0 0 18px rgba(212,175,55,0.4)"','boxShadow:"0 3px 12px rgba(139,105,20,0.32)"'),
 ('boxShadow:"0 0 80px rgba(212,175,55,0.28)"','boxShadow:"0 10px 40px rgba(139,105,20,0.25)"'),
 ('boxShadow:"0 0 100px rgba(212,175,55,0.38)"','boxShadow:"0 12px 48px rgba(139,105,20,0.28)"'),
 # panels / borders on light
 ('rgba(212,175,55,0.04)','rgba(255,253,246,0.7)'),
 ('rgba(212,175,55,0.1)','rgba(184,134,11,0.28)'),
 ('rgba(212,175,55,0.13)','rgba(184,134,11,0.3)'),
 # ambient layers tuned for light bg
 ('rgba(212,175,55,0.16) 7deg','rgba(255,244,214,0.75) 7deg'),
 ('rgba(212,175,55,0.11) 67deg','rgba(255,240,200,0.6) 67deg'),
 ('rgba(212,175,55,0.14) 157deg','rgba(255,246,220,0.68) 157deg'),
 ('rgba(212,175,55,0.09) 257deg','rgba(255,242,208,0.55) 257deg'),
 ('rgba(212,175,55,0.5) 0%,rgba(212,175,55,0.06) 65%','rgba(255,255,255,0.85) 0%,rgba(255,240,200,0.25) 65%'),
 ('rgba(212,175,55,0.20) 0%,transparent 62%','rgba(255,252,240,0.75) 0%,transparent 62%'),
 ('rgba(212,175,55,0.17),transparent','rgba(255,250,230,0.85),transparent'),
]
for o,nw in R:
    if o in c: c=c.replace(o,nw); n+=1

# particles + sound pill readable on light
c=c.replace('<Particles count={60} color={T.yellow} />','<Particles count={60} color="#B8860B" />')
c=c.replace('background:"rgba(212,175,55,0.15)", color:T.yellow','background:"rgba(255,252,244,0.9)", color:"#8B6914"')

s=s[:st]+c+s[k+1:]
io.open(p,'w',encoding='utf-8').write(s)
print("OK  draw screen -> gold landscape, %d/%d rules applied"%(n,len(R)))

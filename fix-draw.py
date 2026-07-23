import io
p='src/App.jsx'; s=io.open(p,encoding='utf-8').read()
io.open(p+'.bak','w',encoding='utf-8').write(s)

# 1) draw background: dark green -> deep near-black with warm cast
a=s.count('linear-gradient(135deg, #0D1B0F 0%, #1A3D1F 100%)')
s=s.replace('linear-gradient(135deg, #0D1B0F 0%, #1A3D1F 100%)',
            'radial-gradient(ellipse at 50% 45%, #1C1710 0%, #0D0D0A 55%, #060605 100%)')
print("OK  draw background -> deep dark (%d)"%a)

# 2) unify every hardcoded yellow glow -> champagne gold D4AF37 = 212,175,55
b=s.count('245,197,24')
s=s.replace('245,197,24','212,175,55')
print("OK  glow/border colour unified (%d occurrences)"%b)

# 3) slot reel panels: warm gold-black instead of olive
s=s.replace('linear-gradient(180deg,#1a1200 0%,#0d0a00 100%)','linear-gradient(180deg,#1F1608 0%,#0C0904 100%)')
s=s.replace('linear-gradient(180deg,#2a1f00 0%,#1a1300 50%,#2a1f00 100%)','linear-gradient(180deg,#2E2210 0%,#1A1308 50%,#2E2210 100%)')
print("OK  slot reels warmed")

io.open(p,'w',encoding='utf-8').write(s)

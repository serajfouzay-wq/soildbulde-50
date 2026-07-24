import io, re, glob
NEW = 'const FROM_EMAIL = process.env.FROM_EMAIL || "SoilBuild 50th Anniversary <rsvp@smartsolutionsevent.my>";'
for f in glob.glob("api/*.js"):
    s = io.open(f, encoding="utf-8").read()
    if "FROM_EMAIL" not in s: continue
    io.open(f + ".bak", "w", encoding="utf-8").write(s)
    s2 = re.sub(r'const FROM_EMAIL\s*=\s*[^\n]*;', NEW, s, count=1)
    if s2 != s:
        io.open(f, "w", encoding="utf-8").write(s2)
        print("  OK   " + f)
    else:
        print("  MISS " + f)

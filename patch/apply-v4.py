#!/usr/bin/env python3
import re, shutil, sys

SRC = 'src/App.jsx'

def bounds(text, name):
    start = text.find(f'function {name}')
    if start == -1: return -1, -1
    i = text.find('(', start)
    if i == -1: return -1, -1
    d = 0
    while i < len(text):
        if text[i] == '(': d += 1
        elif text[i] == ')':
            d -= 1
            if d == 0: break
        i += 1
    brace = text.find('{', i + 1)
    if brace == -1: return -1, -1
    d, i = 0, brace
    while i < len(text):
        if text[i] == '{': d += 1
        elif text[i] == '}':
            d -= 1
            if d == 0: return start, i + 1
        i += 1
    return -1, -1

import os
HERE = os.path.dirname(os.path.abspath(__file__))
H = open(os.path.join(HERE,'helpers-and-home-v4.jsx')).read()
I = open(os.path.join(HERE,'invitation-page-v4.jsx')).read()

shutil.copy(SRC, SRC+'.bak')
content = open(SRC).read()
orig = len(content)

if 'useRef' not in content:
    content = re.sub(r'(import\s*\{[^}]*)(useState)',r'\1useRef, useState',content,count=1)
    print('+ useRef added')

hs, he = bounds(content,'HomePage')
if hs == -1: print('ERROR: HomePage not found'); sys.exit(1)
content = content[:hs] + H + '\n\n' + content[he:]
print('+ HomePage replaced with PNG-asset version')

is_, ie = bounds(content,'InvitationPage')
if is_ != -1:
    content = content[:is_] + I + '\n\n' + content[ie:]
    print('+ InvitationPage replaced')
else:
    _, nhe = bounds(content,'HomePage')
    pos = nhe if nhe != -1 else len(content)
    content = content[:pos] + '\n\n' + I + content[pos:]
    print('+ InvitationPage added')

# Wire invitation route if missing
if 'page==="invitation"' not in content:
    for pat in ['{page==="rsvp"','{page === "rsvp"']:
        if pat in content:
            content = content.replace(pat,
              '{page==="invitation" && <InvitationPage setPage={navSetPage} eventInfo={eventInfo} />}\n      '+pat,1)
            print('+ invitation route wired'); break

# ── KEY CHANGE: hide nav on home + invitation pages ──────────────────
old_nav = 'const showNav = page!=="draw-audience" && page!=="login"'
new_nav = 'const showNav = page!=="draw-audience" && page!=="login" && page!=="home" && page!=="invitation"'
if old_nav in content:
    content = content.replace(old_nav, new_nav, 1)
    print('+ showNav updated — nav hidden on home & invitation pages')
else:
    # Try alternate spacing
    old2 = 'page!=="login";'
    if old2 in content and 'home' not in content.split(old2)[0].split('\n')[-1]:
        content = content.replace(old2, 'page!=="login" && page!=="home" && page!=="invitation";',1)
        print('+ showNav updated (alt pattern)')

if 'Cormorant+Garamond' not in content:
    p2=re.sub(r'(https://fonts\.googleapis\.com/css2\?[^"\'`]*)(family=Playfair\+Display)',r'\1family=Cormorant+Garamond:ital,wght@1,700&\2',content,count=1)
    if p2!=content: content=p2; print('+ Cormorant Garamond added')

open(SRC,'w').write(content)
print(f'\nDone — {len(content)-orig:+,} chars')
print('─'*48)
print('Next:  npm run build')

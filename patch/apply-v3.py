#!/usr/bin/env python3
"""
SoilBuild 50 Years & Beyond — App.jsx Theme Patcher
Run from project root:  python3 update.py
"""
import shutil, sys, os, re

SRC = 'src/App.jsx'
HERE = os.path.dirname(os.path.abspath(__file__))


def get_func_bounds(text, func_name):
    """Return (start, end) char indices of 'function func_name(...)  { ... }'
    by counting brace depth.  Returns (-1, -1) if not found."""
    pat = f'function {func_name}'
    start = text.find(pat)
    if start == -1:
        return -1, -1
    brace_open = text.find('{', start)
    if brace_open == -1:
        return -1, -1
    depth = 0
    i = brace_open
    while i < len(text):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                return start, i + 1
        i += 1
    return -1, -1


def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


# ── Validate ──────────────────────────────────────────────────────────
if not os.path.exists(SRC):
    print(f'✗ {SRC} not found. Run this script from the project root.')
    sys.exit(1)

helpers_path = os.path.join(HERE, 'helpers-and-home-v3.jsx')
inv_path     = os.path.join(HERE, 'invitation-page-v3.jsx')

for p in [helpers_path, inv_path]:
    if not os.path.exists(p):
        print(f'✗ Missing patch file: {p}')
        sys.exit(1)

HELPERS_AND_HOME = read(helpers_path)
INV_PAGE         = read(inv_path)

# ── Backup ────────────────────────────────────────────────────────────
bak = SRC + '.bak'
shutil.copy(SRC, bak)
print(f'✓ Backup saved → {bak}')

content = read(SRC)
original_len = len(content)

# ── STEP 1: Add useRef to React import if missing ─────────────────────
if 'useRef' not in content:
    content = re.sub(
        r'(import\s*\{[^}]*)(useState)',
        r'\1useRef, useState',
        content, count=1
    )
    if 'useRef' in content:
        print('✓ useRef added to React import')
    else:
        print('⚠ Could not auto-add useRef — add it manually to your React import if build fails')

# ── STEP 2: Replace HomePage (and insert all helpers before it) ───────
home_s, home_e = get_func_bounds(content, 'HomePage')
if home_s == -1:
    print('✗ Could not locate function HomePage — aborting'); sys.exit(1)

content = content[:home_s] + HELPERS_AND_HOME + '\n\n' + content[home_e:]
print('✓ HomePage replaced + helpers injected before it')

# ── STEP 3: Replace or insert InvitationPage ──────────────────────────
inv_s, inv_e = get_func_bounds(content, 'InvitationPage')
if inv_s != -1:
    content = content[:inv_s] + INV_PAGE + '\n\n' + content[inv_e:]
    print('✓ InvitationPage replaced')
else:
    # Insert after the end of the new HomePage block
    _, new_home_e = get_func_bounds(content, 'HomePage')
    if new_home_e == -1:
        print('⚠ Could not find insertion point for InvitationPage — appending before App()')
        app_s, _ = get_func_bounds(content, 'App')
        if app_s != -1:
            content = content[:app_s] + INV_PAGE + '\n\n' + content[app_s:]
        else:
            content += '\n\n' + INV_PAGE
    else:
        content = content[:new_home_e] + '\n\n' + INV_PAGE + content[new_home_e:]
    print('✓ InvitationPage added (was not in original file)')

# ── STEP 4: Wire invitation route into App root if missing ───────────
if 'page==="invitation"' not in content:
    # Insert the route just before the rsvp route
    for rsvp_pattern in [
        '{page==="rsvp"',
        "{page===\"rsvp\"",
        '{page === "rsvp"',
        "{page === 'rsvp'",
    ]:
        if rsvp_pattern in content:
            content = content.replace(
                rsvp_pattern,
                '{page==="invitation" && <InvitationPage setPage={navSetPage} eventInfo={eventInfo} />}\n      ' + rsvp_pattern,
                1
            )
            print('✓ Invitation route added to App root render')
            break
    else:
        print('⚠ Could not auto-add invitation route — add this line manually in App() render:')
        print('    {page==="invitation" && <InvitationPage setPage={navSetPage} eventInfo={eventInfo} />}')

# ── STEP 5: Add invitation link to Nav if there's a nav items array ──
if '"invitation"' not in content and "'invitation'" not in content:
    # Try to find a nav items array and add invitation entry
    # This is a best-effort — depends on the nav structure
    if '{ id:"rsvp"' in content or "{ id:'rsvp'" in content:
        content = content.replace(
            '{ id:"rsvp"',
            '{ id:"invitation", label:"Invitation" },\n    { id:"rsvp"',
            1
        )
        print('✓ Invitation added to Nav items')

# ── STEP 6: Patch FontLoader to include Cormorant Garamond ───────────
if 'Cormorant+Garamond' not in content and 'Cormorant Garamond' not in content:
    # Look for the Google Fonts URL and prepend Cormorant Garamond
    patched = re.sub(
        r'(https://fonts\.googleapis\.com/css2\?[^"\'`]*)(family=Playfair\+Display)',
        r'\1family=Cormorant+Garamond:ital,wght@1,700&\2',
        content, count=1
    )
    if patched != content:
        content = patched
        print('✓ Cormorant Garamond added to FontLoader Google Fonts URL')
    else:
        print('ℹ Cormorant Garamond not auto-added to FontLoader (OK — Playfair Display is used as fallback)')

# ── Write ─────────────────────────────────────────────────────────────
write(SRC, content)

delta = len(content) - original_len
print(f'\n✓ {SRC} updated  ({delta:+,} chars)')
print('━' * 48)
print('Next step:  npm run build')
print('If build fails, restore with:  cp src/App.jsx.bak src/App.jsx')

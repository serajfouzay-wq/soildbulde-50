/* ═══════════════════════════════════════════════════════════════════════
   SOILBUILD 50 YEARS & BEYOND — CHAMPAGNE GOLD THEME
   Helpers + HomePage — injected by update.py
   ═══════════════════════════════════════════════════════════════════════ */

const SB_GOLD = '#C9A84C';
const SB_GL   = '#F0D185';
const SB_GB   = '#FFD700';
const SB_GD   = '#8B6914';
const SB_TD   = '#3D2800';
const SB_TM   = '#5C3D11';
const SB_BG   = '#EDD5A0';
const SB_CARD = '#FAF3E2';
const SB_DK   = '#DFBA78';
const SB_FD   = "'Cormorant Garamond','Playfair Display',Georgia,serif";
const SB_FH   = "'Playfair Display',Georgia,serif";
const SB_FB   = "'DM Sans',system-ui,sans-serif";

function injectSBStyles() {
  if (document.getElementById('sb-css-2026')) return;
  const el = document.createElement('style');
  el.id = 'sb-css-2026';
  el.textContent =
    "@keyframes sbFloatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}" +
    "@keyframes sbPulseBtn{0%,100%{opacity:.93}50%{opacity:1}}" +
    "@keyframes sbFadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    "@keyframes sbTw1{0%,100%{opacity:.12;transform:scale(.55)}50%{opacity:1;transform:scale(1.35)}}" +
    "@keyframes sbTw2{0%,100%{opacity:.48;transform:scale(1)}40%{opacity:1;transform:scale(1.45)}75%{opacity:.18;transform:scale(.82)}}" +
    "@keyframes sbTw3{0%,100%{opacity:.72;transform:scale(.88)}55%{opacity:.12;transform:scale(1.18)}}" +
    "@keyframes sbSideWave{0%,100%{opacity:.42}50%{opacity:.76}}" +
    "@keyframes sbCardIn{from{opacity:0;transform:scale(.96) translateY(16px)}to{opacity:1;transform:none}}";
  document.head.appendChild(el);
}

function ChampagneCanvas() {
  const ref = useRef(null);
  const rf  = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    let t = 0;
    const ctx = c.getContext('2d');
    const sz = () => { const p = c.parentElement; c.width = p.offsetWidth || 800; c.height = p.offsetHeight || 700; };
    sz(); window.addEventListener('resize', sz);
    const pts = Array.from({ length: 85 }, () => ({
      x: Math.random(), y: Math.random(),
      size: Math.random() * 2.9 + .7,
      speed: Math.random() * .00024 + .00008,
      phase: Math.random() * Math.PI * 2,
      col: [SB_GB, SB_GL, SB_GOLD, '#FFF8D0', '#EDDA9C'][Math.floor(Math.random() * 5)],
    }));
    const arc = (x1, y1, cx, cy, x2, y2, a, cw) => {
      const W = c.width, H = c.height;
      const d = (sw, sc) => {
        ctx.beginPath(); ctx.moveTo(x1*W, y1*H);
        ctx.quadraticCurveTo(cx*W, cy*H, x2*W, y2*H);
        ctx.strokeStyle = sc; ctx.lineWidth = sw; ctx.lineCap = 'round'; ctx.stroke();
      };
      d(cw * 5,              `rgba(255,215,95,${a * .24})`);
      d(cw * 2.2,            `rgba(240,185,80,${a * .18})`);
      d(cw,                  `rgba(201,168,76,${a})`);
      d(Math.max(.5, cw*.3), `rgba(255,242,168,${a * .66})`);
    };
    const frame = () => {
      const W = c.width, H = c.height; ctx.clearRect(0, 0, W, H);
      let g = ctx.createRadialGradient(W/2, H, 0, W/2, H, H * .7);
      g.addColorStop(0, 'rgba(255,208,72,.68)'); g.addColorStop(.32, 'rgba(201,168,76,.24)'); g.addColorStop(1, 'rgba(201,168,76,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      g = ctx.createRadialGradient(W/2, H*.44, 0, W/2, H*.44, W*.52);
      g.addColorStop(0, 'rgba(255,240,155,.11)'); g.addColorStop(1, 'rgba(255,240,155,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const s1 = Math.sin(t * .38) * .044, s2 = Math.cos(t * .38) * .044, p = (Math.sin(t * .55) + 1) / 2;
      arc(-.06, .16+s1,  .07, .90,  .53, 1.08, .74+p*.14, 3.4);
      arc(-.06, .21+s1,  .02, .86,  .47, 1.08, .45+p*.08, 1.8);
      arc(-.06, .13+s1,  .12, .93,  .59, 1.08, .27,       1.0);
      arc(-.09, .27+s1, -.01, .83,  .43, 1.08, .16,       .58);
      arc(-.03, .10+s1,  .18, .97,  .65, 1.08, .09,       .35);
      arc(1.06, .22+s2,  .93, .90,  .47, 1.08, .74+p*.14, 3.4);
      arc(1.06, .27+s2,  .98, .86,  .53, 1.08, .45+p*.08, 1.8);
      arc(1.06, .18+s2,  .88, .93,  .41, 1.08, .27,       1.0);
      arc(1.09, .33+s2, 1.01, .83,  .57, 1.08, .16,       .58);
      arc(1.03, .15+s2,  .82, .97,  .35, 1.08, .09,       .35);
      arc(-.02, .06,  .05, .35, .27, .54, .26, .9);
      arc(1.02, .08,  .95, .37, .73, .56, .26, .9);
      const now = t * 2.2;
      pts.forEach(p => {
        const a = (Math.sin(now + p.phase) + 1) / 2; if (a < .07) return;
        const x = p.x * W, y = ((p.y + p.speed * t * 100) % 1) * H;
        const r = p.size * (.7 + a * .58), ri = r * .28;
        ctx.save(); ctx.translate(x, y); ctx.rotate(now * .29);
        ctx.fillStyle = p.col; ctx.globalAlpha = a * .88;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a1 = (i / 4) * Math.PI * 2, a2 = a1 + Math.PI / 4;
          ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
          ctx.lineTo(Math.cos(a2) * ri, Math.sin(a2) * ri);
        }
        ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
      });
      t += .009; rf.current = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(rf.current); window.removeEventListener('resize', sz); };
  }, []);
  return <canvas ref={ref} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }} />;
}

function FiftyEmblem({ size = 220 }) {
  return (
    <div style={{ animation:'sbFloatY 4s ease-in-out infinite', display:'inline-block' }}>
      <svg width={size} height={size * .88} viewBox="0 0 280 248">
        <defs>
          <linearGradient id="sbGrad50" x1="5%" y1="0%" x2="95%" y2="100%">
            <stop offset="0%"   stopColor="#F5E190" />
            <stop offset="28%"  stopColor="#C9A84C" />
            <stop offset="62%"  stopColor="#ECC060" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
        </defs>
        <text x="140" y="188" textAnchor="middle"
          fontFamily={SB_FD} fontStyle="italic" fontWeight="700"
          fontSize="205" fill="url(#sbGrad50)" letterSpacing="-10">50</text>
        <path d="M 22 207 C 68 234 116 242 140 227 C 164 212 212 232 258 207"
          stroke={SB_GOLD} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <path d="M 38 216 C 82 242 118 248 140 234 C 162 220 204 240 242 216"
          stroke={SB_GL} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".55" />
        <path d="M 14 33 C 5 17 19 7 33 13 C 47 19 48 35 38 37"
          stroke={SB_GOLD} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".65" />
      </svg>
    </div>
  );
}

function SBLogo({ sz = 22 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
      <svg width={sz * 1.9} height={sz * 1.9} viewBox="0 0 46 46">
        <rect x="1.5"  y="1.5"  width="19" height="19" rx="5.5" fill="#7D4B2C" />
        <rect x="25.5" y="1.5"  width="19" height="19" rx="5.5" fill="#572D0A" />
        <rect x="1.5"  y="25.5" width="19" height="19" rx="5.5" fill="#572D0A" />
        <rect x="25.5" y="25.5" width="19" height="19" rx="5.5" fill="#7D4B2C" />
        <circle cx="23" cy="23" r="5.2" fill="#6A3A18" opacity=".52" />
      </svg>
      <span style={{ fontFamily:SB_FB, fontWeight:700, fontSize:sz, color:SB_TD, letterSpacing:.3 }}>SoilBuild</span>
    </div>
  );
}

function SparkStar({ sz = 10, del = '0s', dur = '2.2s', an = 'sbTw1' }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 10 10"
      style={{ display:'block', animation:`${an} ${dur} ${del} ease-in-out infinite` }}>
      <polygon points="5,0 6.18,3.62 10,5 6.18,6.38 5,10 3.82,6.38 0,5 3.82,3.62" fill={SB_GB} />
    </svg>
  );
}

const SB_SPARKS = [
  { pos:{ top:'5%',  left:'11%'  }, sz:5, del:'0s',   dur:'2.3s', an:'sbTw1' },
  { pos:{ top:'4%',  right:'16%' }, sz:3, del:'.65s', dur:'1.9s', an:'sbTw2' },
  { pos:{ top:'20%', left:'4%'   }, sz:4, del:'.3s',  dur:'2.7s', an:'sbTw3' },
  { pos:{ top:'16%', right:'6%'  }, sz:4, del:'.9s',  dur:'2.2s', an:'sbTw1' },
  { pos:{ top:'78%', left:'7%'   }, sz:4, del:'.2s',  dur:'2.6s', an:'sbTw2' },
  { pos:{ top:'72%', right:'9%'  }, sz:3, del:'.75s', dur:'1.8s', an:'sbTw3' },
  { pos:{ top:'50%', left:'2%'   }, sz:3, del:'.4s',  dur:'2.5s', an:'sbTw1' },
  { pos:{ top:'47%', right:'2%'  }, sz:4, del:'.15s', dur:'2.0s', an:'sbTw2' },
  { pos:{ top:'63%', left:'15%'  }, sz:2, del:'.85s', dur:'1.7s', an:'sbTw3' },
  { pos:{ top:'34%', right:'13%' }, sz:5, del:'.5s',  dur:'3.0s', an:'sbTw1' },
  { pos:{ top:'89%', left:'20%'  }, sz:3, del:'.35s', dur:'2.3s', an:'sbTw2' },
  { pos:{ top:'85%', right:'18%' }, sz:3, del:'.6s',  dur:'1.8s', an:'sbTw3' },
  { pos:{ top:'41%', left:'5%'   }, sz:2, del:'.7s',  dur:'2.5s', an:'sbTw1' },
  { pos:{ top:'58%', right:'5%'  }, sz:3, del:'.25s', dur:'2.1s', an:'sbTw2' },
  { pos:{ top:'25%', left:'9%'   }, sz:2, del:'1.0s', dur:'2.4s', an:'sbTw3' },
  { pos:{ top:'12%', left:'20%'  }, sz:3, del:'.45s', dur:'2.0s', an:'sbTw1' },
];

function SBSideRibbon({ flip = false }) {
  return (
    <svg style={{ position:'absolute', [flip ? 'right' : 'left']:0, top:0, height:'100%', width:70,
      opacity:.54, animation:'sbSideWave 4s ease-in-out infinite',
      animationDelay: flip ? '.55s' : '0s', transform: flip ? 'scaleX(-1)' : 'none' }}
      viewBox="0 0 70 1000" preserveAspectRatio="none">
      <path d="M62 50 Q14 178 54 315 Q82 440 24 568 Q-4 692 50 836 Q66 910 38 978"
        stroke={SB_GOLD} strokeWidth="2.1" fill="none" />
      <path d="M52 74 Q4 202 44 338 Q72 462 14 590"
        stroke={SB_GOLD} strokeWidth=".9" fill="none" opacity=".35" />
      <path d="M66 50 Q18 180 58 315"
        stroke={SB_GL} strokeWidth=".55" fill="none" opacity=".42" />
      <circle cx="62" cy="50"  r="4.4" fill={SB_GB} />
      <circle cx="24" cy="315" r="3.2" fill={SB_GOLD} />
      <circle cx="24" cy="568" r="2.9" fill={SB_GB} />
      <circle cx="50" cy="836" r="3.2" fill={SB_GOLD} />
      <circle cx="48" cy="178" r="1.9" fill={SB_GL} />
      <circle cx="16" cy="440" r="1.6" fill={SB_GB} />
      <circle cx="58" cy="692" r="1.9" fill={SB_GL} />
    </svg>
  );
}

function HomePage({ setPage, eventInfo, autoRole }) {
  useEffect(() => { injectSBStyles(); }, []);

  // Auto-redirect by URL role (preserve existing behaviour)
  useEffect(() => {
    if (autoRole === 'employee' || autoRole === 'vip') setPage('rsvp');
  }, [autoRole]);

  const evDate  = eventInfo?.date  || '23rd October 2026';
  const evTime  = eventInfo?.time  || '6:00 PM';
  const evVenue = eventInfo?.venue || 'Hilton Singapore, Orchard Rd';

  const cards = [
    { icon: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.5"><path d="M8 22l4-20 4 20"/><path d="M5 8h14"/></svg>, t:'Celebration', d:'50 years of excellence' },
    { icon: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.5"><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17a2 2 0 0 1-1 1.73C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17a2 2 0 0 0 1 1.73C16.15 18.75 17 20.24 17 22"/></svg>, t:'Recognition', d:'Honouring our people' },
    { icon: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>, t:'Lucky Draw', d:'Exciting prizes await' },
    { icon: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, t:'Community', d:'Together we build' },
  ];

  return (
    <div style={{ background:SB_BG, display:'flex', flexDirection:'column', minHeight:'100vh', fontFamily:SB_FB }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{ position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'80px 24px 60px' }}>
        <ChampagneCanvas />
        <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:600, width:'100%', animation:'sbFadeIn 1.2s ease both' }}>

          <FiftyEmblem size={220} />

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, margin:'6px 0 24px' }}>
            <div style={{ height:1, width:50, background:SB_GOLD, opacity:.6 }} />
            <p style={{ fontFamily:SB_FB, fontSize:11, color:SB_GD, letterSpacing:6, fontWeight:600, margin:0, textTransform:'uppercase' }}>Years &amp; Beyond</p>
            <div style={{ height:1, width:50, background:SB_GOLD, opacity:.6 }} />
          </div>

          <SBLogo sz={22} />

          <h1 style={{ fontFamily:SB_FH, fontSize:'clamp(24px,4.5vw,52px)', color:SB_TD, margin:'22px 0 12px', fontWeight:700, lineHeight:1.2 }}>
            Paving Tomorrow's Landscape
          </h1>

          <p style={{ color:SB_GD, letterSpacing:'2.5px', fontSize:11, margin:'0 0 42px', fontWeight:600, textTransform:'uppercase' }}>
            {evDate} &nbsp;·&nbsp; {evTime} &nbsp;·&nbsp; {evVenue}
          </p>

          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => setPage('rsvp')}
              style={{ background:SB_GOLD, color:SB_TD, border:'none', borderRadius:3, padding:'16px 54px', fontSize:12, fontWeight:700, letterSpacing:'2.5px', cursor:'pointer', textTransform:'uppercase', fontFamily:SB_FB, animation:'sbPulseBtn 2.5s ease-in-out infinite' }}>
              RSVP Now
            </button>
            <button onClick={() => setPage('invitation')}
              style={{ background:'transparent', color:SB_GD, border:`1.5px solid ${SB_GOLD}`, borderRadius:3, padding:'16px 54px', fontSize:12, fontWeight:700, letterSpacing:'2.5px', cursor:'pointer', textTransform:'uppercase', fontFamily:SB_FB }}>
              View Invitation
            </button>
          </div>
        </div>
      </section>

      {/* ── Highlight cards ───────────────────────────────────── */}
      <section style={{ background:SB_DK, padding:'52px 28px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, maxWidth:720, margin:'0 auto' }}>
          {cards.map(({ icon, t, d }) => (
            <div key={t} style={{ background:'rgba(201,168,76,.18)', border:'0.5px solid rgba(201,168,76,.6)', borderRadius:8, padding:'26px 12px', textAlign:'center' }}>
              <div style={{ marginBottom:12, display:'flex', justifyContent:'center' }}>{icon}</div>
              <p style={{ color:SB_TD, fontSize:13, fontWeight:600, margin:'0 0 5px', fontFamily:SB_FB }}>{t}</p>
              <p style={{ color:SB_GD, fontSize:11, margin:0, fontFamily:SB_FB }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{ background:'#1E0D00', padding:20, textAlign:'center', color:SB_GL, fontSize:11, fontFamily:SB_FB, letterSpacing:'1.5px' }}>
        © 2026 SoilBuild Group Holdings Ltd. &nbsp;—&nbsp; 50 Years &amp; Beyond
      </footer>
    </div>
  );
}

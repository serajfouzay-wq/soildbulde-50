/* ══════════════════════════════════════════════════════════════
   SOILBUILD 50 YEARS & BEYOND — v3
   Home page uses Image 2 (portrait invitation) as background.
   One image, looks right on phone AND desktop via object-position.
   ══════════════════════════════════════════════════════════════ */

const SB_GOLD = '#C9A84C';
const SB_GL   = '#F0D185';
const SB_GB   = '#FFD700';
const SB_GD   = '#8B6914';
const SB_TD   = '#3D2800';
const SB_TM   = '#5C3D11';
const SB_DK   = '#DFBA78';
const SB_FD   = "'Cormorant Garamond','Playfair Display',Georgia,serif";
const SB_FH   = "'Playfair Display',Georgia,serif";
const SB_FB   = "'DM Sans',system-ui,sans-serif";

function injectSBStyles() {
  if (document.getElementById('sb-css-2026')) return;
  const el = document.createElement('style');
  el.id = 'sb-css-2026';
  el.textContent =
    /* animations */
    "@keyframes sbFloatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}" +
    "@keyframes sbFadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}" +
    "@keyframes sbPulse{0%,100%{opacity:.9;transform:scale(1)}50%{opacity:1;transform:scale(1.03)}}" +
    "@keyframes sbGlow{0%,100%{box-shadow:0 0 0 0 rgba(240,209,133,0)}50%{box-shadow:0 0 24px 6px rgba(240,209,133,0.5)}}" +
    "@keyframes sbTw1{0%,100%{opacity:.1;transform:scale(.5)}50%{opacity:1;transform:scale(1.4)}}" +
    "@keyframes sbTw2{0%,100%{opacity:.4;transform:scale(1)}45%{opacity:1;transform:scale(1.5)}75%{opacity:.15;transform:scale(.8)}}" +
    "@keyframes sbTw3{0%,100%{opacity:.65;transform:scale(.85)}55%{opacity:.1;transform:scale(1.2)}}" +
    "@keyframes sbWave{0%,100%{opacity:.38}50%{opacity:.70}}" +
    "@keyframes sbCardIn{from{opacity:0;transform:translateY(28px) scale(.96)}to{opacity:1;transform:none}}" +
    /* background image: portrait image (bg-home.png) responsive focal point */
    ".sb-bg{object-position:35% top}" +                   /* mobile  — show centre-top of portrait */
    "@media(min-width:600px){.sb-bg{object-position:center 12%}}" + /* tablet */
    "@media(min-width:900px){.sb-bg{object-position:center 18%}}" + /* desktop */
    /* button row stacks on small screens */
    ".sb-btns{display:flex;gap:clamp(10px,2vw,14px);justify-content:center;flex-wrap:wrap}" +
    "@media(max-width:420px){.sb-btns{flex-direction:column;align-items:stretch;padding:0 24px}}";
  document.head.appendChild(el);
}

/* ── Canvas: sweeping gold ribbons + vertical light pulse + sparkles ── */
function ChampagneCanvas() {
  const ref = useRef(null), rf = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    let t = 0;
    const ctx = c.getContext('2d');
    const sz = () => {
      const p = c.parentElement;
      c.width  = p.offsetWidth  || 800;
      c.height = p.offsetHeight || 700;
    };
    sz(); window.addEventListener('resize', sz);

    const pts = Array.from({ length: 88 }, () => ({
      x: Math.random(), y: Math.random(),
      size:  Math.random() * 3.2 + .8,
      speed: Math.random() * .00026 + .00008,
      phase: Math.random() * Math.PI * 2,
      col: [SB_GB, SB_GL, '#FFFFFF', '#FFF5C0', SB_GOLD][Math.floor(Math.random() * 5)],
    }));

    /* triple-stroke glowing arc */
    const arc = (x1,y1,cx,cy,x2,y2,a,cw) => {
      const W = c.width, H = c.height;
      const d = (sw,sc) => {
        ctx.beginPath(); ctx.moveTo(x1*W,y1*H);
        ctx.quadraticCurveTo(cx*W,cy*H,x2*W,y2*H);
        ctx.strokeStyle=sc; ctx.lineWidth=sw; ctx.lineCap='round'; ctx.stroke();
      };
      d(cw*5.5, `rgba(255,220,110,${a*.22})`);
      d(cw*2.2, `rgba(201,168,76,${a*.65})`);
      d(cw,     `rgba(201,168,76,${a})`);
      d(Math.max(.4,cw*.26), `rgba(255,248,180,${a*.74})`);
    };

    const frame = () => {
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);

      /* ── Vertical light orb moves up & down slowly ── */
      const ly = H * (0.35 + Math.sin(t * .42) * .22);
      let g = ctx.createRadialGradient(W/2,ly,0,W/2,ly,W*.55);
      g.addColorStop(0, `rgba(255,240,155,${.10+Math.abs(Math.sin(t*.42))*.06})`);
      g.addColorStop(.65,`rgba(201,168,76,${.04+Math.abs(Math.sin(t*.42))*.03})`);
      g.addColorStop(1,   'rgba(201,168,76,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

      /* ── Warm floor glow ── */
      g = ctx.createRadialGradient(W/2,H,0,W/2,H,H*.75);
      g.addColorStop(0,  'rgba(255,210,72,.74)');
      g.addColorStop(.38,'rgba(201,168,76,.26)');
      g.addColorStop(1,  'rgba(201,168,76,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

      const s1 = Math.sin(t*.38)*.045, s2 = Math.cos(t*.38)*.045;
      const p  = (Math.sin(t*.55)+1)/2;

      /* ── Left sweeping ribbons ── */
      arc(-.07,.15+s1, .06,.91, .53,1.09, .80+p*.14,3.6);
      arc(-.07,.20+s1, .02,.87, .47,1.09, .50+p*.09,2.0);
      arc(-.07,.12+s1, .12,.94, .59,1.09, .28,      1.1);
      arc(-.10,.27+s1,-.02,.84, .43,1.09, .16,      .62);
      arc(-.04,.10+s1, .18,.97, .65,1.09, .09,      .38);

      /* ── Right sweeping ribbons ── */
      arc(1.07,.21+s2, .94,.91, .47,1.09, .80+p*.14,3.6);
      arc(1.07,.26+s2, .98,.87, .53,1.09, .50+p*.09,2.0);
      arc(1.07,.17+s2, .88,.94, .41,1.09, .28,      1.1);
      arc(1.10,.32+s2,1.02,.84, .57,1.09, .16,      .62);
      arc(1.04,.14+s2, .82,.97, .35,1.09, .09,      .38);

      /* ── Corner accent streaks ── */
      arc(-.02,.06, .05,.33,.27,.53, .30,.95);
      arc(1.02,.08, .95,.35,.73,.55, .30,.95);

      /* ── Sparkle particles drifting upward ── */
      const now = t * 2.2;
      pts.forEach(p => {
        const a = (Math.sin(now + p.phase)+1)/2; if (a < .07) return;
        const x = p.x*W, y = ((p.y + p.speed*t*100)%1)*H;
        const r = p.size*(.68+a*.62), ri = r*.28;
        ctx.save(); ctx.translate(x,y); ctx.rotate(now*.3);
        ctx.fillStyle = p.col; ctx.globalAlpha = a*.92;
        ctx.beginPath();
        for (let i=0;i<4;i++) {
          const a1=(i/4)*Math.PI*2, a2=a1+Math.PI/4;
          ctx.lineTo(Math.cos(a1)*r, Math.sin(a1)*r);
          ctx.lineTo(Math.cos(a2)*ri,Math.sin(a2)*ri);
        }
        ctx.closePath(); ctx.fill(); ctx.globalAlpha=1; ctx.restore();
      });

      t += .009; rf.current = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(rf.current); window.removeEventListener('resize',sz); };
  },[]);
  return <canvas ref={ref} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none'}}/>;
}

/* ── 50 Years emblem ── */
function FiftyEmblem() {
  return (
    <div style={{animation:'sbFloatY 4s ease-in-out infinite',display:'block',
      width:'clamp(120px,36vw,210px)',margin:'0 auto'}}>
      <svg width="100%" viewBox="0 0 280 248" style={{display:'block'}}>
        <defs>
          <linearGradient id="sbG50" x1="5%" y1="0%" x2="95%" y2="100%">
            <stop offset="0%"   stopColor="#FAF0B0"/>
            <stop offset="30%"  stopColor="#F0D185"/>
            <stop offset="65%"  stopColor="#C9A84C"/>
            <stop offset="100%" stopColor="#8B6914"/>
          </linearGradient>
        </defs>
        <text x="140" y="188" textAnchor="middle"
          fontFamily={SB_FD} fontStyle="italic" fontWeight="700"
          fontSize="205" fill="url(#sbG50)" letterSpacing="-10">50</text>
        <path d="M 22 207 C 68 234 116 242 140 227 C 164 212 212 232 258 207"
          stroke={SB_GL} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M 38 216 C 82 242 118 248 140 234 C 162 220 204 240 242 216"
          stroke={SB_GOLD} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".5"/>
        <path d="M 14 33 C 5 17 19 7 33 13 C 47 19 48 35 38 37"
          stroke={SB_GL} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".72"/>
      </svg>
    </div>
  );
}

/* ── SoilBuild logo ── */
function SBLogo({ onDark = true }) {
  const textCol = onDark ? '#FFFFFF' : SB_TD;
  return (
    <div style={{display:'flex',alignItems:'center',gap:'clamp(6px,1.5vw,10px)',justifyContent:'center'}}>
      <svg width="clamp(32px,5.5vw,42px)" height="clamp(32px,5.5vw,42px)" viewBox="0 0 46 46">
        <rect x="1.5"  y="1.5"  width="19" height="19" rx="5.5" fill="#7D4B2C"/>
        <rect x="25.5" y="1.5"  width="19" height="19" rx="5.5" fill="#572D0A"/>
        <rect x="1.5"  y="25.5" width="19" height="19" rx="5.5" fill="#572D0A"/>
        <rect x="25.5" y="25.5" width="19" height="19" rx="5.5" fill="#7D4B2C"/>
        <circle cx="23" cy="23" r="5.2" fill="#6A3A18" opacity=".52"/>
      </svg>
      <span style={{fontFamily:SB_FB,fontWeight:700,
        fontSize:'clamp(14px,3.2vw,22px)',color:textCol,letterSpacing:'.3px'}}>SoilBuild</span>
    </div>
  );
}

/* ── Sparkle star ── */
function SparkStar({sz=10,del='0s',dur='2.2s',an='sbTw1'}) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 10 10"
      style={{display:'block',animation:`${an} ${dur} ${del} ease-in-out infinite`}}>
      <polygon points="5,0 6.18,3.62 10,5 6.18,6.38 5,10 3.82,6.38 0,5 3.82,3.62" fill={SB_GB}/>
    </svg>
  );
}

const SB_SPARKS = [
  {pos:{top:'5%',left:'11%'},sz:5,del:'0s',dur:'2.3s',an:'sbTw1'},
  {pos:{top:'4%',right:'16%'},sz:3,del:'.65s',dur:'1.9s',an:'sbTw2'},
  {pos:{top:'20%',left:'4%'},sz:4,del:'.3s',dur:'2.7s',an:'sbTw3'},
  {pos:{top:'16%',right:'6%'},sz:4,del:'.9s',dur:'2.2s',an:'sbTw1'},
  {pos:{top:'78%',left:'7%'},sz:4,del:'.2s',dur:'2.6s',an:'sbTw2'},
  {pos:{top:'72%',right:'9%'},sz:3,del:'.75s',dur:'1.8s',an:'sbTw3'},
  {pos:{top:'50%',left:'2%'},sz:3,del:'.4s',dur:'2.5s',an:'sbTw1'},
  {pos:{top:'47%',right:'2%'},sz:4,del:'.15s',dur:'2.0s',an:'sbTw2'},
  {pos:{top:'63%',left:'15%'},sz:2,del:'.85s',dur:'1.7s',an:'sbTw3'},
  {pos:{top:'34%',right:'13%'},sz:5,del:'.5s',dur:'3.0s',an:'sbTw1'},
  {pos:{top:'89%',left:'20%'},sz:3,del:'.35s',dur:'2.3s',an:'sbTw2'},
  {pos:{top:'85%',right:'18%'},sz:3,del:'.6s',dur:'1.8s',an:'sbTw3'},
  {pos:{top:'41%',left:'5%'},sz:2,del:'.7s',dur:'2.5s',an:'sbTw1'},
  {pos:{top:'58%',right:'5%'},sz:3,del:'.25s',dur:'2.1s',an:'sbTw2'},
  {pos:{top:'25%',left:'9%'},sz:2,del:'1.0s',dur:'2.4s',an:'sbTw3'},
  {pos:{top:'12%',left:'20%'},sz:3,del:'.45s',dur:'2.0s',an:'sbTw1'},
];

function SBSideRibbon({ flip = false }) {
  return (
    <svg style={{
      position:'absolute',[flip?'right':'left']:0,top:0,
      height:'100%',width:'clamp(40px,7vw,68px)',
      opacity:.50,animation:'sbWave 4s ease-in-out infinite',
      animationDelay:flip?'.55s':'0s',
      transform:flip?'scaleX(-1)':'none',
    }} viewBox="0 0 70 1000" preserveAspectRatio="none">
      <path d="M62 50 Q14 178 54 315 Q82 440 24 568 Q-4 692 50 836 Q66 910 38 978"
        stroke={SB_GL} strokeWidth="2.2" fill="none"/>
      <path d="M52 74 Q4 202 44 338 Q72 462 14 590"
        stroke={SB_GOLD} strokeWidth="1.0" fill="none" opacity=".38"/>
      <path d="M66 50 Q18 180 58 315 Q86 440 28 568"
        stroke="#FFFFFF" strokeWidth=".5" fill="none" opacity=".28"/>
      <circle cx="62" cy="50"  r="4.4" fill={SB_GB}/>
      <circle cx="24" cy="315" r="3.2" fill={SB_GL}/>
      <circle cx="24" cy="568" r="2.9" fill={SB_GB}/>
      <circle cx="50" cy="836" r="3.2" fill={SB_GL}/>
      <circle cx="48" cy="178" r="1.8" fill="#FFFFFF"/>
      <circle cx="16" cy="440" r="1.5" fill={SB_GB}/>
      <circle cx="58" cy="692" r="1.8" fill={SB_GL}/>
    </svg>
  );
}

/* ══ HOME PAGE ═══════════════════════════════════════════════ */
function HomePage({ setPage, eventInfo, autoRole }) {
  useEffect(() => { injectSBStyles(); }, []);
  useEffect(() => {
    if (autoRole === 'employee' || autoRole === 'vip') setPage('rsvp');
  }, [autoRole]);

  const evDate  = eventInfo?.date  || '23rd October 2026';
  const evTime  = eventInfo?.time  || '6:00 PM';
  const evVenue = eventInfo?.venue || 'Hilton Singapore, Orchard Rd';

  const cards = [
    { icon:<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.5"><path d="M8 22l4-20 4 20"/><path d="M5 8h14"/></svg>, t:'Celebration', d:'50 years of excellence' },
    { icon:<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.5"><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17a2 2 0 0 1-1 1.73C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17a2 2 0 0 0 1 1.73C16.15 18.75 17 20.24 17 22"/></svg>, t:'Recognition', d:'Honouring our people' },
    { icon:<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>, t:'Lucky Draw', d:'Exciting prizes await' },
    { icon:<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, t:'Community', d:'Together we build' },
  ];

  return (
    <div style={{ fontFamily:SB_FB }}>

      {/* ── HERO — bg-home.png (Image 2, portrait) ─────────── */}
      <section style={{
        position:'relative', overflow:'hidden',
        display:'flex', alignItems:'center', justifyContent:'center',
        minHeight:'100vh',
        padding:'clamp(70px,10vh,110px) clamp(16px,5vw,48px) clamp(50px,7vh,80px)',
      }}>

        {/* Background image — ONE image, CSS handles phone vs desktop focus */}
        <img
          src="/bg-home.png"
          alt=""
          className="sb-bg"
          style={{
            position:'absolute', inset:0,
            width:'100%', height:'100%',
            objectFit:'cover',
            pointerEvents:'none',
          }}
        />

        {/* Dark warm overlay — slightly stronger so text pops on any crop */}
        <div style={{position:'absolute',inset:0,background:'rgba(10,3,0,0.42)',pointerEvents:'none'}}/>

        {/* Animated canvas (ribbons + light pulse + sparkles) */}
        <ChampagneCanvas/>

        {/* Page content */}
        <div style={{
          position:'relative', zIndex:2, textAlign:'center',
          width:'100%', maxWidth:'min(620px,92vw)',
          animation:'sbFadeIn 1.4s ease both',
        }}>

          <FiftyEmblem/>

          {/* Years & Beyond divider */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',
            gap:'clamp(8px,2vw,16px)',
            margin:'clamp(4px,1vh,8px) 0 clamp(14px,3vh,24px)'}}>
            <div style={{height:1,width:'clamp(18px,4vw,48px)',background:SB_GL,opacity:.75}}/>
            <p style={{fontFamily:SB_FB,fontSize:'clamp(9px,1.8vw,11px)',color:SB_GL,
              letterSpacing:'clamp(3px,.8vw,6px)',fontWeight:600,margin:0,
              textTransform:'uppercase'}}>Years &amp; Beyond</p>
            <div style={{height:1,width:'clamp(18px,4vw,48px)',background:SB_GL,opacity:.75}}/>
          </div>

          <SBLogo onDark={true}/>

          <h1 style={{
            fontFamily:SB_FH,
            fontSize:'clamp(22px,5.5vw,52px)',
            color:'#FFFFFF',
            margin:'clamp(14px,3vh,22px) 0 clamp(8px,1.5vh,12px)',
            fontWeight:700, lineHeight:1.2,
            textShadow:'0 2px 28px rgba(0,0,0,0.65)',
          }}>Paving Tomorrow's Landscape</h1>

          <p style={{
            color:'rgba(255,255,255,0.82)',
            letterSpacing:'clamp(1px,.4vw,2.5px)',
            fontSize:'clamp(9px,1.8vw,11px)',
            margin:'0 0 clamp(24px,5vh,42px)',
            fontWeight:600, textTransform:'uppercase',
          }}>{evDate}&nbsp;·&nbsp;{evTime}&nbsp;·&nbsp;{evVenue}</p>

          {/* Buttons — stack on mobile, side-by-side on desktop */}
          <div className="sb-btns">
            <button onClick={() => setPage('rsvp')} style={{
              background:SB_GOLD, color:SB_TD, border:'none', borderRadius:4,
              padding:'clamp(13px,2.5vh,17px) clamp(28px,6vw,58px)',
              fontSize:'clamp(11px,2vw,13px)', fontWeight:700,
              letterSpacing:'clamp(1.5px,.5vw,2.5px)', cursor:'pointer',
              textTransform:'uppercase', fontFamily:SB_FB,
              animation:'sbPulse 2.5s ease-in-out infinite, sbGlow 3s ease-in-out infinite',
              minWidth:'clamp(140px,32vw,200px)',
            }}>RSVP Now</button>

            <button onClick={() => setPage('invitation')} style={{
              background:'rgba(255,255,255,0.10)',
              color:'#FFFFFF',
              border:`1.5px solid ${SB_GL}`,
              borderRadius:4,
              padding:'clamp(13px,2.5vh,17px) clamp(28px,6vw,58px)',
              fontSize:'clamp(11px,2vw,13px)', fontWeight:700,
              letterSpacing:'clamp(1.5px,.5vw,2.5px)', cursor:'pointer',
              textTransform:'uppercase', fontFamily:SB_FB,
              minWidth:'clamp(140px,32vw,200px)',
            }}>View Invitation</button>
          </div>
        </div>
      </section>

      {/* ── Highlight cards ─────────────────────────────────── */}
      <section style={{background:SB_DK,padding:'clamp(32px,6vh,52px) clamp(16px,4vw,28px)'}}>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit,minmax(clamp(110px,20vw,155px),1fr))',
          gap:'clamp(10px,2vw,14px)',
          maxWidth:720, margin:'0 auto',
        }}>
          {cards.map(({icon,t,d}) => (
            <div key={t} style={{
              background:'rgba(201,168,76,.18)',
              border:'0.5px solid rgba(201,168,76,.6)',
              borderRadius:8,
              padding:'clamp(18px,3.5vh,26px) clamp(8px,2vw,12px)',
              textAlign:'center',
            }}>
              <div style={{marginBottom:'clamp(8px,1.5vh,12px)',display:'flex',justifyContent:'center'}}>{icon}</div>
              <p style={{color:SB_TD,fontSize:'clamp(11px,2vw,13px)',fontWeight:600,margin:'0 0 4px',fontFamily:SB_FB}}>{t}</p>
              <p style={{color:SB_GD,fontSize:'clamp(9px,1.6vw,11px)',margin:0,fontFamily:SB_FB}}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{
        background:'#1E0D00', padding:'clamp(14px,2.5vh,20px)',
        textAlign:'center', color:SB_GL,
        fontSize:'clamp(9px,1.6vw,11px)', fontFamily:SB_FB, letterSpacing:'1.5px',
      }}>
        © 2026 SoilBuild Group Holdings Ltd. &nbsp;—&nbsp; 50 Years &amp; Beyond
      </footer>
    </div>
  );
}

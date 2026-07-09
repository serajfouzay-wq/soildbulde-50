/* ════════════════════════════════════════════════════════════
   SOILBUILD 50 YEARS & BEYOND — v4
   Uses actual PNG assets. No nav bar. Floating buttons.
   ════════════════════════════════════════════════════════════ */

const SB_GOLD='#C9A84C',SB_GL='#F0D185',SB_GB='#FFD700',SB_GD='#8B6914';
const SB_TD='#3D2800',SB_TM='#5C3D11',SB_FB="'DM Sans',system-ui,sans-serif";
const SB_FH="'Playfair Display',Georgia,serif";

function injectSBStyles(){
  if(document.getElementById('sb-css-2026'))return;
  const el=document.createElement('style');
  el.id='sb-css-2026';
  el.textContent=
    "@keyframes sbFloatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}"+
    "@keyframes sbPulse{0%,100%{opacity:.88;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}"+
    "@keyframes sbFadeIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}"+
    "@keyframes sbTw1{0%,100%{opacity:.1;transform:scale(.5)}50%{opacity:1;transform:scale(1.4)}}"+
    "@keyframes sbTw2{0%,100%{opacity:.4;transform:scale(1)}45%{opacity:1;transform:scale(1.5)}75%{opacity:.15;transform:scale(.8)}}"+
    "@keyframes sbTw3{0%,100%{opacity:.65;transform:scale(.85)}55%{opacity:.1;transform:scale(1.2)}}"+
    "@keyframes sbWave{0%,100%{opacity:.38}50%{opacity:.70}}"+
    "@keyframes sbCardIn{from{opacity:0;transform:translateY(28px) scale(.96)}to{opacity:1;transform:none}}"+
    /* bg focal point per screen size */
    ".sb-bg{object-fit:cover;object-position:35% top}"+
    "@media(min-width:600px){.sb-bg{object-position:center 8%}}"+
    "@media(min-width:900px){.sb-bg{object-position:center center}}"+
    /* floating nav buttons */
    ".sb-float{background:rgba(201,168,76,0.92);color:#3D2800;border:1.5px solid rgba(240,209,133,0.9);"+
    "border-radius:22px;padding:clamp(7px,1.5vh,10px) clamp(12px,2.5vw,18px);"+
    "font-size:clamp(10px,1.6vw,12px);font-weight:700;cursor:pointer;"+
    "font-family:'DM Sans',system-ui,sans-serif;letter-spacing:.5px;white-space:nowrap;transition:all .2s}"+
    ".sb-float:hover{background:rgba(240,209,133,1);transform:translateY(-2px)}"+
    /* button row */
    ".sb-btns{display:flex;gap:clamp(8px,2vw,14px);justify-content:center;flex-wrap:wrap}"+
    "@media(max-width:420px){.sb-btns{flex-direction:column;align-items:center}}";
  document.head.appendChild(el);
}

/* Sparkle particles + vertical light pulse only
   (bg images already have the ribbon wave graphics) */
function SparkleCanvas(){
  const ref=useRef(null),rf=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    let t=0;
    const ctx=c.getContext('2d');
    const sz=()=>{const p=c.parentElement;c.width=p.offsetWidth||800;c.height=p.offsetHeight||700;};
    sz();window.addEventListener('resize',sz);
    const pts=Array.from({length:60},()=>({
      x:Math.random(),y:Math.random(),
      size:Math.random()*3+.8,speed:Math.random()*.00025+.00008,
      phase:Math.random()*Math.PI*2,
      col:[SB_GB,SB_GL,'#FFFFFF','#FFF5C0'][Math.floor(Math.random()*4)],
    }));
    const frame=()=>{
      const W=c.width,H=c.height;ctx.clearRect(0,0,W,H);
      /* vertical light orb — moves up and down slowly */
      const ly=H*(0.35+Math.sin(t*.42)*.22);
      const g=ctx.createRadialGradient(W/2,ly,0,W/2,ly,W*.52);
      g.addColorStop(0,`rgba(255,240,155,${.08+Math.abs(Math.sin(t*.42))*.06})`);
      g.addColorStop(1,'rgba(255,240,155,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      /* sparkle stars drifting upward */
      const now=t*2.2;
      pts.forEach(p=>{
        const a=(Math.sin(now+p.phase)+1)/2;if(a<.07)return;
        const x=p.x*W,y=((p.y+p.speed*t*100)%1)*H;
        const r=p.size*(.68+a*.62),ri=r*.28;
        ctx.save();ctx.translate(x,y);ctx.rotate(now*.3);
        ctx.fillStyle=p.col;ctx.globalAlpha=a*.9;
        ctx.beginPath();
        for(let i=0;i<4;i++){const a1=(i/4)*Math.PI*2,a2=a1+Math.PI/4;ctx.lineTo(Math.cos(a1)*r,Math.sin(a1)*r);ctx.lineTo(Math.cos(a2)*ri,Math.sin(a2)*ri);}
        ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.restore();
      });
      t+=.009;rf.current=requestAnimationFrame(frame);
    };
    frame();
    return()=>{cancelAnimationFrame(rf.current);window.removeEventListener('resize',sz);};
  },[]);
  return <canvas ref={ref} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none'}}/>;
}

function SparkStar({sz=10,del='0s',dur='2.2s',an='sbTw1'}){
  return(
    <svg width={sz} height={sz} viewBox="0 0 10 10" style={{display:'block',animation:`${an} ${dur} ${del} ease-in-out infinite`}}>
      <polygon points="5,0 6.18,3.62 10,5 6.18,6.38 5,10 3.82,6.38 0,5 3.82,3.62" fill={SB_GB}/>
    </svg>
  );
}

const SB_SPARKS=[
  {pos:{top:'5%',left:'11%'},sz:5,del:'0s',dur:'2.3s',an:'sbTw1'},
  {pos:{top:'4%',right:'16%'},sz:3,del:'.65s',dur:'1.9s',an:'sbTw2'},
  {pos:{top:'20%',left:'4%'},sz:4,del:'.3s',dur:'2.7s',an:'sbTw3'},
  {pos:{top:'16%',right:'6%'},sz:4,del:'.9s',dur:'2.2s',an:'sbTw1'},
  {pos:{top:'78%',left:'7%'},sz:4,del:'.2s',dur:'2.6s',an:'sbTw2'},
  {pos:{top:'72%',right:'9%'},sz:3,del:'.75s',dur:'1.8s',an:'sbTw3'},
  {pos:{top:'50%',left:'2%'},sz:3,del:'.4s',dur:'2.5s',an:'sbTw1'},
  {pos:{top:'47%',right:'2%'},sz:4,del:'.15s',dur:'2.0s',an:'sbTw2'},
  {pos:{top:'34%',right:'13%'},sz:5,del:'.5s',dur:'3.0s',an:'sbTw1'},
  {pos:{top:'89%',left:'20%'},sz:3,del:'.35s',dur:'2.3s',an:'sbTw2'},
  {pos:{top:'41%',left:'5%'},sz:2,del:'.7s',dur:'2.5s',an:'sbTw1'},
  {pos:{top:'58%',right:'5%'},sz:3,del:'.25s',dur:'2.1s',an:'sbTw2'},
];

function SBSideRibbon({flip=false}){
  return(
    <svg style={{position:'absolute',[flip?'right':'left']:0,top:0,height:'100%',width:'clamp(40px,7vw,68px)',opacity:.48,animation:'sbWave 4s ease-in-out infinite',animationDelay:flip?'.55s':'0s',transform:flip?'scaleX(-1)':'none'}} viewBox="0 0 70 1000" preserveAspectRatio="none">
      <path d="M62 50 Q14 178 54 315 Q82 440 24 568 Q-4 692 50 836" stroke={SB_GL} strokeWidth="2.2" fill="none"/>
      <circle cx="62" cy="50" r="4.4" fill={SB_GB}/><circle cx="24" cy="315" r="3.2" fill={SB_GL}/>
      <circle cx="24" cy="568" r="2.9" fill={SB_GB}/><circle cx="50" cy="836" r="3.2" fill={SB_GL}/>
    </svg>
  );
}

/* ════ HOME PAGE — no nav bar, PNG assets, floating buttons ═ */
function HomePage({setPage,eventInfo,autoRole}){
  useEffect(()=>{injectSBStyles();},[]);
  useEffect(()=>{if(autoRole==='employee'||autoRole==='vip')setPage('rsvp');},[autoRole]);

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden',background:'#F5E6C0',fontFamily:SB_FB}}>

      {/* Responsive background: landscape desktop, portrait mobile */}
      <picture>
        <source media="(min-width:768px)" srcSet="/bg-home.png"/>
        <img src="/bg-home-p.png" className="sb-bg" alt=""
          style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>
      </picture>

      {/* Sparkle + light-pulse canvas */}
      <SparkleCanvas/>

      {/* ── Floating nav buttons (no header bar) ── */}
      <div style={{
        position:'absolute',top:'clamp(10px,2vh,18px)',right:'clamp(10px,2vw,18px)',
        zIndex:50,display:'flex',gap:'clamp(6px,1.2vw,10px)',flexWrap:'wrap',justifyContent:'flex-end',
      }}>
        <button className="sb-float" onClick={()=>setPage('helpdesk')}>📋 Helpdesk</button>
        <button className="sb-float" onClick={()=>setPage('qr-scanner')}>📷 Check-In</button>
        <button className="sb-float" onClick={()=>setPage('admin')}>🔒 Admin</button>
      </div>

      {/* ── Main content — actual PNG assets stacked ── */}
      <div style={{
        position:'relative',zIndex:2,
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        minHeight:'100vh',
        padding:'clamp(70px,10vh,110px) clamp(16px,5vw,48px) clamp(40px,6vh,60px)',
        textAlign:'center',
        animation:'sbFadeIn 1.2s ease both',
      }}>

        {/* Actual calligraphic 50 logo PNG — animated float */}
        <img src="/img-fifty.png" alt="50 Years & Beyond" style={{
          width:'clamp(150px,36vw,280px)',
          marginBottom:'clamp(10px,2vh,18px)',
          animation:'sbFloatY 4s ease-in-out infinite',
        }}/>

        {/* Actual SoilBuild gold logo PNG */}
        <img src="/img-sb-logo.png" alt="SoilBuild" style={{
          width:'clamp(120px,26vw,200px)',
          marginBottom:'clamp(8px,1.5vh,14px)',
        }}/>

        {/* "SoilBuild 50 Years & Beyond" title text PNG */}
        <img src="/img-title.png" alt="SoilBuild 50 Years & Beyond" style={{
          width:'clamp(200px,50vw,420px)',
          marginBottom:'clamp(14px,2.5vh,24px)',
        }}/>

        {/* Event details box PNG */}
        <img src="/img-eventbox.png" alt="Event Details" style={{
          width:'clamp(240px,56vw,440px)',
          marginBottom:'clamp(20px,3.5vh,32px)',
        }}/>

        {/* RSVP NOW — actual button PNG, clickable + animated */}
        <img src="/img-rsvp.png" alt="RSVP Now" onClick={()=>setPage('rsvp')} style={{
          width:'clamp(180px,38vw,300px)',
          cursor:'pointer',
          marginBottom:'clamp(12px,2vh,18px)',
          animation:'sbPulse 2.5s ease-in-out infinite',
        }}/>

        {/* View Invitation — gold outlined pill button */}
        <button onClick={()=>setPage('invitation')} style={{
          background:'rgba(255,255,255,0.15)',color:SB_GD,
          border:`1.5px solid ${SB_GOLD}`,borderRadius:25,
          padding:'clamp(10px,2vh,13px) clamp(24px,5vw,42px)',
          fontSize:'clamp(11px,1.8vw,13px)',fontWeight:600,
          letterSpacing:'2px',cursor:'pointer',
          textTransform:'uppercase',fontFamily:SB_FB,
        }}>View Invitation</button>
      </div>
    </div>
  );
}

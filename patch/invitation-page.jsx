function InvitationPage({ setPage, eventInfo }) {
  const [name, setName] = useState('');
  useEffect(() => { injectSBStyles(); }, []);

  const evDate  = eventInfo?.date  || '23rd October 2026';
  const evVenue = eventInfo?.venue || 'Hilton Singapore, Orchard Rd';

  return (
    <div style={{ background:SB_BG, position:'relative', overflow:'hidden', minHeight:'100vh', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'48px 20px 64px', fontFamily:SB_FB }}>

      {/* Ambient sparkle stars */}
      {SB_SPARKS.map(({ pos, sz, del, dur, an }, i) => (
        <div key={i} style={{ position:'absolute', ...pos }}>
          <SparkStar sz={sz} del={del} dur={dur} an={an} />
        </div>
      ))}

      {/* Side ribbons */}
      <SBSideRibbon flip={false} />
      <SBSideRibbon flip={true} />

      {/* Invitation card */}
      <div style={{ background:SB_CARD, borderRadius:8, padding:'44px 38px', maxWidth:460, width:'100%', position:'relative', zIndex:1, textAlign:'center', animation:'sbCardIn .9s cubic-bezier(.22,.8,.36,1) both' }}>

        {/* Corner bracket ornaments */}
        {[
          { top:'12px', left:'12px',   borderTop:`2px solid ${SB_GOLD}`,    borderLeft:`2px solid ${SB_GOLD}`   },
          { top:'12px', right:'12px',  borderTop:`2px solid ${SB_GOLD}`,    borderRight:`2px solid ${SB_GOLD}`  },
          { bottom:'12px', left:'12px',  borderBottom:`2px solid ${SB_GOLD}`, borderLeft:`2px solid ${SB_GOLD}`  },
          { bottom:'12px', right:'12px', borderBottom:`2px solid ${SB_GOLD}`, borderRight:`2px solid ${SB_GOLD}` },
        ].map((s, i) => (
          <div key={i} style={{ position:'absolute', width:28, height:28, borderRadius:0, ...s }} />
        ))}

        {/* YOU'RE INVITED */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:8 }}>
          <SparkStar sz={10} del="0s"   dur="2.4s" an="sbTw2" />
          <span style={{ fontFamily:SB_FB, fontSize:10, color:SB_GD, letterSpacing:'5px', fontWeight:600, textTransform:'uppercase' }}>
            You're Invited
          </span>
          <SparkStar sz={10} del="1.2s" dur="2.4s" an="sbTw2" />
        </div>

        {/* 50 emblem */}
        <FiftyEmblem size={148} />

        {/* YEARS & BEYOND */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, margin:'4px 0 12px' }}>
          <div style={{ height:1, width:28, background:SB_GOLD, opacity:.5 }} />
          <p style={{ fontFamily:SB_FB, fontSize:9, color:SB_GD, letterSpacing:'4px', fontWeight:600, margin:0, textTransform:'uppercase' }}>Years &amp; Beyond</p>
          <div style={{ height:1, width:28, background:SB_GOLD, opacity:.5 }} />
        </div>

        {/* SoilBuild logo */}
        <SBLogo sz={17} />

        {/* Cloud / mist overlay section */}
        <div style={{ margin:'18px -38px 0', padding:'24px 38px 20px', background:'rgba(255,255,255,.52)', borderTop:'0.5px solid rgba(201,168,76,.38)', borderBottom:'0.5px solid rgba(201,168,76,.38)' }}>
          <h1 style={{ fontFamily:SB_FH, fontSize:'clamp(18px,3.8vw,24px)', color:SB_GOLD, margin:'0 0 8px', fontWeight:700, lineHeight:1.3 }}>
            SoilBuild 50 Years &amp; Beyond
          </h1>
          {name && (
            <p style={{ fontFamily:SB_FH, fontSize:16, color:SB_GD, fontStyle:'italic', margin:'0 0 8px' }}>
              Dear {name},
            </p>
          )}
          <p style={{ color:SB_TM, fontSize:13, lineHeight:1.72, margin:0 }}>
            Join us as we celebrate a remarkable milestone and look ahead to the future.
          </p>
        </div>

        {/* Event details */}
        <div style={{ margin:'20px 0 14px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:12 }}>
            <div style={{ height:.5, flex:1, background:SB_GOLD, opacity:.5 }} />
            <span style={{ fontFamily:SB_FB, fontSize:9, color:SB_GD, letterSpacing:'3px', fontWeight:600, textTransform:'uppercase', whiteSpace:'nowrap' }}>
              Event Details
            </span>
            <div style={{ height:.5, flex:1, background:SB_GOLD, opacity:.5 }} />
          </div>
          <div style={{ border:`0.5px solid ${SB_GOLD}`, borderRadius:4, padding:'17px 22px', textAlign:'left', background:'rgba(201,168,76,.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:13, marginBottom:10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ color:SB_TD, fontSize:14, fontWeight:500, fontFamily:SB_FB }}>{evDate}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:13 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              <span style={{ color:SB_TD, fontSize:14, fontWeight:500, fontFamily:SB_FB }}>{evVenue}</span>
            </div>
          </div>
        </div>

        <p style={{ color:SB_GD, fontSize:13, margin:'0 0 14px', fontFamily:SB_FB }}>
          Kindly confirm your attendance.
        </p>

        {/* Name personalisation */}
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name to personalise…"
          style={{ width:'100%', padding:'12px 14px', border:`1.5px solid ${SB_GOLD}`, borderRadius:4, background:'rgba(201,168,76,.06)', color:SB_TD, fontFamily:SB_FB, fontSize:13, boxSizing:'border-box', marginBottom:14, textAlign:'center', outline:'none' }}
        />

        {/* RSVP button */}
        <button onClick={() => setPage('rsvp')}
          style={{ width:'100%', background:SB_GOLD, color:SB_TD, border:'none', borderRadius:4, padding:'17px 24px', fontSize:15, fontWeight:700, letterSpacing:'3.5px', cursor:'pointer', textTransform:'uppercase', fontFamily:SB_FB, animation:'sbPulseBtn 2.5s ease-in-out infinite' }}>
          RSVP Now
        </button>

        <p style={{ color:SB_GD, fontSize:11, margin:'14px 0 0', fontStyle:'italic', fontFamily:SB_FB }}>
          Further event details will be shared soon.
        </p>
      </div>
    </div>
  );
}

function InvitationPage({ setPage, eventInfo }) {
  const [name, setName] = useState('');
  useEffect(() => { injectSBStyles(); }, []);

  const evDate  = eventInfo?.date  || '23rd October 2026';
  const evVenue = eventInfo?.venue || 'Hilton Singapore, Orchard Rd';

  return (
    <div style={{
      position:'relative', overflow:'hidden', minHeight:'100vh',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'clamp(40px,6vh,64px) clamp(12px,4vw,24px)',
      fontFamily:SB_FB,
    }}>
      {/* Invitation reuses bg-home.png — shows the portrait design beautifully */}
      <img src="/bg-home.png" alt="" className="sb-bg"
        style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,background:'rgba(6,2,0,0.20)',pointerEvents:'none'}}/>

      {/* Sparkle stars */}
      {SB_SPARKS.map(({pos,sz,del,dur,an},i) => (
        <div key={i} style={{position:'absolute',...pos}}>
          <SparkStar sz={sz} del={del} dur={dur} an={an}/>
        </div>
      ))}

      <SBSideRibbon flip={false}/>
      <SBSideRibbon flip={true}/>

      {/* Floating invitation card */}
      <div style={{
        background:'rgba(250,243,226,0.97)',
        borderRadius:10,
        padding:'clamp(26px,5vh,44px) clamp(18px,5vw,38px)',
        maxWidth:'min(460px,95vw)', width:'100%',
        position:'relative', zIndex:1, textAlign:'center',
        animation:'sbCardIn .9s cubic-bezier(.22,.8,.36,1) both',
      }}>

        {[
          {top:'12px',left:'12px',borderTop:`2px solid ${SB_GOLD}`,borderLeft:`2px solid ${SB_GOLD}`},
          {top:'12px',right:'12px',borderTop:`2px solid ${SB_GOLD}`,borderRight:`2px solid ${SB_GOLD}`},
          {bottom:'12px',left:'12px',borderBottom:`2px solid ${SB_GOLD}`,borderLeft:`2px solid ${SB_GOLD}`},
          {bottom:'12px',right:'12px',borderBottom:`2px solid ${SB_GOLD}`,borderRight:`2px solid ${SB_GOLD}`},
        ].map((s,i) => <div key={i} style={{position:'absolute',width:'clamp(18px,4vw,26px)',height:'clamp(18px,4vw,26px)',borderRadius:0,...s}}/>)}

        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(8px,2vw,12px)',marginBottom:'clamp(6px,1.2vh,10px)'}}>
          <SparkStar sz={10} del="0s"   dur="2.4s" an="sbTw2"/>
          <span style={{fontFamily:SB_FB,fontSize:'clamp(8px,1.8vw,10px)',color:SB_GD,letterSpacing:'clamp(3px,1vw,5px)',fontWeight:600,textTransform:'uppercase'}}>You're Invited</span>
          <SparkStar sz={10} del="1.2s" dur="2.4s" an="sbTw2"/>
        </div>

        <FiftyEmblem/>

        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(6px,1.5vw,10px)',margin:'clamp(3px,.6vh,5px) 0 clamp(8px,1.5vh,12px)'}}>
          <div style={{height:1,width:'clamp(18px,4vw,28px)',background:SB_GOLD,opacity:.5}}/>
          <p style={{fontFamily:SB_FB,fontSize:'clamp(7px,1.5vw,9px)',color:SB_GD,letterSpacing:'clamp(2px,.8vw,4px)',fontWeight:600,margin:0,textTransform:'uppercase'}}>Years &amp; Beyond</p>
          <div style={{height:1,width:'clamp(18px,4vw,28px)',background:SB_GOLD,opacity:.5}}/>
        </div>

        <SBLogo onDark={false}/>

        <div style={{margin:'clamp(12px,2.5vh,18px) clamp(-18px,-5vw,-38px) 0',padding:'clamp(16px,3vh,24px) clamp(18px,5vw,38px) clamp(14px,2.5vh,20px)',background:'rgba(255,255,255,0.56)',borderTop:'0.5px solid rgba(201,168,76,.38)',borderBottom:'0.5px solid rgba(201,168,76,.38)'}}>
          <h1 style={{fontFamily:SB_FH,fontSize:'clamp(16px,4vw,24px)',color:SB_GOLD,margin:'0 0 clamp(6px,1.2vh,8px)',fontWeight:700,lineHeight:1.3}}>
            SoilBuild 50 Years &amp; Beyond
          </h1>
          {name && <p style={{fontFamily:SB_FH,fontSize:'clamp(13px,3vw,16px)',color:SB_GD,fontStyle:'italic',margin:'0 0 6px'}}>Dear {name},</p>}
          <p style={{color:SB_TM,fontSize:'clamp(11px,2.2vw,13px)',lineHeight:1.72,margin:0}}>
            Join us as we celebrate a remarkable milestone and look ahead to the future.
          </p>
        </div>

        <div style={{margin:'clamp(14px,2.5vh,20px) 0 clamp(10px,2vh,14px)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(6px,1.5vw,10px)',marginBottom:'clamp(8px,1.5vh,12px)'}}>
            <div style={{height:.5,flex:1,background:SB_GOLD,opacity:.5}}/>
            <span style={{fontFamily:SB_FB,fontSize:'clamp(7px,1.5vw,9px)',color:SB_GD,letterSpacing:'clamp(2px,.8vw,3px)',fontWeight:600,textTransform:'uppercase',whiteSpace:'nowrap'}}>Event Details</span>
            <div style={{height:.5,flex:1,background:SB_GOLD,opacity:.5}}/>
          </div>
          <div style={{border:`0.5px solid ${SB_GOLD}`,borderRadius:4,padding:'clamp(12px,2.2vh,17px) clamp(14px,3.5vw,22px)',textAlign:'left',background:'rgba(201,168,76,.04)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'clamp(8px,2vw,13px)',marginBottom:'clamp(7px,1.3vh,10px)'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{color:SB_TD,fontSize:'clamp(12px,2.5vw,14px)',fontWeight:500,fontFamily:SB_FB}}>{evDate}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'clamp(8px,2vw,13px)'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SB_GOLD} strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              <span style={{color:SB_TD,fontSize:'clamp(12px,2.5vw,14px)',fontWeight:500,fontFamily:SB_FB}}>{evVenue}</span>
            </div>
          </div>
        </div>

        <p style={{color:SB_GD,fontSize:'clamp(11px,2.2vw,13px)',margin:'0 0 clamp(10px,2vh,14px)',fontFamily:SB_FB}}>
          Kindly confirm your attendance.
        </p>

        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Enter your name to personalise…"
          style={{width:'100%',padding:'clamp(10px,2vh,12px) 14px',border:`1.5px solid ${SB_GOLD}`,borderRadius:4,background:'rgba(201,168,76,.06)',color:SB_TD,fontFamily:SB_FB,fontSize:'clamp(11px,2.2vw,13px)',boxSizing:'border-box',marginBottom:'clamp(10px,2vh,14px)',textAlign:'center',outline:'none'}}/>

        <button onClick={() => setPage('rsvp')} style={{
          width:'100%', background:SB_GOLD, color:SB_TD, border:'none', borderRadius:4,
          padding:'clamp(14px,2.8vh,17px) 24px',
          fontSize:'clamp(13px,2.5vw,15px)', fontWeight:700,
          letterSpacing:'clamp(2px,.8vw,3.5px)', cursor:'pointer',
          textTransform:'uppercase', fontFamily:SB_FB,
          animation:'sbPulse 2.5s ease-in-out infinite, sbGlow 3s ease-in-out 1s infinite',
        }}>RSVP Now</button>

        <p style={{color:SB_GD,fontSize:'clamp(9px,1.8vw,11px)',margin:'clamp(10px,2vh,14px) 0 0',fontStyle:'italic',fontFamily:SB_FB}}>
          Further event details will be shared soon.
        </p>
      </div>
    </div>
  );
}

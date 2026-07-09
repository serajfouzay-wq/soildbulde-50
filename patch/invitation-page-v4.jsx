function InvitationPage({setPage,eventInfo}){
  const [name,setName]=useState('');
  useEffect(()=>{injectSBStyles();},[]);
  const evDate=eventInfo?.date||'23rd October 2026';
  const evVenue=eventInfo?.venue||'Hilton Singapore, Orchard Rd';
  return(
    <div style={{position:'relative',overflow:'hidden',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(40px,6vh,60px) clamp(12px,4vw,24px)',fontFamily:SB_FB,background:'#F5E6C0'}}>
      <img src="/bg-home-p.png" className="sb-bg" alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,background:'rgba(6,2,0,0.14)',pointerEvents:'none'}}/>
      {SB_SPARKS.map(({pos,sz,del,dur,an},i)=>(
        <div key={i} style={{position:'absolute',...pos}}><SparkStar sz={sz} del={del} dur={dur} an={an}/></div>
      ))}
      <SBSideRibbon flip={false}/><SBSideRibbon flip={true}/>
      <button onClick={()=>setPage('home')} className="sb-float"
        style={{position:'absolute',top:'clamp(10px,2vh,16px)',left:'clamp(10px,2vw,16px)',zIndex:50}}>← Back</button>
      <div style={{background:'rgba(250,243,226,0.97)',borderRadius:10,padding:'clamp(26px,5vh,44px) clamp(18px,5vw,38px)',maxWidth:'min(460px,95vw)',width:'100%',position:'relative',zIndex:1,textAlign:'center',animation:'sbCardIn .9s cubic-bezier(.22,.8,.36,1) both'}}>
        {[{top:'12px',left:'12px',borderTop:`2px solid ${SB_GOLD}`,borderLeft:`2px solid ${SB_GOLD}`},{top:'12px',right:'12px',borderTop:`2px solid ${SB_GOLD}`,borderRight:`2px solid ${SB_GOLD}`},{bottom:'12px',left:'12px',borderBottom:`2px solid ${SB_GOLD}`,borderLeft:`2px solid ${SB_GOLD}`},{bottom:'12px',right:'12px',borderBottom:`2px solid ${SB_GOLD}`,borderRight:`2px solid ${SB_GOLD}`}].map((s,i)=><div key={i} style={{position:'absolute',width:'clamp(18px,4vw,26px)',height:'clamp(18px,4vw,26px)',borderRadius:0,...s}}/>)}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(8px,2vw,12px)',marginBottom:'clamp(6px,1.2vh,10px)'}}>
          <SparkStar sz={10} del="0s" dur="2.4s" an="sbTw2"/>
          <span style={{fontFamily:SB_FB,fontSize:'clamp(8px,1.8vw,10px)',color:SB_GD,letterSpacing:'clamp(3px,1vw,5px)',fontWeight:600,textTransform:'uppercase'}}>You're Invited</span>
          <SparkStar sz={10} del="1.2s" dur="2.4s" an="sbTw2"/>
        </div>
        {/* Actual calligraphic 50 logo PNG */}
        <img src="/img-fifty.png" alt="50 Years & Beyond" style={{width:'clamp(120px,30vw,175px)',margin:'0 auto clamp(6px,1.2vh,10px)',display:'block',animation:'sbFloatY 4s ease-in-out infinite'}}/>
        {/* Actual SoilBuild logo PNG */}
        <img src="/img-sb-logo.png" alt="SoilBuild" style={{width:'clamp(100px,22vw,150px)',margin:'0 auto clamp(10px,1.8vh,16px)',display:'block'}}/>
        <div style={{margin:'clamp(12px,2.5vh,18px) clamp(-18px,-5vw,-38px) 0',padding:'clamp(16px,3vh,22px) clamp(18px,5vw,38px) clamp(14px,2.5vh,20px)',background:'rgba(255,255,255,0.56)',borderTop:'0.5px solid rgba(201,168,76,.38)',borderBottom:'0.5px solid rgba(201,168,76,.38)'}}>
          <h1 style={{fontFamily:SB_FH,fontSize:'clamp(16px,4vw,24px)',color:SB_GOLD,margin:'0 0 clamp(6px,1.2vh,8px)',fontWeight:700,lineHeight:1.3}}>SoilBuild 50 Years &amp; Beyond</h1>
          {name&&<p style={{fontFamily:SB_FH,fontSize:'clamp(13px,3vw,16px)',color:SB_GD,fontStyle:'italic',margin:'0 0 6px'}}>Dear {name},</p>}
          <p style={{color:SB_TM,fontSize:'clamp(11px,2.2vw,13px)',lineHeight:1.72,margin:0}}>Join us as we celebrate a remarkable milestone and look ahead to the future.</p>
        </div>
        {/* Actual event details box PNG */}
        <img src="/img-eventbox.png" alt="Event Details" style={{width:'clamp(200px,85%,340px)',margin:'clamp(14px,2.5vh,20px) auto clamp(10px,2vh,14px)',display:'block'}}/>
        <p style={{color:SB_GD,fontSize:'clamp(11px,2.2vw,13px)',margin:'0 0 clamp(10px,2vh,14px)',fontFamily:SB_FB}}>Kindly confirm your attendance.</p>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name to personalise…"
          style={{width:'100%',padding:'clamp(10px,2vh,12px) 14px',border:`1.5px solid ${SB_GOLD}`,borderRadius:4,background:'rgba(201,168,76,.06)',color:SB_TD,fontFamily:SB_FB,fontSize:'clamp(11px,2.2vw,13px)',boxSizing:'border-box',marginBottom:'clamp(10px,2vh,14px)',textAlign:'center',outline:'none'}}/>
        {/* Actual RSVP button PNG — clickable */}
        <img src="/img-rsvp.png" alt="RSVP Now" onClick={()=>setPage('rsvp')}
          style={{width:'100%',maxWidth:320,cursor:'pointer',display:'block',margin:'0 auto',animation:'sbPulse 2.5s ease-in-out infinite'}}/>
        <p style={{color:SB_GD,fontSize:'clamp(9px,1.8vw,11px)',margin:'clamp(10px,2vh,14px) 0 0',fontStyle:'italic',fontFamily:SB_FB}}>Further event details will be shared soon.</p>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPA = createClient(
  "https://zsjbjwxyofgrdyhxlcjj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzamJqd3h5b2ZncmR5aHhsY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTM4NjcsImV4cCI6MjA5NDgyOTg2N30.O0-uolysivbUak-DGbHmG7orv93iTEgGOgCGEHAcQNs"
);

async function dbAll(t) { try { const { data } = await SUPA.from(t).select("*"); return data || []; } catch (e) { return []; } }
async function dbUpsert(t, r) { try { await SUPA.from(t).upsert(r, { onConflict: "id" }); } catch (e) { console.warn(e); } }
async function dbDelete(t, id) { try { await SUPA.from(t).delete().eq("id", id); } catch (e) { console.warn(e); } }
async function pushDrawState(s) { try { await SUPA.from("draw_state").upsert({ id: 1, ...s, ts: new Date().toISOString() }, { onConflict: "id" }); } catch (e) { console.warn(e); } }

// ─── WHATSAPP API (placeholder — insert credentials to activate) ──────────────
const WA_CONFIG = {
  apiUrl:       "https://api.whatsapp.com/v1/messages", // replace with your provider URL
  accountSid:   "YOUR_ACCOUNT_SID",
  authToken:    "YOUR_AUTH_TOKEN",
  fromNumber:   "whatsapp:+YOUR_FROM_NUMBER",
};
async function sendWhatsApp({ to, name, uniqueId, tableName, eventInfo }) {
  try {
    if (!WA_CONFIG.authToken || WA_CONFIG.authToken === "YOUR_AUTH_TOKEN") {
      console.info("WhatsApp: credentials not set — skipping.");
      return { success: false, error: "credentials_not_configured" };
    }
    const body = `Hi ${name}! Your registration for ${eventInfo.title} ${eventInfo.year} is confirmed.\nID: ${uniqueId}\nTable: ${tableName || "TBC"}\nDate: ${eventInfo.date}\nVenue: ${eventInfo.venue}`;
    const res = await fetch(WA_CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + WA_CONFIG.authToken },
      body: JSON.stringify({ from: WA_CONFIG.fromNumber, to: "whatsapp:" + to, body }),
    });
    const d = await res.json();
    return { success: !!d.sid || res.ok, data: d };
  } catch (e) { return { success: false, error: String(e) }; }
}

// ─── EMAIL via Web3Forms (direct browser POST — no server needed) ─────────────
// FIX: Original code called /api/send-email (Vercel serverless).
// This file is pure React — that route doesn't exist. Web3Forms works from browser directly.
// Free 250 emails/day. Get your key at: https://web3forms.com
const WEB3FORMS_KEY = "d1a88dcc-6f3e-400e-84e0-65c542d992bf"; // ← replace with your key

async function sendConfirmationEmail({ to, name, uniqueId, tableName, pax, dietary, allergies, eventInfo }) {
  try {
    if (!WEB3FORMS_KEY || WEB3FORMS_KEY.startsWith("YOUR")) {
      console.info("Email: set WEB3FORMS_KEY in code to activate"); return { success: false, error: "key_not_set" };
    }
    const message = [
      `Dear ${name},`, ``,
      `Thank you for confirming your attendance at ${eventInfo.title} ${eventInfo.year}.`, ``,
      `Registration ID : ${uniqueId}`,
      `Table           : ${tableName || "To be assigned"}`,
      `Pax             : ${pax}`,
      `Dietary         : ${dietary || "—"}${allergies ? "\nAllergies       : " + allergies : ""}`, ``,
      `Date : ${eventInfo.date}   Time : ${eventInfo.time}`,
      `Venue: ${eventInfo.venue}`, ``,
      `Please present your QR code at the entrance.`, ``,
      `Warm regards,`, `Soilbuild Group Holdings Ltd`
    ].join("\n");
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `RSVP Confirmed — ${eventInfo.title} ${eventInfo.year}`,
        from_name: "Soilbuild Annual Dinner 2026",
        to_email: to, message, botcheck: false,
      }),
    });
    const d = await res.json();
    return d.success ? { success: true, to } : { success: false, error: d.message || "failed", to };
  } catch (e) { return { success: false, error: String(e), to }; }
}


// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  green: "#2D8B3E", greenDark: "#1A5C28", greenLight: "#4CAF50",
  yellow: "#F5C518", yellowDark: "#D4A412", yellowLight: "#FFD93D",
  dark: "#3B2A1A", darkGreen: "#5C3D1E",
  white: "#FFFFFF", charcoal: "#1A1A1A",
  red: "#C1272D", gray: "#6B7280",
  grayLight: "#F3F4F6", border: "#E5E7EB",
  beige: "#F5F0E8", beigeLight: "#FAF7F2", beigeDark: "#E8DFD0",
  inkDark: "#2C1A0E", inkMid: "#5C3D1E",
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_EMPLOYEES = [
  { id:"e1",  name:"Ahmad Bin Hassan",          employeeNumber:"SB001", email:"ahmad@soilbuild.com",   mobile:"", department:"Operations", company:"Soilbuild", pax:2, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE001", type:"employee" },
  { id:"e2",  name:"Siti Nurhaliza Binte Azman",employeeNumber:"SB002", email:"siti@soilbuild.com",    mobile:"", department:"HR",         company:"Soilbuild", pax:1, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE002", type:"employee" },
  { id:"e3",  name:"Raj Kumar Suppiah",         employeeNumber:"SB003", email:"raj@soilbuild.com",     mobile:"", department:"Finance",    company:"Soilbuild", pax:2, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE003", type:"employee" },
  { id:"e4",  name:"Wong Wei Liang",            employeeNumber:"SB004", email:"wong@soilbuild.com",    mobile:"", department:"IT",         company:"Soilbuild", pax:1, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE004", type:"employee" },
  { id:"e5",  name:"Priya Sundaram",            employeeNumber:"SB005", email:"priya@soilbuild.com",   mobile:"", department:"Sales",      company:"Soilbuild", pax:2, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE005", type:"employee" },
  { id:"e6",  name:"Tan Ah Kow",               employeeNumber:"SB006", email:"tan@soilbuild.com",     mobile:"", department:"Legal",      company:"Soilbuild", pax:1, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE006", type:"employee" },
  { id:"e7",  name:"Nurul Ain Binte Ali",       employeeNumber:"SB007", email:"nurul@soilbuild.com",   mobile:"", department:"Marketing",  company:"Soilbuild", pax:2, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE007", type:"employee" },
  { id:"e8",  name:"David Lim Chin Huat",       employeeNumber:"SB008", email:"david@soilbuild.com",   mobile:"", department:"Finance",    company:"Soilbuild", pax:1, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE008", type:"employee" },
  { id:"e9",  name:"Sarah Chen Mei Ling",       employeeNumber:"SB009", email:"sarah@soilbuild.com",   mobile:"", department:"Operations", company:"Soilbuild", pax:2, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE009", type:"employee" },
  { id:"e10", name:"Mohammed Faizal Bin Ismail",employeeNumber:"SB010", email:"faizal@soilbuild.com",  mobile:"", department:"HR",         company:"Soilbuild", pax:1, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE010", type:"employee" },
  { id:"e11", name:"Lee Boon Heng",             employeeNumber:"SB011", email:"lee@soilbuild.com",     mobile:"", department:"IT",         company:"Soilbuild", pax:2, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE011", type:"employee" },
  { id:"e12", name:"Kavitha Nair",              employeeNumber:"SB012", email:"kavitha@soilbuild.com", mobile:"", department:"Sales",      company:"Soilbuild", pax:1, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE012", type:"employee" },
  { id:"e13", name:"Zainudin Bin Nordin",       employeeNumber:"SB013", email:"zainudin@soilbuild.com",mobile:"", department:"Legal",      company:"Soilbuild", pax:2, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE013", type:"employee" },
  { id:"e14", name:"Grace Loh Pei Shan",        employeeNumber:"SB014", email:"grace@soilbuild.com",   mobile:"", department:"Marketing",  company:"Soilbuild", pax:1, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE014", type:"employee" },
  { id:"e15", name:"Suresh Pillai",             employeeNumber:"SB015", email:"suresh@soilbuild.com",  mobile:"", department:"Operations", company:"Soilbuild", pax:2, drawEligible:true, tableId:null, rsvpStatus:"pending", uniqueId:"SE015", type:"employee" },
];
const INIT_TABLES = [
  { id:"t1", name:"Table 1",  capacity:10, assignedCount:0 },
  { id:"t2", name:"Table 2",  capacity:10, assignedCount:0 },
  { id:"t3", name:"Table 3",  capacity:10, assignedCount:0 },
  { id:"t4", name:"VIP Table",capacity:8,  assignedCount:0 },
];
const INIT_PRIZES = [
  { id:"p1", label:"Grand Prize", type:"Travel",      description:"Luxury Weekend Getaway for 2", photo:"", drawn:false, order:0 },
  { id:"p2", label:"Prize 1",     type:"Electronics", description:'Sony 65" 4K Smart TV',         photo:"", drawn:false, order:1 },
  { id:"p3", label:"Prize 2",     type:"Voucher",     description:"$500 Shopping Voucher",         photo:"", drawn:false, order:2 },
];
const INIT_EVENT = {
  greeting:"You are warmly invited to", title:"Annual Dinner", year:"2026",
  date:"Friday, 23 October 2026", time:"6:00 PM — Registration",
  venue:"Hilton Singapore Orchard", dressCode:"Smart Casual", rsvpDeadline:"10 October 2026",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,10);
const nowTime = () => new Date().toLocaleTimeString();

function getNextUniqueId(employees, type) {
  const prefix = type === "employee" ? "SE" : "GV";
  const nums = employees
    .filter(e => (e.uniqueId||"").startsWith(prefix))
    .map(e => parseInt((e.uniqueId||"").replace(prefix,""),10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return prefix + String(next).padStart(3,"0");
}

// ─── URL PARAM DETECTION ──────────────────────────────────────────────────────
function getUrlRole() {
  try {
    const params = new URLSearchParams(window.location.search);
    const hash   = window.location.hash;
    const role   = params.get("role");
    if (role === "employee") return "employee";
    if (role === "vip")      return "vip";
    if (hash === "#audience") return "audience";
    return null;
  } catch(e) { return null; }
}

// ─── FONTS + STYLES ───────────────────────────────────────────────────────────
function FontLoader() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'DM Sans',sans-serif;background:#F5F0E8}
      input,button,select,textarea{font-family:inherit}
      ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#F5F0E8}::-webkit-scrollbar-thumb{background:#C8B89A;border-radius:3px}
      @media(max-width:640px){button{min-height:44px}input,select,textarea{font-size:16px!important}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeInDown{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
      @keyframes radarSpin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
      @keyframes countPulse{from{transform:scale(1.5);opacity:0}to{transform:scale(1);opacity:1}}
      @keyframes winnerReveal{from{transform:scale(0.5) translateY(60px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
      @keyframes slideInLeft{from{transform:translateX(-80px);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes spinGlow{from{opacity:0.5}to{opacity:1}}
      @keyframes digitFlip{0%{opacity:1}45%{opacity:0.2}55%{opacity:0.2}100%{opacity:1}}
      @keyframes flicker{0%,100%{opacity:1}50%{opacity:0.55}}
      @keyframes pulse2{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
      @keyframes cardReveal{from{opacity:0;transform:scale(0.9) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}

// ─── LOGO (inline base64 from original) ──────────────────────────────────────
const LOGO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAB3+klEQVR4nOz9d9xt13XXB3/HnHOVXZ566j2368qSVS0JybIsZBvZGLCJgZhAApiXl5aXBAJOIMEvvICJHWMcY+MYCGBe4wAJhOI4ITYuQjZusi1ZsiWr3avb26lP260515x9VtkvR+ec++wzT+9zdt97r73WWnuv37/fb+29RKWS/Xzf933fR0FAFEBARARQAAAAQAAAAAAAAAAAAAAAAABAAEBAQAAAAAAAAAAAAAAAAAAAABAQEBAQAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAQAAAQABAAEAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAA==";

function SoilbuildLogo({ size = 60, dark = false }) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const ns = Math.max(size * 0.34, 11);
  const ss = Math.max(size * 0.15, 7);
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:size*0.12, height:size }}>
      {!failed && (
        <img
          src="https://www.soilbuild.com/images/logo.png"
          alt="Soilbuild Group Holdings Ltd"
          style={{ height:size, width:"auto", objectFit:"contain", display:loaded?"block":"none", background:"none" }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {(!loaded || failed) && (
        <div style={{ display:"inline-flex", alignItems:"center", gap:size*0.12 }}>
          <div style={{ width:size*0.88, height:size, borderRadius:Math.max(size*0.12,4), background: dark ? "rgba(255,255,255,0.1)" : T.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:size*0.36, color: dark ? T.yellow : "#fff" }}>SB</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1.1 }}>
            <div>
              <span style={{ fontFamily:"'Arial Black',Impact,sans-serif", fontWeight:900, fontSize:ns, color:"#D4A800" }}>SOIL</span>
              <span style={{ fontFamily:"'Arial Black',Impact,sans-serif", fontWeight:900, fontSize:ns, color: dark ? "#4CAF50" : T.greenDark }}>BUILD</span>
            </div>
            <div style={{ fontFamily:"'DM Sans',Arial,sans-serif", fontSize:ss, color: dark ? "rgba(255,255,255,0.45)" : "#888", letterSpacing:1.5, textTransform:"uppercase" }}>Group Holdings Ltd</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QR CODE ──────────────────────────────────────────────────────────────────
function QRCode({ value, size=160 }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [err, setErr]     = useState(false);
  useEffect(() => {
    if (window.qrcode) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";
    s.onload  = () => setReady(true);
    s.onerror = () => setErr(true);
    document.head.appendChild(s);
  }, []);
  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    try {
      const qr = window.qrcode(0,"M");
      qr.addData(value); qr.make();
      const modules = qr.getModuleCount();
      const cs      = Math.floor(size / (modules + 4));
      const margin  = Math.floor((size - cs * modules) / 2);
      const canvas  = canvasRef.current;
      canvas.width  = size; canvas.height = size;
      const ctx     = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0,0,size,size);
      ctx.fillStyle = T.inkDark;
      for (let r=0;r<modules;r++) for (let c=0;c<modules;c++) if (qr.isDark(r,c)) ctx.fillRect(margin+c*cs, margin+r*cs, cs, cs);
    } catch(e) { setErr(true); }
  }, [ready, value, size]);
  if (err) return <div style={{ width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center", background:T.beige, borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray }}>QR unavailable</div>;
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius:8, display:"block" }} />;
}

// ─── PARTICLES ────────────────────────────────────────────────────────────────
function Particles({ count=40, color=T.yellow }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const hex = color.replace("#","");
    const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
    const particles = Array.from({length:count}, () => ({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      r:Math.random()*2.5+0.5, dx:(Math.random()-0.5)*0.4,
      dy:-Math.random()*0.6-0.2, alpha:Math.random()*0.6+0.2,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},${p.alpha})`; ctx.fill();
        p.x+=p.dx; p.y+=p.dy;
        if(p.y<-5){p.y=canvas.height+5; p.x=Math.random()*canvas.width;}
        if(p.x<0||p.x>canvas.width) p.dx*=-1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [count, color]);
  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} />;
}

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const canvasRef = useRef();
  const rafRef    = useRef();
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const colors = [T.green, T.greenLight, T.yellow, T.yellowLight, "#fff"];
    const pieces = Array.from({length:220}, () => ({
      x:Math.random()*canvas.width, y:-20,
      w:Math.random()*12+5, h:Math.random()*6+3,
      color:colors[Math.floor(Math.random()*colors.length)],
      rot:Math.random()*360, drot:(Math.random()-0.5)*8,
      dy:Math.random()*5+2, dx:(Math.random()-0.5)*3,
    }));
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p => {
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
        p.x+=p.dx; p.y+=p.dy; p.rot+=p.drot;
        if(p.y>canvas.height+20){p.y=-20; p.x=Math.random()*canvas.width;}
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { if(rafRef.current) cancelAnimationFrame(rafRef.current); ctx.clearRect(0,0,canvas.width,canvas.height); };
  }, [active]);
  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999 }} />;
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav({ page, setPage }) {
  const [open, setOpen] = useState(false);
  // Only show RSVP on homepage-facing nav; admin/helpdesk as tabs
  const tabs = [
    { id:"admin",      label:"🔒 Admin" },
    { id:"helpdesk",   label:"🎫 Helpdesk" },
    { id:"draw-admin", label:"🎰 Draw" },
    { id:"qr-scanner", label:"📷 Check-In" },
  ];
  const go = (id) => { setPage(id); setOpen(false); };
  return (
    <>
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(232,220,205,0.97)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(201,168,76,0.3)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:56 }}>
        <div onClick={()=>go("home")} style={{ cursor:"pointer", flexShrink:0 }}>
          <SoilbuildLogo size={30} />
        </div>
        {/* Desktop tabs (admin/helpdesk/draw) — right side */}
        <div style={{ display:"flex", gap:6 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>go(t.id)}
              style={{ background: page===t.id ? T.green : "transparent", color: page===t.id ? "#fff" : T.inkMid, border:`1px solid ${page===t.id ? T.green : "rgba(92,61,30,0.3)"}`, borderRadius:6, padding:"5px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
              {t.label}
            </button>
          ))}
          <button onClick={()=>go("rsvp")}
            style={{ background: T.green, color:"#fff", border:"none", borderRadius:6, padding:"5px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", marginLeft:8 }}>
            RSVP →
          </button>
        </div>
      </nav>
    </>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ setPage, eventInfo, autoRole }) {
  // If URL has ?role=employee or ?role=vip, auto-open that form
  const [autoTriggered, setAutoTriggered] = useState(false);
  useEffect(() => {
    if (autoRole && !autoTriggered) {
      setAutoTriggered(true);
      setPage("rsvp");
    }
  }, [autoRole]);

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg, #1A3D1F 0%, #0D1B0F 60%, #1A3D1F 100%)`, position:"relative", overflow:"hidden" }}>
      <Particles count={55} color={T.yellow} />
      {/* Radar glow */}
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(700px,90vw)", height:"min(700px,90vw)", borderRadius:"50%", border:"1px solid rgba(245,197,24,0.1)", animation:"radarSpin 14s linear infinite", pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:50,  borderRadius:"50%", border:"1px solid rgba(245,197,24,0.07)" }} />
        <div style={{ position:"absolute", inset:120, borderRadius:"50%", border:"1px solid rgba(245,197,24,0.05)" }} />
      </div>

      <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", textAlign:"center", padding:"80px 24px 60px" }}>
        <div style={{ marginBottom:32, animation:"fadeInDown 0.9s ease-out" }}>
          <SoilbuildLogo size={80} dark />
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(12px,1.5vw,15px)", color:"rgba(255,255,255,0.5)", letterSpacing:5, textTransform:"uppercase", marginBottom:14, animation:"fadeInUp 1s ease-out 0.2s both" }}>
          {eventInfo.greeting}
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(42px,8vw,96px)", fontWeight:900, color:"#fff", lineHeight:1.0, marginBottom:12, maxWidth:900, animation:"fadeInUp 1s ease-out 0.4s both" }}>
          {eventInfo.title}<br /><span style={{ color:T.yellow }}>{eventInfo.year}</span>
        </h1>
        <div style={{ width:90, height:2, background:`linear-gradient(90deg,transparent,${T.yellow},transparent)`, margin:"20px auto", animation:"fadeIn 1s ease-out 0.6s both" }} />
        <div style={{ display:"flex", gap:28, flexWrap:"wrap", justifyContent:"center", marginBottom:48, animation:"fadeInUp 1s ease-out 0.8s both" }}>
          {[["📅", eventInfo.date],["🕕", eventInfo.time],["📍", eventInfo.venue]].map(([icon,text]) => (
            <div key={text} style={{ color:"rgba(255,255,255,0.75)", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500 }}>{icon} {text}</div>
          ))}
        </div>

        {/* SINGLE RSVP BUTTON */}
        <div style={{ animation:"fadeInUp 1s ease-out 1s both" }}>
          <button onClick={()=>setPage("rsvp")}
            style={{ background:T.green, color:"#fff", border:"none", borderRadius:10, padding:"18px 56px", fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, cursor:"pointer", letterSpacing:1, boxShadow:`0 8px 32px rgba(45,139,62,0.4)`, transition:"transform 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            RSVP Now →
          </button>
        </div>

        <div style={{ marginTop:48, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"rgba(255,255,255,0.25)", letterSpacing:3, textTransform:"uppercase", animation:"fadeIn 1s ease-out 1.2s both" }}>
          {eventInfo.dressCode}
        </div>
      </div>

      <footer style={{ position:"relative", zIndex:2, textAlign:"center", padding:20, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Sans',sans-serif", fontSize:11 }}>
        © 2026 Soilbuild Group Holdings Ltd.
      </footer>
    </div>
  );
}

// ─── RSVP CHOOSER ─────────────────────────────────────────────────────────────
function RSVPPage({ employees, setEmployees, tables, setTables, eventInfo, autoRole }) {
  const [step, setStep]           = useState(autoRole || "choose");
  const [confirmed, setConfirmed] = useState(null);

  const reset = () => { setStep("choose"); setConfirmed(null); };

  // Confirmed card
  if (confirmed) {
    const tbl = tables.find(t => t.id === confirmed.tableId);
    return (
      <div style={{ minHeight:"100vh", background:T.beige, display:"flex", flexDirection:"column", alignItems:"center", padding:"90px 24px 40px" }}>
        <div id="rsvp-card-print" style={{ background:`linear-gradient(135deg, ${T.dark} 0%, ${T.inkDark} 100%)`, borderRadius:24, padding:"clamp(20px,5vw,48px) clamp(16px,5vw,40px)", maxWidth:520, width:"100%", border:`2px solid rgba(245,197,24,0.4)`, boxShadow:"0 32px 80px rgba(0,0,0,0.2)", position:"relative", overflow:"hidden", animation:"cardReveal 0.8s ease-out" }}>
          <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200, borderRadius:"50%", background:"rgba(245,197,24,0.05)", pointerEvents:"none" }} />
          <div style={{ textAlign:"center", position:"relative" }}>
            <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><SoilbuildLogo size={44} dark /></div>
            <div style={{ width:55, height:1, background:T.yellow, margin:"18px auto" }} />
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"rgba(245,240,232,0.55)", marginBottom:6, letterSpacing:2, textTransform:"uppercase" }}>{eventInfo.greeting}</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:T.yellow, marginBottom:10, fontWeight:700 }}>{confirmed.name}</h2>
            {confirmed.type==="vip" && confirmed.guestType && (
              <div style={{ display:"inline-block", background:"rgba(245,197,24,0.15)", border:"1px solid rgba(245,197,24,0.4)", borderRadius:20, padding:"3px 14px", marginBottom:12 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.yellow, fontWeight:700, letterSpacing:2 }}>⭐ {confirmed.guestType}</span>
              </div>
            )}
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(245,240,232,0.55)", marginBottom:10 }}>to the</p>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:"#F5F0E8", lineHeight:1.05, marginBottom:4 }}>{eventInfo.title}<br /><span style={{ color:T.yellow }}>{eventInfo.year}</span></h1>
            <div style={{ width:55, height:1, background:T.yellow, margin:"18px auto" }} />
            {[["📅",eventInfo.date],["🕕",eventInfo.time],["📍",eventInfo.venue]].map(([ic,tx]) => (
              <p key={tx} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(245,240,232,0.8)", marginBottom:4 }}>{ic} {tx}</p>
            ))}
            {/* Unique ID + Table */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 20px", background:"rgba(245,197,24,0.08)", border:"1px solid rgba(245,197,24,0.25)", borderRadius:10, padding:"12px 20px", marginTop:20 }}>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"rgba(245,240,232,0.4)", textTransform:"uppercase", letterSpacing:1.5 }}>Registration ID</div>
                <div style={{ fontFamily:"'Courier New',monospace", fontSize:22, color:T.yellow, fontWeight:900, letterSpacing:4 }}>{confirmed.uniqueId}</div>
              </div>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"rgba(245,240,232,0.4)", textTransform:"uppercase", letterSpacing:1.5 }}>Pax</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:T.yellow, fontWeight:700 }}>{confirmed.pax}</div>
              </div>
              {confirmed.dietary && (
                <div style={{ textAlign:"left", gridColumn:"1 / -1", borderTop:"1px solid rgba(245,197,24,0.15)", paddingTop:8, marginTop:4 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"rgba(245,240,232,0.4)", textTransform:"uppercase", letterSpacing:1.5 }}>Dietary</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"rgba(245,240,232,0.8)", fontWeight:600 }}>{confirmed.dietary}{confirmed.allergies ? ` · Allergy: ${confirmed.allergies}` : ""}</div>
                </div>
              )}
            </div>
            {/* QR */}
            <div style={{ marginTop:20, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"rgba(245,240,232,0.35)", letterSpacing:2 }}>ENTRY QR CODE</p>
              <div style={{ background:"#fff", borderRadius:12, padding:10, display:"inline-block", boxShadow:"0 0 20px rgba(245,197,24,0.2)" }}>
                <QRCode value={`${confirmed.uniqueId}|${confirmed.name}|${confirmed.pax}|${confirmed.id}`} size={130} />
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"rgba(245,240,232,0.25)", letterSpacing:2, textTransform:"uppercase" }}>Present at entrance</p>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:12, marginTop:20, flexWrap:"wrap", justifyContent:"center" }}>
          <button onClick={reset} style={{ background:"transparent", color:T.green, border:`1.5px solid ${T.green}`, borderRadius:8, padding:"10px 24px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>← New RSVP</button>
        </div>
      </div>
    );
  }

  // Choose screen
  if (step === "choose") {
    return (
      <div style={{ minHeight:"100vh", background:T.beige, display:"flex", alignItems:"center", justifyContent:"center", padding:"90px 24px 40px" }}>
        <div style={{ background:T.beigeLight, borderRadius:24, padding:"clamp(20px,5vw,48px)", maxWidth:540, width:"100%", boxShadow:"0 20px 60px rgba(92,61,30,0.1)", border:`1px solid ${T.beigeDark}`, textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}><SoilbuildLogo size={48} /></div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.green, letterSpacing:4, textTransform:"uppercase", marginBottom:8, fontWeight:600 }}>{eventInfo.title} {eventInfo.year}</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:T.inkDark, marginBottom:8 }}>Welcome</h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.gray, marginBottom:32 }}>Please select how you are attending</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <button onClick={()=>setStep("employee")} style={{ background:T.green, color:"#fff", border:"none", borderRadius:16, padding:"28px 16px", cursor:"pointer", boxShadow:"0 8px 24px rgba(45,139,62,0.25)", transition:"transform 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              <div style={{ fontSize:36, marginBottom:10 }}>👤</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, marginBottom:4 }}>Employee</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, opacity:0.8 }}>Soilbuild staff</div>
            </button>
            <button onClick={()=>setStep("vip")} style={{ background:`linear-gradient(135deg, ${T.dark} 0%, ${T.inkDark} 100%)`, color:T.yellow, border:`2px solid rgba(245,197,24,0.4)`, borderRadius:16, padding:"28px 16px", cursor:"pointer", boxShadow:"0 8px 24px rgba(44,26,14,0.3)", transition:"transform 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              <div style={{ fontSize:36, marginBottom:10 }}>⭐</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, marginBottom:4 }}>VIP / Guest</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, opacity:0.7, color:"rgba(245,240,232,0.7)" }}>Invited guest</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:T.beige, display:"flex", alignItems:"center", justifyContent:"center", padding:"90px 24px 40px" }}>
      {step === "employee"
        ? <EmployeeForm employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} eventInfo={eventInfo} onConfirm={setConfirmed} onBack={()=>setStep("choose")} />
        : <VIPForm      employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} eventInfo={eventInfo} onConfirm={setConfirmed} onBack={()=>setStep("choose")} />}
    </div>
  );
}

// ─── EMPLOYEE FORM ────────────────────────────────────────────────────────────
function EmployeeForm({ employees, setEmployees, tables, setTables, eventInfo, onConfirm, onBack }) {
  const [query,      setQuery]      = useState("");
  const [suggestions,setSugg]       = useState([]);
  const [showDrop,   setShowDrop]   = useState(false);
  const [form,       setForm]       = useState({ name:"", employeeNumber:"", email:"", mobile:"", department:"", company:"Soilbuild", pax:1, dietary:"Chinese", allergies:"" });
  const [submitting, setSubmitting] = useState(false);
  const [err,        setErr]        = useState("");

  // Search against employee DB
  useEffect(() => {
    if (query.length < 1) { setSugg([]); return; }
    const matches = employees.filter(e => e.type==="employee" && (
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      (e.employeeNumber||"").toLowerCase().includes(query.toLowerCase()) ||
      (e.department||"").toLowerCase().includes(query.toLowerCase())
    )).slice(0,8);
    setSugg(matches); setShowDrop(matches.length > 0);
  }, [query, employees]);

  const pick = (emp) => {
    setQuery(emp.name);
    setForm(f => ({ ...f, name:emp.name, employeeNumber:emp.employeeNumber||"", email:emp.email||"", mobile:emp.mobile||"", department:emp.department||"", company:emp.company||"Soilbuild", pax:emp.pax||1, dietary:emp.dietary||"Chinese" }));
    setShowDrop(false); setSugg([]);
  };

  const handle = async () => {
    setErr("");
    if (!form.name.trim())  { setErr("Please enter your name."); return; }
    if (!form.email || !form.email.includes("@")) { setErr("Please enter a valid email."); return; }
    setSubmitting(true);
    const existing = employees.find(e => e.name.toLowerCase().trim() === form.name.toLowerCase().trim() && e.type==="employee");
    const uniqueId = existing?.uniqueId || getNextUniqueId(employees, "employee");
    const empId    = existing?.id || uid();
    const avail    = tables.filter(t => t.assignedCount + form.pax <= t.capacity).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
    const tbl      = avail[0] || null;
    const guest = { id:empId, ...form, name:form.name.trim(), type:"employee", drawEligible:true, uniqueId, tableId:tbl?.id||null, rsvpStatus:"confirmed", attended:false };
    await dbUpsert("employees", guest);
    if (tbl) {
      const upd = { ...tbl, assignedCount:tbl.assignedCount+form.pax };
      await dbUpsert("tables", upd);
      setTables(prev => prev.map(t => t.id===tbl.id ? upd : t));
    }
    if (existing) setEmployees(prev => prev.map(e => e.id===empId ? guest : e));
    else setEmployees(prev => [...prev, guest]);
    setSubmitting(false);
    // Send Web3Forms confirmation email (direct browser call)
    if (guest.email) {
      sendConfirmationEmail({ to:guest.email, name:guest.name, uniqueId, tableName:tbl?.name||"TBC", pax:guest.pax, dietary:guest.dietary, allergies:guest.allergies, eventInfo }).then(r => {
        if(!r.success) console.warn("Email not sent:", r.error);
      });
    }
    onConfirm({ ...guest, tableName:tbl?.name||"TBC" });
  };

  const F = ({ label, value, onChange, placeholder, type="text", readOnly=false, req=false }) => (
    <div style={{ marginBottom:13 }}>
      <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, marginBottom:5, fontWeight:600 }}>{label}{req && <span style={{ color:T.red }}> *</span>}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background: readOnly ? "#F0EBE3" : "#fff", color:T.inkDark }}
        onFocus={e=>!readOnly&&(e.target.style.borderColor=T.green)} onBlur={e=>e.target.style.borderColor=T.beigeDark} />
    </div>
  );

  return (
    <div style={{ background:T.beigeLight, borderRadius:24, padding:"clamp(20px,4vw,40px)", maxWidth:520, width:"100%", boxShadow:"0 20px 60px rgba(92,61,30,0.1)", border:`1px solid ${T.beigeDark}` }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:T.green, fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer", marginBottom:14, padding:0 }}>← Back</button>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:32, marginBottom:6 }}>👤</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:T.inkDark }}>Employee RSVP</h2>
      </div>
      {err && <div style={{ background:"#FEE2E2", color:T.red, padding:"9px 13px", borderRadius:8, marginBottom:14, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>⚠️ {err}</div>}

      {/* Search with autocomplete */}
      <div style={{ position:"relative", marginBottom:13 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, marginBottom:5, fontWeight:600 }}>Search Name / Employee No. <span style={{ color:T.red }}>*</span></label>
        <input value={query} onChange={e=>{ setQuery(e.target.value); setForm(f=>({...f,name:e.target.value})); }}
          placeholder="Type to search or enter your name…"
          style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background:"#fff", color:T.inkDark }}
          onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>{ setTimeout(()=>setShowDrop(false),180); e.target.style.borderColor=T.beigeDark; }} />
        {showDrop && suggestions.length > 0 && (
          <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:`1px solid ${T.beigeDark}`, borderRadius:9, boxShadow:"0 8px 24px rgba(92,61,30,0.12)", zIndex:50, marginTop:3, maxHeight:200, overflowY:"auto" }}>
            <div style={{ padding:"5px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.gray, borderBottom:`1px solid ${T.beigeDark}` }}>Select or keep typing for a new entry</div>
            {suggestions.map(s => (
              <div key={s.id} onClick={()=>pick(s)} style={{ padding:"9px 13px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, borderBottom:`1px solid ${T.beigeDark}`, display:"flex", justifyContent:"space-between" }}
                onMouseEnter={e=>e.currentTarget.style.background=T.beige} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <span style={{ fontWeight:600 }}>{s.name}</span>
                <span style={{ fontSize:11, color:T.gray }}>{s.employeeNumber} · {s.department}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <F label="Employee No." value={form.employeeNumber} onChange={e=>setForm(f=>({...f,employeeNumber:e.target.value}))} placeholder="e.g. SB001" />
      <F label="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@soilbuild.com" type="email" req />
      <F label="Mobile" value={form.mobile} onChange={e=>setForm(f=>({...f,mobile:e.target.value}))} placeholder="+65 9xxx xxxx" />
      <F label="Department" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} placeholder="e.g. Finance" />
      <F label="Company" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="Soilbuild" />

      {/* Pax */}
      <div style={{ marginBottom:13 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, marginBottom:5, fontWeight:600 }}>Number of Pax</label>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setForm(f=>({...f,pax:Math.max(1,f.pax-1)}))} style={{ width:40, height:40, borderRadius:8, border:`1.5px solid ${T.beigeDark}`, background:"#fff", fontSize:18, fontWeight:700, cursor:"pointer", color:T.green }}>−</button>
          <div style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:8, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:T.inkDark }}>{form.pax}</div>
          <button onClick={()=>setForm(f=>({...f,pax:Math.min(10,f.pax+1)}))} style={{ width:40, height:40, borderRadius:8, border:`1.5px solid ${T.beigeDark}`, background:"#fff", fontSize:18, fontWeight:700, cursor:"pointer", color:T.green }}>+</button>
        </div>
      </div>

      {/* Dietary */}
      <div style={{ marginBottom:13 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, marginBottom:6, fontWeight:600 }}>Dietary Preference <span style={{ color:T.red }}>*</span></label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[["🍜","Chinese"],["🌙","Halal"],["🥗","Vegetarian"]].map(([ic,val]) => (
            <button key={val} onClick={()=>setForm(f=>({...f,dietary:val}))}
              style={{ background:form.dietary===val?T.green:"#F5F0E8", color:form.dietary===val?"#fff":T.inkMid, border:`1.5px solid ${form.dietary===val?T.green:T.beigeDark}`, borderRadius:9, padding:"10px 6px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{ic}</div>{val}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, marginBottom:5, fontWeight:600 }}>Food Allergies <span style={{ opacity:0.5 }}>(optional)</span></label>
        <input value={form.allergies} onChange={e=>setForm(f=>({...f,allergies:e.target.value}))} placeholder="e.g. peanuts, shellfish…"
          style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background:"#fff", color:T.inkDark }}
          onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.beigeDark} />
      </div>

      <button onClick={submitting?undefined:handle} disabled={submitting}
        style={{ width:"100%", background:submitting?"#C8D8C0":T.green, color:"#fff", border:"none", borderRadius:10, padding:14, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, cursor:submitting?"not-allowed":"pointer", boxShadow:"0 4px 14px rgba(45,139,62,0.3)" }}>
        {submitting ? "Registering…" : "✓ Confirm Attendance"}
      </button>
    </div>
  );
}

// ─── VIP FORM ─────────────────────────────────────────────────────────────────
function VIPForm({ employees, setEmployees, tables, setTables, eventInfo, onConfirm, onBack }) {
  const [form, setForm] = useState({ name:"", company:"", email:"", mobile:"", pax:1, guestType:"VIP", dietary:"Chinese", allergies:"" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handle = async () => {
    setErr("");
    if (!form.name.trim()) { setErr("Please enter your name."); return; }
    if (!form.email || !form.email.includes("@")) { setErr("Please enter a valid email."); return; }
    setSubmitting(true);
    const uniqueId = getNextUniqueId(employees, "vip");
    const empId    = uid();
    const avail    = tables.filter(t => t.assignedCount + form.pax <= t.capacity).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
    const tbl      = avail[0] || null;
    const guest = { id:empId, ...form, name:form.name.trim(), employeeNumber:"", department:"", type:"vip", drawEligible:true, uniqueId, tableId:tbl?.id||null, rsvpStatus:"confirmed", attended:false };
    await dbUpsert("employees", guest);
    if (tbl) {
      const upd = { ...tbl, assignedCount:tbl.assignedCount+form.pax };
      await dbUpsert("tables", upd);
      setTables(prev => prev.map(t => t.id===tbl.id ? upd : t));
    }
    setEmployees(prev => [...prev, guest]);
    setSubmitting(false);
    // Send Web3Forms confirmation email
    if (guest.email) {
      sendConfirmationEmail({ to:guest.email, name:guest.name, uniqueId, tableName:tbl?.name||"TBC", pax:guest.pax, dietary:guest.dietary, allergies:guest.allergies, eventInfo }).then(r => {
        if(!r.success) console.warn("Email not sent:", r.error);
      });
    }
    onConfirm({ ...guest, tableName:tbl?.name||"TBC" });
  };

  return (
    <div style={{ background:`linear-gradient(135deg, ${T.dark} 0%, ${T.inkDark} 100%)`, borderRadius:24, padding:"clamp(20px,4vw,40px)", maxWidth:520, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid rgba(245,197,24,0.3)" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:T.yellow, fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer", marginBottom:14, padding:0, opacity:0.8 }}>← Back</button>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:32, marginBottom:6 }}>⭐</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:T.yellow, fontWeight:700 }}>VIP / Guest Registration</h2>
      </div>
      {err && <div style={{ background:"rgba(193,39,45,0.2)", color:"#FFB3B3", padding:"9px 13px", borderRadius:8, marginBottom:14, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>⚠️ {err}</div>}

      {/* Guest type dropdown */}
      <div style={{ marginBottom:13 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(245,240,232,0.65)", marginBottom:5, fontWeight:600 }}>Guest Type <span style={{ color:T.yellow }}>*</span></label>
        <select value={form.guestType} onChange={e=>setForm(f=>({...f,guestType:e.target.value}))}
          style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:"1.5px solid rgba(245,197,24,0.35)", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background:"rgba(255,255,255,0.08)", color:"#F5F0E8", cursor:"pointer" }}>
          <option value="VIP"   style={{ background:T.dark, color:"#F5F0E8" }}>⭐ VIP</option>
          <option value="Guest" style={{ background:T.dark, color:"#F5F0E8" }}>🧑 Guest</option>
        </select>
      </div>

      {[
        ["Full Name","name","text",true],
        ["Company / Organisation","company","text",false],
        ["Email Address","email","email",true],
        ["Mobile Number","mobile","tel",false],
      ].map(([lbl,key,type,req]) => (
        <div key={key} style={{ marginBottom:13 }}>
          <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(245,240,232,0.65)", marginBottom:5, fontWeight:600 }}>
            {lbl} {req ? <span style={{ color:T.yellow }}>*</span> : <span style={{ opacity:0.4 }}>(optional)</span>}
          </label>
          <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={lbl}
            style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:"1.5px solid rgba(245,197,24,0.3)", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background:"rgba(255,255,255,0.08)", color:"#F5F0E8" }}
            onFocus={e=>e.target.style.borderColor=T.yellow} onBlur={e=>e.target.style.borderColor="rgba(245,197,24,0.3)"} />
        </div>
      ))}

      {/* Pax */}
      <div style={{ marginBottom:13 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(245,240,232,0.65)", marginBottom:5, fontWeight:600 }}>Number of Pax</label>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setForm(f=>({...f,pax:Math.max(1,f.pax-1)}))} style={{ width:40, height:40, borderRadius:8, border:"1.5px solid rgba(245,197,24,0.3)", background:"rgba(245,197,24,0.08)", fontSize:18, fontWeight:700, cursor:"pointer", color:T.yellow }}>−</button>
          <div style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:8, border:"1.5px solid rgba(245,197,24,0.3)", fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:T.yellow }}>{form.pax}</div>
          <button onClick={()=>setForm(f=>({...f,pax:Math.min(10,f.pax+1)}))} style={{ width:40, height:40, borderRadius:8, border:"1.5px solid rgba(245,197,24,0.3)", background:"rgba(245,197,24,0.08)", fontSize:18, fontWeight:700, cursor:"pointer", color:T.yellow }}>+</button>
        </div>
      </div>

      {/* Dietary */}
      <div style={{ marginBottom:13 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(245,240,232,0.65)", marginBottom:6, fontWeight:600 }}>Dietary Preference <span style={{ color:T.yellow }}>*</span></label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[["🍜","Chinese"],["🌙","Halal"],["🥗","Vegetarian"]].map(([ic,val]) => (
            <button key={val} onClick={()=>setForm(f=>({...f,dietary:val}))}
              style={{ background:form.dietary===val?"rgba(245,197,24,0.25)":"rgba(255,255,255,0.07)", color:form.dietary===val?T.yellow:"rgba(245,240,232,0.7)", border:`1.5px solid ${form.dietary===val?"rgba(245,197,24,0.6)":"rgba(255,255,255,0.15)"}`, borderRadius:9, padding:"10px 6px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{ic}</div>{val}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(245,240,232,0.65)", marginBottom:5, fontWeight:600 }}>Food Allergies <span style={{ opacity:0.4 }}>(optional)</span></label>
        <input value={form.allergies} onChange={e=>setForm(f=>({...f,allergies:e.target.value}))} placeholder="e.g. peanuts, shellfish…"
          style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:"1.5px solid rgba(245,197,24,0.3)", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background:"rgba(255,255,255,0.08)", color:"#F5F0E8" }}
          onFocus={e=>e.target.style.borderColor=T.yellow} onBlur={e=>e.target.style.borderColor="rgba(245,197,24,0.3)"} />
      </div>

      <button onClick={submitting?undefined:handle} disabled={submitting}
        style={{ width:"100%", background:submitting?"rgba(245,197,24,0.3)":T.yellow, color:"#2C1A0E", border:"none", borderRadius:10, padding:14, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, cursor:submitting?"not-allowed":"pointer", boxShadow:"0 4px 16px rgba(245,197,24,0.3)" }}>
        {submitting ? "Registering…" : "⭐ Confirm Registration"}
      </button>
    </div>
  );
}

// ─── HELPDESK PAGE (no password, nav tab) ─────────────────────────────────────
function HelpdeskPage({ employees, tables }) {
  const [query, setQuery]     = useState("");
  const [result, setResult]   = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [qrShown, setQrShown] = useState(false);

  const search = () => {
    if (!query.trim()) return;
    const q = query.toLowerCase().trim();
    const found = employees.find(e =>
      e.name.toLowerCase().includes(q) ||
      (e.email||"").toLowerCase().includes(q) ||
      (e.mobile||"").toLowerCase().includes(q) ||
      (e.uniqueId||"").toLowerCase().includes(q) ||
      (e.employeeNumber||"").toLowerCase().includes(q) ||
      (e.company||"").toLowerCase().includes(q)
    );
    if (found) { setResult(found); setNotFound(false); setQrShown(false); }
    else       { setResult(null);  setNotFound(true); }
  };

  const tbl = result ? tables.find(t => t.id === result.tableId) : null;

  return (
    <div style={{ minHeight:"100vh", background:T.beige, paddingTop:56 }}>
      <div style={{ background:`linear-gradient(135deg, ${T.greenDark} 0%, ${T.green} 100%)`, padding:"28px 32px" }}>
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:"#fff", fontWeight:700, marginBottom:6 }}>🎫 Helpdesk Check-In</h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:20 }}>Search by name, email, mobile, company, or registration ID</p>
          <div style={{ display:"flex", gap:10 }}>
            <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="e.g. Ahmad, SE001, +65 9xxx, soilbuild@…"
              style={{ flex:1, padding:"12px 16px", borderRadius:9, border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", boxShadow:"0 4px 14px rgba(0,0,0,0.15)" }} />
            <button onClick={search} style={{ background:T.yellow, color:T.inkDark, border:"none", borderRadius:9, padding:"12px 24px", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, cursor:"pointer" }}>Search</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"28px 24px" }}>
        {notFound && (
          <div style={{ background:"#FEE2E2", border:`1px solid #FECACA`, borderRadius:12, padding:"20px 24px", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.red }}>
            ❌ No attendee found matching "<strong>{query}</strong>"
          </div>
        )}

        {result && (
          <div style={{ background:T.beigeLight, borderRadius:16, border:`1px solid ${T.beigeDark}`, overflow:"hidden", boxShadow:"0 8px 24px rgba(92,61,30,0.1)", animation:"cardReveal 0.4s ease-out" }}>
            {/* Header strip */}
            <div style={{ background:result.type==="vip"?T.dark:T.green, padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:result.type==="vip"?T.yellow:"#fff", fontWeight:700 }}>{result.name}</div>
                <div style={{ fontFamily:"'Courier New',monospace", fontSize:16, color:"rgba(255,255,255,0.6)", marginTop:4, letterSpacing:3 }}>{result.uniqueId}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ background:"rgba(255,255,255,0.15)", borderRadius:20, padding:"4px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:"#fff" }}>
                  {result.type==="vip"?`⭐ ${result.guestType||"VIP"}`:"👤 Employee"}
                </span>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:6 }}>
                  {result.rsvpStatus==="confirmed" ? "✅ Confirmed" : result.rsvpStatus==="declined" ? "❌ Declined" : "⏳ Pending"}
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ padding:"24px 28px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 24px", marginBottom:20 }}>
                {[
                  ["Email",      result.email||"—"],
                  ["Mobile",     result.mobile||"—"],
                  ["Company",    result.company||"—"],
                  ["Department", result.department||"—"],
                  ["Pax",        result.pax],
                  ["Table",      tbl?.name||"Not assigned"],
                  ["Dietary",    result.dietary||"—"],
                  ["Allergies",  result.allergies||"None"],
                  ["Attended",   result.attended ? `✅ ${result.attendedAt||""}` : "Not yet"],
                ].map(([k,v]) => (
                  <div key={k}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.gray, textTransform:"uppercase", letterSpacing:1, marginBottom:2 }}>{k}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.inkDark, fontWeight:500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* QR code toggle */}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <button onClick={()=>setQrShown(v=>!v)} style={{ background:T.green, color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  {qrShown ? "Hide QR" : "🔳 Show / Reissue QR Code"}
                </button>
              </div>

              {qrShown && (
                <div style={{ marginTop:20, display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"20px", background:T.beige, borderRadius:12, border:`1px solid ${T.beigeDark}` }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, fontWeight:600 }}>Registration QR — {result.uniqueId}</div>
                  <div style={{ background:"#fff", borderRadius:10, padding:10, boxShadow:"0 0 16px rgba(0,0,0,0.08)" }}>
                    <QRCode value={`${result.uniqueId}|${result.name}|${result.pax}|${result.id}`} size={160} />
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray, textAlign:"center" }}>
                    Show this QR to the guest or print for reissue
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!result && !notFound && (
          <div style={{ textAlign:"center", padding:"60px 0", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.gray }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
            Search above to look up any attendee
          </div>
        )}
      </div>
    </div>
  );
}


// ─── QR SCANNER (door check-in) ───────────────────────────────────────────────
function QRScannerPage({ employees, setEmployees, tables }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [jsQRReady, setJsQRReady] = useState(!!window.jsQR);
  const [cameraOn,  setCameraOn]  = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualQ, setManualQ]     = useState("");
  const [error, setError]         = useState("");

  useEffect(() => {
    if (window.jsQR) { setJsQRReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    s.onload = () => setJsQRReady(true);
    s.onerror = () => setError("QR library failed.");
    document.head.appendChild(s);
  }, []);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraOn(true);
    } catch (e) { setError("Camera denied. Use manual lookup."); }
  };
  const stopCamera = () => { streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; setCameraOn(false); };
  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!cameraOn || !jsQRReady) return;
    const canvas=document.createElement("canvas"); const ctx=canvas.getContext("2d"); let raf;
    const scan = () => {
      const v=videoRef.current;
      if (v && v.readyState===v.HAVE_ENOUGH_DATA) {
        canvas.width=v.videoWidth; canvas.height=v.videoHeight; ctx.drawImage(v,0,0);
        const code=window.jsQR(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
        if (code?.data) { stopCamera(); processGuest(code.data); return; }
      }
      raf=requestAnimationFrame(scan);
    };
    raf=requestAnimationFrame(scan); return ()=>cancelAnimationFrame(raf);
  }, [cameraOn, jsQRReady, employees]);

  const processGuest = async (raw) => {
    const p=raw.split("|"); const uidScan=p[0]||""; const nameScan=p[1]||""; const idScan=p[3]||"";
    const emp=employees.find(e=>(idScan&&e.id===idScan)||(uidScan&&e.uniqueId===uidScan)||(nameScan&&e.name.toLowerCase()===nameScan.toLowerCase()));
    if (!emp) { setScanResult({found:false,raw}); return; }
    if (emp.attended) { setScanResult({found:true,already:true,emp}); return; }
    const upd={...emp,attended:true,attendedAt:nowTime()};
    await dbUpsert("employees",upd); setEmployees(prev=>prev.map(e=>e.id===emp.id?upd:e)); setScanResult({found:true,already:false,emp:upd});
  };

  const handleManual=()=>{ if(!manualQ.trim())return; const q=manualQ.toLowerCase().trim(); const emp=employees.find(e=>(e.uniqueId||"").toLowerCase()===q||e.name.toLowerCase().includes(q)); if(emp)processGuest(`${emp.uniqueId}|${emp.name}|${emp.pax}|${emp.id}`); else setScanResult({found:false,raw:manualQ}); setManualQ(""); };

  const confirmed=employees.filter(e=>e.rsvpStatus==="confirmed");
  const attended=employees.filter(e=>e.attended);

  return (
    <div style={{minHeight:"100vh",background:T.beige,paddingTop:56}}>
      <div style={{background:`linear-gradient(135deg,${T.greenDark} 0%,${T.green} 100%)`,padding:"18px 24px"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#fff",fontWeight:700}}>📷 QR Check-In Scanner</div>
      </div>
      <div style={{maxWidth:900,margin:"0 auto",padding:"22px 18px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:11,marginBottom:20}}>
          {[["Confirmed RSVPs",confirmed.length,T.green],["Checked In",attended.length,"#8B5CF6"],["Still Arriving",Math.max(0,confirmed.length-attended.length),T.yellowDark]].map(([l,v,c])=>(
            <div key={l} style={{background:"#fff",borderRadius:10,padding:"14px 16px",border:`1px solid ${T.beigeDark}`,borderTop:`4px solid ${c}`,textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:c}}>{v}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.gray,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{background:T.beigeLight,borderRadius:13,padding:20,border:`1px solid ${T.beigeDark}`}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.inkDark,marginBottom:13}}>Scan QR Code</h3>
            <div style={{position:"relative",width:"100%",paddingBottom:"72%",background:"#1A1A1A",borderRadius:10,overflow:"hidden",marginBottom:11,border:`2px solid ${cameraOn?T.green:T.beigeDark}`}}>
              <video ref={videoRef} muted playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:cameraOn?"block":"none"}} />
              {!cameraOn&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:9}}><div style={{fontSize:40}}>📷</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>{jsQRReady?"Click Start Camera":"Loading…"}</div></div>}
              {cameraOn&&<>
                <div style={{position:"absolute",left:"10%",right:"10%",height:2,background:`linear-gradient(90deg,transparent,${T.green},transparent)`,animation:"scanLine 2s linear infinite",pointerEvents:"none"}} />
                {[[0,0],[0,1],[1,0],[1,1]].map(([v,h],i)=>(<div key={i} style={{position:"absolute",[v?"bottom":"top"]:12,[h?"right":"left"]:12,width:18,height:18,[`border${v?"Bottom":"Top"}`]:`2.5px solid ${T.green}`,[`border${h?"Right":"Left"}`]:`2.5px solid ${T.green}`}} />))}
              </>}
            </div>
            {error&&<div style={{background:"#FEE2E2",color:T.red,padding:"6px 10px",borderRadius:6,fontSize:11,marginBottom:9}}>{error}</div>}
            <div style={{display:"flex",gap:7,marginBottom:14}}>
              {!cameraOn?<button onClick={startCamera} disabled={!jsQRReady} style={{flex:1,background:jsQRReady?T.green:"#E8DFD0",color:"#fff",border:"none",borderRadius:7,padding:10,fontSize:12,fontWeight:700,cursor:jsQRReady?"pointer":"not-allowed"}}>📷 Start Camera</button>:<button onClick={stopCamera} style={{flex:1,background:T.red,color:"#fff",border:"none",borderRadius:7,padding:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>⏹ Stop</button>}
              {scanResult&&<button onClick={()=>{setScanResult(null);startCamera();}} style={{background:"#EDE4D3",color:T.inkDark,border:"none",borderRadius:7,padding:"10px 13px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Next →</button>}
            </div>
            {scanResult&&(
              <div style={{background:scanResult.found&&!scanResult.already?"#DCFCE7":scanResult.already?"#FEF9C3":"#FEE2E2",borderRadius:10,padding:13,border:`1px solid ${scanResult.found&&!scanResult.already?"#BBF7D0":scanResult.already?"#FDE68A":"#FECACA"}`}}>
                <div style={{fontSize:18,marginBottom:5}}>{scanResult.found&&!scanResult.already?"✅":scanResult.already?"⚠️":"❌"}</div>
                {scanResult.found?(<><div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:T.inkDark,marginBottom:2}}>{scanResult.emp.name}</div><div style={{fontSize:11,color:T.gray,marginBottom:2}}>{scanResult.emp.uniqueId} · {scanResult.emp.pax} pax</div>{scanResult.emp.tableId&&<div style={{fontSize:12,fontWeight:700,color:T.greenDark,background:"#DCFCE7",borderRadius:5,padding:"2px 9px",display:"inline-block",marginBottom:3}}>🪑 {tables.find(t=>t.id===scanResult.emp.tableId)?.name||"?"}</div>}<div style={{fontSize:12,fontWeight:700,color:scanResult.already?T.yellowDark:T.green}}>{scanResult.already?`Already checked in at ${scanResult.emp.attendedAt}`:"✓ Checked in!"}</div></>):(<><div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.inkDark,marginBottom:2}}>Not Found</div><div style={{fontSize:11,color:T.red}}>Not in confirmed guest list.</div></>)}
              </div>
            )}
            <div style={{marginTop:16,paddingTop:13,borderTop:`1px solid ${T.beigeDark}`}}>
              <div style={{fontSize:9,color:T.inkMid,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Manual Lookup</div>
              <div style={{display:"flex",gap:7}}>
                <input value={manualQ} onChange={e=>setManualQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleManual()} placeholder="Name or Registration ID…"
                  style={{flex:1,padding:"8px 10px",borderRadius:6,border:`1.5px solid ${T.beigeDark}`,fontSize:12,outline:"none"}}
                  onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.beigeDark} />
                <button onClick={handleManual} style={{background:T.green,color:"#fff",border:"none",borderRadius:6,padding:"8px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Find</button>
              </div>
            </div>
          </div>
          <div style={{background:T.beigeLight,borderRadius:13,padding:20,border:`1px solid ${T.beigeDark}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.inkDark}}>Checked In</h3>
              <span style={{background:"#8B5CF6",color:"#fff",borderRadius:20,padding:"2px 11px",fontSize:11,fontWeight:700}}>{attended.length}</span>
            </div>
            {attended.length===0?<div style={{textAlign:"center",padding:"32px",fontSize:12,color:T.gray}}>No check-ins yet.</div>:(
              <div style={{maxHeight:280,overflowY:"auto"}}>
                {[...employees].filter(e=>e.attended).reverse().map(e=>(
                  <div key={e.id} style={{padding:"8px 0",borderBottom:`1px solid ${T.beigeDark}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:12,fontWeight:600,color:T.inkDark}}>{e.name}</div><div style={{fontSize:10,color:T.gray}}>{e.uniqueId} · {e.pax} pax · {e.attendedAt}</div></div>
                    <span style={{background:"#DCFCE7",color:T.green,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:600}}>✓ In</span>
                  </div>
                ))}
              </div>
            )}
            {confirmed.length>attended.length&&(
              <div style={{marginTop:13,paddingTop:11,borderTop:`1px solid ${T.beigeDark}`}}>
                <div style={{fontSize:9,fontWeight:700,color:T.inkMid,marginBottom:6,textTransform:"uppercase"}}>Not Yet ({confirmed.length-attended.length})</div>
                <div style={{maxHeight:170,overflowY:"auto"}}>
                  {employees.filter(e=>e.rsvpStatus==="confirmed"&&!e.attended).map(e=>(
                    <div key={e.id} style={{padding:"6px 0",borderBottom:`1px solid ${T.beigeDark}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:11,color:T.inkMid}}>{e.name} <span style={{fontSize:9,color:T.gray}}>{e.uniqueId}</span></div>
                      <button onClick={()=>processGuest(`${e.uniqueId}|${e.name}|${e.pax}|${e.id}`)} style={{background:T.green,color:"#fff",border:"none",borderRadius:5,padding:"2px 8px",fontSize:9,fontWeight:600,cursor:"pointer"}}>Mark In</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes scanLine{0%{top:5%}50%{top:88%}100%{top:5%}}`}</style>
    </div>
  );
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(""); if (!email||!pass) { setErr("Please fill in both fields."); return; }
    setLoading(true);
    try {
      const { data, error } = await SUPA.from("app_config").select("key,value").in("key",["admin_email","admin_password"]);
      if (error) throw new Error(error.message);
      const cfg = Object.fromEntries((data||[]).map(r=>[r.key,r.value]));
      if (!cfg.admin_email) {
        // Fallback demo credentials
        if (email==="admin@soilbuild.com" && pass==="admin1234") { onLogin(); setLoading(false); return; }
        setErr("Admin credentials not found in database."); setLoading(false); return;
      }
      if (email.toLowerCase().trim()===cfg.admin_email && pass===cfg.admin_password) {
        sessionStorage.setItem("adminToken", btoa(email+":"+Date.now()));
        sessionStorage.setItem("adminExpiry", String(Date.now()+8*60*60*1000));
        onLogin();
      } else { setErr("Invalid credentials."); }
    } catch(e) {
      if (email==="admin@soilbuild.com" && pass==="admin1234") { onLogin(); }
      else setErr("Cannot connect. Try: admin@soilbuild.com / admin1234");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${T.beige} 0%, #EDE4D3 100%)`, display:"flex", alignItems:"center", justifyContent:"center", paddingTop:56 }}>
      <div style={{ background:T.beigeLight, borderRadius:20, padding:"clamp(20px,5vw,48px)", width:"min(420px,96vw)", boxShadow:"0 24px 60px rgba(92,61,30,0.15)", border:`1px solid ${T.beigeDark}` }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><SoilbuildLogo size={48} /></div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:T.inkDark, fontWeight:700, marginBottom:4 }}>Admin Portal</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.gray }}>Soilbuild Group Holdings Ltd</div>
        </div>
        {err && <div style={{ background:"#FEE2E2", color:T.red, padding:"10px 14px", borderRadius:8, marginBottom:16, fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>⚠️ {err}</div>}
        {[["Email","email","email",email,setEmail],["Password","pass","password",pass,setPass]].map(([lbl,id,type,val,set]) => (
          <div key={id} style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.inkMid, marginBottom:6, fontWeight:500 }}>{lbl}</label>
            <input type={type} value={val} onChange={e=>set(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}
              placeholder={lbl} style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none" }}
              onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.beigeDark} />
          </div>
        ))}
        <button onClick={handle} disabled={loading}
          style={{ width:"100%", background:loading?"#E8DFD0":T.green, color:loading?T.inkMid:"#fff", border:"none", borderRadius:8, padding:13, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", marginBottom:12 }}>
          {loading ? "Verifying…" : "Sign In"}
        </button>
        <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#15803D", textAlign:"center" }}>
          Demo: admin@soilbuild.com / admin1234
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ employees, setEmployees, tables, setTables, prizes, setPrizes, winners, eventInfo, setEventInfo, onLogout, setPage }) {
  const [tab, setTab]               = useState("people");
  const [search, setSearch]         = useState("");
  const [showAdd, setShowAdd]       = useState(false);
  const [newP, setNewP]             = useState({ name:"", employeeNumber:"", email:"", mobile:"", department:"", company:"Soilbuild", pax:1, type:"employee", dietary:"Chinese", allergies:"" });
  const [editId, setEditId]         = useState(null);
  const [editData, setEditData]     = useState({});
  const [newTable, setNewTable]     = useState({ name:"", capacity:10 });
  const [bulkCount, setBulkCount]   = useState(5);
  const [bulkCap, setBulkCap]       = useState(10);
  const [newPrize, setNewPrize]     = useState({ label:"", type:"", description:"", photo:"" });
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [bulkText, setBulkText]     = useState("");
  const [showBulk, setShowBulk]     = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [editTableId, setEditTableId] = useState(null);
  const [editTableData, setEditTableData] = useState({});

  const TABS = [
    {id:"event",     label:"Event Info"},
    {id:"people",    label:"People"},
    {id:"tables",    label:"Tables"},
    {id:"prizes",    label:"Prizes"},
    {id:"rsvp",      label:"RSVP Status"},
    {id:"dietary",   label:"🍽 Dietary"},
    {id:"downloads", label:"Downloads"},
  ];

  // ── people actions ────────────────────────────────────────────────────────
  const addPerson = async () => {
    if (!newP.name.trim()) return;
    const uniqueId = getNextUniqueId(employees, newP.type);
    const emp = { id:uid(), ...newP, name:newP.name.trim(), uniqueId, drawEligible:true, tableId:null, rsvpStatus:"pending", attended:false };
    await dbUpsert("employees", emp);
    setEmployees(prev => [...prev, emp]);
    setNewP({ name:"", employeeNumber:"", email:"", mobile:"", department:"", company:"Soilbuild", pax:1, type:"employee", dietary:"Chinese", allergies:"" });
    setShowAdd(false);
  };
  const removePerson = async (id) => {
    const emp = employees.find(e=>e.id===id);
    await dbDelete("employees", id);
    if (emp?.tableId && emp.rsvpStatus==="confirmed") setTables(prev=>prev.map(t=>t.id===emp.tableId?{...t,assignedCount:Math.max(0,t.assignedCount-emp.pax)}:t));
    setEmployees(prev=>prev.filter(e=>e.id!==id));
  };
  const toggleDraw = async (id) => {
    const emp = employees.find(e=>e.id===id);
    if (!emp) return;
    const updated = {...emp, drawEligible:!emp.drawEligible};
    await dbUpsert("employees", updated);
    setEmployees(prev=>prev.map(e=>e.id===id?updated:e));
  };
  const saveEdit = async () => {
    const updated = {...employees.find(e=>e.id===editId), ...editData};
    await dbUpsert("employees", updated);
    setEmployees(prev=>prev.map(e=>e.id===editId?updated:e));
    setEditId(null);
  };

  // ── bulk file import ──────────────────────────────────────────────────────
  const handleFileImport = (file) => {
    const reader = new FileReader();
    const isCSV  = file.name.toLowerCase().endsWith(".csv");
    reader.onload = (ev) => {
      try {
        let rows = [];
        if (isCSV) {
          const lines = ev.target.result.split("\n").filter(l=>l.trim());
          const headers = lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));
          rows = lines.slice(1).map(line => {
            const vals = line.split(",").map(v=>v.trim().replace(/^"|"$/g,""));
            const obj = {}; headers.forEach((h,i)=>{ obj[h]=vals[i]||""; }); return obj;
          });
        } else {
          const wb = XLSX.read(ev.target.result,{type:"binary"});
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws,{defval:""});
        }
        const parsed = rows.map(r => {
          const name           = (r["Name"]||r["name"]||"").trim();
          const employeeNumber = (r["EmployeeNumber"]||r["Employee Number"]||r["Emp No"]||"").trim();
          const email          = (r["Email"]||r["email"]||"").trim();
          const mobile         = (r["Mobile"]||r["mobile"]||"").trim();
          const department     = (r["Department"]||r["department"]||"").trim();
          const company        = (r["Company"]||r["company"]||"Soilbuild").trim();
          const pax            = parseInt(r["Pax"]||r["pax"]||"1")||1;
          const type           = ((r["Type"]||r["type"]||"employee")).toLowerCase().trim()==="vip"?"vip":"employee";
          const dietary        = (r["Dietary"]||r["dietary"]||"Chinese").trim();
          if (!name) return null;
          return { name, employeeNumber, email, mobile, department, company, pax, type, dietary };
        }).filter(Boolean);
        setBulkPreview(parsed);
      } catch(e) { alert("Could not read file."); }
    };
    if (isCSV) reader.readAsText(file); else reader.readAsBinaryString(file);
  };
  const confirmImport = async () => {
    let updated = [...employees];
    for (const p of bulkPreview) {
      const existing = updated.find(e=>e.name.toLowerCase()===p.name.toLowerCase());
      if (existing) {
        updated = updated.map(e=>e.id===existing.id?{...e,...p}:e);
        await dbUpsert("employees", {...existing,...p});
      } else {
        const uniqueId = getNextUniqueId(updated, p.type);
        const emp = { id:uid(), ...p, uniqueId, drawEligible:true, tableId:null, rsvpStatus:"pending", attended:false };
        updated.push(emp);
        await dbUpsert("employees", emp);
      }
    }
    setEmployees(updated); setBulkPreview([]); setShowBulk(false);
    alert(`✓ ${bulkPreview.length} people imported.`);
  };

  // ── tables ────────────────────────────────────────────────────────────────
  const addTable = async () => {
    if (!newTable.name) return;
    const t = { id:uid(), name:newTable.name, capacity:parseInt(newTable.capacity)||10, assignedCount:0 };
    await dbUpsert("tables", t);
    setTables(prev=>[...prev,t]); setNewTable({name:"",capacity:10});
  };
  const genBulkTables = async () => {
    const cnt = parseInt(bulkCount)||0; const cap = parseInt(bulkCap)||10;
    if (cnt<1) return;
    const existing = tables.map(t=>{const m=t.name.match(/Table (\d+)/);return m?parseInt(m[1]):0;}).filter(n=>n>0);
    const start = existing.length>0 ? Math.max(...existing)+1 : 1;
    const newTbls = Array.from({length:cnt},(_,i)=>({id:uid(), name:`Table ${start+i}`, capacity:cap, assignedCount:0}));
    for (const t of newTbls) await dbUpsert("tables",t);
    setTables(prev=>[...prev,...newTbls]);
  };
  const removeTable = async (id) => {
    const t = tables.find(x=>x.id===id);
    if (t?.assignedCount>0 && !window.confirm(`${t.name} has ${t.assignedCount} people. Remove anyway?`)) return;
    if (t?.assignedCount>0) setEmployees(prev=>prev.map(e=>e.tableId===id?{...e,tableId:null,rsvpStatus:"pending"}:e));
    await dbDelete("tables", id);
    setTables(prev=>prev.filter(x=>x.id!==id));
  };
  const saveTableEdit = async () => {
    const upd = {...tables.find(t=>t.id===editTableId), ...editTableData};
    await dbUpsert("tables", upd);
    setTables(prev=>prev.map(t=>t.id===editTableId?upd:t));
    setEditTableId(null);
  };

  // ── prizes ────────────────────────────────────────────────────────────────
  const addPrize = async () => {
    if (!newPrize.label) return;
    const p = { id:uid(), ...newPrize, drawn:false, order:prizes.length };
    await dbUpsert("prizes", p);
    setPrizes(prev=>[...prev,p]); setNewPrize({label:"",type:"",description:"",photo:""});
  };
  const movePrize = (idx,dir) => {
    const arr=[...prizes]; const sw=idx+dir;
    if(sw<0||sw>=arr.length) return;
    [arr[idx],arr[sw]]=[arr[sw],arr[idx]]; setPrizes(arr);
  };
  const handlePrizePhoto = (e,prizeId) => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      if(prizeId) setPrizes(prev=>prev.map(p=>p.id===prizeId?{...p,photo:ev.target.result}:p));
      else setNewPrize(p=>({...p,photo:ev.target.result}));
    };
    reader.readAsDataURL(file);
  };

  // ── exports ───────────────────────────────────────────────────────────────
  const exportXLSX = (data, name) => {
    const ws=XLSX.utils.json_to_sheet(data);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,name);
    XLSX.writeFile(wb,`${name}.xlsx`);
  };
  const exportAttendees = () => exportXLSX(employees.map(e=>({
    "Registration ID":e.uniqueId, Type:e.type, "Guest Type":e.guestType||"",
    Name:e.name, "Employee No":e.employeeNumber, Email:e.email, Mobile:e.mobile,
    Company:e.company, Department:e.department, Pax:e.pax,
    "RSVP Status":e.rsvpStatus, Table:tables.find(t=>t.id===e.tableId)?.name||"",
    "Draw Eligible":e.drawEligible?"Yes":"No", Attended:e.attended?"Yes":"No",
  })), "Attendees");
  const exportDietary = () => exportXLSX(employees.filter(e=>e.rsvpStatus==="confirmed").map(e=>({
    "Registration ID":e.uniqueId, Name:e.name, Type:e.type,
    Dietary:e.dietary||"—", Allergies:e.allergies||"None",
    Pax:e.pax, Table:tables.find(t=>t.id===e.tableId)?.name||"",
  })), "Dietary_Report");
  const exportDrawList = (filterType) => {
    const pool = employees.filter(e => e.rsvpStatus==="confirmed" && e.drawEligible && (filterType==="all" || e.type===filterType));
    exportXLSX(pool.map(e=>({ "Registration ID":e.uniqueId, Name:e.name, Type:e.type, "Guest Type":e.guestType||"" })), `LuckyDraw_${filterType}`);
  };
  const exportWinners = () => exportXLSX(winners.map(w=>({ "Registration ID":w.uniqueId||"", Name:w.name, Prize:w.prizeLabel, Description:w.prizeDescription, Time:w.timestamp })), "Winners");

  const filtered   = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || (e.uniqueId||"").toLowerCase().includes(search.toLowerCase()) || (e.employeeNumber||"").toLowerCase().includes(search.toLowerCase()));
  const confirmed  = employees.filter(e=>e.rsvpStatus==="confirmed");
  const declined   = employees.filter(e=>e.rsvpStatus==="declined");
  const pending    = employees.filter(e=>e.rsvpStatus==="pending");
  const totalSeats = confirmed.reduce((a,e)=>a+e.pax,0);
  const rsvpFiltered = rsvpFilter==="all" ? employees : employees.filter(e=>e.rsvpStatus===rsvpFilter);

  return (
    <div style={{ minHeight:"100vh", background:"#F5F0E8", paddingTop:56 }}>
      {/* Header */}
      <div style={{ background:"#EDE4D3", borderBottom:`1px solid ${T.beigeDark}`, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <SoilbuildLogo size={32} />
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, color:T.inkDark, fontWeight:700 }}>Admin Dashboard</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid }}>{eventInfo.title} {eventInfo.year}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={()=>setPage("draw-admin")} style={{ background:T.green, color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer" }}>🎰 Draw</button>
          <button onClick={onLogout} style={{ background:"rgba(193,39,45,0.1)", color:T.red, border:`1px solid rgba(193,39,45,0.25)`, borderRadius:7, padding:"8px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer" }}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:T.beigeLight, borderBottom:`1px solid ${T.beigeDark}`, display:"flex", padding:"0 12px", overflowX:"auto", scrollbarWidth:"none" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ background:"none", border:"none", borderBottom:`3px solid ${tab===t.id?T.green:"transparent"}`, padding:"13px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:tab===t.id?700:500, color:tab===t.id?T.green:T.inkMid, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:"28px 24px", maxWidth:1280, margin:"0 auto" }}>

        {/* ── EVENT INFO ── */}
        {tab==="event" && (
          <div style={{ maxWidth:680 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:T.inkDark, marginBottom:20 }}>Event Information</h3>
            <div style={{ background:T.beigeLight, borderRadius:12, padding:28, border:`1px solid ${T.beigeDark}` }}>
              {[["Greeting","greeting"],["Title","title"],["Year","year"],["Date","date"],["Time","time"],["Venue","venue"],["Dress Code","dressCode"],["RSVP Deadline","rsvpDeadline"]].map(([lbl,key]) => (
                <div key={key} style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, marginBottom:5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>{lbl}</label>
                  <input value={eventInfo[key]||""} onChange={e=>setEventInfo(p=>({...p,[key]:e.target.value}))}
                    style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:14, outline:"none", background:"#fff", color:T.inkDark }}
                    onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.beigeDark} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PEOPLE ── */}
        {tab==="people" && (
          <div>
            <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, ID, employee no…"
                style={{ flex:1, minWidth:200, padding:"9px 14px", borderRadius:7, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }} />
              <button onClick={()=>setShowAdd(true)} style={{ background:T.green, color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Add Person</button>
              <button onClick={()=>setShowBulk(!showBulk)} style={{ background:"#8B5CF6", color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>📂 Import CSV/XLSX</button>
            </div>

            {/* Bulk import */}
            {showBulk && (
              <div style={{ background:T.beigeLight, borderRadius:12, padding:24, marginBottom:18, border:`1px solid ${T.beigeDark}` }}>
                <h4 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:T.inkDark, marginBottom:12 }}>📂 Import from File</h4>
                <div style={{ border:"2px dashed #D0C0A8", borderRadius:10, padding:"24px", textAlign:"center", marginBottom:14, cursor:"pointer", background:"#FAF7F2" }}
                  onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.green;}}
                  onDragLeave={e=>e.currentTarget.style.borderColor="#D0C0A8"}
                  onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="#D0C0A8";const f=e.dataTransfer.files[0];if(f)handleFileImport(f);}}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.inkMid, marginBottom:10 }}>Drag &amp; drop CSV or XLSX, or</div>
                  <label style={{ background:"#8B5CF6", color:"#fff", borderRadius:7, padding:"8px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    Browse File <input type="file" accept=".xlsx,.xls,.csv" onChange={e=>e.target.files[0]&&handleFileImport(e.target.files[0])} style={{ display:"none" }} />
                  </label>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray, marginTop:8 }}>Columns: Name, EmployeeNumber, Email, Mobile, Department, Company, Pax, Type (employee/vip), Dietary</div>
                </div>
                {bulkPreview.length>0 && (
                  <div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.green, fontWeight:700, marginBottom:8 }}>✓ {bulkPreview.length} people ready to import:</div>
                    <div style={{ maxHeight:160, overflowY:"auto", border:`1px solid ${T.beigeDark}`, borderRadius:8, background:"#fff", marginBottom:12 }}>
                      {bulkPreview.slice(0,8).map((p,i)=>(
                        <div key={i} style={{ padding:"7px 12px", borderBottom:`1px solid #F5F0E8`, fontFamily:"'DM Sans',sans-serif", fontSize:12, display:"flex", gap:12 }}>
                          <span style={{ fontWeight:600, color:T.inkDark, minWidth:140 }}>{p.name}</span>
                          <span style={{ color:T.gray }}>{p.employeeNumber||"—"}</span>
                          <span style={{ color:p.type==="vip"?T.yellow:T.green, fontWeight:600 }}>{p.type}</span>
                        </div>
                      ))}
                      {bulkPreview.length>8 && <div style={{ padding:"5px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray }}>…and {bulkPreview.length-8} more</div>}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={confirmImport} style={{ background:T.green, color:"#fff", border:"none", borderRadius:7, padding:"9px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>✓ Import {bulkPreview.length}</button>
                      <button onClick={()=>{setBulkPreview([]);setShowBulk(false);}} style={{ background:"#EDE4D3", color:T.inkDark, border:"none", borderRadius:7, padding:"9px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add person modal */}
            {showAdd && (
              <div style={{ background:T.beigeLight, borderRadius:12, padding:24, marginBottom:18, border:`1px solid ${T.beigeDark}` }}>
                <h4 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, marginBottom:14, color:T.inkDark }}>Add New Person</h4>
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  {[["👤 Employee","employee"],["⭐ VIP / Guest","vip"]].map(([lbl,val])=>(
                    <button key={val} onClick={()=>setNewP(p=>({...p,type:val}))}
                      style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`2px solid ${newP.type===val?T.green:T.beigeDark}`, background:newP.type===val?"#DCFCE7":"#F5F0E8", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", color:newP.type===val?T.green:T.gray }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginBottom:12 }}>
                  {[["Name","name","text"],["Employee No.","employeeNumber","text"],["Email","email","email"],["Mobile","mobile","tel"],["Department","department","text"],["Company","company","text"],["Pax","pax","number"]].map(([lbl,key,type])=>(
                    <div key={key}>
                      <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray, marginBottom:3 }}>{lbl}</label>
                      <input type={type} value={newP[key]} onChange={e=>setNewP(p=>({...p,[key]:type==="number"?parseInt(e.target.value)||1:e.target.value}))} placeholder={lbl}
                        style={{ width:"100%", padding:"8px 10px", borderRadius:6, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:12 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={addPerson} style={{ background:T.green, color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>Add</button>
                  <button onClick={()=>setShowAdd(false)} style={{ background:"#EDE4D3", color:T.inkDark, border:"none", borderRadius:7, padding:"8px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={{ background:T.beigeLight, borderRadius:12, overflow:"hidden", border:`1px solid ${T.beigeDark}`, overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#EDE4D3" }}>
                  {["ID","Type","Name","Emp No.","Email","Pax","RSVP","Table","Draw","Actions"].map(h=>(
                    <th key={h} style={{ padding:"11px 13px", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:T.gray, textTransform:"uppercase", letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map((e,i) => (
                    <tr key={e.id} style={{ borderTop:`1px solid ${T.beigeDark}`, background:i%2===0?T.beigeLight:"#F5F0E8" }}>
                      {editId===e.id ? (
                        <>
                          <td style={{ padding:"8px 10px" }}><input value={editData.name||""} onChange={ev=>setEditData(d=>({...d,name:ev.target.value}))} style={{ padding:"5px 8px", borderRadius:5, border:`1px solid ${T.beigeDark}`, fontSize:12, width:120 }} /></td>
                          <td style={{ padding:"8px 10px" }}><input value={editData.employeeNumber||""} onChange={ev=>setEditData(d=>({...d,employeeNumber:ev.target.value}))} style={{ padding:"5px 8px", borderRadius:5, border:`1px solid ${T.beigeDark}`, fontSize:12, width:80 }} /></td>
                          <td style={{ padding:"8px 10px" }}><input value={editData.email||""} onChange={ev=>setEditData(d=>({...d,email:ev.target.value}))} style={{ padding:"5px 8px", borderRadius:5, border:`1px solid ${T.beigeDark}`, fontSize:12, width:130 }} /></td>
                          <td style={{ padding:"8px 10px" }}><input type="number" value={editData.pax||1} onChange={ev=>setEditData(d=>({...d,pax:parseInt(ev.target.value)||1}))} style={{ padding:"5px 8px", borderRadius:5, border:`1px solid ${T.beigeDark}`, fontSize:12, width:50 }} /></td>
                          <td colSpan={4} />
                          <td style={{ padding:"8px 10px" }}>
                            <div style={{ display:"flex", gap:5 }}>
                              <button onClick={saveEdit} style={{ background:T.green, color:"#fff", border:"none", borderRadius:5, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer" }}>Save</button>
                              <button onClick={()=>setEditId(null)} style={{ background:"#EDE4D3", color:T.inkDark, border:"none", borderRadius:5, padding:"4px 8px", fontSize:11, cursor:"pointer" }}>✕</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding:"11px 13px" }}>
                            <span style={{ fontFamily:"'Courier New',monospace", fontSize:13, fontWeight:900, color:T.yellow, background:T.dark, padding:"2px 7px", borderRadius:5, letterSpacing:1 }}>{e.uniqueId||"—"}</span>
                          </td>
                          <td style={{ padding:"11px 13px" }}>
                            <span style={{ background:e.type==="vip"?T.dark:"#DCFCE7", color:e.type==="vip"?T.yellow:T.green, padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:700 }}>{e.type==="vip"?"⭐ VIP":"👤"}</span>
                          </td>
                          <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.inkDark, fontWeight:500, whiteSpace:"nowrap" }}>{e.name}</td>
                          <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{e.employeeNumber||"—"}</td>
                          <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.email||"—"}</td>
                          <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>{e.pax}</td>
                          <td style={{ padding:"11px 13px" }}>
                            <span style={{ background:e.rsvpStatus==="confirmed"?"#DCFCE7":e.rsvpStatus==="declined"?"#FEE2E2":"#F5F0E8", color:e.rsvpStatus==="confirmed"?T.green:e.rsvpStatus==="declined"?T.red:T.gray, padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:600 }}>{e.rsvpStatus}</span>
                          </td>
                          <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{tables.find(t=>t.id===e.tableId)?.name||"—"}</td>
                          <td style={{ padding:"11px 13px" }}>
                            <button onClick={()=>toggleDraw(e.id)}
                              style={{ background:e.drawEligible?"#DCFCE7":"#F5F0E8", color:e.drawEligible?T.green:T.gray, border:"none", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                              {e.drawEligible?"✓ In":"✕ Out"}
                            </button>
                          </td>
                          <td style={{ padding:"11px 13px" }}>
                            <div style={{ display:"flex", gap:5 }}>
                              <button onClick={()=>{setEditId(e.id);setEditData({name:e.name,employeeNumber:e.employeeNumber,email:e.email||"",pax:e.pax});}}
                                style={{ background:"#EDE4D3", color:T.inkDark, border:"none", borderRadius:5, padding:"4px 9px", fontSize:11, fontWeight:600, cursor:"pointer" }}>Edit</button>
                              <button onClick={()=>removePerson(e.id)}
                                style={{ background:"#FEE2E2", color:T.red, border:"none", borderRadius:5, padding:"4px 9px", fontSize:11, fontWeight:600, cursor:"pointer" }}>✕</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {filtered.length===0 && <tr><td colSpan={10} style={{ padding:28, textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.gray }}>No results.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TABLES ── */}
        {tab==="tables" && (
          <div>
            <div style={{ background:T.beigeLight, borderRadius:12, padding:22, marginBottom:20, border:`1px solid ${T.beigeDark}` }}>
              <h4 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:T.inkDark, marginBottom:12 }}>Bulk Generate Tables</h4>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
                {[["Count","number",bulkCount,setBulkCount,80],["Capacity","number",bulkCap,setBulkCap,80]].map(([lbl,type,val,set,w])=>(
                  <div key={lbl}>
                    <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray, marginBottom:3 }}>{lbl}</label>
                    <input type={type} value={val} onChange={e=>set(e.target.value)} style={{ padding:"8px 10px", borderRadius:6, border:`1.5px solid ${T.beigeDark}`, fontSize:13, width:w }} />
                  </div>
                ))}
                <button onClick={genBulkTables} style={{ background:T.green, color:"#fff", border:"none", borderRadius:7, padding:"9px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Generate</button>
              </div>
            </div>
            <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"flex-end" }}>
              {[["Table Name","name","text",newTable.name,v=>setNewTable(t=>({...t,name:v})),180],["Capacity","capacity","number",newTable.capacity,v=>setNewTable(t=>({...t,capacity:v})),90]].map(([lbl,key,type,val,set,w])=>(
                <div key={key}>
                  <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray, marginBottom:3 }}>{lbl}</label>
                  <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={lbl} style={{ padding:"8px 10px", borderRadius:6, border:`1.5px solid ${T.beigeDark}`, fontSize:13, width:w }} />
                </div>
              ))}
              <button onClick={addTable} style={{ background:T.greenDark, color:"#fff", border:"none", borderRadius:7, padding:"9px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Add Custom</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
              {tables.map(t => {
                const pct = Math.round((t.assignedCount/t.capacity)*100);
                const isE = editTableId===t.id;
                return (
                  <div key={t.id} style={{ background:T.beigeLight, borderRadius:13, padding:20, border:`1px solid ${T.beigeDark}` }}>
                    {isE ? (
                      <div style={{ marginBottom:12 }}>
                        <input value={editTableData.name} onChange={e=>setEditTableData(d=>({...d,name:e.target.value}))} style={{ padding:"6px 10px", borderRadius:6, border:`1px solid ${T.beigeDark}`, fontSize:14, fontWeight:700, width:"100%", marginBottom:6 }} />
                        <input type="number" value={editTableData.capacity} onChange={e=>setEditTableData(d=>({...d,capacity:parseInt(e.target.value)||1}))} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${T.beigeDark}`, fontSize:12, width:80 }} />
                      </div>
                    ) : (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.inkDark }}>{t.name}</div>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray, marginTop:2 }}>Capacity {t.capacity}</div>
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{t.assignedCount} / {t.capacity}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:pct>=90?T.red:T.inkDark }}>{pct}%</span>
                    </div>
                    <div style={{ background:"#EDE4D3", borderRadius:6, height:6, overflow:"hidden", marginBottom:12 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:pct>=90?T.red:pct>=60?T.yellow:T.green, borderRadius:6, transition:"width 0.3s" }} />
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {isE ? (
                        <>
                          <button onClick={saveTableEdit} style={{ background:T.green, color:"#fff", border:"none", borderRadius:5, padding:"5px 10px", fontSize:11, fontWeight:700, cursor:"pointer" }}>Save</button>
                          <button onClick={()=>setEditTableId(null)} style={{ background:"#EDE4D3", color:T.inkDark, border:"none", borderRadius:5, padding:"5px 8px", fontSize:11, cursor:"pointer" }}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={()=>{setEditTableId(t.id);setEditTableData({name:t.name,capacity:t.capacity});}} style={{ background:"#EDE4D3", color:T.inkDark, border:"none", borderRadius:5, padding:"5px 10px", fontSize:11, fontWeight:600, cursor:"pointer" }}>✏ Edit</button>
                      )}
                      <button onClick={()=>removeTable(t.id)} style={{ background:"#FEE2E2", color:T.red, border:"none", borderRadius:5, padding:"5px 10px", fontSize:11, fontWeight:600, cursor:"pointer" }}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PRIZES ── */}
        {tab==="prizes" && (
          <div>
            <div style={{ background:T.beigeLight, borderRadius:12, padding:22, marginBottom:20, border:`1px solid ${T.beigeDark}` }}>
              <h4 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:T.inkDark, marginBottom:14 }}>Add Prize</h4>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                {[["Label","label"],["Type","type"],["Description","description"]].map(([lbl,key])=>(
                  <div key={key} style={{ gridColumn:key==="description"?"1 / -1":"auto" }}>
                    <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray, marginBottom:3 }}>{lbl}</label>
                    <input value={newPrize[key]} onChange={e=>setNewPrize(p=>({...p,[key]:e.target.value}))} placeholder={lbl}
                      style={{ width:"100%", padding:"8px 10px", borderRadius:6, border:`1.5px solid ${T.beigeDark}`, fontSize:13 }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:10 }}>
                <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray, marginBottom:3 }}>Prize Photo</label>
                <input type="file" accept="image/*" onChange={e=>handlePrizePhoto(e,null)} style={{ fontSize:12 }} />
                {newPrize.photo && <img src={newPrize.photo} alt="preview" style={{ height:70, borderRadius:7, border:`1px solid ${T.beigeDark}`, marginTop:8 }} />}
              </div>
              <button onClick={addPrize} style={{ background:T.green, color:"#fff", border:"none", borderRadius:7, padding:"9px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Add Prize</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {prizes.map((p,i) => (
                <div key={p.id} style={{ background:T.beigeLight, borderRadius:11, padding:"14px 18px", border:`1px solid ${T.beigeDark}`, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                    <button onClick={()=>movePrize(i,-1)} disabled={i===0} style={{ background:"none", border:"none", cursor:i===0?"default":"pointer", fontSize:13, color:i===0?T.beigeDark:T.gray }}>▲</button>
                    <button onClick={()=>movePrize(i, 1)} disabled={i===prizes.length-1} style={{ background:"none", border:"none", cursor:i===prizes.length-1?"default":"pointer", fontSize:13, color:i===prizes.length-1?T.beigeDark:T.gray }}>▼</button>
                  </div>
                  <div style={{ width:68, height:68, borderRadius:8, background:"#EDE4D3", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
                    {p.photo ? <img src={p.photo} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={p.label} /> : <span style={{ fontSize:24, opacity:0.3 }}>🎁</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.green, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>{p.type||"—"}</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.inkDark }}>{p.label}</div>
                    {p.description && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{p.description}</div>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5, alignItems:"flex-end", flexShrink:0 }}>
                    <label style={{ background:"#EDE4D3", color:T.inkDark, borderRadius:5, padding:"4px 9px", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                      📷<input type="file" accept="image/*" onChange={e=>handlePrizePhoto(e,p.id)} style={{ display:"none" }} />
                    </label>
                    <button onClick={()=>setPrizes(prev=>prev.map(pr=>pr.id===p.id?{...pr,drawn:!pr.drawn}:pr))}
                      style={{ background:p.drawn?"#DCFCE7":"#F5F0E8", color:p.drawn?T.green:T.gray, border:"none", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                      {p.drawn?"Drawn ✓":"Not Drawn"}
                    </button>
                    <button onClick={()=>setPrizes(prev=>prev.filter(pr=>pr.id!==p.id))} style={{ background:"#FEE2E2", color:T.red, border:"none", borderRadius:5, padding:"4px 9px", fontSize:10, fontWeight:600, cursor:"pointer" }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RSVP STATUS ── */}
        {tab==="rsvp" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:24 }}>
              {[["Total",employees.length,T.greenDark],["Confirmed",confirmed.length,T.green],["Declined",declined.length,T.red],["Pending",pending.length,T.yellowDark],["Seats",totalSeats,"#8B5CF6"]].map(([lbl,val,color])=>(
                <div key={lbl} style={{ background:"#fff", borderRadius:11, padding:"16px 18px", border:`1px solid ${T.beigeDark}`, borderTop:`4px solid ${color}` }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color }}>{val}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray, marginTop:3 }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:7, marginBottom:14, flexWrap:"wrap" }}>
              {["all","confirmed","declined","pending"].map(f=>(
                <button key={f} onClick={()=>setRsvpFilter(f)}
                  style={{ background:rsvpFilter===f?T.green:"#fff", color:rsvpFilter===f?"#fff":T.gray, border:`1px solid ${rsvpFilter===f?T.green:T.beigeDark}`, borderRadius:20, padding:"5px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer", textTransform:"capitalize" }}>
                  {f}
                </button>
              ))}
            </div>
            <div style={{ background:T.beigeLight, borderRadius:11, overflow:"hidden", border:`1px solid ${T.beigeDark}`, overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#EDE4D3" }}>
                  {["ID","Name","Emp No.","Email","Pax","Status","Table"].map(h=>(
                    <th key={h} style={{ padding:"11px 13px", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:T.gray, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {rsvpFiltered.map((e,i)=>(
                    <tr key={e.id} style={{ borderTop:`1px solid ${T.beigeDark}`, background:i%2===0?T.beigeLight:"#F5F0E8" }}>
                      <td style={{ padding:"11px 13px" }}><span style={{ fontFamily:"'Courier New',monospace", fontSize:12, fontWeight:700, color:T.yellow, background:T.dark, padding:"2px 6px", borderRadius:4 }}>{e.uniqueId||"—"}</span></td>
                      <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500 }}>{e.name}</td>
                      <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{e.employeeNumber||"—"}</td>
                      <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{e.email||"—"}</td>
                      <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>{e.pax}</td>
                      <td style={{ padding:"11px 13px" }}>
                        <span style={{ background:e.rsvpStatus==="confirmed"?"#DCFCE7":e.rsvpStatus==="declined"?"#FEE2E2":"#F5F0E8", color:e.rsvpStatus==="confirmed"?T.green:e.rsvpStatus==="declined"?T.red:T.gray, padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:600 }}>{e.rsvpStatus}</span>
                      </td>
                      <td style={{ padding:"11px 13px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{tables.find(t=>t.id===e.tableId)?.name||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DIETARY ── */}
        {tab==="dietary" && (
          <div style={{ maxWidth:760 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:T.inkDark, marginBottom:20 }}>Dietary Preferences</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:24 }}>
              {[["🍜","Chinese"],["🌙","Halal"],["🥗","Vegetarian"]].map(([ic,val])=>{
                const count=confirmed.filter(e=>e.dietary===val).length;
                const pax  =confirmed.filter(e=>e.dietary===val).reduce((a,e)=>a+e.pax,0);
                return (
                  <div key={val} style={{ background:T.beigeLight, borderRadius:12, border:`1px solid ${T.beigeDark}`, padding:"18px 20px", textAlign:"center" }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>{ic}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:30, fontWeight:800, color:T.green }}>{count}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, fontWeight:600, marginTop:2 }}>{val}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gray }}>{pax} pax</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background:T.beigeLight, borderRadius:12, border:`1px solid ${T.beigeDark}`, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#EDE4D3" }}>
                  {["Name","ID","Type","Dietary","Allergies","Pax"].map(h=>(
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:T.gray, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {confirmed.map((e,i)=>(
                    <tr key={e.id} style={{ borderTop:`1px solid ${T.beigeDark}`, background:i%2===0?T.beigeLight:"#F5F0E8" }}>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500 }}>{e.name}</td>
                      <td style={{ padding:"10px 14px" }}><span style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:T.yellow, background:T.dark, padding:"2px 6px", borderRadius:4 }}>{e.uniqueId||"—"}</span></td>
                      <td style={{ padding:"10px 14px" }}><span style={{ background:e.type==="vip"?"#FEF9C3":"#EEF2FF", color:e.type==="vip"?"#92400E":T.green, borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700 }}>{e.type==="vip"?"VIP":"Employee"}</span></td>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>{{"Chinese":"🍜","Halal":"🌙","Vegetarian":"🥗"}[e.dietary]||"—"} {e.dietary||"—"}</td>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{e.allergies||"None"}</td>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>{e.pax}</td>
                    </tr>
                  ))}
                  {confirmed.length===0 && <tr><td colSpan={6} style={{ padding:24, textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.gray }}>No confirmed attendees yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DOWNLOADS ── */}
        {tab==="downloads" && (
          <div style={{ maxWidth:700 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:T.inkDark, marginBottom:20 }}>Export Data</h3>
            {[
              ["📋 Full Attendee List", "All registrations — ID, type, name, contact, table, draw status", exportAttendees],
              ["✅ RSVP Report",        "Confirmed and declined guests only",                               ()=>exportXLSX(employees.filter(e=>e.rsvpStatus!=="pending").map(e=>({ID:e.uniqueId,Name:e.name,Type:e.type,Status:e.rsvpStatus,Table:tables.find(t=>t.id===e.tableId)?.name||""})),"RSVP_Report")],
              ["🍽 Dietary Report",     "All confirmed attendees with dietary & allergy info",              exportDietary],
              ["🏆 Winners List",       "Lucky draw winners",                                              exportWinners],
            ].map(([title,desc,fn])=>(
              <div key={title} style={{ background:"#fff", borderRadius:11, padding:"16px 20px", border:`1px solid ${T.beigeDark}`, marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center", gap:14 }}>
                <div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:T.inkDark, marginBottom:3 }}>{title}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{desc}</div>
                </div>
                <button onClick={fn} style={{ background:T.green, color:"#fff", border:"none", borderRadius:7, padding:"9px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0 }}>⬇ Excel</button>
              </div>
            ))}
            {/* Lucky Draw exports by category */}
            <div style={{ background:T.beigeLight, borderRadius:11, padding:"16px 20px", border:`1px solid ${T.beigeDark}`, marginTop:16 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:T.inkDark, marginBottom:12 }}>🎰 Lucky Draw Lists by Category</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["Employee Only","employee"],["VIP / Guest Only","vip"],["Everyone","all"]].map(([lbl,type])=>(
                  <button key={type} onClick={()=>exportDrawList(type)} style={{ background:type==="all"?T.dark:T.green, color:"#fff", border:"none", borderRadius:7, padding:"8px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    ⬇ {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DRAW ADMIN ───────────────────────────────────────────────────────────────
function DrawAdmin({ employees, setEmployees, prizes, setPrizes, winners, setWinners, eventInfo, onLogout, setPage }) {
  const [selectedPrize, setSelectedPrize] = useState("");
  const [winnersCount,  setWinnersCount]  = useState(1);
  // ── DRAW POOL MODE — this is admin-only, audience never sees the choice ──
  const [poolMode, setPoolMode]           = useState("both"); // "employee" | "vip" | "both"
  const [countdown, setCountdown]         = useState(null);
  const [spinning,  setSpinning]          = useState(false);
  const [spinDisplay,setSpinDisplay]      = useState("—");
  const [roundWinners,setRoundWinners]    = useState([]);
  const [excluded,  setExcluded]          = useState([]);
  const spinRef  = useRef();
  const countRef = useRef();

  // Eligible pool filtered by admin's mode choice
  const eligible = employees.filter(e =>
    e.rsvpStatus==="confirmed" && e.drawEligible && !excluded.includes(e.id) &&
    (poolMode==="both" || e.type===poolMode)
  );
  const excludedList = employees.filter(e => excluded.includes(e.id));

  const uid_fn = () => Math.random().toString(36).slice(2,10);

  // Generate a MIXED audience display pool: SE + GV IDs shuffled together (001-600)
  // This is what shows on the AUDIENCE screen during spin — independent from actual pool
  const buildAudienceDisplayPool = () => {
    const pool = [];
    for (let i=1;i<=300;i++) pool.push("SE"+String(i).padStart(3,"0"));
    for (let i=1;i<=300;i++) pool.push("GV"+String(i).padStart(3,"0"));
    // Fisher-Yates shuffle
    for (let i=pool.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    return pool;
  };

  const startDraw = () => {
    if (!selectedPrize || eligible.length===0) return;
    setRoundWinners([]); setCountdown(3);
    pushDrawState({ active:true, spinning:false, winners:[], countdown:3 });
    let c=3;
    clearInterval(countRef.current);
    countRef.current = setInterval(()=>{
      c--;
      if (c>0) { setCountdown(c); pushDrawState({active:true,spinning:false,winners:[],countdown:c}); }
      else {
        clearInterval(countRef.current); setCountdown(null);
        pushDrawState({active:true,spinning:true,winners:[],countdown:null});
        setSpinning(true);
        runSpin();
      }
    },1000);
  };

  const runSpin = () => {
    const prize = prizes.find(p=>p.id===selectedPrize);
    const pool  = [...eligible];
    const count = Math.min(winnersCount, pool.length);
    const displayPool = buildAudienceDisplayPool();
    let di = 0;
    const duration = 4200;
    let elapsed = 0;
    clearInterval(spinRef.current);
    spinRef.current = setInterval(()=>{
      const id = displayPool[di % displayPool.length];
      setSpinDisplay(id);
      pushDrawState({ active:true, spinning:true, spinDisplay:id, countdown:null });
      di++; elapsed += 80;
      if (elapsed >= duration) {
        clearInterval(spinRef.current);
        const shuffled = [...pool].sort(()=>Math.random()-0.5);
        const picked   = shuffled.slice(0,count);
        const newWinners = picked.map(emp=>({
          id:uid_fn(), employeeId:emp.id, name:emp.name,
          uniqueId:emp.uniqueId||"", type:emp.type,
          prizeId:prize.id, prizeLabel:prize.label,
          prizeType:prize.type||"", prizeDescription:prize.description||"",
          prizePhoto:prize.photo||"", timestamp:nowTime(),
        }));
        setWinners(prev=>[...newWinners,...prev]);
        setRoundWinners(newWinners);
        setEmployees(prev=>prev.map(e=>picked.find(p=>p.id===e.id)?{...e,drawEligible:false}:e));
        setPrizes(prev=>prev.map(p=>p.id===prize.id?{...p,drawn:true}:p));
        setSpinning(false);
        pushDrawState({ active:true, spinning:false, winners:newWinners, countdown:null });
      }
    },80);
  };

  const clearScreen = () => {
    setRoundWinners([]); setSpinDisplay("—");
    pushDrawState({ active:false, spinning:false, winners:[], countdown:null });
  };

  const canStart = !spinning && countdown===null && !!selectedPrize && eligible.length>0;

  return (
    <div style={{ minHeight:"100vh", background:"#F5F0E8", paddingTop:56 }}>
      {/* Header */}
      <div style={{ background:"#EDE4D3", borderBottom:`1px solid ${T.beigeDark}`, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <SoilbuildLogo size={30} />
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, color:T.inkDark, fontWeight:700 }}>🎰 Lucky Draw Control</div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={()=>window.open(window.location.href+"#audience","_blank")} style={{ background:T.green, color:"#fff", border:"none", borderRadius:7, padding:"8px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>👁 Audience Screen</button>
          <button onClick={()=>setPage("admin")} style={{ background:"transparent", color:T.inkMid, border:`1px solid ${T.beigeDark}`, borderRadius:7, padding:"8px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>← Admin</button>
          <button onClick={onLogout} style={{ background:"rgba(193,39,45,0.1)", color:T.red, border:`1px solid rgba(193,39,45,0.25)`, borderRadius:7, padding:"8px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>Logout</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, padding:"26px 22px", maxWidth:1200, margin:"0 auto" }}>
        {/* ── LEFT: Controls ── */}
        <div>
          <div style={{ background:T.beigeLight, borderRadius:15, padding:24, border:`1px solid ${T.beigeDark}`, marginBottom:20 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:T.inkDark, marginBottom:18 }}>Draw Controls</h3>

            {/* POOL MODE — Admin only, never visible to audience */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkMid, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Audience Display Mode</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                {[["🃏","Cards","cards","One-by-one"],["🖼","Split Screen","splitscreen","Prize + names"],["🎁","Multi-Prize","multiprize","Each wins own"]].map(([ic,lbl,val,sub])=>(
                  <button key={val} onClick={()=>setDisplayMode(val)} disabled={spinning||countdown!==null}
                    style={{ padding:"9px 5px", borderRadius:8, border:`2px solid ${displayMode===val?T.green:T.beigeDark}`, background:displayMode===val?"#DCFCE7":"#F5F0E8", color:displayMode===val?T.green:T.inkMid, fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:700, cursor:"pointer", textAlign:"center", lineHeight:1.4 }}>
                    <div style={{ fontSize:16, marginBottom:2 }}>{ic}</div>{lbl}<br/><span style={{ fontSize:8, fontWeight:400, opacity:0.6 }}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14, background:"#EDE4D3", borderRadius:9, padding:"12px 14px", border:`1px solid ${T.beigeDark}` }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.inkMid, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>🔒 Draw Pool (Admin Only)</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                {[["👤 Employees","employee"],["⭐ VIP","vip"],["👥 Both","both"]].map(([lbl,val])=>(
                  <button key={val} onClick={()=>setPoolMode(val)} disabled={spinning||countdown!==null}
                    style={{ padding:"8px 5px", borderRadius:8, border:`2px solid ${poolMode===val?T.green:T.beigeDark}`, background:poolMode===val?"#DCFCE7":"#F5F0E8", color:poolMode===val?T.green:T.inkMid, fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, cursor:"pointer", textAlign:"center" }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.gray, marginTop:6 }}>
                Audience always sees mixed SE+GV animation — your pool choice is private.
              </div>
            </div>

            {/* Prize selector */}
            <div style={{ marginBottom:12 }}>
              <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, marginBottom:5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Select Prize</label>
              <select value={selectedPrize} onChange={e=>setSelectedPrize(e.target.value)} disabled={spinning||countdown!==null}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:13, background:"#fff", color:T.inkDark }}>
                <option value="">— Choose a prize —</option>
                {prizes.filter(p=>!p.drawn).map(p=>(
                  <option key={p.id} value={p.id}>{p.label}{p.type?` — ${p.type}`:""}</option>
                ))}
              </select>
            </div>

            {/* Winners count */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, marginBottom:5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Number of Winners</label>
              <input type="number" min={1} max={eligible.length||1} value={winnersCount} onChange={e=>setWinnersCount(Math.max(1,parseInt(e.target.value)||1))} disabled={spinning||countdown!==null}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:13, background:"#fff", color:T.inkDark }} />
            </div>

            {/* Countdown display */}
            {countdown!==null && (
              <div style={{ textAlign:"center", marginBottom:16 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:72, color:T.green, fontWeight:900, animation:"pulse2 0.8s ease-in-out" }}>{countdown}</div>
              </div>
            )}

            {/* Spin display */}
            {spinning && (
              <div style={{ textAlign:"center", marginBottom:14, padding:14, background:T.dark, borderRadius:11 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:3, textTransform:"uppercase", marginBottom:5 }}>Drawing…</div>
                <div style={{ fontFamily:"'Courier New',monospace", fontSize:28, color:T.yellow, animation:"flicker 0.08s infinite", fontWeight:900, letterSpacing:4 }}>{spinDisplay}</div>
              </div>
            )}

            {/* Round winners */}
            {roundWinners.length>0 && !spinning && (
              <div style={{ background:"#DCFCE7", borderRadius:10, padding:12, marginBottom:14 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:T.green, marginBottom:7 }}>🏆 Winners this round:</div>
                {roundWinners.map(w=>(
                  <div key={w.id} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.inkDark, padding:"2px 0", display:"flex", justifyContent:"space-between" }}>
                    <span>• {w.name}</span>
                    <span style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:T.yellow, background:T.dark, padding:"1px 6px", borderRadius:4 }}>{w.uniqueId}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={canStart?startDraw:undefined} disabled={!canStart}
              style={{ width:"100%", background:canStart?T.green:"#E8DFD0", color:canStart?"#fff":T.gray, border:"none", borderRadius:9, padding:"14px 0", fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, cursor:canStart?"pointer":"not-allowed", marginBottom:10, boxShadow:canStart?"0 4px 16px rgba(45,139,62,0.3)":"none" }}>
              {countdown!==null?`Starting in ${countdown}…`:spinning?"🎰 DRAWING…":"🎰 START DRAW"}
            </button>
            {/* Reveal Next — press to show each winner one at a time */}
            {roundWinners.length>0 && !spinning && revealIdx < roundWinners.length && (
              <button onClick={()=>{
                const next = revealIdx + 1;
                setRevealIdx(next);
                pushDrawState({ active:true, spinning:false, winners:roundWinners, revealedCount:next, countdown:null, displayMode });
              }} style={{ width:"100%", background:T.yellow, color:"#2C1A0E", border:"none", borderRadius:9, padding:"12px 0", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:9, boxShadow:"0 4px 16px rgba(245,197,24,0.4)", animation:"pulse2 1.5s ease-in-out infinite" }}>
                Reveal Next ({revealIdx+1}/{roundWinners.length})
              </button>
            )}
            {roundWinners.length>0 && !spinning && revealIdx >= roundWinners.length && (
              <div style={{ textAlign:"center", padding:"6px", marginBottom:9, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.green, fontWeight:600 }}>All {roundWinners.length} revealed!</div>
            )}
            {(roundWinners.length>0||spinning) && (
              <button onClick={clearScreen} style={{ width:"100%", background:"#FEE2E2", color:T.red, border:"none", borderRadius:9, padding:"11px 0", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Clear Audience Screen
              </button>
            )}
          </div>

          {/* Winner history */}
          <div style={{ background:T.beigeLight, borderRadius:15, padding:20, border:`1px solid ${T.beigeDark}` }}>
            <h4 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:T.inkDark, marginBottom:14 }}>All Winners</h4>
            {winners.length===0 ? <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.gray }}>No winners yet.</p> : (
              <div style={{ maxHeight:260, overflowY:"auto" }}>
                {winners.map(w=>(
                  <div key={w.id} style={{ padding:"8px 0", borderBottom:`1px solid ${T.beigeDark}`, display:"flex", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:T.inkDark }}>{w.name}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.green }}>{w.prizeLabel}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:T.yellow, background:T.dark, padding:"1px 6px", borderRadius:4 }}>{w.uniqueId}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.gray, marginTop:3 }}>{w.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Eligible pool ── */}
        <div>
          <div style={{ background:T.beigeLight, borderRadius:15, padding:20, border:`1px solid ${T.beigeDark}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:T.inkDark }}>Eligible Pool</h3>
              <span style={{ background:T.green, color:"#fff", borderRadius:20, padding:"3px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700 }}>{eligible.length}</span>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, marginBottom:10 }}>
              Mode: <strong style={{ color:poolMode==="both"?T.green:T.greenDark }}>{poolMode==="both"?"All confirmed attendees":poolMode==="employee"?"Employees only":"VIP / Guests only"}</strong>
            </div>
            <div style={{ maxHeight:380, overflowY:"auto" }}>
              {eligible.map(e=>(
                <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${T.beigeDark}` }}>
                  <div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:T.inkDark }}>{e.name}</div>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:2 }}>
                      <span style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:T.yellow, background:T.dark, padding:"1px 6px", borderRadius:4 }}>{e.uniqueId}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.gray }}>{e.type==="vip"?"⭐ VIP":"👤"} · Pax {e.pax}</span>
                    </div>
                  </div>
                  <button onClick={()=>setExcluded(prev=>prev.includes(e.id)?prev.filter(x=>x!==e.id):[...prev,e.id])}
                    style={{ background:"#FEE2E2", color:T.red, border:"none", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>Exclude</button>
                </div>
              ))}
              {eligible.length===0 && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.inkMid, padding:"14px 0" }}>No eligible attendees in this pool.</p>}
            </div>
            {excludedList.length>0 && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:T.inkMid, marginBottom:7, textTransform:"uppercase" }}>EXCLUDED ({excludedList.length})</div>
                {excludedList.map(e=>(
                  <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", opacity:0.65 }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.inkMid }}>{e.name}</span>
                    <button onClick={()=>setExcluded(prev=>prev.filter(x=>x!==e.id))} style={{ background:"#DCFCE7", color:T.green, border:"none", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>Include</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUDIENCE SCREEN ──────────────────────────────────────────────────────────
function AudienceScreen({ eventInfo }) {
  const [ds, setDs] = useState({ active:false, spinning:false, winners:[], countdown:null, spinDisplay:"—" });

  useEffect(()=>{
    SUPA.from("draw_state").select("*").eq("id",1).single().then(({data})=>{ if(data) setDs(p=>({...p,...data})); });
    const ch = SUPA.channel("aud-v3").on("postgres_changes",{event:"*",schema:"public",table:"draw_state"},p=>{
      if(p.new) setDs(prev=>({...prev,...p.new}));
    }).subscribe();
    return ()=>SUPA.removeChannel(ch);
  },[]);

  // BroadcastChannel: for same-device Force All Live from admin
  useEffect(()=>{
    if(typeof BroadcastChannel==="undefined") return;
    const bc = new BroadcastChannel("sb-draw");
    bc.onmessage = e => { if(e.data?.type==="FORCE_AUDIENCE") window.location.hash = "#audience"; };
    return () => bc.close();
  },[]);

  const { active, spinning, winners=[], countdown, spinDisplay="SE000", revealedCount=0, displayMode="cards" } = ds;
  const showCountdown  = countdown!==null && countdown>0;
  const visibleWinners = winners.slice(0, revealedCount);
  const showWinners    = !spinning && active && visibleWinners.length>0;
  const awaitReveal    = !spinning && active && winners.length>0 && revealedCount===0;
  const cardW = winners.length===1?480:winners.length<=2?380:300;
  const nameFS= winners.length===1?"clamp(38px,6vw,72px)":winners.length<=2?"clamp(28px,4vw,52px)":"clamp(22px,3vw,40px)";

  return (
    <div style={{ position:"fixed", inset:0, background:`linear-gradient(135deg, #0D1B0F 0%, #1A3D1F 100%)`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
      <Particles count={60} color={T.yellow} />
      <Confetti active={showWinners} />

      {/* Radar */}
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:560, height:560, borderRadius:"50%", border:"1px solid rgba(245,197,24,0.1)", animation:"radarSpin 12s linear infinite", pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:50,  borderRadius:"50%", border:"1px solid rgba(245,197,24,0.07)" }} />
        <div style={{ position:"absolute", inset:120, borderRadius:"50%", border:"1px solid rgba(245,197,24,0.04)" }} />
      </div>

      {/* Corner logo */}
      <div style={{ position:"absolute", top:22, left:26, zIndex:10 }}><SoilbuildLogo size={38} dark /></div>
      <div style={{ position:"absolute", top:28, right:28, zIndex:10, textAlign:"right" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase" }}>{eventInfo.title} {eventInfo.year}</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:2 }}>🎰 LUCKY DRAW</div>
      </div>

      {/* ── AWAIT REVEAL — draw done, host about to reveal ── */}
      {awaitReveal && (
        <div style={{ textAlign:"center", position:"relative", zIndex:2 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,4vw,50px)", color:T.yellow, fontWeight:700, animation:"pulse2 2s ease-in-out infinite" }}>🎰 Draw Complete!</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,0.35)", marginTop:14, letterSpacing:3, textTransform:"uppercase" }}>Host will reveal the winner</div>
        </div>
      )}

      {/* ── IDLE ── */}
      {!active && !showCountdown && (
        <div style={{ textAlign:"center", position:"relative", zIndex:2 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}><SoilbuildLogo size={100} dark /></div>
          <div style={{ width:100, height:2, background:`linear-gradient(90deg,transparent,${T.yellow},transparent)`, margin:"0 auto 20px" }} />
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,4vw,44px)", color:T.yellow, fontWeight:700, marginBottom:10 }}>{eventInfo.title} {eventInfo.year}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(11px,1.3vw,14px)", color:"rgba(255,255,255,0.35)", letterSpacing:4, textTransform:"uppercase" }}>Lucky Draw · Standing By</div>
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {showCountdown && (
        <div key={countdown} style={{ textAlign:"center", position:"relative", zIndex:2 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(120px,24vw,240px)", fontWeight:900, color:T.yellow, lineHeight:1, textShadow:`0 0 120px rgba(245,197,24,0.9)`, animation:"countPulse 0.8s ease-out" }}>{countdown}</div>
        </div>
      )}

      {/* ── SPINNING — audience sees mixed SE/GV IDs (SE001–SE300 + GV001–GV300) ── */}
      {spinning && (
        <div style={{ textAlign:"center", position:"relative", zIndex:2 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:5, marginBottom:24, textTransform:"uppercase" }}>LUCKY DRAW</div>
          <div style={{ position:"relative", display:"inline-block" }}>
            <div style={{ position:"absolute", inset:-18, borderRadius:22, background:`radial-gradient(ellipse, rgba(245,197,24,0.22) 0%, transparent 70%)`, pointerEvents:"none", animation:"spinGlow 0.5s ease-in-out infinite alternate" }} />
            <div style={{ background:`linear-gradient(180deg, #1a1200 0%, #0d0a00 100%)`, border:`3px solid rgba(245,197,24,0.55)`, borderRadius:18, padding:"28px 56px", boxShadow:`0 0 60px rgba(245,197,24,0.28), inset 0 0 30px rgba(0,0,0,0.5)` }}>
              {/* Split display: prefix (SE/GV) + number */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {/* Prefix block */}
                <div style={{ width:80, height:110, background:`linear-gradient(180deg, #2a1f00 0%, #1a1300 50%, #2a1f00 100%)`, border:`2px solid rgba(245,197,24,0.4)`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`inset 0 4px 10px rgba(0,0,0,0.5)` }}>
                  <span style={{ fontFamily:"'Courier New',monospace", fontSize:42, fontWeight:900, color:T.yellow, textShadow:`0 0 20px rgba(245,197,24,0.9)`, animation:"flicker 0.12s infinite" }}>
                    {(()=>{const raw=spinDisplay||"SE000"; return raw.slice(0,2);})()}
                  </span>
                </div>
                <div style={{ width:3, height:80, background:"rgba(245,197,24,0.2)", borderRadius:2 }} />
                {/* Number digits */}
                {((()=>{const raw=spinDisplay||"SE000"; return raw.slice(2).padStart(3,"0");})()).split("").map((d,i)=>(
                  <div key={i} style={{ width:72, height:110, background:`linear-gradient(180deg, #2a1f00 0%, #1a1300 50%, #2a1f00 100%)`, border:`2px solid rgba(245,197,24,0.4)`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", boxShadow:`inset 0 4px 10px rgba(0,0,0,0.5)` }}>
                    <div style={{ position:"absolute", top:"48%", left:0, right:0, height:2, background:"rgba(245,197,24,0.12)" }} />
                    <span style={{ fontFamily:"'Courier New',monospace", fontSize:68, fontWeight:900, color:T.yellow, textShadow:`0 0 18px rgba(245,197,24,0.9)`, lineHeight:1, animation:`digitFlip ${0.065+i*0.018}s ease-in-out infinite` }}>{d}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14, fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"rgba(245,197,24,0.4)", letterSpacing:5, textTransform:"uppercase", textAlign:"center" }}>Registration ID</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── WINNERS — CARDS mode (default, revealed one at a time) ─── */}
      {showWinners && displayMode==="cards" && (
        <div style={{ position:"relative", zIndex:2, width:"100%", display:"flex", flexDirection:"column", alignItems:"center", padding:"70px 24px 32px" }}>
          <div style={{ textAlign:"center", marginBottom:18 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,4vw,52px)", fontWeight:900, color:T.yellow, textShadow:`0 0 50px rgba(245,197,24,0.7)`, animation:"winnerReveal 0.8s ease-out" }}>🎉 Congratulations! 🎉</div>
            <div style={{ width:66, height:2, background:T.yellow, margin:"10px auto 0" }} />
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:18, justifyContent:"center", width:"100%", maxWidth:1300 }}>
            {visibleWinners.map((w,i)=>(
              <div key={w.id} style={{ background:"rgba(245,197,24,0.07)", border:`2px solid rgba(245,197,24,0.4)`, borderRadius:18, padding:"20px 24px", width:cardW, flexShrink:0, animation:`winnerReveal 0.9s cubic-bezier(0.34,1.56,0.64,1) ${i*150}ms both`, boxShadow:`0 0 48px rgba(245,197,24,0.18)` }}>
                {w.prizePhoto && (<div style={{ width:"100%", height:138, borderRadius:9, marginBottom:10, overflow:"hidden", border:"1px solid rgba(245,197,24,0.2)" }}><img src={w.prizePhoto} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={w.prizeLabel} /></div>)}
                <div style={{ fontFamily:"'Courier New',monospace", fontSize:12, color:T.yellow, letterSpacing:4, marginBottom:5, fontWeight:700 }}>{w.uniqueId}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:nameFS, fontWeight:700, color:"#fff", marginBottom:10, lineHeight:1.05 }}>{w.name}</div>
                <div style={{ width:30, height:1, background:T.yellow, marginBottom:9 }} />
                {w.prizeType && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.yellow, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:2 }}>{w.prizeType}</div>}
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, color:T.yellow, fontWeight:700 }}>{w.prizeLabel}</div>
                {w.prizeDescription && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:3 }}>{w.prizeDescription}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── WINNERS — SPLIT SCREEN (prize photo right, winner names left) ─── */}
      {showWinners && displayMode==="splitscreen" && (
        <div style={{ position:"relative", zIndex:2, width:"100%", height:"100vh", display:"flex" }}>
          <div style={{ flex:"0 0 44%", display:"flex", flexDirection:"column", justifyContent:"center", padding:"80px 36px 36px 52px", borderRight:"1px solid rgba(245,197,24,0.13)" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.26)", letterSpacing:4, textTransform:"uppercase", marginBottom:20 }}>Winners</div>
            {visibleWinners.map((w,i)=>(
              <div key={w.id} style={{ marginBottom:14, animation:`slideInLeft 0.8s ease-out ${i*180}ms both` }}>
                <div style={{ display:"flex", gap:13, alignItems:"center" }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:T.yellow, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 18px rgba(245,197,24,0.4)" }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:13, color:"#2C1A0E" }}>{i+1}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Courier New',monospace", fontSize:10, color:"rgba(245,197,24,0.55)", marginBottom:1 }}>{w.uniqueId}</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,4vw,58px)", fontWeight:900, color:"#fff", lineHeight:1.0 }}>{w.name}</div>
                  </div>
                </div>
                {i<visibleWinners.length-1 && <div style={{ marginLeft:45, marginTop:10, height:1, background:"rgba(245,197,24,0.1)" }} />}
              </div>
            ))}
            {visibleWinners.length>0 && <div style={{ marginTop:26, fontSize:18, fontWeight:900, color:T.yellow }}>🎉 Congratulations!</div>}
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 42px 42px" }}>
            {visibleWinners[0]?.prizePhoto ? (
              <div style={{ width:"100%", maxWidth:480, borderRadius:22, overflow:"hidden", border:"3px solid rgba(245,197,24,0.45)", boxShadow:"0 0 80px rgba(245,197,24,0.28)", marginBottom:16 }}>
                <img src={visibleWinners[0].prizePhoto} alt={visibleWinners[0].prizeLabel} style={{ width:"100%", height:"auto", maxHeight:"55vh", objectFit:"cover", display:"block" }} />
              </div>
            ) : (
              <div style={{ width:250, height:250, borderRadius:22, border:"3px solid rgba(245,197,24,0.24)", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(245,197,24,0.04)", marginBottom:16 }}>
                <span style={{ fontSize:78 }}>🎁</span>
              </div>
            )}
            {visibleWinners[0]?.prizeType && <div style={{ fontSize:11, color:T.yellow, letterSpacing:3, textTransform:"uppercase", marginBottom:6, opacity:0.7 }}>{visibleWinners[0].prizeType}</div>}
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(20px,3vw,44px)", fontWeight:900, color:T.yellow, textShadow:"0 0 40px rgba(245,197,24,0.5)" }}>{visibleWinners[0]?.prizeLabel}</div>
            {visibleWinners[0]?.prizeDescription && <div style={{ fontSize:13, color:"rgba(255,255,255,0.42)", marginTop:6 }}>{visibleWinners[0].prizeDescription}</div>}
          </div>
        </div>
      )}

      {/* ─── WINNERS — MULTI-PRIZE (each winner shown with their own prize) ─── */}
      {showWinners && displayMode==="multiprize" && (() => {
        const cur = visibleWinners[visibleWinners.length - 1];
        if (!cur) return null;
        return (
          <div style={{ position:"relative", zIndex:2, width:"100%", height:"100vh", display:"flex" }}>
            <div style={{ flex:"0 0 45%", display:"flex", flexDirection:"column", justifyContent:"center", padding:"80px 36px 36px 54px", borderRight:"1px solid rgba(245,197,24,0.13)" }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.23)", letterSpacing:3, textTransform:"uppercase", marginBottom:16 }}>Winner {revealedCount} of {visibleWinners.length || 1}</div>
              <div key={cur.id} style={{ animation:"slideInLeft 0.9s ease-out both" }}>
                <div style={{ fontFamily:"'Courier New',monospace", fontSize:13, color:T.yellow, letterSpacing:3, marginBottom:5, opacity:0.7 }}>{cur.uniqueId}</div>
                <div style={{ fontSize:11, color:T.yellow, letterSpacing:3, textTransform:"uppercase", marginBottom:7, opacity:0.8 }}>🎉 Congratulations</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(38px,6vw,84px)", fontWeight:900, color:"#fff", lineHeight:1.0, marginBottom:11 }}>{cur.name}</div>
                <div style={{ width:50, height:3, background:T.yellow, marginBottom:14, borderRadius:2 }} />
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.36)", marginBottom:4 }}>wins</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(18px,2.5vw,32px)", fontWeight:700, color:T.yellow }}>{cur.prizeLabel}</div>
                {cur.prizeDescription && <div style={{ fontSize:12, color:"rgba(255,255,255,0.42)", marginTop:4 }}>{cur.prizeDescription}</div>}
              </div>
              {visibleWinners.length>1 && (
                <div style={{ marginTop:24, paddingTop:16, borderTop:"1px solid rgba(245,197,24,0.1)" }}>
                  {visibleWinners.slice(0,-1).map(w=>(
                    <div key={w.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{w.name}</span>
                      <span style={{ fontSize:9, color:"rgba(245,197,24,0.38)" }}>{w.prizeLabel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div key={cur.id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 42px 42px", animation:"winnerReveal 0.9s ease-out both" }}>
              {cur.prizePhoto ? (
                <div style={{ width:"100%", maxWidth:500, borderRadius:22, overflow:"hidden", border:"3px solid rgba(245,197,24,0.5)", boxShadow:"0 0 100px rgba(245,197,24,0.38)", marginBottom:16 }}>
                  <img src={cur.prizePhoto} alt={cur.prizeLabel} style={{ width:"100%", height:"auto", maxHeight:"52vh", objectFit:"cover", display:"block" }} />
                </div>
              ) : (
                <div style={{ width:230, height:230, borderRadius:22, border:"3px solid rgba(245,197,24,0.3)", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(245,197,24,0.04)", marginBottom:16 }}>
                  <span style={{ fontSize:76 }}>🎁</span>
                </div>
              )}
              {cur.prizeType && <div style={{ fontSize:10, color:T.yellow, letterSpacing:3, textTransform:"uppercase", opacity:0.65 }}>{cur.prizeType}</div>}
            </div>
          </div>
        );
      })()}

    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
function validSession(k,ek){try{const t=sessionStorage.getItem(k),e=parseInt(sessionStorage.getItem(ek)||"0");if(!t||!e)return false;if(Date.now()>e){sessionStorage.removeItem(k);sessionStorage.removeItem(ek);return false;}return true;}catch(e){return false;}}

export default function App() {
  // Detect URL param on load
  const urlRole = getUrlRole();

  const load = (key,def) => { try { const s=localStorage.getItem(key); return s?JSON.parse(s):def; } catch(e){ return def; } };
  const save = (key,val)  => { try { localStorage.setItem(key,JSON.stringify(val)); } catch(e){} };

  const [page,      setPage]      = useState(urlRole==="audience" ? "draw-audience" : "home");
  const [employees, setEmployeesState] = useState(()=>load("sb2_emps", INIT_EMPLOYEES));
  const [tables,    setTablesState]    = useState(()=>load("sb2_tbls", INIT_TABLES));
  const [prizes,    setPrizesState]    = useState(()=>load("sb2_przs", INIT_PRIZES));
  const [winners,   setWinnersState]   = useState(()=>load("sb2_wnrs", []));
  const [eventInfo, setEventInfoState] = useState(()=>load("sb2_event", INIT_EVENT));
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [pendingPage,   setPendingPage]   = useState(null);

  const setEmployees = (v) => { const val=typeof v==="function"?v(employees):v; setEmployeesState(val); save("sb2_emps",val); };
  const setTables    = (v) => { const val=typeof v==="function"?v(tables):v;    setTablesState(val);    save("sb2_tbls",val); };
  const setPrizes    = (v) => { const val=typeof v==="function"?v(prizes):v;    setPrizesState(val);    save("sb2_przs",val); };
  const setWinners   = (v) => { const val=typeof v==="function"?v(winners):v;   setWinnersState(val);   save("sb2_wnrs",val); };
  const setEventInfo = (v) => { const val=typeof v==="function"?v(eventInfo):v; setEventInfoState(val); save("sb2_event",val); };

  // Load from Supabase on mount
  useEffect(()=>{
    (async()=>{
      try {
        const [emps,tbls,przs,wnrs] = await Promise.all([dbAll("employees"),dbAll("tables"),dbAll("prizes"),dbAll("winners")]);
        if(emps.length){ setEmployeesState(emps); save("sb2_emps",emps); }
        if(tbls.length){ setTablesState(tbls);    save("sb2_tbls",tbls); }
        if(przs.length){ setPrizesState(przs);    save("sb2_przs",przs); }
        if(wnrs.length){ setWinnersState(wnrs);   save("sb2_wnrs",wnrs); }
      } catch(e) { console.warn("Supabase load:",e); }
    })();
  },[]);

  // Restore admin session
  useEffect(()=>{ if(validSession("adminToken","adminExpiry")) setAdminLoggedIn(true); },[]);

  // Handle URL hash for audience screen
  useEffect(()=>{
    if (window.location.hash==="#audience") setPage("draw-audience");
  },[]);

  const goAdmin = (view) => {
    if (!adminLoggedIn||!validSession("adminToken","adminExpiry")) { setPendingPage(view); setPage("login"); }
    else setPage(view);
  };
  const handleLogin = () => { setAdminLoggedIn(true); setPage(pendingPage||"admin"); setPendingPage(null); };
  const handleLogout = () => { setAdminLoggedIn(false); sessionStorage.removeItem("adminToken"); sessionStorage.removeItem("adminExpiry"); setPage("home"); };

  const navSetPage = (p) => {
    if (p==="admin"||p==="draw-admin") goAdmin(p);
    else setPage(p);
  };

  const showNav = page!=="draw-audience" && page!=="login";

  return (
    <div style={{ minHeight:"100vh" }}>
      <FontLoader />
      {showNav && <Nav page={page} setPage={navSetPage} />}

      {page==="home"         && <HomePage    setPage={navSetPage} eventInfo={eventInfo} autoRole={urlRole} />}
      {page==="rsvp"         && <RSVPPage    employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} eventInfo={eventInfo} autoRole={urlRole==="employee"||urlRole==="vip"?urlRole:null} />}
      {page==="helpdesk"     && <HelpdeskPage employees={employees} setEmployees={setEmployees} tables={tables} />}
      {page==="qr-scanner"   && <QRScannerPage employees={employees} setEmployees={setEmployees} tables={tables} />}
      {page==="login"        && <AdminLogin  onLogin={handleLogin} />}
      {page==="admin"        && (adminLoggedIn && validSession("adminToken","adminExpiry")
        ? <AdminDashboard employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} prizes={prizes} setPrizes={setPrizes} winners={winners} eventInfo={eventInfo} setEventInfo={setEventInfo} onLogout={handleLogout} setPage={navSetPage} />
        : <AdminLogin onLogin={handleLogin} />)}
      {page==="draw-admin"   && (adminLoggedIn && validSession("adminToken","adminExpiry")
        ? <DrawAdmin employees={employees} setEmployees={setEmployees} prizes={prizes} setPrizes={setPrizes} winners={winners} setWinners={setWinners} eventInfo={eventInfo} onLogout={handleLogout} setPage={setPage} />
        : <AdminLogin onLogin={handleLogin} />)}
      {page==="draw-audience" && <AudienceScreen eventInfo={eventInfo} />}
    </div>
  );
}
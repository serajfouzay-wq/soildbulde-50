import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
const SUPA=createClient("https://zsjbjwxyofgrdyhxlcjj.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzamJqd3h5b2ZncmR5aHhsY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTM4NjcsImV4cCI6MjA5NDgyOTg2N30.O0-uolysivbUak-DGbHmG7orv93iTEgGOgCGEHAcQNs");
const EMAIL_API="/api/send-email";
async function dbAll(t){try{const{data}=await SUPA.from(t).select("*");return data||[];}catch(e){return[];}}
async function dbUpsert(t,r){try{await SUPA.from(t).upsert(r,{onConflict:"id"});}catch(e){console.warn(e);}}
async function dbDelete(t,id){try{await SUPA.from(t).delete().eq("id",id);}catch(e){console.warn(e);}}
async function dbInsert(t,r){try{await SUPA.from(t).insert(r);}catch(e){console.warn(e);}}
async function pushDrawState(s){try{await SUPA.from("draw_state").upsert({id:1,...s,ts:new Date().toISOString()},{onConflict:"id"});}catch(e){console.warn(e);}}
function makePool(e,eo=false){if(eo)return e.filter(x=>x.type!=="vip");const em=e.filter(x=>x.type!=="vip"),vi=e.filter(x=>x.type==="vip");if(!vi.length)return em;if(!em.length)return vi;const w=Math.max(1,Math.round((0.12*em.length)/(0.88*vi.length)));return[...em,...vi.flatMap(v=>Array(w).fill(v))];}

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  green: "#2D8B3E",
  greenDark: "#1A5C28",
  greenLight: "#4CAF50",
  yellow: "#F5C518",
  yellowDark: "#D4A412",
  yellowLight: "#FFD93D",
  dark: "#3B2A1A",
  darkGreen: "#5C3D1E",
  white: "#FFFFFF",
  charcoal: "#1A1A1A",
  red: "#C1272D",
  gray: "#6B7280",
  grayLight: "#F3F4F6",
  border: "#E5E7EB",
  beige: "#F5F0E8",
  beigeLight: "#FAF7F2",
  beigeDark: "#E8DFD0",
  inkDark: "#2C1A0E",
  inkMid: "#5C3D1E",
};


// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_EMPLOYEES = [
  { id: "e1",  name: "Ahmad Bin Hassan",           employeeNumber: "SB001", email: "", pax: 2, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "001", type: "employee" },
  { id: "e2",  name: "Siti Nurhaliza Binte Azman", employeeNumber: "SB002", email: "", pax: 1, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "002", type: "employee" },
  { id: "e3",  name: "Raj Kumar Suppiah",           employeeNumber: "SB003", email: "", pax: 2, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "003", type: "employee" },
  { id: "e4",  name: "Wong Wei Liang",              employeeNumber: "SB004", email: "", pax: 1, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "004", type: "employee" },
  { id: "e5",  name: "Priya Sundaram",              employeeNumber: "SB005", email: "", pax: 2, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "005", type: "employee" },
  { id: "e6",  name: "Tan Ah Kow",                 employeeNumber: "SB006", email: "", pax: 1, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "006", type: "employee" },
  { id: "e7",  name: "Nurul Ain Binte Ali",         employeeNumber: "SB007", email: "", pax: 2, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "007", type: "employee" },
  { id: "e8",  name: "David Lim Chin Huat",         employeeNumber: "SB008", email: "", pax: 1, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "008", type: "employee" },
  { id: "e9",  name: "Sarah Chen Mei Ling",         employeeNumber: "SB009", email: "", pax: 2, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "009", type: "employee" },
  { id: "e10", name: "Mohammed Faizal Bin Ismail",  employeeNumber: "SB010", email: "", pax: 1, department: "", drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber: "010", type: "employee" },
];

const INIT_TABLES = [
  { id: "t1", name: "Table 1", capacity: 10, assignedCount: 0 },
  { id: "t2", name: "Table 2", capacity: 10, assignedCount: 0 },
  { id: "t3", name: "Table 3", capacity: 10, assignedCount: 0 },
];

const INIT_PRIZES = [
  { id: "p1", label: "Grand Prize", type: "Travel",      description: "Luxury Weekend Getaway for 2", photo: "", drawn: false, order: 0 },
  { id: "p2", label: "Prize 1",     type: "Electronics", description: 'Sony 65" 4K Smart TV',         photo: "", drawn: false, order: 1 },
  { id: "p3", label: "Prize 2",     type: "Voucher",     description: "$500 Shopping Voucher",         photo: "", drawn: false, order: 2 },
];

const INIT_EVENT = {
  greeting:     "You are warmly invited to",
  title:        "Annual Dinner",
  year:         "2026",
  date:         "Friday, 23 October 2026",
  time:         "6:00 PM — Registration",
  venue:        "Hilton Singapore Orchard",
  dressCode:    "Smart Casual",
  rsvpDeadline: "10 October 2026",
  emailSubject: "RSVP Confirmed — Soilbuild Annual Dinner 2026",
  emailBody:    "Dear {{name}},\n\nThank you for confirming your attendance at the Soilbuild Annual Dinner {{year}}.\n\nEvent Details:\n  Date: {{date}}\n  Time: {{time}}\n  Venue: {{venue}}\n  Dress Code: {{dressCode}}\n  Pax: {{pax}}\n\nPlease present your QR code at the entrance. Your table will be assigned upon arrival.\n\nWe look forward to celebrating with you!\n\nWarm regards,\nSoilbuild Group Holdings Ltd.",
  web3formsKey: "d1a88dcc-6f3e-400e-84e0-65c542d992bf",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const nowTime = () => new Date().toLocaleTimeString();

const getNextDrawNumber = (employees) => {
  const nums = employees.map(e => parseInt((e.drawNumber || "0").replace(/\D/g, ""), 10)).filter(n => n > 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return String(next).padStart(3, "0");
};

// ─── PDF DOWNLOAD ─────────────────────────────────────────────────────────────
function downloadCardAsPDF(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;padding:40px;";
  wrapper.appendChild(el.cloneNode(true));
  document.body.innerHTML = "";
  document.body.appendChild(wrapper);
  window.print();
  window.location.reload();
}

// ─── EMAIL SENDER — Web3Forms ─────────────────────────────────────────────────
function fillTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || "");
}

async function sendEmail({ to, name, tableName, pax, drawNumber, eventInfo }) {
  try{
    const vars={name,table:tableName||"TBC",pax:String(pax||1),draw_number:drawNumber||"—",dietary:"",date:eventInfo.date,time:eventInfo.time,venue:eventInfo.venue,dressCode:eventInfo.dressCode,title:eventInfo.title,year:eventInfo.year};
    const subject=fillTemplate(eventInfo.emailSubject||"RSVP Confirmed",vars);
    const body=fillTemplate(eventInfo.emailBody||"",vars);
    const r=await fetch(EMAIL_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,name,pax,tableName,drawNumber,subject,body,date:eventInfo.date,time:eventInfo.time,venue:eventInfo.venue,dressCode:eventInfo.dressCode,title:eventInfo.title,year:eventInfo.year})});
    const d=await r.json();
    return d.ok?{success:true,to}:{success:false,error:d.error,to};
  }catch(e){return{success:false,error:String(e),to};}
}

// ─── BROADCAST CHANNEL ────────────────────────────────────────────────────────
function useBroadcast(channelName, onMessage) {
  const chRef = useRef(null);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(channelName);
    chRef.current = ch;
    ch.onmessage = (e) => onMessage(e.data);
    return () => ch.close();
  }, [channelName]);
  const send = (data) => { if (chRef.current) chRef.current.postMessage(data); };
  return send;
}

// ─── SOUND FX ──────────────────────────────────────────────────────────────────
function useSoundFX() {
  const ctxRef = useRef(null);
  const getCtx = () => {
    if (!ctxRef.current) { try { ctxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
    return ctxRef.current;
  };
  const tick = () => {
    const ctx = getCtx(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = 800; o.type = "square";
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.1);
  };
  const fanfare = () => {
    const ctx = getCtx(); if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = freq; o.type = "triangle";
      const start = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(0.15, start + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
      o.connect(g); g.connect(ctx.destination); o.start(start); o.stop(start + 1.5);
    });
  };
  const spinSound = () => {
    const ctx = getCtx(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.setValueAtTime(200, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(800, ctx.currentTime + 4);
    o.type = "sawtooth"; g.gain.setValueAtTime(0.03, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 4);
  };
  return { tick, fanfare, spinSound };
}

// ─── FONT LOADER ───────────────────────────────────────────────────────────────
function FontLoader() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif}@media print{body>*{display:none!important}body>div:last-child{display:flex!important}@page{margin:10mm;size:A5 portrait}}`;
    document.head.appendChild(s);
  }, []);
  return null;
}


// ─── SOILBUILD LOGO (embedded PNG — no external requests) ───────────────────
const LOGO_B64="";


function SoilbuildLogo({ size = 60, showText = true, vertical = false, dark = false }) {
  const ns=Math.max(size*0.38,11);
  const ss=Math.max(size*0.18,8);
  const iw=size*0.72;
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:size*0.14}}>
      <svg width={iw} height={size} viewBox="0 0 72 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M36 50C36 50 9 44 7 20C5 4 19 1 28 8C36 14 36 34 36 50Z" fill="#2D8B3E"/>
        <path d="M36 50C36 50 63 44 65 20C67 4 53 1 44 8C36 14 36 34 36 50Z" fill="#1A5C28"/>
        <path d="M36 50C36 50 19 56 17 72C15 89 27 96 36 91C45 96 57 89 55 72C53 56 36 50 36 50Z" fill="#D4A412"/>
        <line x1="36" y1="50" x2="36" y2="89" stroke="#F5C518" strokeWidth="1.5" opacity="0.5"/>
      </svg>
      {showText&&<div style={{display:"flex",flexDirection:"column",lineHeight:1.1}}>
        <div style={{display:"flex",alignItems:"baseline"}}>
          <span style={{fontFamily:"'Arial Black',Impact,sans-serif",fontWeight:900,fontSize:ns,color:"#D4A800"}}>SOIL</span>
          <span style={{fontFamily:"'Arial Black',Impact,sans-serif",fontWeight:900,fontSize:ns,color:dark?"#4CAF50":"#2D8B3E"}}>BUILD</span>
        </div>
        <div style={{fontFamily:"'DM Sans',Arial,sans-serif",fontSize:ss,color:dark?"rgba(255,255,255,0.55)":"#888",letterSpacing:1.5,textTransform:"uppercase"}}>Group Holdings Ltd</div>
      </div>}
    </div>
  );
}

// ─── QR CODE — pure JS, no external requests, works on GitHub Pages ──────────
// Uses qrcode-generator loaded from CDN once, then renders to canvas
function QRCode({ value, size = 160 }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(false);

  // Load qrcode-generator from CDN once
  useEffect(() => {
    if (window.qrcode) { setReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";
    script.onload  = () => setReady(true);
    script.onerror = () => setErr(true);
    document.head.appendChild(script);
  }, []);

  // Draw QR onto canvas whenever value or size changes
  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    try {
      const qr = window.qrcode(0, "M");
      qr.addData(value);
      qr.make();

      const modules    = qr.getModuleCount();
      const cellSize   = Math.floor(size / (modules + 4));
      const margin     = Math.floor((size - cellSize * modules) / 2);
      const canvas     = canvasRef.current;
      canvas.width     = size;
      canvas.height    = size;
      const ctx        = canvas.getContext("2d");

      // White background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      // Dark modules
      ctx.fillStyle = "#2C1A0E";
      for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect(
              margin + col * cellSize,
              margin + row * cellSize,
              cellSize, cellSize
            );
          }
        }
      }
    } catch (e) {
      setErr(true);
    }
  }, [ready, value, size]);

  if (err) return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F0E8", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#888", textAlign: "center", padding: 8 }}>
      QR unavailable
    </div>
  );

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: 8, display: "block" }}
    />
  );
}

// Build the QR data string from a guest record
function buildQRData(guest) {
  return [
    guest.name || "",
    guest.employeeNumber || "",
    guest.drawNumber || "",
    guest.pax || "1",
    guest.id || "",
  ].join("|");
}

// Parse QR data string back into an object
function parseQRData(str) {
  const parts = str.split("|");
  return {
    name:           parts[0] || "",
    employeeNumber: parts[1] || "",
    drawNumber:     parts[2] || "",
    pax:            parts[3] || "1",
    id:             parts[4] || "",
  };
}

// ─── PARTICLES ───────────────────────────────────────────────────────────────
function Particles({ count = 40, color = T.yellow }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const hex = color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: -Math.random() * 0.6 - 0.2,
      alpha: Math.random() * 0.6 + 0.2,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [count, color]);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const canvasRef = useRef();
  const rafRef = useRef();
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = [T.green, T.greenLight, T.yellow, T.yellowLight, "#FFFFFF"];
    const pieces = Array.from({ length: 220 }, () => ({
      x: Math.random() * canvas.width, y: -20,
      w: Math.random() * 12 + 5, h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360, drot: (Math.random() - 0.5) * 8,
      dy: Math.random() * 5 + 2, dx: (Math.random() - 0.5) * 3,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
        p.x += p.dx; p.y += p.dy; p.rot += p.drot;
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); ctx.clearRect(0, 0, canvas.width, canvas.height); };
  }, [active]);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }} />;
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ page, setPage }) {
  const links = [
    { id: "home", label: "Home" },
    { id: "rsvp", label: "RSVP" },
    { id: "qr-scanner", label: "📷 Check-In" },
    { id: "admin", label: "Admin" },
  ];
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(232,220,205,0.97)", backdropFilter: "blur(12px)", borderBottom: `1px solid rgba(201,168,76,0.3)`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 64 }}>
      <div onClick={() => setPage("home")} style={{ cursor: "pointer" }}>
        <SoilbuildLogo size={36} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {links.map(l => (
          <button key={l.id} onClick={() => setPage(l.id)} style={{ background: page === l.id ? T.green : "transparent", color: page === l.id ? T.white : T.inkMid, border: `1px solid ${page === l.id ? T.green : "rgba(92,61,30,0.3)"}`, borderRadius: 6, padding: "6px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
            {l.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({ setPage, eventInfo }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #F5F0E8 0%, #EDE4D3 100%)`, position: "relative", overflow: "hidden" }}>
      <Particles count={50} color={T.yellowDark} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, rgba(92,61,30,0.06) 0%, transparent 70%)`, animation: "pulse 4s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", padding: "120px 24px 60px" }}>
        <div style={{ marginBottom: 32, animation: "fadeInDown 1s ease-out" }}>
          <SoilbuildLogo size={100} vertical />
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(14px,1.8vw,18px)", color: "rgba(255,255,255,0.7)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 16, fontWeight: 600, animation: "fadeInUp 1s ease-out 0.2s both" }}>
          {eventInfo.greeting}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(40px,8vw,90px)", fontWeight: 900, color: "#FFFFFF", lineHeight: 1.05, marginBottom: 12, maxWidth: 900, animation: "fadeInUp 1s ease-out 0.4s both" }}>
          {eventInfo.title}<br /><span style={{ color: T.yellow }}>{eventInfo.year}</span>
        </h1>
        <div style={{ width: 100, height: 3, background: `linear-gradient(90deg, transparent, ${T.yellow}, transparent)`, margin: "20px auto 16px", animation: "fadeIn 1s ease-out 0.6s both" }} />
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(16px,2.5vw,26px)", color: T.yellow, fontStyle: "italic", marginBottom: 24, animation: "fadeIn 1s ease-out 0.7s both", opacity: 0.9 }}>
          
        </div>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center", marginBottom: 48, animation: "fadeInUp 1s ease-out 0.8s both" }}>
          <div style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500 }}>📅 {eventInfo.date}</div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500 }}>🕕 {eventInfo.time}</div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500 }}>📍 {eventInfo.venue}</div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", animation: "fadeInUp 1s ease-out 1s both" }}>
          <button onClick={() => setPage("rsvp")} style={{ background: T.green, color: T.white, border: "none", borderRadius: 8, padding: "16px 42px", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 1, boxShadow: "0 8px 24px rgba(45,139,62,0.3)", transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            RSVP Now →
          </button>
        </div>
        <div style={{ marginTop: 60, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 3, opacity: 1, animation: "fadeIn 1s ease-out 1.2s both", textTransform: "uppercase" }}>
          {eventInfo.dressCode}
        </div>
      </div>
      <footer style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "20px", color: T.inkMid, opacity: 0.5, fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}>
        © 2026 Soilbuild Group Holdings Ltd · Group Holdings Ltd.
      </footer>
      <style>{`
        @keyframes pulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.6}50%{transform:translate(-50%,-50%) scale(1.15);opacity:1}}
        @keyframes fadeInDown{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
    </div>
  );
}

// ─── EMAIL PREVIEW MODAL ──────────────────────────────────────────────────────
function EmailPreviewModal({ emailData, confirmedData, eventInfo, onClose }) {
  if (!emailData) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: T.white, borderRadius: 16, maxWidth: 600, width: "100%", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", animation: "cardReveal 0.4s ease-out", margin: "auto" }}>
        {/* Header */}
        <div style={{ background: "#3B2A1A", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✉️</span>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: T.white }}>Email Sent Successfully</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>ID: {emailData.messageId}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, width: 30, height: 30, color: T.white, fontSize: 18, cursor: "pointer" }}>×</button>
        </div>
        {/* Meta */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #E8DFD0", background: "#F0EBE2" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 5, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
            <span style={{ color: T.gray, fontWeight: 600 }}>To:</span><span style={{ color: T.inkDark }}>{emailData.to}</span>
            <span style={{ color: T.gray, fontWeight: 600 }}>From:</span><span style={{ color: T.inkDark }}>events@soilbuild.com</span>
            <span style={{ color: T.gray, fontWeight: 600 }}>Subject:</span><span style={{ color: T.inkDark, fontWeight: 600 }}>{emailData.subject}</span>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #E8DFD0" }}>
          <pre style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkDark, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{emailData.body}</pre>
        </div>
        {/* Attached RSVP card */}
        {confirmedData && (
          <div style={{ padding: "16px 24px", background: "#F5F0E8", borderBottom: "1px solid #E8DFD0" }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              📎 Attached: Invitation Card
            </div>
            <div style={{ background: "linear-gradient(135deg, #3B2A1A 0%, #2C1A0E 100%)", borderRadius: 14, padding: "24px 28px", border: "1.5px solid rgba(245,197,24,0.35)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(245,197,24,0.05)", pointerEvents: "none" }} />
              <div style={{ textAlign: "center", position: "relative" }}>
                <div style={{ width: 40, height: 1, background: T.yellow, margin: "0 auto 12px" }} />
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(245,240,232,0.5)", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 6 }}>{eventInfo.greeting}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: T.yellow, fontWeight: 700, marginBottom: 4 }}>{confirmedData.name}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(245,240,232,0.5)", marginBottom: 8 }}>to the</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: "#F5F0E8", lineHeight: 1.1 }}>{eventInfo.title} <span style={{ color: T.yellow }}>{eventInfo.year}</span></div>
                <div style={{ width: 40, height: 1, background: T.yellow, margin: "12px auto" }} />
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(245,240,232,0.75)", marginBottom: 3 }}>📅 {eventInfo.date} &nbsp;·&nbsp; 🕕 {eventInfo.time}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(245,240,232,0.75)", marginBottom: 12 }}>📍 {eventInfo.venue}</div>
                <div style={{ display: "inline-grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.25)", borderRadius: 8, padding: "10px 20px" }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "rgba(245,240,232,0.4)", textTransform: "uppercase", letterSpacing: 1.5 }}>Table</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: T.yellow, fontWeight: 700 }}>{confirmedData.tableName}</div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "rgba(245,240,232,0.4)", textTransform: "uppercase", letterSpacing: 1.5 }}>Pax</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: T.yellow, fontWeight: 700 }}>{confirmedData.pax}</div>
                  </div>
                  {confirmedData.drawNumber && (
                    <div style={{ textAlign: "left", gridColumn: "1 / -1", borderTop: "1px solid rgba(245,197,24,0.15)", paddingTop: 8, marginTop: 4 }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "rgba(245,240,232,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 }}>🎰 Lucky Draw No.</div>
                      <div style={{ fontFamily: "'Courier New', monospace", fontSize: 22, color: T.yellow, fontWeight: 900, letterSpacing: 5 }}>#{confirmedData.drawNumber}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <div style={{ padding: "12px 24px", background: emailData.real && emailData.success ? "#F0FFF4" : emailData.real && !emailData.success ? "#FEE2E2" : "#FEF9C3", display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${emailData.real && emailData.success ? "#BBF7D0" : emailData.real && !emailData.success ? "#FECACA" : "#FDE68A"}` }}>
          <span style={{ fontSize: 15 }}>{emailData.real && emailData.success ? "✅" : emailData.real && !emailData.success ? "❌" : "📋"}</span>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: emailData.real && emailData.success ? T.green : emailData.real && !emailData.success ? T.red : T.yellowDark }}>
            {emailData.real && emailData.success
              ? "Real email sent via Web3Forms ✓"
              : emailData.real && !emailData.success
                ? `Web3Forms error: ${emailData.error}`
                : "Demo mode — add your Web3Forms key in Admin → Email Template to send real emails (free, no IP restriction)"
            }
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── RSVP PAGE ────────────────────────────────────────────────────────────────
function RSVPPage({ employees, setEmployees, tables, setTables, eventInfo }) {
  const [step, setStep]           = useState("choose");   // "choose" | "employee" | "vip"
  const [confirmed, setConfirmed] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailData, setEmailData] = useState(null);

  const reset = () => { setStep("choose"); setConfirmed(null); setEmailData(null); };

  // ── CHOOSE SCREEN ──────────────────────────────────────────────────────────
  if (step === "choose") {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 40px" }}>
        <div style={{ background: "#FAF7F2", borderRadius: 24, padding: 48, maxWidth: 560, width: "100%", boxShadow: "0 20px 60px rgba(92,61,30,0.1)", border: "1px solid #E8DFD0", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><SoilbuildLogo size={50} /></div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.green, letterSpacing: 4, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>{eventInfo.title} {eventInfo.year}</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, color: T.inkDark, marginBottom: 8 }}>Welcome</h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.gray, marginBottom: 36 }}>Please select how you are attending</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Employee */}
            <button onClick={() => setStep("employee")}
              style={{ background: T.green, color: T.white, border: "none", borderRadius: 16, padding: "32px 20px", cursor: "pointer", textAlign: "center", boxShadow: "0 8px 24px rgba(45,139,62,0.25)", transition: "transform 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Employee</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, opacity: 0.8 }}>Soilbuild staff member</div>
            </button>
            {/* VIP */}
            <button onClick={() => setStep("vip")}
              style={{ background: "linear-gradient(135deg, #2C1A0E 0%, #3B2A1A 100%)", color: T.yellow, border: `2px solid rgba(245,197,24,0.4)`, borderRadius: 16, padding: "32px 20px", cursor: "pointer", textAlign: "center", boxShadow: "0 8px 24px rgba(44,26,14,0.3)", transition: "transform 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginBottom: 6, color: T.yellow }}>VIP Guest</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, opacity: 0.7, color: "rgba(245,240,232,0.8)" }}>Invited guest / partner</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CONFIRMED CARD ─────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F0E8", display: "flex", flexDirection: "column", alignItems: "center", padding: "100px 24px 40px" }}>
        {emailSending && (
          <div style={{ background: "#FEF9C3", border: `1px solid ${T.yellow}`, color: T.yellowDark, padding: "10px 20px", borderRadius: 8, marginBottom: 20, fontFamily: "'DM Sans',sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span> Sending confirmation email…
          </div>
        )}
        {emailData && !emailSending && (
          <div style={{ background: emailData.real && emailData.success ? "#DCFCE7" : "#FEF9C3", border: `1px solid ${emailData.real && emailData.success ? T.green : T.yellow}`, color: emailData.real && emailData.success ? T.greenDark : T.yellowDark, padding: "10px 20px", borderRadius: 8, marginBottom: 20, fontFamily: "'DM Sans',sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{emailData.real && emailData.success ? "✅" : "📋"}</span>
            <span>{emailData.real && emailData.success ? `Confirmation email sent to ${emailData.to}` : "Email preview ready (configure Web3Forms in Admin to send real emails)"}</span>
          </div>
        )}

        {/* Invitation Card */}
        <div id="rsvp-card-print" style={{ background: `linear-gradient(135deg, #3B2A1A 0%, #2C1A0E 100%)`, borderRadius: 24, padding: "48px 40px", maxWidth: 520, width: "100%", border: `2px solid rgba(245,197,24,0.4)`, boxShadow: "0 32px 80px rgba(0,0,0,0.2)", position: "relative", overflow: "hidden", animation: "cardReveal 0.8s ease-out" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(245,197,24,0.06)", pointerEvents: "none" }} />
          <div style={{ textAlign: "center", position: "relative" }}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><SoilbuildLogo size={48} dark /></div>
            <div style={{ width: 60, height: 1, background: T.yellow, margin: "20px auto" }} />
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(245,240,232,0.65)", marginBottom: 4, letterSpacing: 2, textTransform: "uppercase" }}>{eventInfo.greeting}</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, color: T.yellow, marginBottom: 12, marginTop: 12, fontWeight: 700 }}>{confirmed.name}</h2>
            {confirmed.company && (
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(245,240,232,0.6)", marginBottom: 4 }}>{confirmed.company}</p>
            )}
            {confirmed.type === "vip" && (
              <div style={{ display: "inline-block", background: "rgba(245,197,24,0.15)", border: "1px solid rgba(245,197,24,0.4)", borderRadius: 20, padding: "3px 14px", marginBottom: 12 }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.yellow, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>⭐ VIP Guest</span>
              </div>
            )}
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(245,240,232,0.65)", marginBottom: 12 }}>to celebrate the</p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 900, color: "#F5F0E8", lineHeight: 1.1, marginBottom: 4 }}>
              {eventInfo.title}<br /><span style={{ color: T.yellow }}>{eventInfo.year}</span>
            </h1>
            <div style={{ width: 60, height: 1, background: T.yellow, margin: "20px auto" }} />
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(245,240,232,0.85)", marginBottom: 5 }}>📅 {eventInfo.date}</p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(245,240,232,0.85)", marginBottom: 5 }}>🕕 {eventInfo.time}</p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(245,240,232,0.85)", marginBottom: 20 }}>📍 {eventInfo.venue}</p>

            {/* QR Code — no table/draw number shown here */}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(245,240,232,0.45)", letterSpacing: 1, marginBottom: 4 }}>Your Entry QR Code</p>
              <div style={{ background: T.white, borderRadius: 12, padding: 12, display: "inline-block", boxShadow: "0 0 20px rgba(245,197,24,0.2)" }}>
                <QRCode value={buildQRData(confirmed)} size={140} />
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(245,240,232,0.3)", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>
                Present at entrance · Table assigned upon arrival
              </p>
            </div>

            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(245,240,232,0.35)", marginTop: 16, letterSpacing: 1 }}>
              {eventInfo.dressCode}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => downloadCardAsPDF("rsvp-card-print")}
            style={{ background: T.green, color: T.white, border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            ⬇ Download Invitation (PDF)
          </button>
          <button onClick={reset}
            style={{ background: "transparent", color: T.green, border: `1.5px solid ${T.green}`, borderRadius: 8, padding: "10px 24px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            ← New RSVP
          </button>
        </div>
        <style>{`@keyframes cardReveal{from{opacity:0;transform:scale(0.9) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── SUB-FORMS ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 40px" }}>
      {step === "employee"
        ? <EmployeeForm employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} eventInfo={eventInfo}
            onConfirm={(data, eData) => { setConfirmed(data); setEmailData(eData); }}
            onBack={reset} />
        : <VIPForm employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} eventInfo={eventInfo}
            onConfirm={(data, eData) => { setConfirmed(data); setEmailData(eData); }}
            onBack={reset} />
      }
    </div>
  );
}

// ─── EMPLOYEE FORM ────────────────────────────────────────────────────────────
function EmployeeForm({ employees, setEmployees, tables, setTables, eventInfo, onConfirm, onBack }) {
  const [name, setName]             = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail]           = useState("");
  const [pax, setPax]               = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop]     = useState(false);
  const [nameError, setNameError]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (name.length < 1) { setSuggestions([]); return; }
    const matches = employees.filter(e => e.type !== "vip" && e.name.toLowerCase().includes(name.toLowerCase())).slice(0, 6);
    setSuggestions(matches);
    setShowDrop(matches.length > 0);
  }, [name, employees]);

  const pickSuggestion = (emp) => {
    setName(emp.name); setEmployeeNumber(emp.employeeNumber || "");
    setDepartment(emp.department || ""); setEmail(emp.email || ""); setPax(emp.pax || 1);
    setShowDrop(false); setSuggestions([]);
  };

  const handleSubmit = async () => {
    setNameError("");
    if (!name.trim()) { setNameError("Please enter your name."); return; }
    if (!email || !email.includes("@")) { alert("Please enter a valid email."); return; }

    setSubmitting(true);
    const avail = tables.filter(t => t.assignedCount + pax <= t.capacity);
    avail.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const tbl = avail[0] || null;

    const existing = employees.find(e => e.name.toLowerCase().trim() === name.toLowerCase().trim());
    let drawNumber = existing?.drawNumber || getNextDrawNumber(employees);
    const empId    = existing?.id || uid();

    const guest = { id: empId, name: name.trim(), employeeNumber: employeeNumber.trim(),
      department: department.trim(), email, pax, type: "employee",
      drawEligible: true, tableId: tbl?.id || null,
      rsvpStatus: "confirmed", drawNumber };

    if (existing) {
      setEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...guest } : e));
    } else {
      setEmployees(prev => [...prev, guest]);
    }
    if (tbl) setTables(prev => prev.map(t => t.id === tbl.id ? { ...t, assignedCount: t.assignedCount + pax } : t));

    let eData = null;
    try {
      eData = await sendEmail({ to: email, name: name.trim(), tableName: tbl?.name || "TBC", pax, drawNumber, eventInfo });
    } catch {}
    setSubmitting(false);
    onConfirm({ ...guest, tableName: tbl?.name || "TBC" }, eData);
  };

  return (
    <div style={{ background: "#FAF7F2", borderRadius: 24, padding: 40, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(92,61,30,0.1)", border: "1px solid #E8DFD0" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: T.green, fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0 }}>← Back</button>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: T.inkDark }}>Employee RSVP</h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray, marginTop: 4 }}>Soilbuild staff registration</p>
      </div>

      {/* Name with autocomplete */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 5, fontWeight: 600 }}>Full Name <span style={{ color: T.red }}>*</span></label>
        <input value={name} onChange={e => { setName(e.target.value); setNameError(""); }}
          placeholder="Start typing to search or enter your name"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${nameError ? T.red : "#E8DFD0"}`, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", background: T.white, color: T.inkDark }}
          onFocus={e => e.target.style.borderColor = T.green}
          onBlur={e => { setTimeout(() => setShowDrop(false), 200); e.target.style.borderColor = nameError ? T.red : "#E8DFD0"; }} />
        {nameError && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.red, marginTop: 3 }}>{nameError}</div>}
        {showDrop && suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.white, border: "1px solid #E8DFD0", borderRadius: 9, boxShadow: "0 8px 24px rgba(92,61,30,0.1)", zIndex: 50, marginTop: 3, maxHeight: 200, overflowY: "auto" }}>
            <div style={{ padding: "6px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.gray }}>Select from list or keep typing</div>
            {suggestions.map(s => (
              <div key={s.id} onClick={() => pickSuggestion(s)}
                style={{ padding: "9px 14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}
                onMouseEnter={e => e.currentTarget.style.background = T.grayLight}
                onMouseLeave={e => e.currentTarget.style.background = T.white}>
                <span>{s.name}</span><span style={{ fontSize: 11, color: T.gray }}>{s.employeeNumber}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employee No */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 5, fontWeight: 600 }}>Employee No. <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span></label>
        <input value={employeeNumber} onChange={e => setEmployeeNumber(e.target.value)} placeholder="e.g. SB001"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", background: T.white, color: T.inkDark }}
          onFocus={e => e.target.style.borderColor = T.green} onBlur={e => e.target.style.borderColor = "#E8DFD0"} />
      </div>

      {/* Department */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 5, fontWeight: 600 }}>Department <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span></label>
        <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Finance, HR, Operations"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", background: T.white, color: T.inkDark }}
          onFocus={e => e.target.style.borderColor = T.green} onBlur={e => e.target.style.borderColor = "#E8DFD0"} />
      </div>

      {/* Email */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 5, fontWeight: 600 }}>Email Address <span style={{ color: T.red }}>*</span></label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@soilbuild.com"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", background: T.white, color: T.inkDark }}
          onFocus={e => e.target.style.borderColor = T.green} onBlur={e => e.target.style.borderColor = "#E8DFD0"} />
      </div>

      {/* Pax */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 5, fontWeight: 600 }}>Number of Pax</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setPax(Math.max(1, pax - 1))} style={{ width: 42, height: 42, borderRadius: 9, border: "1.5px solid #E8DFD0", background: T.white, fontSize: 20, fontWeight: 700, cursor: "pointer", color: T.green }}>−</button>
          <div style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 9, border: "1.5px solid #E8DFD0", fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: T.inkDark }}>{pax}</div>
          <button onClick={() => setPax(Math.min(10, pax + 1))} style={{ width: 42, height: 42, borderRadius: 9, border: "1.5px solid #E8DFD0", background: T.white, fontSize: 20, fontWeight: 700, cursor: "pointer", color: T.green }}>+</button>
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.gray, marginTop: 5, textAlign: "center" }}>Including yourself (max 10)</div>
      </div>

      <button onClick={submitting ? undefined : handleSubmit} disabled={submitting}
        style={{ width: "100%", background: submitting ? "#C8D8C0" : T.green, color: T.white, border: "none", borderRadius: 10, padding: "14px", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(45,139,62,0.3)" }}>
        {submitting ? "Registering…" : "✓ Confirm Attendance"}
      </button>
    </div>
  );
}

// ─── VIP FORM ──────────────────────────────────────────────────────────────────
function VIPForm({ employees, setEmployees, tables, setTables, eventInfo, onConfirm, onBack }) {
  const [name, setName]       = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail]     = useState("");
  const [pax, setPax]         = useState(1);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setNameError("");
    if (!name.trim()) { setNameError("Please enter your name."); return; }
    if (!email || !email.includes("@")) { alert("Please enter a valid email."); return; }

    setSubmitting(true);
    const avail = tables.filter(t => t.assignedCount + pax <= t.capacity);
    avail.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const tbl = avail[0] || null;

    const drawNumber = getNextDrawNumber(employees);
    const empId      = uid();
    const guest = { id: empId, name: name.trim(), company: company.trim(),
      email, pax, type: "vip", employeeNumber: "",
      drawEligible: false, tableId: tbl?.id || null,
      rsvpStatus: "confirmed", drawNumber };

    setEmployees(prev => [...prev, guest]);
    if (tbl) setTables(prev => prev.map(t => t.id === tbl.id ? { ...t, assignedCount: t.assignedCount + pax } : t));

    let eData = null;
    try {
      eData = await sendEmail({ to: email, name: name.trim(), tableName: tbl?.name || "TBC", pax, drawNumber, eventInfo });
    } catch {}
    setSubmitting(false);
    onConfirm({ ...guest, tableName: tbl?.name || "TBC" }, eData);
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #3B2A1A 0%, #2C1A0E 100%)", borderRadius: 24, padding: 40, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid rgba(245,197,24,0.3)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: T.yellow, fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0, opacity: 0.8 }}>← Back</button>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: T.yellow, fontWeight: 700 }}>VIP Guest Registration</h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(245,240,232,0.55)", marginTop: 4 }}>Invited guest &amp; partner registration</p>
      </div>

      {[
        ["Full Name", name, setName, "Your full name", true, nameError],
        ["Company / Organisation", company, setCompany, "Your company or organisation", false, ""],
        ["Email Address", email, setEmail, "your@email.com", true, ""],
      ].map(([lbl, val, setter, ph, req, err]) => (
        <div key={lbl} style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(245,240,232,0.6)", marginBottom: 5, fontWeight: 600 }}>
            {lbl} {req && <span style={{ color: T.yellow }}>*</span>}
            {!req && <span style={{ fontWeight: 400, opacity: 0.5 }}> (optional)</span>}
          </label>
          <input type={lbl.includes("Email") ? "email" : "text"} value={val}
            onChange={e => { setter(e.target.value); if (lbl === "Full Name") setNameError(""); }}
            placeholder={ph}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${err ? T.red : "rgba(245,197,24,0.3)"}`, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", background: "rgba(255,255,255,0.08)", color: "#F5F0E8" }}
            onFocus={e => e.target.style.borderColor = T.yellow}
            onBlur={e => e.target.style.borderColor = err ? T.red : "rgba(245,197,24,0.3)"} />
          {err && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.yellow, marginTop: 3 }}>{err}</div>}
        </div>
      ))}

      {/* Pax */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(245,240,232,0.6)", marginBottom: 5, fontWeight: 600 }}>Number of Pax</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setPax(Math.max(1, pax - 1))} style={{ width: 42, height: 42, borderRadius: 9, border: "1.5px solid rgba(245,197,24,0.3)", background: "rgba(245,197,24,0.08)", fontSize: 20, fontWeight: 700, cursor: "pointer", color: T.yellow }}>−</button>
          <div style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 9, border: "1.5px solid rgba(245,197,24,0.3)", fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: T.yellow }}>{pax}</div>
          <button onClick={() => setPax(Math.min(10, pax + 1))} style={{ width: 42, height: 42, borderRadius: 9, border: "1.5px solid rgba(245,197,24,0.3)", background: "rgba(245,197,24,0.08)", fontSize: 20, fontWeight: 700, cursor: "pointer", color: T.yellow }}>+</button>
        </div>
      </div>

      <button onClick={submitting ? undefined : handleSubmit} disabled={submitting}
        style={{ width: "100%", background: submitting ? "rgba(245,197,24,0.3)" : T.yellow, color: "#2C1A0E", border: "none", borderRadius: 10, padding: "14px", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(245,197,24,0.3)" }}>
        {submitting ? "Registering…" : "⭐ Confirm as VIP Guest"}
      </button>
    </div>
  );
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = "admin@soilbuild.com";
  const ADMIN_PASS = "Admin@1234";

  const handle = async () => {
    setErr("");
    if (!email || !pass) { setErr("Please enter both email and password."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    if (email.toLowerCase().trim() === ADMIN_EMAIL && pass === ADMIN_PASS) {
      onLogin();
    } else {
      setErr("Invalid credentials. Check email and password.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F5F0E8 0%, #EDE4D3 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#FAF7F2", borderRadius: 20, padding: 48, width: 420, boxShadow: "0 24px 60px rgba(92,61,30,0.15)", border: "1px solid #E8DFD0" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <SoilbuildLogo size={50} />
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: T.inkDark, fontWeight: 700, marginBottom: 4 }}>Admin Portal</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>Soilbuild Group Holdings Ltd</div>
        </div>

        {err && (
          <div style={{ background: "#FEE2E2", color: T.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontFamily: "'DM Sans',sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️</span> {err}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid, marginBottom: 6, fontWeight: 600 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={ADMIN_EMAIL}
            onKeyDown={e => e.key === "Enter" && handle()}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", color: T.inkDark, background: T.white }}
            onFocus={ev => ev.target.style.borderColor = T.green}
            onBlur={ev => ev.target.style.borderColor = "#E8DFD0"} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid, marginBottom: 6, fontWeight: 600 }}>Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handle()}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", color: T.inkDark, background: T.white }}
            onFocus={ev => ev.target.style.borderColor = T.green}
            onBlur={ev => ev.target.style.borderColor = "#E8DFD0"} />
        </div>
        <button onClick={handle} disabled={loading}
          style={{ width: "100%", background: loading ? "#E8DFD0" : T.green, color: loading ? T.inkMid : T.white, border: "none", borderRadius: 8, padding: 14, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginBottom: 16, transition: "all 0.2s" }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
        <div style={{ background: "#EEF7EE", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Demo Credentials</div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: T.inkDark, lineHeight: 1.8 }}>
            <div><span style={{ color: T.inkMid }}>Email:</span> {ADMIN_EMAIL}</div>
            <div><span style={{ color: T.inkMid }}>Pass: </span> {ADMIN_PASS}</div>
          </div>
          <button onClick={() => { setEmail(ADMIN_EMAIL); setPass(ADMIN_PASS); }}
            style={{ marginTop: 8, background: T.green, color: T.white, border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            Auto-fill
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── SEATING MODAL ───────────────────────────────────────────────────────────
function SeatingModal({ table, guests, allEmployees, tables, onClose, onRemove, onAdd }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const unassigned = allEmployees.filter(e =>
    !guests.find(g => g.id === e.id) &&
    (e.name.toLowerCase().includes(search.toLowerCase()) || e.employeeNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FAF7F2", borderRadius: 16, padding: 0, maxWidth: 640, width: "100%", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ background: "#EDE4D3", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #D4C4A8", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: T.inkDark, fontWeight: 700 }}>{table.name} — Seating</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginTop: 2 }}>
              {table.assignedCount} / {table.capacity} seats filled &nbsp;·&nbsp; {table.capacity - table.assignedCount} remaining
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowAdd(!showAdd)}
              style={{ background: T.green, color: T.white, border: "none", borderRadius: 7, padding: "7px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {showAdd ? "✕ Cancel" : "+ Add Guest"}
            </button>
            <button onClick={onClose} style={{ background: "transparent", border: "none", borderRadius: 6, width: 32, height: 32, fontSize: 20, cursor: "pointer", color: T.inkMid }}>×</button>
          </div>
        </div>

        {/* Add guest panel */}
        {showAdd && (
          <div style={{ padding: "14px 24px", background: "#F5F0E8", borderBottom: "1px solid #E8DFD0", flexShrink: 0 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 8, fontWeight: 600 }}>SEARCH EMPLOYEE TO ADD</div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type name or employee number..."
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 8, outline: "none", background: T.white, color: T.inkDark }}
            />
            <div style={{ maxHeight: 160, overflowY: "auto", border: "1px solid #E8DFD0", borderRadius: 8, background: T.white }}>
              {unassigned.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>
                  {search ? "No matching employees found." : "All employees are already assigned."}
                </div>
              ) : unassigned.slice(0, 20).map(e => (
                <div key={e.id} style={{ padding: "10px 14px", borderBottom: "1px solid #F5F0E8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: T.inkDark }}>{e.name}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.gray }}>
                      {e.employeeNumber} &nbsp;·&nbsp; {e.pax} pax &nbsp;·&nbsp;
                      <span style={{ color: e.rsvpStatus === "confirmed" ? T.green : e.rsvpStatus === "declined" ? T.red : T.gray }}>
                        {e.rsvpStatus}
                      </span>
                      {e.tableId && <span style={{ color: T.yellowDark }}> &nbsp;·&nbsp; currently at {tables.find(t => t.id === e.tableId)?.name}</span>}
                    </div>
                  </div>
                  <button onClick={() => { onAdd(e.id); setShowAdd(false); setSearch(""); }}
                    style={{ background: T.green, color: T.white, border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guest list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {guests.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.gray }}>
              No guests assigned yet. Click "+ Add Guest" to assign someone.
            </div>
          ) : guests.map((g, i) => (
            <div key={g.id} style={{ padding: "13px 24px", borderBottom: "1px solid #EDE4D3", display: "flex", justifyContent: "space-between", alignItems: "center", background: i % 2 === 0 ? "#FAF7F2" : "#F5F0E8" }}>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: T.inkDark }}>{g.name}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginTop: 2 }}>
                  {g.employeeNumber} &nbsp;·&nbsp; {g.pax} pax &nbsp;·&nbsp; {g.email || "no email"}
                  &nbsp;·&nbsp; <span style={{ color: g.rsvpStatus === "confirmed" ? T.green : T.gray }}>{g.rsvpStatus}</span>
                </div>
              </div>
              <button onClick={() => onRemove(g.id)}
                style={{ background: "#FEE2E2", color: T.red, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ employees, setEmployees, tables, setTables, prizes, setPrizes, winners, eventInfo, setEventInfo, onLogout, setPage }) {
  const [tab, setTab] = useState("event");
  const [search, setSearch] = useState("");
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: "", employeeNumber: "", email: "", pax: 1 });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newTable, setNewTable] = useState({ name: "", capacity: 10 });
  const [bulkTableCount, setBulkTableCount] = useState(5);
  const [bulkTableCapacity, setBulkTableCapacity] = useState(10);
  const [newPrize, setNewPrize] = useState({ label: "", type: "", description: "", photo: "" });
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [bulkText, setBulkText]       = useState("");
  const [showBulk, setShowBulk]       = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [viewTableId, setViewTableId] = useState(null);
  const [editTableId, setEditTableId] = useState(null);
  const [editTableData, setEditTableData] = useState({});

  const tabs = [
    { id: "event", label: "Event Info" },
    { id: "email", label: "Email Template" },
    { id: "people", label: "People" },
    { id: "tables", label: "Tables" },
    { id: "prizes", label: "Prizes" },
    { id: "rsvp", label: "RSVP Status" },
    { id: "downloads", label: "Downloads" },
  ];

  const addPerson = () => {
    if (!newPerson.name || !newPerson.employeeNumber) return;
    setEmployees(prev => {
      const drawNumber = getNextDrawNumber(prev);
      return [...prev, { id: uid(), ...newPerson, drawEligible: true, tableId: null, rsvpStatus: "pending", drawNumber }];
    });
    setNewPerson({ name: "", employeeNumber: "", email: "", pax: 1 });
    setShowAddPerson(false);
  };

  const removePerson = id => {
    const emp = employees.find(e => e.id === id);
    if (emp && emp.tableId && emp.rsvpStatus === "confirmed") {
      setTables(prev => prev.map(t => t.id === emp.tableId ? { ...t, assignedCount: Math.max(0, t.assignedCount - emp.pax) } : t));
    }
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const toggleDraw = id => setEmployees(prev => prev.map(e => e.id === id ? { ...e, drawEligible: !e.drawEligible } : e));

  const saveEdit = () => {
    setEmployees(prev => prev.map(e => e.id === editId ? { ...e, ...editData } : e));
    setEditId(null);
  };

  const parseRowToEmployee = (row) => {
    const name           = (row["Name"] || row["name"] || row["NAME"] || "").trim();
    const employeeNumber = (row["EmployeeNumber"] || row["Employee Number"] || row["employeeNumber"] || row["Employee No"] || row["Emp No"] || "").trim();
    const email          = (row["Email"] || row["email"] || row["EMAIL"] || "").trim();
    const department     = (row["Department"] || row["department"] || row["Dept"] || "").trim();
    const company        = (row["Company"] || row["company"] || "").trim();
    const pax            = parseInt(row["Pax"] || row["pax"] || row["PAX"] || "1") || 1;
    const type           = ((row["Type"] || row["type"] || "employee")).toLowerCase().trim() === "vip" ? "vip" : "employee";
    if (!name) return null;
    return { name, employeeNumber, email, department, company, pax, type };
  };

  const handleFileImport = (file) => {
    const reader = new FileReader();
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    reader.onload = (ev) => {
      try {
        let rows = [];
        if (isCSV) {
          const lines = ev.target.result.split("\n").filter(l => l.trim());
          const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
          rows = lines.slice(1).map(line => {
            const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
            const obj = {};
            headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
            return obj;
          });
        } else {
          const wb = XLSX.read(ev.target.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        }
        const parsed = rows.map(parseRowToEmployee).filter(Boolean);
        setBulkPreview(parsed);
      } catch (err) {
        alert("Could not read file. Make sure it is a valid Excel or CSV file.");
      }
    };
    if (isCSV) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  };

  const confirmFileImport = () => {
    setEmployees(prev => {
      let updated = [...prev];
      bulkPreview.forEach(p => {
        const existing = updated.find(e => e.name.toLowerCase() === p.name.toLowerCase());
        if (existing) {
          updated = updated.map(e => e.id === existing.id ? { ...e, ...p, drawNumber: e.drawNumber } : e);
        } else {
          const drawNumber = getNextDrawNumber(updated);
          updated.push({ id: uid(), ...p, drawEligible: p.type !== "vip", tableId: null, rsvpStatus: "pending", drawNumber });
        }
      });
      return updated;
    });
    setBulkPreview([]); setShowBulk(false);
    alert(`✓ ${bulkPreview.length} people imported successfully!`);
  };

  const bulkImport = () => {
    const lines = bulkText.trim().split("\n");
    const newEmps = lines.map(line => {
      const parts = line.split(",").map(s => s.trim());
      return { id: uid(), name: parts[0] || "", employeeNumber: parts[1] || "", email: parts[2] || "", department: parts[3] || "", pax: parseInt(parts[4]) || 1, type: "employee", drawEligible: true, tableId: null, rsvpStatus: "pending" };
    }).filter(e => e.name);
    setEmployees(prev => {
      let updated = [...prev];
      newEmps.forEach(p => {
        updated.push({ ...p, drawNumber: getNextDrawNumber(updated) });
      });
      return updated;
    });
    setBulkText(""); setShowBulk(false);
  };

  const addTable = () => {
    if (!newTable.name) return;
    setTables(prev => [...prev, { id: uid(), name: newTable.name, capacity: parseInt(newTable.capacity) || 10, assignedCount: 0 }]);
    setNewTable({ name: "", capacity: 10 });
  };

  const generateBulkTables = () => {
    const count = parseInt(bulkTableCount) || 0;
    const cap = parseInt(bulkTableCapacity) || 10;
    if (count < 1) return;
    const existingNums = tables.map(t => { const m = t.name.match(/Table (\d+)/); return m ? parseInt(m[1]) : 0; }).filter(n => n > 0);
    const startFrom = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const newTables = Array.from({ length: count }, (_, i) => ({ id: uid(), name: `Table ${startFrom + i}`, capacity: cap, assignedCount: 0 }));
    setTables(prev => [...prev, ...newTables]);
  };

  const removeTable = id => {
    const tbl = tables.find(t => t.id === id);
    if (tbl && tbl.assignedCount > 0) {
      if (!window.confirm(`${tbl.name} has ${tbl.assignedCount} people. Remove anyway? Their RSVP will reset.`)) return;
      setEmployees(prev => prev.map(e => e.tableId === id ? { ...e, tableId: null, rsvpStatus: "pending" } : e));
    }
    setTables(prev => prev.filter(t => t.id !== id));
  };

  const saveTableEdit = () => {
    setTables(prev => prev.map(t => t.id === editTableId ? { ...t, ...editTableData } : t));
    setEditTableId(null);
  };

  const moveGuestFromTable = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    if (!window.confirm(`Remove ${emp.name} from this table?`)) return;
    setTables(prev => prev.map(t => t.id === emp.tableId ? { ...t, assignedCount: Math.max(0, t.assignedCount - emp.pax) } : t));
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, tableId: null, rsvpStatus: "pending" } : e));
  };

  const addPrize = () => {
    if (!newPrize.label) return;
    setPrizes(prev => [...prev, { id: uid(), ...newPrize, drawn: false, order: prev.length }]);
    setNewPrize({ label: "", type: "", description: "", photo: "" });
  };

  const movePrize = (idx, dir) => {
    const arr = [...prizes]; const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]]; setPrizes(arr);
  };

  const handlePrizePhoto = (e, prizeId) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (prizeId) setPrizes(prev => prev.map(p => p.id === prizeId ? { ...p, photo: ev.target.result } : p));
      else setNewPrize(p => ({ ...p, photo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const exportXLSX = (data, name) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, `${name}.xlsx`);
  };

  const exportAttendees = () => exportXLSX(employees.map(e => ({
    Name: e.name, "Employee No": e.employeeNumber, Email: e.email, Pax: e.pax,
    "RSVP Status": e.rsvpStatus, Table: tables.find(t => t.id === e.tableId)?.name || "",
    "Draw Eligible": e.drawEligible ? "Yes" : "No",
    "Attended": e.attended ? "Yes" : "No",
    "Attended At": e.attendedAt || "",
  })), "Attendees");

  const exportRSVP = () => exportXLSX(employees.filter(e => e.rsvpStatus !== "pending").map(e => ({
    Name: e.name, "Employee No": e.employeeNumber, Email: e.email, Pax: e.pax,
    Status: e.rsvpStatus, Table: tables.find(t => t.id === e.tableId)?.name || ""
  })), "RSVP_Report");

  const exportWinners = () => exportXLSX(winners.map(w => ({
    Name: w.name, "Prize Type": w.prizeType, "Prize Name": w.prizeLabel,
    Description: w.prizeDescription, Time: w.timestamp
  })), "Winners");

  const exportTables = () => {
    const data = [];
    tables.forEach(t => {
      const guests = employees.filter(e => e.tableId === t.id);
      if (guests.length === 0) data.push({ Table: t.name, Capacity: t.capacity, Filled: t.assignedCount, "Guest Name": "(empty)", "Employee No": "", Pax: "" });
      else guests.forEach(g => data.push({ Table: t.name, Capacity: t.capacity, Filled: t.assignedCount, "Guest Name": g.name, "Employee No": g.employeeNumber, Pax: g.pax }));
    });
    exportXLSX(data, "Tables_Seating");
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeNumber.toLowerCase().includes(search.toLowerCase())
  );
  const rsvpFiltered = rsvpFilter === "all" ? employees : employees.filter(e => e.rsvpStatus === rsvpFilter);
  const confirmedList = employees.filter(e => e.rsvpStatus === "confirmed");
  const declinedList = employees.filter(e => e.rsvpStatus === "declined");
  const pendingList = employees.filter(e => e.rsvpStatus === "pending");
  const totalSeats = confirmedList.reduce((a, e) => a + e.pax, 0);

  const viewedTable = viewTableId ? tables.find(t => t.id === viewTableId) : null;
  const viewedTableGuests = viewTableId ? employees.filter(e => e.tableId === viewTableId) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: "#EDE4D3", borderBottom: "1px solid #D4C4A8", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SoilbuildLogo size={34} />
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: "#FFFFFF", fontWeight: 700 }}>Admin Dashboard</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)", opacity: 1 }}>{eventInfo.title} {eventInfo.year}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setPage("draw-admin")}
            style={{ background: T.green, color: T.white, border: "none", borderRadius: 7, padding: "9px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            🎰 Draw Control
          </button>
          <button onClick={() => setPage("qr-scanner")}
            style={{ background: "#8B5CF6", color: T.white, border: "none", borderRadius: 7, padding: "9px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            📷 QR Check-In
          </button>
          <button onClick={() => setPage("home")}
            style={{ background: "transparent", color: T.inkMid, border: "1px solid #C8B89A", borderRadius: 7, padding: "9px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>
            🏠 Home
          </button>
          <button onClick={onLogout}
            style={{ background: "rgba(193,39,45,0.1)", color: T.red, border: "1px solid rgba(193,39,45,0.25)", borderRadius: 7, padding: "9px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#FAF7F2", borderBottom: "1px solid #E8DFD0", display: "flex", padding: "0 24px", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "none", border: "none", borderBottom: `3px solid ${tab === t.id ? T.green : "transparent"}`, padding: "14px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? T.green : T.inkMid, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "28px 24px", maxWidth: 1280, margin: "0 auto" }}>

        {/* EVENT INFO TAB */}
        {tab === "event" && (
          <div style={{ maxWidth: 680 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: T.inkDark, marginBottom: 8 }}>Event Information</h3>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid, marginBottom: 24 }}>Changes appear instantly on the Home page and invitation card.</p>
            <div style={{ background: "#FAF7F2", borderRadius: 12, padding: 28, border: "1px solid #E8DFD0" }}>
              {[
                ["Greeting", "greeting"], ["Event Title", "title"], ["Year", "year"],
                ["Date", "date"], ["Time", "time"], ["Venue", "venue"],
                ["Dress Code", "dressCode"], ["RSVP Deadline", "rsvpDeadline"],
              ].map(([lbl, key]) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{lbl}</label>
                  <input value={eventInfo[key]} onChange={e => setEventInfo(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", background: T.white, color: T.inkDark }}
                    onFocus={e => e.target.style.borderColor = T.green}
                    onBlur={e => e.target.style.borderColor = T.border} />
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "10px 14px", background: "#DCFCE7", borderRadius: 8, color: T.greenDark, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
                ✓ Auto-saved — changes are live immediately.
              </div>
            </div>
          </div>
        )}

        {/* EMAIL TEMPLATE TAB */}
        {tab === "email" && (
          <div style={{ maxWidth: 720 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: T.inkDark, marginBottom: 8 }}>Email Template</h3>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid, marginBottom: 24 }}>
              Customise the confirmation email sent after RSVP. Use <strong style={{color:T.green}}>{"{{name}}"}</strong>, <strong style={{color:T.green}}>{"{{table}}"}</strong>, <strong style={{color:T.green}}>{"{{pax}}"}</strong>, <strong style={{color:T.green}}>{"{{date}}"}</strong>, <strong style={{color:T.green}}>{"{{time}}"}</strong>, <strong style={{color:T.green}}>{"{{venue}}"}</strong>, <strong style={{color:T.green}}>{"{{dressCode}}"}</strong>, <strong style={{color:T.green}}>{"{{title}}"}</strong>, <strong style={{color:T.green}}>{"{{year}}"}</strong> as placeholders.
            </p>
            <div style={{ background: "#FAF7F2", borderRadius: 12, padding: 28, border: "1px solid #E8DFD0" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Email Subject</label>
                <input
                  value={eventInfo.emailSubject || ""}
                  onChange={e => setEventInfo(prev => ({ ...prev, emailSubject: e.target.value }))}
                  placeholder="RSVP Confirmed - Soilbuild Group Holdings Ltd"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none", background: T.white, color: T.inkDark }}
                  onFocus={e => e.target.style.borderColor = T.green}
                  onBlur={e => e.target.style.borderColor = "#E8DFD0"}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Email Body</label>
                <textarea
                  value={eventInfo.emailBody || ""}
                  onChange={e => setEventInfo(prev => ({ ...prev, emailBody: e.target.value }))}
                  rows={14}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "monospace", fontSize: 13, outline: "none", background: T.white, color: T.inkDark, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = T.green}
                  onBlur={e => e.target.style.borderColor = "#E8DFD0"}
                />
              </div>
              {/* Live preview */}
              <div style={{ marginTop: 8, padding: "14px 18px", background: "#EDE4D3", borderRadius: 10, border: "1px solid #D4C4A8" }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Preview (with sample data)</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}><strong>Subject:</strong> {(eventInfo.emailSubject||"").replace(/\{\{name\}\}/g,"Ahmad Hassan").replace(/\{\{title\}\}/g,eventInfo.title).replace(/\{\{year\}\}/g,eventInfo.year)}</div>
                <pre style={{ fontFamily: "monospace", fontSize: 12, color: T.inkDark, lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: 8, wordBreak: "break-word" }}>
                  {(eventInfo.emailBody||"")
                    .replace(/\{\{name\}\}/g,"Ahmad Hassan")
                    .replace(/\{\{table\}\}/g,"Table 3")
                    .replace(/\{\{pax\}\}/g,"2")
                    .replace(/\{\{title\}\}/g,eventInfo.title)
                    .replace(/\{\{year\}\}/g,eventInfo.year)
                    .replace(/\{\{date\}\}/g,eventInfo.date)
                    .replace(/\{\{time\}\}/g,eventInfo.time)
                    .replace(/\{\{venue\}\}/g,eventInfo.venue)
                    .replace(/\{\{dressCode\}\}/g,eventInfo.dressCode)}
                </pre>
              </div>
              <div style={{ marginTop: 16, padding: "10px 14px", background: "#F0FFF4", borderRadius: 8, color: T.green, fontFamily: "'DM Sans',sans-serif", fontSize: 13, border: "1px solid #BBF7D0" }}>
                ✓ Template auto-saved. The RSVP invitation card is automatically attached to every confirmation email.
              </div>

              {/* Web3Forms email setup */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #E8DFD0" }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: T.inkDark, marginBottom: 6 }}>
                  📧 Email Setup — Web3Forms (Free, No IP Restriction)
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 6 }}>
                  Works from any browser on GitHub Pages. Free: <strong>250 emails/day</strong>, no IP lock, no credit card.
                </div>
                <div style={{ background: "#F5F0E8", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkDark, border: "1px solid #E8DFD0", lineHeight: 1.9 }}>
                  <strong>60-second setup:</strong><br/>
                  1. Go to <a href="https://web3forms.com" target="_blank" rel="noreferrer" style={{ color: T.green }}>web3forms.com</a><br/>
                  2. Enter <strong>your email address</strong> → click <strong>"Get Access Key"</strong><br/>
                  3. Check your inbox → copy the access key they send you<br/>
                  4. Paste it below → done! Every RSVP sends a notification to YOUR inbox with all guest details
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 4, fontWeight: 600 }}>Web3Forms Access Key</label>
                  <input
                    value={eventInfo.web3formsKey || ""}
                    onChange={e => setEventInfo(prev => ({ ...prev, web3formsKey: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    style={{ width: "100%", padding: "9px 14px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "monospace", fontSize: 13, outline: "none", background: T.white, color: T.inkDark }}
                    onFocus={e => e.target.style.borderColor = T.green}
                    onBlur={e => e.target.style.borderColor = "#E8DFD0"}
                  />
                </div>
                {(eventInfo.web3formsKey || "").length > 10 ? (
                  <div style={{ padding: "10px 14px", background: "#DCFCE7", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.green, border: "1px solid #BBF7D0" }}>
                    ✅ Web3Forms configured — real emails will be sent on every RSVP confirmation
                  </div>
                ) : (
                  <div style={{ padding: "10px 14px", background: "#FEF9C3", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.yellowDark, border: "1px solid #FDE68A" }}>
                    ⚠️ Not configured yet — emails show as preview only (demo mode)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PEOPLE TAB */}
        {tab === "people" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or ID…"
                style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 7, border: `1.5px solid ${T.border}`, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none" }} />
              <button onClick={() => setShowAddPerson(true)} style={{ background: T.green, color: T.white, border: "none", borderRadius: 7, padding: "8px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add Person</button>
              <button onClick={() => setShowBulk(!showBulk)} style={{ background: "#8B5CF6", color: T.white, border: "none", borderRadius: 7, padding: "8px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📂 Import File</button>
            </div>

            {showBulk && (
              <div style={{ background: "#FAF7F2", borderRadius: 12, padding: 24, marginBottom: 20, border: "1px solid #E8DFD0" }}>
                <h4 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: T.inkDark, marginBottom: 4 }}>📂 Import People from File</h4>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 16 }}>
                  Upload an <strong>Excel (.xlsx/.xls)</strong> or <strong>CSV</strong> file. First row must be headers.<br/>
                  Required column: <strong>Name</strong> — Optional: <strong>EmployeeNumber, Email, Department, Pax, Type (employee/vip), Company</strong>
                </p>

                {/* File upload */}
                <div style={{ border: "2px dashed #D0DBE8", borderRadius: 10, padding: "24px", textAlign: "center", marginBottom: 16, background: "#FAF7F2", cursor: "pointer" }}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.green; }}
                  onDragLeave={e => e.currentTarget.style.borderColor = "#E5E7EB"}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#E5E7EB"; const f = e.dataTransfer.files[0]; if (f) handleFileImport(f); }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid, marginBottom: 8 }}>
                    Drag &amp; drop your file here, or
                  </div>
                  <label style={{ background: "#8B5CF6", color: T.white, borderRadius: 7, padding: "8px 20px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Browse File
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files[0] && handleFileImport(e.target.files[0])} style={{ display: "none" }} />
                  </label>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.gray, marginTop: 8 }}>Supports .xlsx .xls .csv</div>
                </div>

                {/* Preview */}
                {bulkPreview.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.green, fontWeight: 700, marginBottom: 8 }}>
                      ✓ {bulkPreview.length} people ready to import — preview:
                    </div>
                    <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #E8DFD0", borderRadius: 8, background: T.white, marginBottom: 12 }}>
                      {bulkPreview.slice(0, 10).map((p, i) => (
                        <div key={i} style={{ padding: "7px 12px", borderBottom: "1px solid #F5F0E8", fontFamily: "'DM Sans',sans-serif", fontSize: 12, display: "flex", gap: 12 }}>
                          <span style={{ fontWeight: 600, color: T.inkDark, minWidth: 140 }}>{p.name}</span>
                          <span style={{ color: T.gray }}>{p.employeeNumber || "—"}</span>
                          <span style={{ color: T.gray }}>{p.department || "—"}</span>
                          <span style={{ color: p.type === "vip" ? T.yellow : T.green, fontWeight: 600, background: p.type === "vip" ? "#3B2A1A" : "#DCFCE7", borderRadius: 10, padding: "1px 8px", fontSize: 10 }}>{p.type || "employee"}</span>
                        </div>
                      ))}
                      {bulkPreview.length > 10 && <div style={{ padding: "7px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.gray }}>…and {bulkPreview.length - 10} more</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={confirmFileImport} style={{ background: T.green, color: T.white, border: "none", borderRadius: 7, padding: "9px 20px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        ✓ Import {bulkPreview.length} People
                      </button>
                      <button onClick={() => { setBulkPreview([]); setShowBulk(false); }} style={{ background: "#EDE4D3", color: T.inkDark, border: "none", borderRadius: 7, padding: "9px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* CSV paste fallback */}
                <details style={{ marginTop: 16 }}>
                  <summary style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, cursor: "pointer" }}>Or paste CSV text manually</summary>
                  <div style={{ marginTop: 10 }}>
                    <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={5}
                      style={{ width: "100%", padding: 10, borderRadius: 7, border: `1px solid ${T.border}`, fontFamily: "monospace", fontSize: 12, marginBottom: 8, resize: "vertical" }}
                      placeholder={"Name, EmployeeNumber, Email, Department, Pax\nAhmad Hassan, SB001, ahmad@soilbuild.com, Finance, 2\nSiti Nurhaliza, SB002, siti@soilbuild.com, HR, 1"} />
                    <button onClick={bulkImport} style={{ background: T.green, color: T.white, border: "none", borderRadius: 7, padding: "8px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Import CSV</button>
                  </div>
                </details>
              </div>
            )}

            {showAddPerson && (
              <div style={{ background: "#FAF7F2", borderRadius: 12, padding: 24, marginBottom: 20, border: "1px solid #E8DFD0" }}>
                <h4 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 16, color: T.inkDark }}>Add New Person</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
                  {[["Full Name", "name", "text"], ["Employee No.", "employeeNumber", "text"], ["Email", "email", "email"], ["Pax", "pax", "number"]].map(([lbl, key, type]) => (
                    <div key={key}>
                      <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}>{lbl}</label>
                      <input type={type} value={newPerson[key]} onChange={e => setNewPerson(p => ({ ...p, [key]: type === "number" ? parseInt(e.target.value) || 1 : e.target.value }))} placeholder={lbl}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addPerson} style={{ background: T.green, color: T.white, border: "none", borderRadius: 7, padding: "8px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add</button>
                  <button onClick={() => setShowAddPerson(false)} style={{ background: "#EDE4D3", color: T.inkDark, border: "none", borderRadius: 7, padding: "8px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ background: "#FAF7F2", borderRadius: 12, overflow: "hidden", border: "1px solid #E8DFD0", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#EDE4D3" }}>
                    {["Draw #", "Type", "Name", "Employee No.", "Dept", "Email", "Pax", "RSVP", "Table", "Draw Eligible", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.gray, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => (
                    <tr key={e.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? "#FAF7F2" : "#F5F0E8" }}>
                      {editId === e.id ? (
                        <>
                          <td style={{ padding: "8px 10px" }}><input value={editData.name} onChange={ev => setEditData(d => ({ ...d, name: ev.target.value }))} style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: "100%", minWidth: 120 }} /></td>
                          <td style={{ padding: "8px 10px" }}><input value={editData.employeeNumber} onChange={ev => setEditData(d => ({ ...d, employeeNumber: ev.target.value }))} style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 90 }} /></td>
                          <td style={{ padding: "8px 10px" }}><input value={editData.email || ""} onChange={ev => setEditData(d => ({ ...d, email: ev.target.value }))} style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: "100%", minWidth: 140 }} /></td>
                          <td style={{ padding: "8px 10px" }}><input type="number" value={editData.pax} onChange={ev => setEditData(d => ({ ...d, pax: parseInt(ev.target.value) || 1 }))} style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 56 }} /></td>
                          <td colSpan={3} />
                          <td style={{ padding: "8px 10px" }}>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button onClick={saveEdit} style={{ background: T.green, color: T.white, border: "none", borderRadius: 5, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                              <button onClick={() => setEditId(null)} style={{ background: "#EDE4D3", color: T.inkDark, border: "none", borderRadius: 5, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 14, fontWeight: 900, color: T.yellow, background: "#3B2A1A", padding: "2px 8px", borderRadius: 6, letterSpacing: 2 }}>
                              {e.drawNumber || "—"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ background: e.type === "vip" ? "#3B2A1A" : "#DCFCE7", color: e.type === "vip" ? T.yellow : T.green, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{e.type === "vip" ? "⭐ VIP" : "👤 Staff"}</span>
                          </td>
                          <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkDark, fontWeight: 500, whiteSpace: "nowrap" }}>{e.name}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>{e.employeeNumber || "—"}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, whiteSpace: "nowrap" }}>{e.department || "—"}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.email || "—"}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>{e.pax}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ background: e.rsvpStatus === "confirmed" ? "#DCFCE7" : e.rsvpStatus === "declined" ? "#FEE2E2" : T.grayLight, color: e.rsvpStatus === "confirmed" ? T.green : e.rsvpStatus === "declined" ? T.red : T.gray, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                              {e.rsvpStatus}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray, whiteSpace: "nowrap" }}>{tables.find(t => t.id === e.tableId)?.name || "—"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <button onClick={() => toggleDraw(e.id)}
                              style={{ background: e.drawEligible ? "#DCFCE7" : T.grayLight, color: e.drawEligible ? T.green : T.gray, border: "none", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              {e.drawEligible ? "Eligible" : "Excluded"}
                            </button>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button onClick={() => { setEditId(e.id); setEditData({ name: e.name, employeeNumber: e.employeeNumber, email: e.email || "", pax: e.pax }); }}
                                style={{ background: "#EDE4D3", color: T.inkDark, border: "none", borderRadius: 5, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                              <button onClick={() => removePerson(e.id)}
                                style={{ background: "#FEE2E2", color: T.red, border: "none", borderRadius: 5, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>No results found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABLES TAB */}
        {tab === "tables" && (
          <div>
            <div style={{ background: "#FAF7F2", borderRadius: 12, padding: 24, marginBottom: 20, border: "1px solid #E8DFD0" }}>
              <h4 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: T.inkDark, marginBottom: 12 }}>Bulk Generate Tables</h4>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}>Number of Tables</label>
                  <input type="number" min={1} value={bulkTableCount} onChange={e => setBulkTableCount(e.target.value)} style={{ padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`, fontSize: 13, width: 120 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}>Capacity Each</label>
                  <input type="number" min={1} value={bulkTableCapacity} onChange={e => setBulkTableCapacity(e.target.value)} style={{ padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`, fontSize: 13, width: 120 }} />
                </div>
                <button onClick={generateBulkTables} style={{ background: T.green, color: T.white, border: "none", borderRadius: 7, padding: "9px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Generate Tables</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}>Custom Table Name</label>
                <input value={newTable.name} onChange={e => setNewTable(t => ({ ...t, name: e.target.value }))} placeholder="e.g. VIP Table"
                  style={{ padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}>Capacity</label>
                <input type="number" value={newTable.capacity} onChange={e => setNewTable(t => ({ ...t, capacity: e.target.value }))} placeholder="10"
                  style={{ padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`, fontSize: 13, width: 100 }} />
              </div>
              <button onClick={addTable} style={{ background: T.darkGreen, color: T.white, border: "none", borderRadius: 7, padding: "9px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add Custom</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {tables.map(t => {
                const pct = Math.round((t.assignedCount / t.capacity) * 100);
                const isEditing = editTableId === t.id;
                return (
                  <div key={t.id} style={{ background: "#FAF7F2", borderRadius: 14, padding: 22, border: "1px solid #E8DFD0" }}>
                    <div style={{ marginBottom: 14 }}>
                      {isEditing ? (
                        <div>
                          <input value={editTableData.name} onChange={e => setEditTableData(d => ({ ...d, name: e.target.value }))} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 15, fontWeight: 700, width: "100%", marginBottom: 6 }} />
                          <input type="number" value={editTableData.capacity} onChange={e => setEditTableData(d => ({ ...d, capacity: parseInt(e.target.value) || 1 }))} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 80 }} />
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, color: T.inkDark }}>{t.name}</div>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginTop: 2 }}>Capacity: {t.capacity}</div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>Filled: {t.assignedCount} / {t.capacity}</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: pct >= 90 ? T.red : T.charcoal }}>{pct}%</span>
                    </div>
                    <div style={{ background: "#EDE4D3", borderRadius: 8, height: 7, overflow: "hidden", marginBottom: 14 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? T.red : pct >= 60 ? T.yellow : T.green, borderRadius: 8, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => setViewTableId(t.id)} style={{ background: T.green, color: T.white, border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>👁 Seating</button>
                      {isEditing ? (
                        <>
                          <button onClick={saveTableEdit} style={{ background: T.green, color: T.white, border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                          <button onClick={() => setEditTableId(null)} style={{ background: "#EDE4D3", color: T.inkDark, border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => { setEditTableId(t.id); setEditTableData({ name: t.name, capacity: t.capacity }); }}
                          style={{ background: "#EDE4D3", color: T.inkDark, border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏ Edit</button>
                      )}
                      <button onClick={() => removeTable(t.id)} style={{ background: "#FEE2E2", color: T.red, border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {viewedTable && (
              <SeatingModal
                table={viewedTable}
                guests={viewedTableGuests}
                allEmployees={employees}
                tables={tables}
                onClose={() => setViewTableId(null)}
                onRemove={moveGuestFromTable}
                onAdd={(empId) => {
                  const emp = employees.find(e => e.id === empId);
                  if (!emp) return;
                  const remaining = viewedTable.capacity - viewedTable.assignedCount;
                  if (emp.pax > remaining) { alert("Not enough seats remaining in this table."); return; }
                  // Remove from old table if any
                  if (emp.tableId) {
                    setTables(prev => prev.map(t => t.id === emp.tableId ? { ...t, assignedCount: Math.max(0, t.assignedCount - emp.pax) } : t));
                  }
                  setTables(prev => prev.map(t => t.id === viewedTable.id ? { ...t, assignedCount: t.assignedCount + emp.pax } : t));
                  setEmployees(prev => prev.map(e => e.id === empId ? { ...e, tableId: viewedTable.id, rsvpStatus: e.rsvpStatus === "pending" ? "confirmed" : e.rsvpStatus } : e));
                }}
              />
            )}
          </div>
        )}

        {/* PRIZES TAB */}
        {tab === "prizes" && (
          <div>
            <div style={{ background: "#FAF7F2", borderRadius: 12, padding: 24, marginBottom: 20, border: "1px solid #E8DFD0" }}>
              <h4 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: T.inkDark, marginBottom: 16 }}>Add New Prize</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}>Prize Label</label>
                  <input value={newPrize.label} onChange={e => setNewPrize(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Grand Prize"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}>Prize Type</label>
                  <input value={newPrize.type} onChange={e => setNewPrize(p => ({ ...p, type: e.target.value }))} placeholder="Electronics, Voucher, Travel…"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`, fontSize: 13 }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}>Description</label>
                <input value={newPrize.description} onChange={e => setNewPrize(p => ({ ...p, description: e.target.value }))} placeholder='e.g. Sony 65" 4K Smart TV'
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`, fontSize: 13 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginBottom: 4 }}>Prize Photo</label>
                <input type="file" accept="image/*" onChange={e => handlePrizePhoto(e, null)} style={{ fontSize: 12 }} />
                {newPrize.photo && <img src={newPrize.photo} style={{ height: 80, borderRadius: 8, border: `1px solid ${T.border}`, marginTop: 8 }} alt="prize preview" />}
              </div>
              <button onClick={addPrize} style={{ background: T.green, color: T.white, border: "none", borderRadius: 7, padding: "9px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add Prize</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {prizes.map((p, i) => (
                <div key={p.id} style={{ background: "#FAF7F2", borderRadius: 12, padding: 16, border: "1px solid #E8DFD0", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button onClick={() => movePrize(i, -1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", fontSize: 14, color: i === 0 ? T.border : T.gray }}>▲</button>
                    <button onClick={() => movePrize(i, 1)} disabled={i === prizes.length - 1} style={{ background: "none", border: "none", cursor: i === prizes.length - 1 ? "default" : "pointer", fontSize: 14, color: i === prizes.length - 1 ? T.border : T.gray }}>▼</button>
                  </div>
                  <div style={{ width: 76, height: 76, borderRadius: 8, background: "#EDE4D3", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {p.photo ? <img src={p.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.label} /> : <span style={{ fontSize: 26, opacity: 0.3 }}>🎁</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{p.type || "—"}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: T.inkDark }}>{p.label}</div>
                    {p.description && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray }}>{p.description}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                    <label style={{ background: "#EDE4D3", color: T.inkDark, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {p.photo ? "📷 Change" : "📷 Photo"}
                      <input type="file" accept="image/*" onChange={e => handlePrizePhoto(e, p.id)} style={{ display: "none" }} />
                    </label>
                    <button onClick={() => setPrizes(prev => prev.map(pr => pr.id === p.id ? { ...pr, drawn: !pr.drawn } : pr))}
                      style={{ background: p.drawn ? "#DCFCE7" : T.grayLight, color: p.drawn ? T.green : T.gray, border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {p.drawn ? "Drawn ✓" : "Not Drawn"}
                    </button>
                    <button onClick={() => setPrizes(prev => prev.filter(pr => pr.id !== p.id))}
                      style={{ background: "#FEE2E2", color: T.red, border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RSVP STATUS TAB */}
        {tab === "rsvp" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}>
              {[["Total", employees.length, T.darkGreen], ["Confirmed", confirmedList.length, T.green], ["Declined", declinedList.length, T.red], ["Pending", pendingList.length, T.yellowDark], ["Seats", totalSeats, "#8B5CF6"]].map(([lbl, val, color]) => (
                <div key={lbl} style={{ background: T.white, borderRadius: 12, padding: "18px 20px", border: `1px solid ${T.border}`, borderTop: `4px solid ${color}` }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray, marginTop: 4 }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["all", "confirmed", "declined", "pending"].map(f => (
                <button key={f} onClick={() => setRsvpFilter(f)}
                  style={{ background: rsvpFilter === f ? T.green : T.white, color: rsvpFilter === f ? T.white : T.gray, border: `1px solid ${rsvpFilter === f ? T.green : T.border}`, borderRadius: 20, padding: "6px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                  {f}
                </button>
              ))}
            </div>
            <div style={{ background: "#FAF7F2", borderRadius: 12, overflow: "hidden", border: "1px solid #E8DFD0", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#EDE4D3" }}>
                    {["Name", "Employee No.", "Email", "Pax", "Status", "Table"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.gray, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rsvpFiltered.map((e, i) => (
                    <tr key={e.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? "#FAF7F2" : "#F5F0E8" }}>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500 }}>{e.name}</td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>{e.employeeNumber}</td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray }}>{e.email || "—"}</td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>{e.pax}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: e.rsvpStatus === "confirmed" ? "#DCFCE7" : e.rsvpStatus === "declined" ? "#FEE2E2" : T.grayLight, color: e.rsvpStatus === "confirmed" ? T.green : e.rsvpStatus === "declined" ? T.red : T.gray, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {e.rsvpStatus}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>{tables.find(t => t.id === e.tableId)?.name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DOWNLOADS TAB */}
        {tab === "downloads" && (
          <div style={{ maxWidth: 700 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: T.inkDark, marginBottom: 24 }}>Export Data</h3>
            {[
              ["📋 Full Attendee List", "All employees with RSVP, email, and table info", exportAttendees],
              ["✅ RSVP Report", "Confirmed and declined guests only", exportRSVP],
              ["🪑 Tables & Seating", "Full seating chart per table", exportTables],
              ["🏆 Winners List", "All lucky draw winners", exportWinners],
            ].map(([title, desc, fn]) => (
              <div key={title} style={{ background: T.white, borderRadius: 12, padding: "18px 22px", border: `1px solid ${T.border}`, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600, color: T.inkDark, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>{desc}</div>
                </div>
                <button onClick={fn} style={{ background: T.green, color: T.white, border: "none", borderRadius: 8, padding: "9px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  ⬇ Excel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



// ─── QR CHECK-IN STAFF LOGIN ─────────────────────────────────────────────────
// Separate simple login for door staff — gives access ONLY to the QR scanner
// Cannot access admin dashboard or any other admin features
function QRLogin({ onLogin }) {
  const [pass, setPass]       = useState("");
  const [err,  setErr]        = useState("");
  const [loading, setLoading] = useState(false);

  // Staff PIN — separate from admin credentials
  const handle = async () => {
    setErr("");
    if(!pass){setErr("Please enter the staff PIN.");return;}
    setLoading(true);
    try{
      const{data,error}=await SUPA.from("app_config").select("value").eq("key","staff_pin").single();
      if(error)throw new Error(error.message);
      if(!data?.value){setErr("PIN not configured.");setLoading(false);return;}
      if(pass===data.value){
        sessionStorage.setItem("staffToken",btoa("staff:"+Date.now()));
        sessionStorage.setItem("staffExpiry",String(Date.now()+12*60*60*1000));
        onLogin();
      }else{setErr("Incorrect PIN. Please ask your supervisor.");}
    }catch(e){setErr("Cannot connect to database.");}
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1A5C28 0%, #2D8B3E 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#FAF7F2", borderRadius: 20, padding: 48, width: 380, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", border: "1px solid #E8DFD0", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: "#1A5C28", fontWeight: 700, marginBottom: 4 }}>Staff Check-In</div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray, marginBottom: 28 }}>QR Scanner — Door Staff Only</div>

        {err && (
          <div style={{ background: "#FEE2E2", color: T.red, padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
            ⚠️ {err}
          </div>
        )}

        <div style={{ marginBottom: 20, textAlign: "left" }}>
          <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid, marginBottom: 6, fontWeight: 600 }}>Staff PIN</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handle()}
            placeholder="Enter PIN"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 20, outline: "none", color: T.inkDark, background: T.white, letterSpacing: 8, textAlign: "center" }}
            onFocus={ev => ev.target.style.borderColor = T.green}
            onBlur={ev => ev.target.style.borderColor = "#E8DFD0"} />
        </div>

        <button onClick={handle} disabled={loading}
          style={{ width: "100%", background: loading ? "#E8DFD0" : T.green, color: loading ? T.inkMid : T.white, border: "none", borderRadius: 8, padding: 14, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Checking…" : "Enter →"}
        </button>

        <div style={{ marginTop: 20, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.gray, opacity: 0.6 }}>
          This screen is for door staff only.<br/>For admin access, use the main Admin login.
        </div>
      </div>
    </div>
  );
}

// ─── QR SCANNER PAGE ─────────────────────────────────────────────────────────
function QRScannerPage({ employees, setEmployees, tables, onBack }) {
  // Build a map of tableId → tableName for fast lookup
  const tableMap = Object.fromEntries((tables || []).map(t => [t.id, t.name]));
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [scanning,    setScanning]    = useState(false);
  const [scanResult,  setScanResult]  = useState(null);
  const [error,       setError]       = useState("");
  const [attended,    setAttended]    = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [cameraMode,  setCameraMode]  = useState(false);

  // Load jsQR from CDN
  const [jsQRReady, setJsQRReady] = useState(false);
  useEffect(() => {
    if (window.jsQR) { setJsQRReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    script.onload = () => setJsQRReady(true);
    script.onerror = () => setError("Could not load QR scanner library.");
    document.head.appendChild(script);
  }, []);

  // Start camera
  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraMode(true);
      setScanning(true);
    } catch (err) {
      setError("Camera access denied. Use manual entry below instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraMode(false);
    setScanning(false);
  };

  // Scan loop
  useEffect(() => {
    if (!scanning || !jsQRReady || !cameraMode) return;
    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d");
    let rafId;
    const scan = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(img.data, img.width, img.height);
        if (code?.data) {
          handleScan(code.data);
          return; // stop after first scan
        }
      }
      rafId = requestAnimationFrame(scan);
    };
    rafId = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(rafId);
  }, [scanning, jsQRReady, cameraMode]);

  const handleScan = (raw) => {
    stopCamera();
    const parsed = parseQRData(raw);
    processGuest(parsed);
  };

  const processGuest = (parsed) => {
    // Find the employee by id, drawNumber, or name
    const emp = employees.find(e =>
      (parsed.id && e.id === parsed.id) ||
      (parsed.drawNumber && e.drawNumber === parsed.drawNumber) ||
      e.name.toLowerCase() === (parsed.name || "").toLowerCase()
    );

    if (!emp) {
      setScanResult({ found: false, parsed });
      return;
    }

    if (emp.attended) {
      setScanResult({ found: true, emp, alreadyScanned: true, tableMap });
      return;
    }

    // Mark as attended
    setEmployees(prev => prev.map(e =>
      e.id === emp.id ? { ...e, attended: true, attendedAt: new Date().toLocaleTimeString() } : e
    ));
    setAttended(prev => [...prev, { ...emp, attendedAt: new Date().toLocaleTimeString() }]);
    setScanResult({ found: true, emp, alreadyScanned: false, tableMap });
  };

  const handleManual = () => {
    if (!manualInput.trim()) return;
    // Try as draw number or name
    const emp = employees.find(e =>
      e.drawNumber === manualInput.trim() ||
      e.name.toLowerCase().includes(manualInput.toLowerCase())
    );
    if (emp) {
      processGuest({ id: emp.id, name: emp.name, drawNumber: emp.drawNumber });
    } else {
      setScanResult({ found: false, parsed: { name: manualInput } });
    }
    setManualInput("");
  };

  const confirmedCount = employees.filter(e => e.rsvpStatus === "confirmed").length;
  const attendedCount  = employees.filter(e => e.attended).length;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: "#EDE4D3", borderBottom: "1px solid #D4C4A8", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SoilbuildLogo size={32} />
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: T.inkDark, fontWeight: 700 }}>📷 QR Check-In Scanner</div>
        </div>
        <button onClick={onBack}
          style={{ background: "transparent", color: T.inkMid, border: "1px solid #C8B89A", borderRadius: 7, padding: "8px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>
          ← Dashboard
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
          {[
            ["Confirmed RSVPs", confirmedCount, T.green],
            ["Checked In Today", attendedCount, "#8B5CF6"],
            ["Still Arriving", Math.max(0, confirmedCount - attendedCount), T.yellowDark],
          ].map(([lbl, val, color]) => (
            <div key={lbl} style={{ background: T.white, borderRadius: 12, padding: "18px 20px", border: `1px solid ${T.border}`, borderTop: `4px solid ${color}`, textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 700, color }}>{val}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray, marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* LEFT — Scanner */}
          <div style={{ background: "#FAF7F2", borderRadius: 16, padding: 24, border: "1px solid #E8DFD0" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: T.inkDark, marginBottom: 16 }}>Scan QR Code</h3>

            {/* Camera viewfinder */}
            <div style={{ position: "relative", width: "100%", paddingBottom: "75%", background: "#1A1A1A", borderRadius: 12, overflow: "hidden", marginBottom: 14, border: `2px solid ${cameraMode ? T.green : "#E8DFD0"}` }}>
              <video ref={videoRef} muted playsInline
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: cameraMode ? "block" : "none" }} />
              {!cameraMode && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ fontSize: 52 }}>📷</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "0 20px" }}>
                    {jsQRReady ? "Click Start Camera to scan" : "Loading scanner…"}
                  </div>
                </div>
              )}
              {/* Scan overlay corners */}
              {cameraMode && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ width: 180, height: 180, position: "relative" }}>
                    {[["0 auto auto 0","borderTop","borderLeft"],["0 0 auto auto","borderTop","borderRight"],["auto auto 0 0","borderBottom","borderLeft"],["auto 0 0 auto","borderBottom","borderRight"]].map(([inset, b1, b2], i) => (
                      <div key={i} style={{ position: "absolute", inset, width: 28, height: 28, [b1]: `3px solid ${T.green}`, [b2]: `3px solid ${T.green}` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <div style={{ background: "#FEE2E2", color: T.red, padding: "8px 12px", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 12, marginBottom: 12 }}>{error}</div>}

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {!cameraMode ? (
                <button onClick={startCamera} disabled={!jsQRReady}
                  style={{ flex: 1, background: jsQRReady ? T.green : "#E8DFD0", color: T.white, border: "none", borderRadius: 8, padding: "11px", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, cursor: jsQRReady ? "pointer" : "not-allowed" }}>
                  📷 Start Camera
                </button>
              ) : (
                <button onClick={stopCamera}
                  style={{ flex: 1, background: T.red, color: T.white, border: "none", borderRadius: 8, padding: "11px", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  ⏹ Stop Camera
                </button>
              )}
              {scanResult && (
                <button onClick={() => { setScanResult(null); startCamera(); }}
                  style={{ background: "#EDE4D3", color: T.inkDark, border: "none", borderRadius: 8, padding: "11px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Next →
                </button>
              )}
            </div>

            {/* Scan result */}
            {scanResult && (
              <div style={{ background: scanResult.found && !scanResult.alreadyScanned ? "#DCFCE7" : scanResult.alreadyScanned ? "#FEF9C3" : "#FEE2E2", borderRadius: 12, padding: 16, border: `1px solid ${scanResult.found && !scanResult.alreadyScanned ? "#BBF7D0" : scanResult.alreadyScanned ? "#FDE68A" : "#FECACA"}`, animation: "fadeInUp 0.3s ease-out" }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, marginBottom: 8 }}>
                  {scanResult.found && !scanResult.alreadyScanned ? "✅" : scanResult.alreadyScanned ? "⚠️" : "❌"}
                </div>
                {scanResult.found ? (
                  <>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: T.inkDark, marginBottom: 4 }}>{scanResult.emp.name}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray, marginBottom: 4 }}>
                      {scanResult.emp.employeeNumber} · {scanResult.emp.pax} pax · Draw #{scanResult.emp.drawNumber}
                    </div>
                    {scanResult.emp.tableId && (
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: "#2D8B3E", background: "#E8F0FB", borderRadius: 6, padding: "4px 12px", display: "inline-block", marginBottom: 4 }}>
                        🪑 {scanResult.tableMap?.[scanResult.emp.tableId] || scanResult.emp.tableId}
                      </div>
                    )}
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: scanResult.alreadyScanned ? T.yellowDark : T.green }}>
                      {scanResult.alreadyScanned ? `Already checked in at ${scanResult.emp.attendedAt}` : "✓ Checked in successfully!"}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: T.inkDark, marginBottom: 4 }}>Guest Not Found</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>{scanResult.parsed?.name || "Unknown"}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.red, marginTop: 4 }}>Not in the confirmed guest list.</div>
                  </>
                )}
              </div>
            )}

            {/* Manual lookup */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E8DFD0" }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, fontWeight: 600, marginBottom: 8 }}>MANUAL LOOKUP (name or draw #)</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={manualInput} onChange={e => setManualInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleManual()}
                  placeholder="Type name or draw number…"
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none" }}
                  onFocus={e => e.target.style.borderColor = T.green}
                  onBlur={e => e.target.style.borderColor = "#E8DFD0"} />
                <button onClick={handleManual}
                  style={{ background: T.green, color: T.white, border: "none", borderRadius: 8, padding: "9px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Find
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — Checked-in list */}
          <div style={{ background: "#FAF7F2", borderRadius: 16, padding: 24, border: "1px solid #E8DFD0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: T.inkDark }}>Checked In</h3>
              <span style={{ background: "#8B5CF6", color: T.white, borderRadius: 20, padding: "3px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700 }}>{attendedCount}</span>
            </div>

            {attendedCount === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>
                No check-ins yet.<br/>Start scanning QR codes at the entrance.
              </div>
            ) : (
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {employees.filter(e => e.attended).reverse().map((e, i) => (
                  <div key={e.id} style={{ padding: "11px 0", borderBottom: "1px solid #EDE4D3", display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeInUp 0.3s ease-out" }}>
                    <div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: T.inkDark }}>{e.name}</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.gray }}>{e.employeeNumber} · {e.pax} pax · {e.attendedAt}</div>
                    </div>
                    <span style={{ background: "#DCFCE7", color: T.green, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>✓ In</span>
                  </div>
                ))}
              </div>
            )}

            {/* Not yet arrived */}
            {confirmedCount > attendedCount && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #E8DFD0" }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.inkMid, marginBottom: 8 }}>NOT YET ARRIVED ({confirmedCount - attendedCount})</div>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {employees.filter(e => e.rsvpStatus === "confirmed" && !e.attended).map(e => (
                    <div key={e.id} style={{ padding: "8px 0", borderBottom: "1px solid #F5F0E8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid }}>{e.name}</div>
                      <button onClick={() => processGuest({ id: e.id, name: e.name, drawNumber: e.drawNumber })}
                        style={{ background: T.green, color: T.white, border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        Mark In
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── DRAW ADMIN ───────────────────────────────────────────────────────────────
function DrawAdmin({ employees, setEmployees, prizes, setPrizes, winners, setWinners, eventInfo, onLogout, setPage }) {
  const [selectedPrize, setSelectedPrize]   = useState("");
  const [winnersCount,  setWinnersCount]    = useState(1);
  const [countdown,     setCountdown]       = useState(null);
  const [spinning,      setSpinning]        = useState(false);
  const [spinName,      setSpinName]        = useState("");
  const [roundWinners,  setRoundWinners]    = useState([]);
  const [excluded,      setExcluded]        = useState([]);
  const [displayMode,   setDisplayMode]     = useState("cards");
  // multiprize queue: [{qid, prizeId}]
  const [mpQueue,       setMpQueue]         = useState([]);
  // how many winners are currently visible on audience screen
  const [revealedCount, setRevealedCount]   = useState(0);
  const spinRef  = useRef();
  const countRef = useRef();
  const fx       = useSoundFX();
  const broadcast = useBroadcast("soilbuild-draw", () => {});

  const eligible    = employees.filter(e => e.rsvpStatus === "confirmed" && e.drawEligible && !excluded.includes(e.id));
  const excludedList = employees.filter(e => excluded.includes(e.id));

  const goLiveOnAllScreens = () => goLiveOnAllScreens(); // audience via ?screen=audience

  // ── helpers ───────────────────────────────────────────────────────────────
  const buildWinner = (emp, prize) => ({
    id: uid(), employeeId: emp.id, name: emp.name,
    employeeNumber: emp.employeeNumber || "",
    prizeId: prize.id, prizeLabel: prize.label,
    prizeType: prize.type || "", prizeDescription: prize.description || "",
    prizePhoto: prize.photo || "", timestamp: nowTime(),
  });

  const pickRandom = (pool) => pool[Math.floor(Math.random() * pool.length)];

  // broadcast current full state to audience
  const bcast = (extra) => pushDrawState({displayMode,...extra});

  // ── reveal next winner on audience ────────────────────────────────────────
  const revealNext = () => {
    const next = revealedCount + 1;
    setRevealedCount(next);
    pushDrawState({revealedCount:next,displayMode,active:true,winners:roundWinners});
    fx.fanfare();
  };

  // ── clear audience screen ─────────────────────────────────────────────────
  const clearScreen = () => {
    setRoundWinners([]); setRevealedCount(0);
    bcast({ active: false, spinning: false, winners: [], countdown: null, prize: null });
  };

  // ── Spinning NUMBER ticker ───────────────────────────────────────────────────
  // Counts 001→300, exactly 2 full loops at high speed, then slows to winner's number
  const spinTicker = (pool, duration, onDone) => {
    clearTimeout(spinRef.current);
    const MAX = 300;
    const fmt = (n) => String(n).padStart(3, "0");

    // Phase 1: 2 full fast loops (each loop = 300 steps at 20ms = 6000ms total)
    // Phase 2: slow crawl to winner's number
    const FAST_INTERVAL = 20;        // ms per step — fast
    const TOTAL_FAST_STEPS = MAX * 2; // exactly 2 full loops
    const SLOW_STEPS = 40;            // steps in slow-down phase
    const SLOW_START_INTERVAL = 80;   // ms — start of slow phase
    const SLOW_END_INTERVAL = 400;    // ms — end of slow phase (dramatic pause)

    // Pick winner now so we can target their number
    const winner = pool[Math.floor(Math.random() * pool.length)];
    const winnerNum = winner?.drawNumber
      ? parseInt(winner.drawNumber, 10)
      : winner?.employeeNumber
        ? parseInt(String(winner.employeeNumber).replace(/\D/g, ""), 10) || Math.ceil(Math.random() * MAX)
        : Math.ceil(Math.random() * MAX);
    const targetNum = Math.min(Math.max(winnerNum, 1), MAX);

    let step = 0;
    let current = 0;

    const fastPhase = () => {
      step++;
      current = (current % MAX) + 1;
      const display = fmt(current);
      setSpinName(display);
      pushDrawState({spinName:display,spinning:true,displayMode,active:true});

      if (step < TOTAL_FAST_STEPS) {
        spinRef.current = setTimeout(fastPhase, FAST_INTERVAL);
      } else {
        // Done with fast loops — now slowly crawl toward targetNum
        // Figure out remaining steps from current to targetNum
        // If targetNum is ahead, go forward; if behind, do another small loop
        slowPhase(current);
      }
    };

    const slowPhase = (from) => {
      // Build path from `from` to `targetNum`, going forward (wrap if needed)
      let steps = [];
      let n = from;
      while (n !== targetNum) {
        n = n >= MAX ? 1 : n + 1;
        steps.push(n);
        if (steps.length > MAX + 5) break; // safety
      }
      // If already at target, just stay
      if (steps.length === 0) {
        finalize(targetNum);
        return;
      }

      let si = 0;
      const crawl = () => {
        const num = steps[si];
        const display = fmt(num);
        setSpinName(display);
        pushDrawState({spinName:display,spinning:true,displayMode,active:true});
        si++;
        if (si < steps.length) {
          // Ease out: interval grows as we approach the end
          const progress = si / steps.length;
          const interval = SLOW_START_INTERVAL + Math.floor(progress * progress * (SLOW_END_INTERVAL - SLOW_START_INTERVAL));
          spinRef.current = setTimeout(crawl, interval);
        } else {
          finalize(targetNum);
        }
      };
      crawl();
    };

    const finalize = (num) => {
      const display = fmt(num);
      setSpinName(display);
      pushDrawState({spinName:display,spinning:true,displayMode,active:true});
      // Pause 800ms showing final number before revealing winner
      setTimeout(() => onDone(winner), 800);
    };

    // Kick off
    fastPhase();
  };

  // ── countdown then callback ───────────────────────────────────────────────
  const runCountdown = (onDone) => {
    let c = 3;
    setCountdown(c); fx.tick();
    // broadcast initial countdown to audience
    clearInterval(countRef.current);
    countRef.current = setInterval(() => {
      c--;
      if (c > 0) {
        setCountdown(c);
        fx.tick();
        // broadcast each tick so audience sees 3 → 2 → 1
        pushDrawState({countdown:c,spinning:false,active:true,displayMode});
      } else {
        clearInterval(countRef.current);
        setCountdown(null);
        // tell audience countdown is done (null = hide it)
        pushDrawState({countdown:null,spinning:false,active:true,displayMode});
        onDone();
      }
    }, 1000);
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  MODE: cards / splitscreen  — one prize, N winners, revealed one-by-one
  // ══════════════════════════════════════════════════════════════════════════
  const startNormalDraw = () => {
    if (!selectedPrize || eligible.length === 0) return;
    const prize = prizes.find(p => p.id === selectedPrize);
    if (!prize) return;

    setRoundWinners([]); setRevealedCount(0); setSpinning(false);
    pushDrawState({displayMode,active:true,spinning:false,winners:[],countdown:null,prize});
    pushDrawState({countdown:3,spinning:false,active:true,displayMode});

    runCountdown(() => {
      setSpinning(true);
      bcast({ active: true, spinning: true, winners: [], countdown: null, prize });
      fx.spinSound();

      const pool  = [...eligible];
      const count = Math.min(winnersCount, pool.length);
      const picked = [];

      // spin for each winner sequentially
      const spinOne = (remaining, usedIds) => {
        const subPool = pool.filter(e => !usedIds.includes(e.id));
        if (subPool.length === 0 || picked.length >= count) {
          // all done
          const newWinners = picked.map(emp => buildWinner(emp, prize));
          setWinners(prev => [...newWinners, ...prev]);
          setRoundWinners(newWinners);
          setRevealedCount(0);
          setEmployees(prev => prev.map(e => picked.find(p => p.id === e.id) ? { ...e, drawEligible: false } : e));
          setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, drawn: true } : p));
          setSpinning(false);
          bcast({ active: true, spinning: false, winners: newWinners, countdown: null, prize });
          fx.fanfare();
          return;
        }

        spinTicker(subPool, remaining === count ? 4000 : 2500, (winner) => {
          if (winner) picked.push(winner);
          if (picked.length < count) {
            setTimeout(() => spinOne(remaining - 1, picked.map(e => e.id)), 400);
          } else {
            const newWinners = picked.map(emp => buildWinner(emp, prize));
            setWinners(prev => [...newWinners, ...prev]);
            setRoundWinners(newWinners);
            setRevealedCount(0);
            setEmployees(prev => prev.map(e => picked.find(p => p.id === e.id) ? { ...e, drawEligible: false } : e));
            setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, drawn: true } : p));
            setSpinning(false);
            bcast({ active: true, spinning: false, winners: newWinners, countdown: null, prize });
            fx.fanfare();
          }
        });
      };

      spinOne(count, []);
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  MODE: multiprize — each queue entry = 1 spin, 1 winner, own prize
  //  All spins run back-to-back automatically, then host reveals one-by-one
  // ══════════════════════════════════════════════════════════════════════════
  const startMultiPrizeDraw = () => {
    if (mpQueue.length === 0 || eligible.length === 0) return;

    // Snapshot queue and prizes at draw time (avoids stale closure)
    const queueSnap  = [...mpQueue];
    const prizesSnap = [...prizes];
    const eligSnap   = [...eligible];

    setRoundWinners([]); setRevealedCount(0); setSpinning(false);

    const firstPrize = prizesSnap.find(p => p.id === queueSnap[0].prizeId) || prizesSnap[0];
    // Tell audience new draw starting, reset their state
    pushDrawState({displayMode:"multiprize",active:true,spinning:false,winners:[],countdown:null,prize:firstPrize});
    // Start countdown ticks
    pushDrawState({countdown:3,spinning:false,active:true,displayMode});

    runCountdown(() => {
      const runNext = (idx, accWinners, usedIds) => {
        if (idx >= queueSnap.length) {
          // ── All spins complete ──
          setSpinning(false);
          setRoundWinners(accWinners);
          setRevealedCount(0);
          fx.fanfare();
          // Send final state — displayMode hardcoded as "multiprize"
          pushDrawState({displayMode:"multiprize",active:true,spinning:false,winners:accWinners,countdown:null,prize:null});
          return;
        }

        const currentPrize = prizesSnap.find(p => p.id === queueSnap[idx].prizeId) || prizesSnap[0];
        const pool = eligSnap.filter(e => !usedIds.includes(e.id));
        if (pool.length === 0) { runNext(idx + 1, accWinners, usedIds); return; }

        setSpinning(true);
        pushDrawState({displayMode:"multiprize",active:true,spinning:true,winners:accWinners,countdown:null,prize:currentPrize});
        fx.spinSound();

        spinTicker(pool, 3000, (spunWinner) => {
          const emp    = spunWinner || pickRandom(pool);
          const winner = buildWinner(emp, currentPrize);
          const updated = [...accWinners, winner];

          setWinners(prev => [winner, ...prev]);
          setRoundWinners(updated);
          setEmployees(prev => prev.map(e =>
            e.id === emp.id ? { ...e, drawEligible: false } : e
          ));
          setPrizes(prev => prev.map(p =>
            p.id === currentPrize.id ? { ...p, drawn: true } : p
          ));

          // Pause so audience can see the final number, then next prize
          setTimeout(() => runNext(idx + 1, updated, [...usedIds, emp.id]), 1400);
        });
      };

      runNext(0, [], []);
    });
  };

  const startDraw = () => {
    if (displayMode === "multiprize") startMultiPrizeDraw();
    else startNormalDraw();
  };

  const toggleExclude = (id) => setExcluded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const canStart = !spinning && countdown === null && (
    displayMode === "multiprize" ? mpQueue.length > 0 : !!selectedPrize
  ) && eligible.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: "#EDE4D3", borderBottom: "1px solid #D4C4A8", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SoilbuildLogo size={32} />
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: T.inkDark, fontWeight: 700 }}>🎰 Lucky Draw Control</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => window.open(window.location.href + "#audience", "_blank")}
            style={{ background: T.green, color: T.white, border: "none", borderRadius: 7, padding: "8px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            👁 Audience Screen
          </button>
          <button onClick={goLiveOnAllScreens}
            style={{ background: T.red, color: T.white, border: "none", borderRadius: 7, padding: "8px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            📡 Force All Live
          </button>
          <button onClick={() => setPage("admin")}
            style={{ background: "transparent", color: T.inkMid, border: "1px solid #C8B89A", borderRadius: 7, padding: "8px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer" }}>
            ← Dashboard
          </button>
          <button onClick={onLogout}
            style={{ background: "rgba(193,39,45,0.1)", color: T.red, border: "1px solid rgba(193,39,45,0.25)", borderRadius: 7, padding: "8px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* ── LEFT: Controls ─────────────────────────────────────────────── */}
        <div>
          <div style={{ background: "#FAF7F2", borderRadius: 16, padding: 24, border: "1px solid #E8DFD0", marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: T.inkDark, marginBottom: 18 }}>Draw Controls</h3>

            {/* Display Mode */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkMid, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Audience Display Mode</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[
                  { id: "cards",       icon: "🃏", label: "Cards",        sub: "Cards one-by-one" },
                  { id: "splitscreen", icon: "🖼",  label: "Split Screen", sub: "Prize right, names left" },
                  { id: "multiprize",  icon: "🎁",  label: "Multi-Prize",  sub: "Each wins own prize" },
                ].map(m => (
                  <button key={m.id} onClick={() => { setDisplayMode(m.id); setRoundWinners([]); setRevealedCount(0); }}
                    disabled={spinning || countdown !== null}
                    style={{ padding: "9px 6px", borderRadius: 8, border: `2px solid ${displayMode === m.id ? T.green : "#E8DFD0"}`, background: displayMode === m.id ? "#DCFCE7" : T.white, color: displayMode === m.id ? T.green : T.inkMid, fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, cursor: "pointer", textAlign: "center", lineHeight: 1.5 }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{m.icon}</div>
                    {m.label}<br/>
                    <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.6 }}>{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cards / Split: single prize + winner count */}
            {(displayMode === "cards" || displayMode === "splitscreen") && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 5, fontWeight: 600 }}>Select Prize</label>
                  <select value={selectedPrize} onChange={e => setSelectedPrize(e.target.value)} disabled={spinning || countdown !== null}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, background: T.white, color: T.inkDark }}>
                    <option value="">— Choose a prize —</option>
                    {prizes.filter(p => !p.drawn).map(p => (
                      <option key={p.id} value={p.id}>{p.label}{p.type ? ` — ${p.type}` : ""}{p.description ? ` (${p.description})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 5, fontWeight: 600 }}>Number of Winners</label>
                  <input type="number" min={1} max={eligible.length || 1} value={winnersCount}
                    onChange={e => setWinnersCount(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={spinning || countdown !== null}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, background: T.white, color: T.inkDark }} />
                </div>
              </>
            )}

            {/* Multi-Prize: queue builder */}
            {displayMode === "multiprize" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.inkMid, fontWeight: 700 }}>Prize Queue (drawn in order)</label>
                  <button onClick={() => {
                    const avail = prizes.filter(p => !p.drawn);
                    if (!avail.length) return;
                    setMpQueue(prev => [...prev, { qid: uid(), prizeId: avail[0].id }]);
                  }} style={{ background: T.green, color: T.white, border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
                </div>
                {mpQueue.length === 0 && (
                  <div style={{ padding: 14, textAlign: "center", background: "#F5F0E8", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.gray }}>
                    Click "+ Add" — each entry = 1 separate spin with its own prize.
                  </div>
                )}
                {mpQueue.map((item, idx) => (
                  <div key={item.qid} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.yellow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: "#2C1A0E" }}>{idx + 1}</span>
                    </div>
                    <select value={item.prizeId}
                      onChange={e => setMpQueue(prev => prev.map((x, i) => i === idx ? { ...x, prizeId: e.target.value } : x))}
                      style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "1.5px solid #E8DFD0", fontFamily: "'DM Sans',sans-serif", fontSize: 12, background: T.white, color: T.inkDark }}>
                      {prizes.map(p => <option key={p.id} value={p.id}>{p.label}{p.type ? ` — ${p.type}` : ""}</option>)}
                    </select>
                    <button onClick={() => setMpQueue(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: "#FEE2E2", color: T.red, border: "none", borderRadius: 6, width: 28, height: 28, fontSize: 15, cursor: "pointer", flexShrink: 0 }}>×</button>
                  </div>
                ))}
                {mpQueue.length > 0 && (
                  <div style={{ marginTop: 8, padding: "7px 12px", background: "#F0FFF4", borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.green, border: "1px solid #BBF7D0" }}>
                    ✓ {mpQueue.length} prize{mpQueue.length > 1 ? "s" : ""} queued · spins run back-to-back · reveal one-by-one
                  </div>
                )}
              </div>
            )}

            {/* Countdown display */}
            {countdown !== null && (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 72, color: T.green, fontWeight: 900, animation: "pulse2 0.8s ease-in-out" }}>{countdown}</div>
              </div>
            )}

            {/* Spin display */}
            {spinning && (
              <div style={{ textAlign: "center", marginBottom: 16, padding: 14, background: "#3B2A1A", borderRadius: 12 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 5, textTransform: "uppercase" }}>Drawing…</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: T.yellow, animation: "flicker 0.1s infinite", minHeight: 30 }}>{spinName}</div>
              </div>
            )}

            {/* Winners this round */}
            {roundWinners.length > 0 && !spinning && (
              <div style={{ background: "#DCFCE7", borderRadius: 12, padding: 12, marginBottom: 14 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 6 }}>🏆 Winners this round:</div>
                {roundWinners.map(w => (
                  <div key={w.id} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkDark, padding: "2px 0", display: "flex", justifyContent: "space-between" }}>
                    <span>• {w.name}</span>
                    {displayMode === "multiprize" && <span style={{ color: T.green, fontSize: 11 }}>{w.prizeLabel}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* START button */}
            <button onClick={canStart ? startDraw : undefined} disabled={!canStart}
              style={{ width: "100%", background: canStart ? T.green : "#E8DFD0", color: canStart ? T.white : T.gray, border: "none", borderRadius: 10, padding: "14px 0", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: canStart ? "pointer" : "not-allowed", marginBottom: 10, boxShadow: canStart ? "0 4px 16px rgba(45,139,62,0.3)" : "none", transition: "all 0.2s" }}>
              {countdown !== null ? `Starting in ${countdown}…` : spinning ? "🎰 DRAWING…" : "🎰 START DRAW"}
            </button>

            {/* REVEAL NEXT button */}
            {roundWinners.length > 0 && !spinning && revealedCount < roundWinners.length && (
              <button onClick={revealNext}
                style={{ width: "100%", background: T.yellow, color: "#2C1A0E", border: "none", borderRadius: 10, padding: "13px 0", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10, boxShadow: "0 4px 16px rgba(245,197,24,0.45)", animation: "pulse2 1.5s ease-in-out infinite" }}>
                ✨ Reveal Next Winner ({revealedCount + 1} / {roundWinners.length})
              </button>
            )}
            {roundWinners.length > 0 && !spinning && revealedCount >= roundWinners.length && (
              <div style={{ textAlign: "center", padding: "8px", marginBottom: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.green, fontWeight: 600 }}>
                ✅ All {roundWinners.length} winner{roundWinners.length > 1 ? "s" : ""} revealed!
              </div>
            )}

            {/* CLEAR button */}
            {(roundWinners.length > 0 || spinning) && (
              <button onClick={clearScreen}
                style={{ width: "100%", background: "#FEE2E2", color: T.red, border: "none", borderRadius: 10, padding: "11px 0", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                🗑 Clear Audience Screen
              </button>
            )}
          </div>

          {/* Winner history */}
          <div style={{ background: "#FAF7F2", borderRadius: 16, padding: 20, border: "1px solid #E8DFD0" }}>
            <h4 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: T.inkDark, marginBottom: 14 }}>All Winners</h4>
            {winners.length === 0
              ? <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.gray }}>No winners yet.</p>
              : <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {winners.map(w => (
                    <div key={w.id} style={{ padding: "9px 0", borderBottom: "1px solid #E8DFD0", display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: T.inkDark }}>{w.name}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.green }}>{w.prizeLabel}{w.prizeType ? ` · ${w.prizeType}` : ""}</div>
                      </div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: T.gray, flexShrink: 0 }}>{w.timestamp}</div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>

        {/* ── RIGHT: Eligible pool ────────────────────────────────────────── */}
        <div>
          <div style={{ background: "#FAF7F2", borderRadius: 16, padding: 20, border: "1px solid #E8DFD0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: T.inkDark }}>Eligible Pool</h3>
              <span style={{ background: T.green, color: T.white, borderRadius: 20, padding: "3px 14px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700 }}>{eligible.length}</span>
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {eligible.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #E8DFD0" }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: T.inkDark }}>{e.name}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.inkMid }}>{e.employeeNumber} · Pax {e.pax}</div>
                  </div>
                  <button onClick={() => toggleExclude(e.id)}
                    style={{ background: "#FEE2E2", color: T.red, border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>Exclude</button>
                </div>
              ))}
              {eligible.length === 0 && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid, padding: "16px 0" }}>No eligible attendees. Confirm some RSVPs first.</p>}
            </div>
            {excludedList.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: T.inkMid, marginBottom: 8 }}>EXCLUDED ({excludedList.length})</div>
                {excludedList.map(e => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", opacity: 0.65 }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.inkMid }}>{e.name}</span>
                    <button onClick={() => toggleExclude(e.id)}
                      style={{ background: "#DCFCE7", color: T.green, border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>Include</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flicker { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @keyframes pulse2  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
      `}</style>
    </div>
  );
}


// ─── AUDIENCE SCREEN ─────────────────────────────────────────────────────────
function AudienceScreen({ eventInfo }) {
  const [drawState, setDrawState] = useState({
    active: false, spinning: false, winners: [],
    countdown: null, prize: null, displayMode: "cards"
  });
  const [spinDisplay, setSpinDisplay] = useState("—");
  const [revealedCount, setRevealedCount] = useState(0);
  const fx = useSoundFX();

  const [countdown, setCountdown] = useState(null); // managed separately from drawState

  useEffect(()=>{
    SUPA.from("draw_state").select("*").eq("id",1).single().then(({data})=>{
      if(data){setDrawState(p=>({...p,...data}));if(data.countdown)setCountdown(data.countdown);if(data.spinName)setSpinDisplay(data.spinName);if(typeof data.revealedCount==="number")setRevealedCount(data.revealedCount);}
    });
    const ch=SUPA.channel("aud-draw").on("postgres_changes",{event:"*",schema:"public",table:"draw_state"},payload=>{
      if(!payload.new)return;const d=payload.new;
      setDrawState(p=>({...p,...d}));
      if(d.countdown!==undefined)setCountdown(d.countdown);
      if(d.spinName)setSpinDisplay(d.spinName);
      if(typeof d.revealedCount==="number")setRevealedCount(d.revealedCount);
      if(d.spinning)fx.spinSound();
      if(!d.spinning&&d.revealedCount>0)fx.fanfare();
      if(d.countdown&&d.countdown>0)fx.tick();
    }).subscribe();
    return()=>SUPA.removeChannel(ch);
  // eslint-disable-next-line
  },[]);

  const { active, spinning, winners: allWinners = [], prize, displayMode = "cards" } = drawState;
  const showCountdown   = countdown !== null && countdown > 0;
  const showWinners     = !spinning && active && allWinners.length > 0 && revealedCount > 0;
  const readyToReveal   = !spinning && active && allWinners.length > 0 && revealedCount === 0;
  const visibleWinners  = allWinners.slice(0, revealedCount);
  const winnerCount     = allWinners.length;

  // card sizing
  const cardW   = winnerCount === 1 ? 500 : winnerCount === 2 ? 420 : winnerCount <= 4 ? 340 : 280;
  const nameFS  = winnerCount === 1 ? "clamp(42px,6vw,80px)" : winnerCount <= 2 ? "clamp(32px,4.5vw,60px)" : "clamp(24px,3.5vw,44px)";
  const prizeFS = winnerCount === 1 ? 28 : winnerCount <= 2 ? 24 : 18;
  const photoH  = winnerCount === 1 ? 220 : winnerCount <= 2 ? 180 : 140;

  // ── shared dark bg ──────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, background: "linear-gradient(135deg, #1A3D1F 0%, #0D1B0F 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Particles count={60} color={T.yellow} />
      <Confetti active={showWinners} />

      {/* Radar rings */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(245,197,24,0.12)", animation: "radarSpin 12s linear infinite", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 40,  borderRadius: "50%", border: "1px solid rgba(245,197,24,0.08)" }} />
        <div style={{ position: "absolute", inset: 100, borderRadius: "50%", border: "1px solid rgba(245,197,24,0.05)" }} />
      </div>

      {/* Corner logo */}
      <div style={{ position: "absolute", top: 24, left: 28, zIndex: 10 }}>
        <SoilbuildLogo size={40} dark />
      </div>
      <div style={{ position: "absolute", top: 32, right: 32, zIndex: 10, textAlign: "right" }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 3, textTransform: "uppercase" }}>{eventInfo.title} {eventInfo.year}</div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>🎰 LUCKY DRAW</div>
      </div>

      {/* ── IDLE ─────────────────────────────────────────────────────────── */}
      {!active && !showCountdown && (
        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <SoilbuildLogo size={110} vertical dark />
          </div>
          <div style={{ width: 120, height: 2, background: "linear-gradient(90deg,transparent,#F5C518,transparent)", margin: "0 auto 24px" }} />
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,4vw,46px)", color: T.yellow, fontWeight: 700, marginBottom: 10 }}>
            {eventInfo.title} {eventInfo.year}
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(12px,1.4vw,16px)", color: "rgba(255,255,255,0.4)", letterSpacing: 4, textTransform: "uppercase" }}>
            Lucky Draw · Standing By
          </div>
          <div style={{ marginTop: 32, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>Awaiting host…</div>
        </div>
      )}

      {/* ── COUNTDOWN ────────────────────────────────────────────────────── */}
      {showCountdown && (
        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          {prize && (
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.yellow, letterSpacing: 4, textTransform: "uppercase", marginBottom: 24 }}>
              Drawing for: {prize.label}
            </div>
          )}
          <div key={countdown} style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(120px,24vw,240px)", fontWeight: 900, color: T.yellow, lineHeight: 1, textShadow: "0 0 120px rgba(245,197,24,0.9)", animation: "countPulse 0.8s ease-out" }}>
            {countdown}
          </div>
        </div>
      )}

      {/* ── SPINNING ─────────────────────────────────────────────────────── */}
      {spinning && (
        <div style={{ textAlign: "center", position: "relative", zIndex: 2, padding: "0 32px", width: "100%", maxWidth: 900 }}>
          {prize && (
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.yellow, letterSpacing: 4, marginBottom: 20, textTransform: "uppercase", opacity: 0.8 }}>
              {prize.label}{prize.type ? ` · ${prize.type}` : ""}
            </div>
          )}
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 5, marginBottom: 24, textTransform: "uppercase" }}>
            LUCKY DRAW
          </div>

          {/* Slot machine number display */}
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* Glow ring */}
            <div style={{ position: "absolute", inset: -20, borderRadius: 28, background: "radial-gradient(ellipse, rgba(245,197,24,0.25) 0%, transparent 70%)", pointerEvents: "none", animation: "spinGlow 0.4s ease-in-out infinite alternate" }} />
            {/* Main box */}
            <div style={{ background: "linear-gradient(180deg, #1a1200 0%, #0d0a00 100%)", border: "3px solid rgba(245,197,24,0.6)", borderRadius: 20, padding: "32px 64px", boxShadow: "0 0 60px rgba(245,197,24,0.3), inset 0 0 40px rgba(0,0,0,0.5)" }}>
              {/* Number display — split into individual digit boxes */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
                {(spinDisplay.padStart(3,"0")).split("").map((digit, i) => (
                  <div key={i} style={{
                    width: 100, height: 140,
                    background: "linear-gradient(180deg, #2a1f00 0%, #1a1300 50%, #2a1f00 100%)",
                    border: "2px solid rgba(245,197,24,0.4)",
                    borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "inset 0 4px 12px rgba(0,0,0,0.6), 0 0 20px rgba(245,197,24,0.15)",
                    position: "relative", overflow: "hidden",
                  }}>
                    {/* scanline effect */}
                    <div style={{ position: "absolute", top: "48%", left: 0, right: 0, height: 2, background: "rgba(245,197,24,0.15)", pointerEvents: "none" }} />
                    <span style={{
                      fontFamily: "'Courier New', 'OCR A Std', monospace",
                      fontSize: 96,
                      fontWeight: 900,
                      color: T.yellow,
                      textShadow: "0 0 20px rgba(245,197,24,0.9), 0 0 40px rgba(245,197,24,0.5)",
                      lineHeight: 1,
                      animation: "digitFlip 0.06s steps(1) infinite",
                    }}>{digit}</span>
                  </div>
                ))}
              </div>
              {/* Label under digits */}
              <div style={{ marginTop: 16, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(245,197,24,0.4)", letterSpacing: 6, textTransform: "uppercase", textAlign: "center" }}>
                Employee No.
              </div>
            </div>
          </div>

          {/* Partial winners already drawn (multi-prize) */}
          {allWinners.length > 0 && (
            <div style={{ marginTop: 32, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              {allWinners.map(w => (
                <div key={w.id} style={{ background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.25)", borderRadius: 10, padding: "8px 18px", animation: "fadeIn 0.5s ease-out" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: T.white, fontWeight: 700 }}>{w.name}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.yellow, marginTop: 2 }}>{w.prizeLabel}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AWAITING REVEAL ───────────────────────────────────────────────── */}
      {readyToReveal && (
        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,52px)", color: T.yellow, fontWeight: 700, animation: "pulse 2s ease-in-out infinite" }}>
            🎰 Draw Complete!
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 16, letterSpacing: 3, textTransform: "uppercase" }}>
            Press Reveal on the control panel
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODE: CARDS — winner cards appear one by one
      ════════════════════════════════════════════════════════════════════ */}
      {showWinners && displayMode === "cards" && (
        <div style={{ position: "relative", zIndex: 2, width: "100%", maxHeight: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "72px 24px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 20, flexShrink: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(24px,3.5vw,52px)", fontWeight: 900, color: T.yellow, textShadow: "0 0 50px rgba(245,197,24,0.7)", animation: "winnerHeader 0.8s ease-out" }}>
              🎉 Congratulations! 🎉
            </div>
            <div style={{ width: 70, height: 2, background: T.yellow, margin: "12px auto 0" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", alignItems: "flex-start", width: "100%", maxWidth: 1300 }}>
            {visibleWinners.map((w, i) => (
              <div key={w.id} style={{
                background: "rgba(245,197,24,0.07)", border: "2px solid rgba(245,197,24,0.4)",
                borderRadius: 20, padding: "24px 28px", width: cardW, flexShrink: 0,
                animation: "winnerReveal 0.9s cubic-bezier(0.34,1.56,0.64,1) both",
                boxShadow: "0 0 50px rgba(245,197,24,0.2)", backdropFilter: "blur(8px)",
              }}>
                {w.prizePhoto && (
                  <div style={{ width: "100%", height: photoH, borderRadius: 10, marginBottom: 14, overflow: "hidden", border: "1px solid rgba(245,197,24,0.2)" }}>
                    <img src={w.prizePhoto} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={w.prizeLabel} />
                  </div>
                )}
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 5 }}>Winner</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: nameFS, fontWeight: 700, color: T.white, marginBottom: 14, lineHeight: 1.1 }}>{w.name}</div>
                <div style={{ width: 36, height: 1, background: T.yellow, marginBottom: 12 }} />
                {w.prizeType && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: T.yellow, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>{w.prizeType}</div>}
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: prizeFS, color: T.yellow, fontWeight: 700, marginBottom: 4 }}>{w.prizeLabel}</div>
                {w.prizeDescription && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{w.prizeDescription}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODE: SPLIT SCREEN — one prize photo right, names list left
          All winners share the SAME prize (shown right), revealed one by one left
      ════════════════════════════════════════════════════════════════════ */}
      {showWinners && displayMode === "splitscreen" && (
        <div style={{ position: "relative", zIndex: 2, width: "100%", height: "100vh", display: "flex", alignItems: "stretch" }}>
          {/* LEFT — winner names */}
          <div style={{ flex: "0 0 44%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 40px 40px 56px", borderRight: "1px solid rgba(245,197,24,0.15)" }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 24 }}>
              {prize?.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {visibleWinners.map((w, i) => (
                <div key={w.id} style={{ animation: "slideInLeft 0.8s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.yellow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 20px rgba(245,197,24,0.4)" }}>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 16, color: "#2C1A0E" }}>{i + 1}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(32px,4.5vw,64px)", fontWeight: 900, color: T.white, lineHeight: 1.05 }}>{w.name}</div>
                      {w.employeeNumber && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{w.employeeNumber}</div>}
                    </div>
                  </div>
                  {i < visibleWinners.length - 1 && <div style={{ marginLeft: 54, marginTop: 14, height: 1, background: "rgba(245,197,24,0.1)" }} />}
                </div>
              ))}
              {visibleWinners.length === 0 && (
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: "rgba(255,255,255,0.15)" }}>Awaiting reveal…</div>
              )}
            </div>
            {visibleWinners.length > 0 && (
              <div style={{ marginTop: 36, fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 900, color: T.yellow }}>🎉 Congratulations!</div>
            )}
          </div>

          {/* RIGHT — prize photo */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 48px 48px 48px" }}>
            {prize?.photo ? (
              <div style={{ width: "100%", maxWidth: 500, borderRadius: 24, overflow: "hidden", border: "3px solid rgba(245,197,24,0.4)", boxShadow: "0 0 80px rgba(245,197,24,0.3)" }}>
                <img src={prize.photo} alt={prize.label} style={{ width: "100%", height: "auto", maxHeight: "55vh", objectFit: "cover", display: "block" }} />
              </div>
            ) : (
              <div style={{ width: 300, height: 300, borderRadius: 24, border: "3px solid rgba(245,197,24,0.25)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,197,24,0.04)", boxShadow: "0 0 60px rgba(245,197,24,0.15)" }}>
                <span style={{ fontSize: 90 }}>🎁</span>
              </div>
            )}
            <div style={{ marginTop: 24, textAlign: "center" }}>
              {prize?.type && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.yellow, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, opacity: 0.75 }}>{prize.type}</div>}
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(22px,3.5vw,48px)", fontWeight: 900, color: T.yellow, textShadow: "0 0 40px rgba(245,197,24,0.5)" }}>{prize?.label}</div>
              {prize?.description && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>{prize.description}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODE: MULTI-PRIZE — each person wins their OWN prize
          Revealed one at a time: name LEFT, their specific prize photo RIGHT
      ════════════════════════════════════════════════════════════════════ */}
      {showWinners && displayMode === "multiprize" && (() => {
        const current = visibleWinners[visibleWinners.length - 1];
        if (!current) return null;
        return (
          <div style={{ position: "relative", zIndex: 2, width: "100%", height: "100vh", display: "flex", alignItems: "stretch" }}>
            {/* LEFT — current winner name + wins label + previous winners */}
            <div style={{ flex: "0 0 45%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 40px 40px 60px", borderRight: "1px solid rgba(245,197,24,0.15)" }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 20 }}>
                Winner {revealedCount} of {allWinners.length}
              </div>
              <div key={current.id} style={{ animation: "slideInLeft 0.9s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.yellow, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10, opacity: 0.85 }}>🎉 Congratulations</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(44px,7vw,96px)", fontWeight: 900, color: T.white, lineHeight: 1.0, marginBottom: 14 }}>{current.name}</div>
                <div style={{ width: 56, height: 3, background: T.yellow, marginBottom: 18, borderRadius: 2 }} />
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>wins</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(20px,2.8vw,36px)", fontWeight: 700, color: T.yellow }}>{current.prizeLabel}</div>
                {current.prizeDescription && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>{current.prizeDescription}</div>}
              </div>

              {/* Previous winners mini-list */}
              {visibleWinners.length > 1 && (
                <div style={{ marginTop: 36, paddingTop: 20, borderTop: "1px solid rgba(245,197,24,0.1)" }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Previous</div>
                  {visibleWinners.slice(0, -1).map(w => (
                    <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{w.name}</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(245,197,24,0.45)" }}>{w.prizeLabel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — this winner's specific prize photo */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 48px 48px 48px" }}>
              <div key={current.id} style={{ animation: "winnerReveal 0.9s cubic-bezier(0.34,1.56,0.64,1) both", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {current.prizePhoto ? (
                  <div style={{ width: "100%", maxWidth: 520, borderRadius: 24, overflow: "hidden", border: "3px solid rgba(245,197,24,0.45)", boxShadow: "0 0 100px rgba(245,197,24,0.35)", marginBottom: 20 }}>
                    <img src={current.prizePhoto} alt={current.prizeLabel} style={{ width: "100%", height: "auto", maxHeight: "52vh", objectFit: "cover", display: "block" }} />
                  </div>
                ) : (
                  <div style={{ width: 280, height: 280, borderRadius: 24, border: "3px solid rgba(245,197,24,0.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,197,24,0.04)", marginBottom: 20, boxShadow: "0 0 80px rgba(245,197,24,0.2)" }}>
                    <span style={{ fontSize: 90 }}>🎁</span>
                  </div>
                )}
                {current.prizeType && (
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.yellow, letterSpacing: 3, textTransform: "uppercase", opacity: 0.7 }}>{current.prizeType}</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes radarSpin    { from{transform:translate(-50%,-50%) rotate(0deg)}   to{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes countPulse   { from{transform:scale(1.5);opacity:0}                to{transform:scale(1);opacity:1} }
        @keyframes winnerReveal { from{transform:scale(0.5) translateY(60px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
        @keyframes winnerHeader { from{transform:scale(0.5);opacity:0}                to{transform:scale(1);opacity:1} }
        @keyframes spinPulse    { from{box-shadow:0 0 60px rgba(245,197,24,0.15)}     to{box-shadow:0 0 110px rgba(245,197,24,0.55)} }
        @keyframes slideInLeft  { from{transform:translateX(-90px);opacity:0}         to{transform:translateX(0);opacity:1} }
        @keyframes fadeIn       { from{opacity:0}                                      to{opacity:1} }
        @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes flicker      { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes pulse2       { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes fadeInDown   { from{opacity:0;transform:translateY(-30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInUp     { from{opacity:0;transform:translateY(30px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes spinGlow     { from{opacity:0.5;transform:scale(0.98)} to{opacity:1;transform:scale(1.02)} }
        @keyframes digitFlip    { 0%{transform:translateY(0);opacity:1} 45%{transform:translateY(-8px);opacity:0.3} 55%{transform:translateY(8px);opacity:0.3} 100%{transform:translateY(0);opacity:1} }
      `}</style>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
function validSession(k,ek){try{const t=sessionStorage.getItem(k),e=parseInt(sessionStorage.getItem(ek)||"0");if(!t||!e)return false;if(Date.now()>e){sessionStorage.removeItem(k);sessionStorage.removeItem(ek);return false;}return true;}catch(ex){return false;}}

export default function App() {
  const [page, setPage] = useState("home");
  const [employees, setEmployees] = useState(() => {
    try { const s = localStorage.getItem("sb_employees"); return s ? JSON.parse(s) : INIT_EMPLOYEES; } catch { return INIT_EMPLOYEES; }
  });
  useEffect(() => { try { localStorage.setItem("sb_employees", JSON.stringify(employees)); } catch {} }, [employees]);
  const [tables, setTables] = useState(() => {
    try { const s = localStorage.getItem("sb_tables"); return s ? JSON.parse(s) : INIT_TABLES; } catch { return INIT_TABLES; }
  });
  useEffect(() => { try { localStorage.setItem("sb_tables", JSON.stringify(tables)); } catch {} }, [tables]);
  const [prizes, setPrizes] = useState(() => {
    try { const s = localStorage.getItem("sb_prizes"); return s ? JSON.parse(s) : INIT_PRIZES; } catch { return INIT_PRIZES; }
  });
  useEffect(() => { try { localStorage.setItem("sb_prizes", JSON.stringify(prizes)); } catch {} }, [prizes]);
  const [winners, setWinners] = useState(() => {
    try { const s = localStorage.getItem("sb_winners"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem("sb_winners", JSON.stringify(winners)); } catch {} }, [winners]);
  // Load saved settings from localStorage, fallback to INIT_EVENT defaults
  const [eventInfo, setEventInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("sb_eventInfo");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Hardcoded fields always win — event details + key never change from cache
        return {
          ...parsed,
          greeting:     INIT_EVENT.greeting,
          title:        INIT_EVENT.title,
          year:         INIT_EVENT.year,
          date:         INIT_EVENT.date,
          time:         INIT_EVENT.time,
          venue:        INIT_EVENT.venue,
          web3formsKey: INIT_EVENT.web3formsKey,
          emailSubject: INIT_EVENT.emailSubject,
          emailBody:    INIT_EVENT.emailBody,
        };
      }
    } catch {}
    return INIT_EVENT;
  });

  // Auto-save eventInfo to localStorage whenever admin changes anything
  useEffect(() => {
    try { localStorage.setItem("sb_eventInfo", JSON.stringify(eventInfo)); } catch {}
  }, [eventInfo]);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [qrLoggedIn,    setQrLoggedIn]    = useState(false);

  // Load all data from Supabase on mount
  useEffect(()=>{
    (async()=>{
      try{
        const[emps,tbls,przs,wnrs]=await Promise.all([dbAll("employees"),dbAll("tables"),dbAll("prizes"),dbAll("winners")]);
        if(emps.length)setEmployees(emps);
        if(tbls.length)setTables(tbls);
        if(przs.length)setPrizes(przs);
        if(wnrs.length)setWinners(wnrs);
      }catch(e){console.warn("Supabase load:",e);}
    })();
  },[]);

  // Real-time employee sync
  useEffect(()=>{
    const ch=SUPA.channel("rt-emp").on("postgres_changes",{event:"*",schema:"public",table:"employees"},p=>{
      if(p.eventType==="INSERT"||p.eventType==="UPDATE"){
        setEmployees(prev=>{const i=prev.findIndex(e=>e.id===p.new.id);return i>=0?prev.map((e,j)=>j===i?p.new:e):[...prev,p.new];});
      }else if(p.eventType==="DELETE"){setEmployees(prev=>prev.filter(e=>e.id!==p.old.id));}
    }).subscribe();
    return()=>SUPA.removeChannel(ch);
  },[]);
  const [pendingPage, setPendingPage] = useState(null);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel("soilbuild-draw");
    ch.onmessage = (e) => {
      if (e.data.type === "FORCE_AUDIENCE_VIEW") {
        if (page !== "draw-admin" && page !== "admin" && page !== "login") {
          setPage("draw-audience");
        }
      }
    };
    return () => ch.close();
  }, [page]);

  useEffect(() => {
    if (window.location.hash === "#audience") setPage("draw-audience");
  }, []);

  const goAdmin = (view) => {
    if (!adminLoggedIn) { setPendingPage(view); setPage("login"); }
    else setPage(view);
  };

  const handleLogin = () => {
    setAdminLoggedIn(true);
    setPage(pendingPage || "admin");
    setPendingPage(null);
  };

  const handleLogout = () => { setAdminLoggedIn(false); setPage("home"); };

  const navSetPage = (p) => {
    if (p === "admin" || p === "draw-admin") goAdmin(p);
    else setPage(p);
  };

  const showNav = page !== "draw-audience" && page !== "login";

  return (
    <div>
      <FontLoader />
      {showNav && <Nav page={page} setPage={navSetPage} />}
      {page === "home" && <HomePage setPage={navSetPage} eventInfo={eventInfo} />}
      {page === "rsvp" && <RSVPPage employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} eventInfo={eventInfo} />}
      {page === "login" && <AdminLogin onLogin={handleLogin} />}
      {page === "admin" && (adminLoggedIn
        ? <AdminDashboard employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} prizes={prizes} setPrizes={setPrizes} winners={winners} eventInfo={eventInfo} setEventInfo={setEventInfo} onLogout={handleLogout} setPage={navSetPage} />
        : <AdminLogin onLogin={handleLogin} />)}
      {page === "draw-admin" && (adminLoggedIn
        ? <DrawAdmin employees={employees} setEmployees={setEmployees} prizes={prizes} setPrizes={setPrizes} winners={winners} setWinners={setWinners} eventInfo={eventInfo} onLogout={handleLogout} setPage={setPage} />
        : <AdminLogin onLogin={handleLogin} />)}
      {page === "draw-audience" && <AudienceScreen eventInfo={eventInfo} />}
      {page === "qr-scanner" && (qrLoggedIn
        ? <QRScannerPage employees={employees} setEmployees={setEmployees} tables={tables} onBack={() => setPage("home")} />
        : <QRLogin onLogin={() => setQrLoggedIn(true)} />)}
    </div>
  );
}
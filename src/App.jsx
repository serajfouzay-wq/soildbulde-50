import React, { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPA = createClient(
  "https://zsjbjwxyofgrdyhxlcjj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzamJqd3h5b2ZncmR5aHhsY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTM4NjcsImV4cCI6MjA5NDgyOTg2N30.O0-uolysivbUak-DGbHmG7orv93iTEgGOgCGEHAcQNs"
);

async function dbAll(t) { try { const { data } = await SUPA.from(t).select("*"); return data || []; } catch (e) { return []; } }
async function dbUpsert(t, r) {
  try {
    const { error } = await SUPA.from(t).upsert(r, { onConflict: "id" });
    if (error) console.warn(`Supabase upsert [${t}] failed:`, error.message, "— run the SQL setup script to add missing columns. Row:", r);
  } catch (e) { console.warn(`Supabase upsert [${t}] exception:`, e); }
}
async function dbDelete(t, id) { try { await SUPA.from(t).delete().eq("id", id); } catch (e) { console.warn(e); } }
async function pushDrawState(s) { try { await SUPA.from("draw_state").upsert({ id: 1, ...s, ts: new Date().toISOString() }, { onConflict: "id" }); } catch (e) { console.warn(e); } }

// ─── WHATSAPP API (placeholder — insert credentials to activate) ──────────────
// ─── TWILIO WHATSAPP (sandbox) ────────────────────────────────────────────────
// Twilio config from your dashboard. NOTE: you must add your AUTH TOKEN below.
// ⚠️ IMPORTANT: Twilio blocks direct browser calls (CORS + exposing auth token is unsafe).
// Best practice: deploy the tiny serverless function shown in the comment at the bottom
// of this file to Vercel (api/send-whatsapp.js) and it will work automatically.
const TWILIO = {
  accountSid:  "AC9279029bf0d6a18b0816666f87114b3e",
  authToken:   "YOUR_TWILIO_AUTH_TOKEN", // ← from twilio.com/console (keep secret!)
  fromNumber:  "whatsapp:+14155238886",   // Twilio sandbox number
  templateSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e", // "Your appointment is coming up on {{1}} at {{2}}."
};

async function sendWhatsApp({ to, name, uniqueId, pax, guestId, eventInfo }) {
  // Sends WhatsApp via the Vercel serverless route (api/send-whatsapp.js).
  // Includes the guest's QR code as an image attachment.
  try {
    if (!to) return { success:false, error:"no_phone_number" };
    const r = await fetch("/api/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        name,
        uniqueId,
        pax: pax || 1,
        guestId: guestId || "",
        eventDate: eventInfo.date,
        eventTime: eventInfo.time,
        venue: eventInfo.venue,
      }),
    });
    if (r.ok) { const d = await r.json(); return { success:true, sid:d.sid }; }
    const err = await r.text();
    console.warn("WhatsApp serverless error:", r.status, err);
    return { success:false, error: r.status===404 ? "serverless_route_missing" : err };
  } catch (e) {
    return { success:false, error:"serverless_route_missing — deploy api/send-whatsapp.js" };
  }
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
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,700&family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
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

// ─── SOILBUILD LOGO (user-provided, background removed, embedded base64) ─────
const LOGO_DATA = "data:image/png;base64,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";

function SoilbuildLogo({ size = 60, dark = false }) {
  return (
    <img
      src={LOGO_DATA}
      alt="SoilBuild"
      style={{ height:size, width:"auto", objectFit:"contain", display:"block", background:"none" }}
    />
  );
}



// ─── PDF DOWNLOAD (html2canvas + jsPDF — real PDF file, not browser print) ────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}
async function downloadCardPDF(elementId, filename) {
  try {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    const el = document.getElementById(elementId);
    if (!el) { alert("Card not found"); return; }
    const canvas = await window.html2canvas(el, { scale: 2, backgroundColor: null, useCORS: true });
    const img = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    // A5 portrait fits an invitation card nicely
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = canvas.height / canvas.width;
    let w = pageW - 16; let h = w * ratio;
    if (h > pageH - 16) { h = pageH - 16; w = h / ratio; }
    pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    pdf.save(filename);
  } catch (e) {
    console.error("PDF error:", e);
    alert("Could not generate PDF. Please try again.");
  }
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
  // Nav: Helpdesk public; Check-In + Admin require login (gated via navSetPage).
  const tabs = [
    { id:"helpdesk",   label:"🎫 Helpdesk" },
    { id:"qr-scanner", label:"📷 Check-In" },
    { id:"admin",      label:"🔒 Admin" },
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
  el.textContent=".sb-asset{mix-blend-mode:multiply}"+
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
        <img className="sb-asset" src="/img-fifty.png" alt="50 Years & Beyond" style={{
          width:'clamp(150px,36vw,280px)',
          marginBottom:'clamp(10px,2vh,18px)',
          animation:'sbFloatY 4s ease-in-out infinite',
        }}/>

        {/* Actual SoilBuild gold logo PNG */}
        <img className="sb-asset" src="/img-sb-logo.png" alt="SoilBuild" style={{
          width:'clamp(120px,26vw,200px)',
          marginBottom:'clamp(8px,1.5vh,14px)',
        }}/>

        {/* "SoilBuild 50 Years & Beyond" title text PNG */}
        <img className="sb-asset" src="/img-title.png" alt="SoilBuild 50 Years & Beyond" style={{
          width:'clamp(200px,50vw,420px)',
          marginBottom:'clamp(14px,2.5vh,24px)',
        }}/>

        {/* Event details box PNG */}
        <img className="sb-asset" src="/img-eventbox.png" alt="Event Details" style={{
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
        <img className="sb-asset" src="/img-fifty.png" alt="50 Years & Beyond" style={{width:'clamp(120px,30vw,175px)',margin:'0 auto clamp(6px,1.2vh,10px)',display:'block',animation:'sbFloatY 4s ease-in-out infinite'}}/>
        {/* Actual SoilBuild logo PNG */}
        <img className="sb-asset" src="/img-sb-logo.png" alt="SoilBuild" style={{width:'clamp(100px,22vw,150px)',margin:'0 auto clamp(10px,1.8vh,16px)',display:'block'}}/>
        <div style={{margin:'clamp(12px,2.5vh,18px) clamp(-18px,-5vw,-38px) 0',padding:'clamp(16px,3vh,22px) clamp(18px,5vw,38px) clamp(14px,2.5vh,20px)',background:'rgba(255,255,255,0.56)',borderTop:'0.5px solid rgba(201,168,76,.38)',borderBottom:'0.5px solid rgba(201,168,76,.38)'}}>
          <h1 style={{fontFamily:SB_FH,fontSize:'clamp(16px,4vw,24px)',color:SB_GOLD,margin:'0 0 clamp(6px,1.2vh,8px)',fontWeight:700,lineHeight:1.3}}>SoilBuild 50 Years &amp; Beyond</h1>
          {name&&<p style={{fontFamily:SB_FH,fontSize:'clamp(13px,3vw,16px)',color:SB_GD,fontStyle:'italic',margin:'0 0 6px'}}>Dear {name},</p>}
          <p style={{color:SB_TM,fontSize:'clamp(11px,2.2vw,13px)',lineHeight:1.72,margin:0}}>Join us as we celebrate a remarkable milestone and look ahead to the future.</p>
        </div>
        {/* Actual event details box PNG */}
        <img className="sb-asset" src="/img-eventbox.png" alt="Event Details" style={{width:'clamp(200px,85%,340px)',margin:'clamp(14px,2.5vh,20px) auto clamp(10px,2vh,14px)',display:'block'}}/>
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
              {confirmed.mobile && (
                <div style={{ textAlign:"left", gridColumn:"1 / -1" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:"rgba(245,240,232,0.4)", textTransform:"uppercase", letterSpacing:1.5 }}>Mobile</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"rgba(245,240,232,0.85)", fontWeight:600 }}>📱 {confirmed.mobile}</div>
                </div>
              )}
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
          <button onClick={()=>downloadCardPDF("rsvp-card-print", `Soilbuild-RSVP-${confirmed.uniqueId}.pdf`)}
            style={{ background:T.green, color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(45,139,62,0.3)" }}>
            ⬇ Download PDF Card
          </button>
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
    // Send WhatsApp (with QR code image) via Twilio serverless route
    if (guest.mobile) {
      sendWhatsApp({ to:guest.mobile, name:guest.name, uniqueId, pax:guest.pax, guestId:guest.id, eventInfo }).then(r => {
        if(!r.success) console.info("WhatsApp:", r.error);
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
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
          {[["🍜","Chinese"],["🌙","Halal"],["🥗","Vegetarian"],["🥜","Food Allergies"]].map(([ic,val]) => (
            <button key={val} onClick={()=>setForm(f=>({...f,dietary:val}))}
              style={{ background:form.dietary===val?T.green:"#F5F0E8", color:form.dietary===val?"#fff":T.inkMid, border:`1.5px solid ${form.dietary===val?T.green:T.beigeDark}`, borderRadius:9, padding:"10px 4px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, textAlign:"center" }}>
              <div style={{ fontSize:18, marginBottom:3 }}>{ic}</div>{val}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.inkMid, marginBottom:5, fontWeight:600 }}>Food Allergies <span style={{ opacity:0.5 }}>(optional)</span></label>
        <textarea value={form.allergies} onChange={e=>setForm(f=>({...f,allergies:e.target.value}))} placeholder="Describe any food allergies in detail — e.g. severe peanut allergy, shellfish intolerance, gluten-free required…" rows={3}
          style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background:"#fff", color:T.inkDark, resize:"vertical", minHeight:70 }}
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
    // Send WhatsApp (with QR code image) via Twilio serverless route
    if (guest.mobile) {
      sendWhatsApp({ to:guest.mobile, name:guest.name, uniqueId, pax:guest.pax, guestId:guest.id, eventInfo }).then(r => {
        if(!r.success) console.info("WhatsApp:", r.error);
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
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
          {[["🍜","Chinese"],["🌙","Halal"],["🥗","Vegetarian"],["🥜","Food Allergies"]].map(([ic,val]) => (
            <button key={val} onClick={()=>setForm(f=>({...f,dietary:val}))}
              style={{ background:form.dietary===val?"rgba(245,197,24,0.25)":"rgba(255,255,255,0.07)", color:form.dietary===val?T.yellow:"rgba(245,240,232,0.7)", border:`1.5px solid ${form.dietary===val?"rgba(245,197,24,0.6)":"rgba(255,255,255,0.15)"}`, borderRadius:9, padding:"10px 4px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, textAlign:"center" }}>
              <div style={{ fontSize:18, marginBottom:3 }}>{ic}</div>{val}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(245,240,232,0.65)", marginBottom:5, fontWeight:600 }}>Food Allergies <span style={{ opacity:0.4 }}>(optional)</span></label>
        <textarea value={form.allergies} onChange={e=>setForm(f=>({...f,allergies:e.target.value}))} placeholder="Describe any food allergies in detail — e.g. severe peanut allergy, shellfish intolerance, gluten-free required…" rows={3}
          style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:"1.5px solid rgba(245,197,24,0.3)", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background:"rgba(255,255,255,0.08)", color:"#F5F0E8", resize:"vertical", minHeight:70 }}
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
        // No sessionStorage — login is in-memory only and dies on refresh (security)
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


// ─── COMMS TEST PANEL (diagnose Email + WhatsApp from inside the app) ─────────
function CommsTestPanel({ eventInfo }) {
  const [phone, setPhone]   = useState("");
  const [email, setEmail]   = useState("");
  const [waResult, setWaResult] = useState(null);
  const [emResult, setEmResult] = useState(null);
  const [waBusy, setWaBusy] = useState(false);
  const [emBusy, setEmBusy] = useState(false);

  const testWA = async () => {
    if (!phone.trim()) { setWaResult({ok:false, msg:"Enter a phone number first (with country code, e.g. +60111…)"}); return; }
    setWaBusy(true); setWaResult(null);
    try {
      const r = await fetch("/api/send-whatsapp", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ to:phone.trim(), name:"Test Guest", uniqueId:"SE999", pax:1, guestId:"test", eventDate:eventInfo.date, eventTime:eventInfo.time, venue:eventInfo.venue }),
      });
      const text = await r.text();
      let d; try { d = JSON.parse(text); } catch(e) { d = { raw:text }; }
      if (r.ok && d.success) setWaResult({ok:true, msg:`✅ Sent! Twilio SID: ${d.sid}. If it doesn't arrive: the recipient must first send the sandbox JOIN CODE to +1 415 523 8886 on WhatsApp.`});
      else if (r.status === 404) setWaResult({ok:false, msg:"❌ 404 — api/send-whatsapp.js is NOT deployed. The file must be in the api/ folder at your project ROOT (next to package.json, NOT inside src/). Push it and redeploy."});
      else setWaResult({ok:false, msg:`❌ ${r.status} — ${d.error || d.raw || "unknown"}. ${String(d.error||"").includes("TWILIO_AUTH_TOKEN") ? "→ Add TWILIO_AUTH_TOKEN in Vercel Settings → Environment Variables, then REDEPLOY (env vars only apply to new builds)." : ""}`});
    } catch(e) { setWaResult({ok:false, msg:"❌ Network error: "+String(e)}); }
    setWaBusy(false);
  };

  const testEmail = async () => {
    if (!email.trim() || !email.includes("@")) { setEmResult({ok:false, msg:"Enter a valid email first"}); return; }
    setEmBusy(true); setEmResult(null);
    const r = await sendConfirmationEmail({ to:email.trim(), name:"Test Guest", uniqueId:"SE999", tableName:"Table 1", pax:1, dietary:"Chinese", allergies:"", eventInfo });
    setEmResult(r.success ? {ok:true, msg:"✅ Email sent! Check the inbox (and spam folder)."} : {ok:false, msg:"❌ "+(r.error||"failed")});
    setEmBusy(false);
  };

  const box = (ok) => ({ marginTop:8, padding:"9px 13px", borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.5, background: ok?"#DCFCE7":"#FEE2E2", color: ok?"#15803D":T.red, border:`1px solid ${ok?"#BBF7D0":"#FECACA"}` });

  return (
    <div>
      {/* WhatsApp test */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, fontWeight:600, marginBottom:5 }}>📱 WhatsApp test (number must have joined the Twilio sandbox)</div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+60111372927"
            style={{ flex:1, padding:"9px 12px", borderRadius:7, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }} />
          <button onClick={testWA} disabled={waBusy}
            style={{ background:waBusy?"#E8DFD0":"#25D366", color:"#fff", border:"none", borderRadius:7, padding:"9px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:waBusy?"wait":"pointer" }}>
            {waBusy?"Sending…":"Send Test"}
          </button>
        </div>
        {waResult && <div style={box(waResult.ok)}>{waResult.msg}</div>}
      </div>
      {/* Email test */}
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, fontWeight:600, marginBottom:5 }}>📧 Email test (Web3Forms)</div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email"
            style={{ flex:1, padding:"9px 12px", borderRadius:7, border:`1.5px solid ${T.beigeDark}`, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }} />
          <button onClick={testEmail} disabled={emBusy}
            style={{ background:emBusy?"#E8DFD0":T.green, color:"#fff", border:"none", borderRadius:7, padding:"9px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:emBusy?"wait":"pointer" }}>
            {emBusy?"Sending…":"Send Test"}
          </button>
        </div>
        {emResult && <div style={box(emResult.ok)}>{emResult.msg}</div>}
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
          <button onClick={()=>setPage("qr-scanner")} style={{ background:"#8B5CF6", color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer" }}>📷 Check-In</button>
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

              {/* ── 📡 COMMUNICATIONS TEST PANEL ── */}
              <div style={{ marginTop:22, paddingTop:20, borderTop:`1px solid ${T.beigeDark}` }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:T.inkDark, marginBottom:10 }}>📡 Test Email & WhatsApp</div>
                <CommsTestPanel eventInfo={eventInfo} />
              </div>
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
              {[["🍜","Chinese"],["🌙","Halal"],["🥗","Vegetarian"],["🥜","Food Allergies"]].map(([ic,val])=>{
                // Food Allergies counts BOTH people who chose it as dietary AND anyone with allergy text
                const matches = val==="Food Allergies"
                  ? confirmed.filter(e=>e.dietary===val || (e.allergies&&e.allergies.trim()))
                  : confirmed.filter(e=>e.dietary===val);
                const count = matches.length;
                const pax   = matches.reduce((a,e)=>a+e.pax,0);
                return (
                  <div key={val} style={{ background:T.beigeLight, borderRadius:12, border:`1px solid ${val==="Food Allergies"?"#FCA5A5":T.beigeDark}`, padding:"18px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:26, marginBottom:5 }}>{ic}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:28, fontWeight:800, color:val==="Food Allergies"?T.red:T.green }}>{count}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.inkMid, fontWeight:600, marginTop:2 }}>{val}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.gray }}>{pax} pax</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background:T.beigeLight, borderRadius:12, border:`1px solid ${T.beigeDark}`, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#EDE4D3" }}>
                  {["Name","ID","Mobile","Type","Dietary","Allergies","Pax"].map(h=>(
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:T.gray, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {confirmed.map((e,i)=>(
                    <tr key={e.id} style={{ borderTop:`1px solid ${T.beigeDark}`, background:i%2===0?T.beigeLight:"#F5F0E8" }}>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500 }}>{e.name}</td>
                      <td style={{ padding:"10px 14px" }}><span style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:T.yellow, background:T.dark, padding:"2px 6px", borderRadius:4 }}>{e.uniqueId||"—"}</span></td>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.gray }}>{e.mobile||"—"}</td>
                      <td style={{ padding:"10px 14px" }}><span style={{ background:e.type==="vip"?"#FEF9C3":"#EEF2FF", color:e.type==="vip"?"#92400E":T.green, borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700 }}>{e.type==="vip"?"VIP":"Employee"}</span></td>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>{{"Chinese":"🍜","Halal":"🌙","Vegetarian":"🥗"}[e.dietary]||"—"} {e.dietary||"—"}</td>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:e.allergies?T.red:T.gray, maxWidth:220, whiteSpace:"normal", wordBreak:"break-word", fontWeight:e.allergies?600:400 }}>{e.allergies||"None"}</td>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>{e.pax}</td>
                    </tr>
                  ))}
                  {confirmed.length===0 && <tr><td colSpan={7} style={{ padding:24, textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.gray }}>No confirmed attendees yet.</td></tr>}
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
  const [displayMode, setDisplayMode]     = useState("cards"); // cards | splitscreen | multiprize
  const [winnersCount,  setWinnersCount]  = useState(1);
  // ── DRAW POOL MODE — this is admin-only, audience never sees the choice ──
  const [poolMode, setPoolMode]           = useState("both"); // "employee" | "vip" | "both"
  const [countdown, setCountdown]         = useState(null);
  const [spinning,  setSpinning]          = useState(false);
  const [spinDisplay,setSpinDisplay]      = useState("—");
  const [roundWinners,setRoundWinners]    = useState([]);
  const [revealIdx, setRevealIdx]         = useState(0);
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
    // ⚠️ ALWAYS mixed SE001–SE300 + GV001–GV300 shuffled together.
    // This is INDEPENDENT from the admin's pool choice (employee/vip/both).
    // The audience must NEVER be able to tell which pool the winner comes from.
    const pool = [];
    for (let i=1;i<=300;i++) pool.push("SE"+String(i).padStart(3,"0"));
    for (let i=1;i<=300;i++) pool.push("GV"+String(i).padStart(3,"0"));
    // Fisher-Yates shuffle for true random mix
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
      // Throttled: audience animates locally, only needs spinning=true flag
      if (di % 8 === 0) pushDrawState({ active:true, spinning:true, spinDisplay:id, countdown:null, displayMode });
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
            {/* AUDIENCE DISPLAY MODE */}
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

  // ── LOCAL SPIN ANIMATION ──────────────────────────────────────────────────
  // The audience generates its OWN rolling characters while spinning=true.
  // This is independent of network ticks, so the reels NEVER freeze at zeros.
  // Always mixed SE+GV — pool choice (employee/vip/both) is invisible here.
  const [localSpin, setLocalSpin] = useState("SE000");
  useEffect(() => {
    if (!ds.spinning) return;
    const pool = [];
    for (let i=1;i<=300;i++) pool.push("SE"+String(i).padStart(3,"0"));
    for (let i=1;i<=300;i++) pool.push("GV"+String(i).padStart(3,"0"));
    const iv = setInterval(() => {
      setLocalSpin(pool[Math.floor(Math.random()*pool.length)]);
    }, 75);
    return () => clearInterval(iv);
  }, [ds.spinning]);

  // ── DRAW SOUNDS (WebAudio — no files needed) ──────────────────────────────
  const audioCtxRef = useRef(null);
  const drumRef = useRef(null);
  const [soundOn, setSoundOn] = useState(false);
  const getCtx = () => {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext||window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtxRef.current;
  };
  // Browser autoplay policy: audio ONLY works after a user gesture.
  // This button unlocks the AudioContext with a click + plays a test beep.
  const enableSound = () => {
    const ctx = getCtx(); if (!ctx) return;
    ctx.resume().then(() => {
      try {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = 880;
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.3);
      } catch(e) {}
      setSoundOn(true);
    }).catch(()=>{});
  };
  // Drumroll while spinning
  useEffect(() => {
    if (!ds.spinning) { if(drumRef.current){clearInterval(drumRef.current);drumRef.current=null;} return; }
    const ctx = getCtx(); if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(()=>{});
    const hit = () => {
      try {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(150 + Math.random()*60, ctx.currentTime);
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.08);
      } catch(e) {}
    };
    drumRef.current = setInterval(hit, 90);
    return () => { if(drumRef.current){clearInterval(drumRef.current);drumRef.current=null;} };
  }, [ds.spinning]);
  // 🎉 BIG CELEBRATION when a winner is revealed: fanfare + cymbal + applause
  const prevRevealed = useRef(0);
  const playCelebration = () => {
    const ctx = getCtx(); if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(()=>{});
    try {
      const now = ctx.currentTime;
      // 1) Triumphant fanfare — two-voice ascending: C5-E5-G5-C6 with harmony
      const notes = [[523.25,659.25],[659.25,783.99],[783.99,987.77],[1046.5,1318.5]];
      notes.forEach(([f1,f2], i) => {
        const t = now + i * 0.14;
        [f1, f2].forEach((f, v) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = v === 0 ? "square" : "sine";
          o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(v===0 ? 0.12 : 0.2, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + (i===3 ? 1.1 : 0.28));
          o.connect(g); g.connect(ctx.destination);
          o.start(t); o.stop(t + (i===3 ? 1.2 : 0.32));
        });
      });
      // 2) Cymbal crash on the final note (white-noise burst, high-passed)
      const crashT = now + 0.42;
      const len = ctx.sampleRate * 1.2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i=0;i<len;i++) ch[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2.2);
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5500;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.35, crashT);
      ng.gain.exponentialRampToValueAtTime(0.001, crashT + 1.2);
      noise.connect(hp); hp.connect(ng); ng.connect(ctx.destination);
      noise.start(crashT);
      // 3) Applause — rapid filtered noise claps for ~2 seconds
      for (let i=0;i<28;i++) {
        const t = now + 0.5 + i*0.07 + Math.random()*0.03;
        const clen = ctx.sampleRate * 0.05;
        const cb = ctx.createBuffer(1, clen, ctx.sampleRate);
        const cd = cb.getChannelData(0);
        for (let j=0;j<clen;j++) cd[j] = (Math.random()*2-1) * Math.pow(1 - j/clen, 1.4);
        const clap = ctx.createBufferSource(); clap.buffer = cb;
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1100 + Math.random()*800;
        const cg = ctx.createGain();
        cg.gain.value = 0.05 + Math.random()*0.06;
        clap.connect(bp); bp.connect(cg); cg.connect(ctx.destination);
        clap.start(t);
      }
    } catch(e) {}
  };
  useEffect(() => {
    const rc = ds.revealedCount || 0;
    if (rc > prevRevealed.current && rc > 0) playCelebration();
    prevRevealed.current = rc;
  }, [ds.revealedCount]);


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

      {/* 🔊 Enable Sound — browsers require one click before audio can play */}
      {!soundOn && (
        <button onClick={enableSound}
          style={{ position:"absolute", bottom:24, right:24, zIndex:20, background:"rgba(245,197,24,0.15)", color:T.yellow, border:"2px solid rgba(245,197,24,0.5)", borderRadius:30, padding:"12px 26px", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, cursor:"pointer", backdropFilter:"blur(8px)", animation:"pulse2 2s ease-in-out infinite", letterSpacing:1 }}>
          🔊 Enable Sound
        </button>
      )}
      {soundOn && (
        <div style={{ position:"absolute", bottom:24, right:24, zIndex:20, color:"rgba(245,197,24,0.4)", fontFamily:"'DM Sans',sans-serif", fontSize:11, letterSpacing:1 }}>🔊 Sound on</div>
      )}

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
      {spinning && (()=>{
        // 5 ROLLING BOXES: each character of e.g. "SE001" gets its own slot box.
        // The display is ALWAYS a mix of SE001-SE300 + GV001-GV300 regardless of
        // which pool (employee/vip/both) the admin secretly chose — no one can tell.
        const raw = (localSpin || spinDisplay || "SE000").padEnd(5, "0").slice(0, 5);
        const chars = raw.split("");
        return (
          <div style={{ textAlign:"center", position:"relative", zIndex:2 }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.26)", letterSpacing:5, marginBottom:22, textTransform:"uppercase" }}>LUCKY DRAW</div>
            <div style={{ position:"relative", display:"inline-block", animation:"spinGlow 0.45s ease-in-out infinite alternate", borderRadius:22 }}>
              <div style={{ background:"linear-gradient(180deg,#1a1200 0%,#0d0a00 100%)", border:"3px solid rgba(245,197,24,0.65)", borderRadius:20, padding:"24px 36px", boxShadow:"0 0 70px rgba(245,197,24,0.32),inset 0 0 30px rgba(0,0,0,0.5)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:9 }}>
                  {chars.map((ch, i) => (
                    <React.Fragment key={i}>
                      {/* Divider between letters (SE/GV) and digits */}
                      {i === 2 && <div style={{ width:3, height:76, background:"rgba(245,197,24,0.22)", borderRadius:2, flexShrink:0 }} />}
                      <div style={{
                        width: i < 2 ? 68 : 74,
                        height: 116,
                        background:"linear-gradient(180deg,#2a1f00 0%,#1a1300 50%,#2a1f00 100%)",
                        border:"2px solid rgba(245,197,24,0.48)",
                        borderRadius:11,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        position:"relative", overflow:"hidden",
                        boxShadow:"inset 0 4px 12px rgba(0,0,0,0.55)",
                      }}>
                        {/* center line like a real slot reel */}
                        <div style={{ position:"absolute", top:"48%", left:0, right:0, height:2, background:"rgba(245,197,24,0.13)" }} />
                        {/* top/bottom shadows for reel depth */}
                        <div style={{ position:"absolute", top:0, left:0, right:0, height:24, background:"linear-gradient(180deg,rgba(0,0,0,0.55),transparent)", pointerEvents:"none" }} />
                        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:24, background:"linear-gradient(0deg,rgba(0,0,0,0.55),transparent)", pointerEvents:"none" }} />
                        <span style={{
                          fontFamily:"'Courier New',monospace",
                          fontSize: i < 2 ? 50 : 66,
                          fontWeight:900, color:T.yellow,
                          textShadow:"0 0 18px rgba(245,197,24,0.9)",
                          lineHeight:1,
                          animation:`digitFlip ${0.055 + i*0.015}s ease-in-out infinite`,
                        }}>{ch}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ marginTop:12, fontSize:9, color:"rgba(245,197,24,0.38)", letterSpacing:5, textTransform:"uppercase", textAlign:"center" }}>Registration ID</div>
              </div>
            </div>
          </div>
        );
      })()}

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

  // SECURITY: Admin session is NOT restored on refresh — must login again every time.
  // (sessionStorage restore removed per security requirement)

  // Handle URL hash for audience screen
  useEffect(()=>{
    if (window.location.hash==="#audience") setPage("draw-audience");
  },[]);

  const goAdmin = (view) => {
    if (!adminLoggedIn) { setPendingPage(view); setPage("login"); }
    else setPage(view);
  };
  const handleLogin = () => { setAdminLoggedIn(true); setPage(pendingPage||"admin"); setPendingPage(null); };
  const handleLogout = () => { setAdminLoggedIn(false); setPage("home"); };

  const navSetPage = (p) => {
    // Admin, Draw and QR Check-In all require admin login
    if (p==="admin"||p==="draw-admin"||p==="qr-scanner") goAdmin(p);
    else setPage(p);
  };

  const showNav = page!=="draw-audience" && page!=="login" && page!=="home" && page!=="invitation";

  return (
    <div style={{ minHeight:"100vh" }}>
      <FontLoader />
      {showNav && <Nav page={page} setPage={navSetPage} />}

      {page==="home"         && <HomePage    setPage={navSetPage} eventInfo={eventInfo} autoRole={urlRole} />}
      {page==="invitation" && <InvitationPage setPage={navSetPage} eventInfo={eventInfo} />}
      {page==="rsvp"         && <RSVPPage    employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} eventInfo={eventInfo} autoRole={urlRole==="employee"||urlRole==="vip"?urlRole:null} />}
      {page==="helpdesk"     && <HelpdeskPage employees={employees} setEmployees={setEmployees} tables={tables} />}
      {page==="qr-scanner"   && (adminLoggedIn
        ? <QRScannerPage employees={employees} setEmployees={setEmployees} tables={tables} />
        : <AdminLogin onLogin={handleLogin} />)}
      {page==="login"        && <AdminLogin  onLogin={handleLogin} />}
      {page==="admin"        && (adminLoggedIn
        ? <AdminDashboard employees={employees} setEmployees={setEmployees} tables={tables} setTables={setTables} prizes={prizes} setPrizes={setPrizes} winners={winners} eventInfo={eventInfo} setEventInfo={setEventInfo} onLogout={handleLogout} setPage={navSetPage} />
        : <AdminLogin onLogin={handleLogin} />)}
      {page==="draw-admin"   && (adminLoggedIn
        ? <DrawAdmin employees={employees} setEmployees={setEmployees} prizes={prizes} setPrizes={setPrizes} winners={winners} setWinners={setWinners} eventInfo={eventInfo} onLogout={handleLogout} setPage={setPage} />
        : <AdminLogin onLogin={handleLogin} />)}
      {page==="draw-audience" && <AudienceScreen eventInfo={eventInfo} />}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   TWILIO SERVERLESS FUNCTION — create this file in your Vercel project:
   📁 api/send-whatsapp.js
   ═══════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { to, contentVariables } = req.body;
  const sid   = "AC9279029bf0d6a18b0816666f87114b3e";
  const token = process.env.TWILIO_AUTH_TOKEN; // set in Vercel env settings
  const params = new URLSearchParams();
  params.append("To", "whatsapp:" + String(to).replace(/^whatsapp:/, ""));
  params.append("From", "whatsapp:+14155238886");
  params.append("ContentSid", "HXb5b62575e6e4ff6129ad7c8efe1f983e");
  params.append("ContentVariables", JSON.stringify(contentVariables || {}));
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
    },
    body: params,
  });
  const data = await r.json();
  if (data.sid) return res.status(200).json({ success: true, sid: data.sid });
  return res.status(400).json({ success: false, error: data.message });
}

   Then in Vercel: Settings → Environment Variables → add:
   TWILIO_AUTH_TOKEN = (your auth token from twilio.com/console)
   ═══════════════════════════════════════════════════════════════════════════ */
import React, { useState, useRef, useEffect } from "react";

/* ────────────────────────────────────────────────────────────────
   TRAVELFY — AI Travel Concierge
   Apple-minimal, live AI. Flights · Hotels · Umrah · Cancel · Refund.
   Rebrand via BRAND. Follows the real human booking sequence.
   ──────────────────────────────────────────────────────────────── */

const BRAND = { name: "Travelfy", handle: "AI Concierge" };

const SYSTEM = `You are the AI Travel Concierge for ${BRAND.name}, a travel booking app.
You book flights, hotels and Umrah/Hajj packages, and manage bookings (cancellations, refunds).
This is a live product demo — invent realistic inventory, prices, times and references. Behave as if fully connected; never say you can't access real data.

FOLLOW THE REAL HUMAN BOOKING SEQUENCE. Do not skip steps:
FLIGHTS  : 1) collect trip details you're missing (from, to, depart date, passengers, cabin) — use a "form" if several are missing, else ask one short question  2) show "flight_results" (max 4, cheapest & fastest noted in the reply)  3) after they pick, collect traveller with a "form" (Full name, Email, Phone)  4) collect payment with a "form" (Cardholder, Card number, Expiry, CVC)  5) issue "booking_confirmation" with a PT-XXXXXX reference and e-ticket lines.
HOTELS   : destination, check-in, check-out, guests → "hotel_results" → traveller "form" → payment "form" → "booking_confirmation".
UMRAH    : departure city, dates or duration, pax → "umrah_packages" → traveller "form" (add Passport no.) → payment "form" → "booking_confirmation".
CANCEL/REFUND : ask for the booking reference (or show their most recent) → "manage_booking" → on confirm, show "refund_summary" with honest penalty maths (fare paid − cancellation fee = refund), method and ETA.

STYLE: replies are calm and short (1–2 sentences), plain text, no markdown, no emoji. Prices in USD unless asked. One clear next step at a time.

ALWAYS reply with ONE JSON object and nothing else — no backticks, no text outside it:
{ "reply":"…", "widget": null | {"type":"…","data":{…}}, "quick_replies":["…"] }

Widgets:
- flight_results: {"options":[{"id","airline","flightNo","fromCode","toCode","depart","arrive","duration","stops","price","currency","tag"}]}   // tag optional: "Cheapest"/"Fastest"
- hotel_results:  {"options":[{"id","name","location","rating","pricePerNight","nights","total","currency","amenities":["Wi-Fi"]}]}
- umrah_packages: {"options":[{"id","name","nights","makkahHotel","madinahHotel","distance","price","currency","includes":["Visa"]}]}
- options: {"options":[{"id","title","subtitle","price","currency"}]}
- form:    {"title","fields":[{"name","label","type":"text|email|tel|date|number","placeholder"}],"submitLabel"}
- booking_confirmation: {"kind":"Flight|Hotel|Umrah","reference","status":"Confirmed","lines":[{"label","value"}],"total","currency"}
- manage_booking: {"reference","kind","title","date","status","price","currency","actions":["Cancel booking","Modify dates"]}
- refund_summary: {"reference","lines":[{"label","value"}],"refundAmount","currency","method","eta"}

Max 4 options so the JSON stays small. Only add a widget when it advances the booking.`;

const CSS = `
.tf *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
.tf{
  --blue:#007AFF;--blue-deep:#0060CC;--pale:#F2F8FE;--white:#FFFFFF;
  --ink:#0B1B2B;--ink-soft:rgba(11,27,43,0.5);--line:rgba(11,27,43,0.08);
  --gold:#FF9F0A;--bubble-in:#EDEFF2;--ok:#34C759;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Inter,Roboto,sans-serif;
  color:var(--ink);
  width:100%;
  height:100vh;height:100svh;height:100dvh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:clamp(8px,2vh,20px);padding:clamp(10px,2.5vh,30px) 16px;
  background:#DCE6EF;
  overflow:auto;
}
.tf-stage{display:flex;flex-direction:column;align-items:center;gap:clamp(8px,2vh,16px);
  height:100%;width:100%;justify-content:center;min-height:0}
/* ── iPhone frame ──
   Fully responsive: the frame's width is derived from whichever is
   smallest — its natural 384px design size, 92% of the viewport
   width, or the available viewport HEIGHT (minus the space the
   footnote/gaps/padding need) converted to width via the phone's
   true aspect ratio (384:830). Because the height-derived cap is
   computed from the *actual remaining* vertical space (not a fixed
   vh guess), the frame always fits fully on screen — short laptop
   windows, tall phones, browser chrome eating into the viewport,
   etc. — with no clipping and no separate fixed height to fight. */
.tf-phone{
  position:relative;
  flex:0 1 auto;
  width:min(384px,92vw,calc((100dvh - 90px) * (384 / 830)));
  aspect-ratio:384/830;
  max-height:100%;
  background:#0B0B0D;border-radius:56px;padding:14px;
  box-shadow:0 50px 90px -30px rgba(11,27,43,.55),0 0 0 2px rgba(255,255,255,.06) inset;
}
.tf-phone::before{content:"";position:absolute;left:-3px;top:14%;width:3px;height:3.4%;background:#161618;border-radius:2px 0 0 2px}
.tf-phone::after{content:"";position:absolute;left:-3px;top:20.5%;width:3px;height:6.3%;background:#161618;border-radius:2px 0 0 2px}
.tf-power{position:absolute;right:-3px;top:18%;width:3px;height:8.4%;background:#161618;border-radius:0 2px 2px 0}
.tf-screen{position:relative;width:100%;height:100%;background:var(--pale);border-radius:42px;overflow:hidden;display:flex;flex-direction:column}
.tf-island{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:100px;height:28px;background:#000;border-radius:20px;z-index:40}
/* status bar */
.tf-status{height:47px;flex:none;display:flex;align-items:flex-end;justify-content:space-between;padding:0 22px 6px;font-size:14px;font-weight:600;color:var(--ink);background:var(--white);z-index:30}
.tf-status .r{display:flex;align-items:center;gap:4px}
/* app header */
.tf-app{flex:1;display:flex;flex-direction:column;min-height:0;background:var(--white)}
.tf-head{flex:none;padding:18px 16px 16px;border-bottom:1px solid var(--line);
  display:flex;flex-direction:column;align-items:center;gap:6px;background:var(--white);z-index:20}
.tf-ava{width:56px;height:56px;border-radius:50%;background:#15171A;color:#fff;display:grid;place-items:center;flex:none}
.tf-hn{font-size:19px;font-weight:700;letter-spacing:-.2px;margin-top:2px}
.tf-hs{font-size:13px;color:var(--ink-soft);display:flex;align-items:center;gap:6px}
.tf-live{width:7px;height:7px;border-radius:50%;background:var(--ok);flex:none}
/* thread */
.tf-thread{flex:1;min-height:0;overflow-y:auto;padding:14px 12px 10px;display:flex;flex-direction:column;gap:10px;background:var(--white)}
.tf-thread::-webkit-scrollbar{width:0}
.tf-b{max-width:82%;font-size:15.5px;line-height:1.38;padding:9px 14px;border-radius:18px}
.tf-in{align-self:flex-start;background:var(--bubble-in);color:var(--ink);border-bottom-left-radius:5px}
.tf-out{align-self:flex-end;background:var(--blue);color:#fff;border-bottom-right-radius:5px}
.tf-fade{animation:tff .3s cubic-bezier(.22,.61,.36,1)}
@keyframes tff{from{opacity:0;transform:translateY(7px) scale(.98)}to{opacity:1;transform:none}}
/* cards */
.tf-w{align-self:flex-start;width:92%;display:flex;flex-direction:column;gap:8px}
.tf-card{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:12px 13px;
  box-shadow:0 1px 3px rgba(11,27,43,.06)}
.tf-tag{font-size:10.5px;font-weight:600;color:var(--blue);letter-spacing:.01em;margin-bottom:6px;display:inline-block}
.tf-flh{display:flex;justify-content:space-between;align-items:center;margin-bottom:11px}
.tf-air{font-size:13.5px;font-weight:600;letter-spacing:-.01em}
.tf-sub{font-size:11.5px;color:var(--ink-soft)}
.tf-route{display:flex;align-items:center;gap:12px}
.tf-node{text-align:center}
.tf-node .c{font-size:19px;font-weight:700;letter-spacing:-.02em}
.tf-node .t{font-size:11px;color:var(--ink-soft);margin-top:2px}
.tf-conn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.tf-conn .ln{width:100%;height:1px;background:var(--line);position:relative}
.tf-conn .ln svg{position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:#fff;padding:0 4px}
.tf-conn .d{font-size:10.5px;color:var(--ink-soft)}
.tf-flb{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:11px;border-top:1px solid var(--line)}
.tf-price{font-size:17px;font-weight:700;letter-spacing:-.02em;color:var(--blue-deep)}
.tf-price small{font-size:11px;font-weight:500;color:var(--ink-soft);letter-spacing:0}
.tf-pill{border:0;background:var(--blue);color:#fff;font-family:inherit;font-size:13px;font-weight:600;
  padding:9px 17px;border-radius:20px;cursor:pointer;transition:transform .1s,background .15s;letter-spacing:-.01em}
.tf-pill:active{transform:scale(.96)}
.tf-pill:hover{background:var(--blue-deep)}
.tf-pill:disabled{opacity:.4}
/* hotel/umrah */
.tf-htop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:9px}
.tf-hname{font-size:14.5px;font-weight:600;letter-spacing:-.01em;line-height:1.3}
.tf-hloc{font-size:12px;color:var(--ink-soft);margin-top:3px}
.tf-stars{font-size:11.5px;color:var(--gold);white-space:nowrap;font-weight:600}
.tf-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:2px}
.tf-chipmini{font-size:10.5px;color:var(--ink-soft);background:var(--pale);padding:4px 9px;border-radius:20px}
/* confirmation / refund */
.tf-vou{background:var(--white);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 4px 18px -10px rgba(11,27,43,.2)}
.tf-vtop{padding:15px 16px 13px;display:flex;align-items:center;gap:11px;border-bottom:1px solid var(--line)}
.tf-mark{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;flex:none}
.tf-vtop .kk{font-size:14px;font-weight:600;letter-spacing:-.01em}
.tf-vtop .rr{font-size:11.5px;color:var(--ink-soft);margin-top:2px;letter-spacing:.03em}
.tf-vbody{padding:13px 16px 15px;display:flex;flex-direction:column;gap:9px}
.tf-vl{display:flex;justify-content:space-between;gap:14px;font-size:13px}
.tf-vl .l{color:var(--ink-soft)}.tf-vl .v{font-weight:500;text-align:right;letter-spacing:-.01em}
.tf-vtot{display:flex;justify-content:space-between;align-items:center;margin-top:4px;padding-top:11px;border-top:1px solid var(--line)}
.tf-vtot .l{font-size:12px;color:var(--ink-soft)}
.tf-vtot .v{font-size:18px;font-weight:700;letter-spacing:-.02em;color:var(--blue-deep)}
.tf-badge{font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:20px}
.tf-badge.ok{color:var(--ok);background:rgba(52,199,89,.12)}
/* manage */
.tf-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:5px}
.tf-ghost{border:1.5px solid var(--blue);background:var(--white);color:var(--blue);font-family:inherit;font-size:12.5px;font-weight:600;
  padding:9px 15px;border-radius:20px;cursor:pointer;transition:.12s;letter-spacing:-.01em}
.tf-ghost:hover{background:var(--blue);color:#fff}
.tf-ghost.warn{border-color:#FF3B30;color:#FF3B30}
.tf-ghost.warn:hover{background:#FF3B30;color:#fff}
/* options */
.tf-opt{display:flex;justify-content:space-between;align-items:center;gap:10px;cursor:pointer}
.tf-opt .ott{font-size:13.5px;font-weight:600;letter-spacing:-.01em}
.tf-opt .ost{font-size:12px;color:var(--ink-soft);margin-top:2px}
/* form */
.tf-form{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:15px;display:flex;flex-direction:column;gap:11px}
.tf-ftitle{font-size:13px;font-weight:600;letter-spacing:-.01em;margin-bottom:1px}
.tf-field label{font-size:11px;color:var(--ink-soft);font-weight:500;display:block;margin-bottom:5px}
.tf-field input{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 12px;font-size:14px;
  font-family:inherit;color:var(--ink);outline:none;transition:.14s;background:var(--pale)}
.tf-field input:focus{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3.5px rgba(0,122,255,.12)}
.tf-field input::placeholder{color:var(--ink-soft)}
/* quick replies */
.tf-qr{align-self:flex-start;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;width:92%;margin:2px 0 4px}
.tf-qchip{border:1.5px solid var(--blue);background:var(--white);color:var(--blue);font-family:inherit;font-size:13.5px;font-weight:600;
  padding:11px 10px;border-radius:20px;text-align:center;cursor:pointer;transition:.14s;letter-spacing:-.01em;line-height:1.25}
.tf-qchip:hover,.tf-qchip:active{background:var(--blue);color:#fff}
/* typing */
.tf-typing{align-self:flex-start;background:var(--bubble-in);border-radius:18px;border-bottom-left-radius:5px;padding:12px 15px;display:flex;gap:4px}
.tf-typing i{width:6px;height:6px;border-radius:50%;background:var(--ink-soft);animation:tft 1.2s infinite ease-in-out}
.tf-typing i:nth-child(2){animation-delay:.15s}.tf-typing i:nth-child(3){animation-delay:.3s}
@keyframes tft{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
/* composer */
.tf-foot{flex:none;padding:8px 10px;background:var(--white);border-top:1px solid var(--line);display:flex;align-items:center;gap:8px}
.tf-foot input{flex:1;border:1px solid var(--line);background:var(--pale);border-radius:20px;padding:9px 16px;
  font-size:15px;font-family:inherit;outline:none;color:var(--ink);min-width:0}
.tf-foot input:focus{border-color:var(--blue)}
.tf-foot input::placeholder{color:var(--ink-soft)}
.tf-snd{width:34px;height:34px;border-radius:50%;border:0;background:var(--blue);color:#fff;cursor:pointer;flex:none;display:grid;place-items:center;transition:.12s}
.tf-snd:active{transform:scale(.92)}
.tf-snd:disabled{opacity:.4;cursor:default}
/* home indicator */
.tf-home{height:22px;flex:none;display:grid;place-items:center;background:var(--white)}
.tf-home i{width:120px;height:4px;border-radius:3px;background:var(--ink);opacity:.35}
.tf-foot-note{flex:none;font-size:clamp(10px,1.6vh,12px);color:var(--ink-soft, #8A8F98);letter-spacing:.01em;text-align:center}
.tf-foot-note b{color:#0B1B2B;font-weight:600}
@media (prefers-reduced-motion:reduce){.tf-fade,.tf-typing i{animation:none}.tf-pill:active,.tf-snd:active{transform:none}}
`;

/* tiny inline glyphs */
const Plane = ({ s = 13, c = "#007AFF" }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L11 19v-5.5z"/></svg>);
const Check = ({ s = 17 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>);
const Undo = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/></svg>);
const SendI = () => (<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M4 20L20 12L4 4L4 10L14 12L4 14L4 20Z" fill="white"/></svg>);
const Sig = () => (<svg width="17" height="11" viewBox="0 0 17 11" fill="none"><path d="M1 8L1 10L2 10L2 8L1 8Z" fill="currentColor"/><path d="M4.5 6L4.5 10L5.5 10L5.5 6L4.5 6Z" fill="currentColor"/><path d="M8 3.5L8 10L9 10L9 3.5L8 3.5Z" fill="currentColor"/><path d="M11.5 1L11.5 10L12.5 10L12.5 1L11.5 1Z" fill="currentColor"/></svg>);
const Wifi = () => (<svg width="15" height="11" viewBox="0 0 15 11" fill="none"><path d="M7.5 0C4.4 0 1.7 1.3 0 3.4L1.5 4.9C2.9 3.2 5.1 2.1 7.5 2.1C9.9 2.1 12.1 3.2 13.5 4.9L15 3.4C13.3 1.3 10.6 0 7.5 0Z" fill="currentColor" opacity="0.35"/><path d="M7.5 4C5.9 4 4.5 4.7 3.5 5.9L5 7.4C5.6 6.6 6.5 6.1 7.5 6.1C8.5 6.1 9.4 6.6 10 7.4L11.5 5.9C10.5 4.7 9.1 4 7.5 4Z" fill="currentColor"/></svg>);
const Batt = () => (<svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x="1" y="1" width="19" height="9" rx="2" stroke="currentColor" strokeOpacity="0.4"/><rect x="2.5" y="2.5" width="15" height="6" rx="1" fill="currentColor"/><rect x="21" y="3.5" width="1.5" height="4" rx="0.7" fill="currentColor" opacity="0.4"/></svg>);

const stars = (r) => "★".repeat(Math.max(0, Math.round(r || 4))) + (r ? "  " + r : "");
const money = (v, c) => v == null ? "" : ((c === "USD" || !c) ? "$" : "") + Number(v).toLocaleString() + ((c === "USD" || !c) ? "" : " " + c);

function safeParse(text) {
  if (!text) return { reply: "Sorry, could you say that again?", widget: null, quick_replies: [] };
  let t = text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s !== -1 && e !== -1) t = t.slice(s, e + 1);
  try { const o = JSON.parse(t); return { reply: o.reply || "", widget: o.widget || null, quick_replies: Array.isArray(o.quick_replies) ? o.quick_replies : [] }; }
  catch { return { reply: text.replace(/[{}"]/g, " ").slice(0, 400).trim(), widget: null, quick_replies: [] }; }
}

export default function App() {
  const intro = {
    role: "assistant", intro: true,
    text: `Hi, I'm your ${BRAND.name} concierge. I can book flights, hotels or an Umrah package — or handle a change or refund. Where are we headed?`,
    quick_replies: ["Book a flight", "Find a hotel", "Umrah package", "Cancel a booking"],
  };
  const [msgs, setMsgs] = useState([intro]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const thread = useRef(null);

  useEffect(() => { const el = thread.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [msgs, loading]);

  async function send(text) {
    const clean = (text || "").trim();
    if (!clean || loading) return;
    const next = [...msgs, { role: "user", text: clean }];
    setMsgs(next); setInput(""); setLoading(true);
    const history = next.filter((m) => !m.intro)
      .map((m) => ({ role: m.role, content: m.text || (m.role === "assistant" ? "(showed options)" : "…") }));
    try {
      // NOTE: this calls OUR OWN backend (/api/chat), which holds the real
      // Anthropic API key server-side and forwards the request. It does NOT
      // call api.anthropic.com directly from the browser.
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM, messages: history }),
      });
      const data = await res.json();
      const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const p = safeParse(txt);
      setMsgs((m) => [...m, { role: "assistant", text: p.reply, widget: p.widget, quick_replies: p.quick_replies }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "That didn't go through — please try again in a moment." }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="tf">
      <style>{CSS}</style>
      <div className="tf-stage">
        <div className="tf-phone">
          <div className="tf-power" />
          <div className="tf-screen">
            <div className="tf-island" />
            <div className="tf-status">
              <span>9:41</span>
              <span className="r"><Sig /><Wifi /><Batt /></span>
            </div>

            <div className="tf-app">
              <div className="tf-head">
                <div className="tf-ava"><Plane s={26} c="#fff" /></div>
                <div className="tf-hn">{BRAND.name}</div>
                <div className="tf-hs"><span className="tf-live" /> {BRAND.handle} · online</div>
              </div>

              <div className="tf-thread" ref={thread}>
                {msgs.map((m, i) => <Msg key={i} m={m} onAction={send} disabled={loading} />)}
                {loading && <div className="tf-typing tf-fade"><i /><i /><i /></div>}
              </div>

              <div className="tf-foot">
                <input value={input} placeholder="Message" disabled={loading}
                  onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} aria-label="Message" />
                <button className="tf-snd" onClick={() => send(input)} disabled={loading || !input.trim()} aria-label="Send"><SendI /></button>
              </div>
              <div className="tf-home"><i /></div>
            </div>
          </div>
        </div>
        <div className="tf-foot-note">Live AI demo · <b>{BRAND.name}</b> — white-label for any agency</div>
      </div>
    </div>
  );
}

function Msg({ m, onAction, disabled }) {
  const me = m.role === "user";
  return (
    <>
      {m.text && <div className={`tf-b ${me ? "tf-out" : "tf-in"} tf-fade`}>{m.text}</div>}
      {m.widget && <Widget w={m.widget} onAction={onAction} disabled={disabled} />}
      {!me && m.quick_replies?.length > 0 && (
        <div className="tf-qr tf-fade">
          {m.quick_replies.map((q, i) => <button key={i} className="tf-qchip" disabled={disabled} onClick={() => onAction(q)}>{q}</button>)}
        </div>
      )}
    </>
  );
}

function Widget({ w, onAction, disabled }) {
  const d = w.data || {};
  const act = (t) => !disabled && onAction(t);

  if (w.type === "flight_results") return (
    <div className="tf-w tf-fade">
      {(d.options || []).map((f) => (
        <div className="tf-card" key={f.id}>
          {f.tag && <span className="tf-tag">{f.tag}</span>}
          <div className="tf-flh"><span className="tf-air">{f.airline}</span><span className="tf-sub">{f.flightNo} · {f.stops}</span></div>
          <div className="tf-route">
            <div className="tf-node"><div className="c">{f.fromCode}</div><div className="t">{f.depart}</div></div>
            <div className="tf-conn"><div className="ln"><Plane s={13} /></div><div className="d">{f.duration}</div></div>
            <div className="tf-node"><div className="c">{f.toCode}</div><div className="t">{f.arrive}</div></div>
          </div>
          <div className="tf-flb">
            <span className="tf-price">{money(f.price, f.currency)} <small>total</small></span>
            <button className="tf-pill" disabled={disabled} onClick={() => act(`Select ${f.airline} ${f.flightNo}, ${f.fromCode}→${f.toCode} ${f.depart}, ${money(f.price, f.currency)}.`)}>Select</button>
          </div>
        </div>
      ))}
    </div>
  );

  if (w.type === "hotel_results") return (
    <div className="tf-w tf-fade">
      {(d.options || []).map((h) => (
        <div className="tf-card" key={h.id}>
          <div className="tf-htop">
            <div><div className="tf-hname">{h.name}</div><div className="tf-hloc">{h.location}</div></div>
            <div className="tf-stars">{stars(h.rating)}</div>
          </div>
          {h.amenities && <div className="tf-tags">{h.amenities.slice(0, 4).map((a, i) => <span className="tf-chipmini" key={i}>{a}</span>)}</div>}
          <div className="tf-flb">
            <span className="tf-price">{money(h.pricePerNight, h.currency)} <small>/ night{h.nights ? ` · ${money(h.total, h.currency)} total` : ""}</small></span>
            <button className="tf-pill" disabled={disabled} onClick={() => act(`Book ${h.name}${h.nights ? `, ${h.nights} nights` : ""}, ${money(h.total || h.pricePerNight, h.currency)}.`)}>Book</button>
          </div>
        </div>
      ))}
    </div>
  );

  if (w.type === "umrah_packages") return (
    <div className="tf-w tf-fade">
      {(d.options || []).map((p) => (
        <div className="tf-card" key={p.id}>
          <div className="tf-htop">
            <div><div className="tf-hname">{p.name}</div><div className="tf-hloc">{p.nights} nights{p.distance ? ` · ${p.distance} from Haram` : ""}</div></div>
            <span className="tf-price">{money(p.price, p.currency)}</span>
          </div>
          <div className="tf-tags">
            {p.makkahHotel && <span className="tf-chipmini">Makkah · {p.makkahHotel}</span>}
            {p.madinahHotel && <span className="tf-chipmini">Madinah · {p.madinahHotel}</span>}
            {(p.includes || []).slice(0, 2).map((x, i) => <span className="tf-chipmini" key={i}>{x}</span>)}
          </div>
          <div className="tf-flb">
            <span className="tf-sub">per person</span>
            <button className="tf-pill" disabled={disabled} onClick={() => act(`Book the ${p.name} package, ${p.nights} nights, ${money(p.price, p.currency)} pp.`)}>Book</button>
          </div>
        </div>
      ))}
    </div>
  );

  if (w.type === "options") return (
    <div className="tf-w tf-fade">
      {(d.options || []).map((o) => (
        <div className="tf-card tf-opt" key={o.id} onClick={() => act(`Choose: ${o.title}`)}>
          <div><div className="ott">{o.title}</div>{o.subtitle && <div className="ost">{o.subtitle}</div>}</div>
          {o.price != null && <span className="tf-price">{money(o.price, o.currency)}</span>}
        </div>
      ))}
    </div>
  );

  if (w.type === "form") return <FormW d={d} onAction={act} disabled={disabled} />;

  if (w.type === "booking_confirmation") return (
    <div className="tf-w tf-fade">
      <div className="tf-vou">
        <div className="tf-vtop">
          <div className="tf-mark" style={{ background: "var(--ok)" }}><Check /></div>
          <div><div className="kk">{d.kind || "Booking"} confirmed</div><div className="rr">Ref {d.reference}</div></div>
          <span className="tf-badge ok" style={{ marginLeft: "auto" }}>{d.status || "Confirmed"}</span>
        </div>
        <div className="tf-vbody">
          {(d.lines || []).map((l, i) => <div className="tf-vl" key={i}><span className="l">{l.label}</span><span className="v">{l.value}</span></div>)}
          <div className="tf-vtot"><span className="l">Total paid</span><span className="v">{money(d.total, d.currency)}</span></div>
        </div>
      </div>
    </div>
  );

  if (w.type === "manage_booking") return (
    <div className="tf-w tf-fade">
      <div className="tf-card">
        <div className="tf-htop">
          <div><div className="tf-hname">{d.title || d.kind}</div><div className="tf-hloc">{[d.kind, d.date].filter(Boolean).join(" · ")}</div></div>
          <span className="tf-badge ok">{d.status || "Active"}</span>
        </div>
        <div className="tf-vl"><span className="l">Reference</span><span className="v">{d.reference}</span></div>
        {d.price != null && <div className="tf-vl" style={{ marginTop: 6 }}><span className="l">Paid</span><span className="v">{money(d.price, d.currency)}</span></div>}
        <div className="tf-actions">
          {(d.actions || ["Cancel booking"]).map((a, i) => (
            <button key={i} className={`tf-ghost ${/cancel/i.test(a) ? "warn" : ""}`} disabled={disabled} onClick={() => act(`${a} for ${d.reference}.`)}>{a}</button>
          ))}
        </div>
      </div>
    </div>
  );

  if (w.type === "refund_summary") return (
    <div className="tf-w tf-fade">
      <div className="tf-vou">
        <div className="tf-vtop">
          <div className="tf-mark" style={{ background: "#1D1D1F" }}><Undo /></div>
          <div><div className="kk">Refund processed</div><div className="rr">Ref {d.reference}</div></div>
        </div>
        <div className="tf-vbody">
          {(d.lines || []).map((l, i) => <div className="tf-vl" key={i}><span className="l">{l.label}</span><span className="v">{l.value}</span></div>)}
          <div className="tf-vtot"><span className="l">Refund to {d.method || "original method"}{d.eta ? ` · ${d.eta}` : ""}</span><span className="v" style={{ color: "var(--ok)" }}>{money(d.refundAmount, d.currency)}</span></div>
        </div>
      </div>
    </div>
  );

  return null;
}

function FormW({ d, onAction, disabled }) {
  const [vals, setVals] = useState({});
  const fields = d.fields || [];
  const submit = () => onAction(fields.map((f) => `${f.label}: ${vals[f.name] || "—"}`).join(", "));
  return (
    <div className="tf-w tf-fade">
      <div className="tf-form">
        {d.title && <div className="tf-ftitle">{d.title}</div>}
        {fields.map((f, i) => (
          <div className="tf-field" key={i}>
            <label>{f.label}</label>
            <input type={f.type || "text"} placeholder={f.placeholder || ""} value={vals[f.name] || ""}
              disabled={disabled} onChange={(e) => setVals((v) => ({ ...v, [f.name]: e.target.value }))} />
          </div>
        ))}
        <button className="tf-pill" style={{ alignSelf: "flex-end", marginTop: 2 }} disabled={disabled} onClick={submit}>{d.submitLabel || "Continue"}</button>
      </div>
    </div>
  );
}

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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.tf *{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}
.tf{
  --ink:#1D1D1F;--ink2:#6E6E73;--line:#EBEBED;--hair:#F0F0F2;
  --accent:#007AFF;--accent-d:#0062CC;--ok:#34C759;--in:#E9E9EB;--app:#FFFFFF;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter',system-ui,sans-serif;
  color:var(--ink);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:20px;padding:30px 16px;
  background:radial-gradient(120% 90% at 50% 0%, #eef0f3 0%, #dfe2e7 55%, #d3d7dd 100%);
}
.tf-stage{display:flex;flex-direction:column;align-items:center;gap:16px}
/* ── iPhone frame ── */
.tf-phone{
  position:relative;width:min(384px,92vw);height:min(830px,90vh);
  background:#0A0A0C;border-radius:56px;padding:11px;
  box-shadow:0 2px 3px rgba(255,255,255,.35) inset,0 0 0 2px #23232a,
             0 50px 90px -30px rgba(20,24,32,.55),0 20px 40px -20px rgba(20,24,32,.4);
}
.tf-screen{position:relative;width:100%;height:100%;background:var(--app);border-radius:46px;overflow:hidden;display:flex;flex-direction:column}
.tf-island{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:118px;height:33px;background:#000;border-radius:20px;z-index:40}
/* status bar */
.tf-status{height:52px;flex:none;display:flex;align-items:flex-end;justify-content:space-between;padding:0 26px 7px;font-size:14px;font-weight:600;letter-spacing:.02em;z-index:30}
.tf-status .r{display:flex;align-items:center;gap:6px}
/* app header */
.tf-head{flex:none;padding:6px 18px 12px;border-bottom:1px solid var(--hair);
  display:flex;flex-direction:column;align-items:center;gap:5px;background:rgba(255,255,255,.85);backdrop-filter:blur(20px);z-index:20}
.tf-ava{width:44px;height:44px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center}
.tf-hn{font-size:15px;font-weight:600;letter-spacing:-.01em}
.tf-hs{font-size:11.5px;color:var(--ink2);display:flex;align-items:center;gap:5px;margin-top:-2px}
.tf-live{width:6px;height:6px;border-radius:50%;background:var(--ok)}
/* thread */
.tf-thread{flex:1;overflow-y:auto;padding:16px 16px 6px;display:flex;flex-direction:column;gap:9px;background:var(--app)}
.tf-thread::-webkit-scrollbar{width:0}
.tf-b{max-width:78%;font-size:15px;line-height:1.42;padding:9px 14px;border-radius:20px;letter-spacing:-.01em}
.tf-in{align-self:flex-start;background:var(--in);color:var(--ink);border-bottom-left-radius:7px}
.tf-out{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:7px}
.tf-fade{animation:tff .3s cubic-bezier(.22,.61,.36,1)}
@keyframes tff{from{opacity:0;transform:translateY(7px) scale(.98)}to{opacity:1;transform:none}}
/* cards */
.tf-w{align-self:flex-start;width:88%;display:flex;flex-direction:column;gap:8px}
.tf-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px 15px;
  box-shadow:0 1px 2px rgba(20,24,32,.04)}
.tf-tag{font-size:10.5px;font-weight:600;color:var(--accent);letter-spacing:.01em;margin-bottom:6px;display:inline-block}
.tf-flh{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.tf-air{font-size:13px;font-weight:600;letter-spacing:-.01em}
.tf-sub{font-size:11.5px;color:var(--ink2)}
.tf-route{display:flex;align-items:center;gap:12px}
.tf-node{text-align:center}
.tf-node .c{font-size:19px;font-weight:700;letter-spacing:-.02em}
.tf-node .t{font-size:11px;color:var(--ink2);margin-top:2px}
.tf-conn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.tf-conn .ln{width:100%;height:1px;background:var(--line);position:relative}
.tf-conn .ln svg{position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:#fff;padding:0 4px}
.tf-conn .d{font-size:10.5px;color:var(--ink2)}
.tf-flb{display:flex;justify-content:space-between;align-items:center;margin-top:13px;padding-top:12px;border-top:1px solid var(--hair)}
.tf-price{font-size:18px;font-weight:700;letter-spacing:-.02em}
.tf-price small{font-size:11px;font-weight:500;color:var(--ink2);letter-spacing:0}
.tf-pill{border:0;background:var(--accent);color:#fff;font-family:inherit;font-size:13px;font-weight:600;
  padding:8px 17px;border-radius:980px;cursor:pointer;transition:transform .1s,background .15s;letter-spacing:-.01em}
.tf-pill:active{transform:scale(.96)}
.tf-pill:hover{background:var(--accent-d)}
.tf-pill:disabled{opacity:.4}
/* hotel/umrah */
.tf-htop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:9px}
.tf-hname{font-size:14.5px;font-weight:600;letter-spacing:-.01em;line-height:1.3}
.tf-hloc{font-size:12px;color:var(--ink2);margin-top:3px}
.tf-stars{font-size:11px;color:#F5A623;white-space:nowrap;font-weight:600}
.tf-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:2px}
.tf-chipmini{font-size:10.5px;color:var(--ink2);background:#F5F5F7;padding:4px 9px;border-radius:980px}
/* confirmation / refund */
.tf-vou{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 4px 18px -10px rgba(20,24,32,.2)}
.tf-vtop{padding:15px 16px 13px;display:flex;align-items:center;gap:11px;border-bottom:1px solid var(--hair)}
.tf-mark{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;flex:none}
.tf-vtop .kk{font-size:14px;font-weight:600;letter-spacing:-.01em}
.tf-vtop .rr{font-size:11.5px;color:var(--ink2);margin-top:2px;letter-spacing:.03em}
.tf-vbody{padding:13px 16px 15px;display:flex;flex-direction:column;gap:9px}
.tf-vl{display:flex;justify-content:space-between;gap:14px;font-size:13px}
.tf-vl .l{color:var(--ink2)}.tf-vl .v{font-weight:500;text-align:right;letter-spacing:-.01em}
.tf-vtot{display:flex;justify-content:space-between;align-items:center;margin-top:4px;padding-top:11px;border-top:1px solid var(--hair)}
.tf-vtot .l{font-size:12px;color:var(--ink2)}
.tf-vtot .v{font-size:18px;font-weight:700;letter-spacing:-.02em}
.tf-badge{font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:980px}
.tf-badge.ok{color:var(--ok);background:rgba(52,199,89,.12)}
/* manage */
.tf-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:5px}
.tf-ghost{border:1px solid var(--line);background:#fff;color:var(--ink);font-family:inherit;font-size:12.5px;font-weight:600;
  padding:9px 15px;border-radius:980px;cursor:pointer;transition:.12s;letter-spacing:-.01em}
.tf-ghost:hover{background:#F5F5F7}
.tf-ghost.warn{color:#FF3B30}
.tf-ghost.warn:hover{background:rgba(255,59,48,.08)}
/* options */
.tf-opt{display:flex;justify-content:space-between;align-items:center;gap:10px;cursor:pointer}
.tf-opt .ott{font-size:13.5px;font-weight:600;letter-spacing:-.01em}
.tf-opt .ost{font-size:12px;color:var(--ink2);margin-top:2px}
/* form */
.tf-form{background:#fff;border:1px solid var(--line);border-radius:18px;padding:15px;display:flex;flex-direction:column;gap:11px}
.tf-ftitle{font-size:13px;font-weight:600;letter-spacing:-.01em;margin-bottom:1px}
.tf-field label{font-size:11px;color:var(--ink2);font-weight:500;display:block;margin-bottom:5px}
.tf-field input{width:100%;border:1px solid var(--line);border-radius:11px;padding:11px 12px;font-size:14px;
  font-family:inherit;color:var(--ink);outline:none;transition:.14s;background:#FBFBFC}
.tf-field input:focus{border-color:var(--accent);background:#fff;box-shadow:0 0 0 3.5px rgba(0,122,255,.12)}
.tf-field input::placeholder{color:#B7B7BC}
/* quick replies */
.tf-qr{align-self:flex-start;display:flex;flex-wrap:wrap;gap:7px;margin:3px 0 4px 2px}
.tf-qchip{border:1px solid var(--accent);background:#fff;color:var(--accent);font-family:inherit;font-size:13px;font-weight:500;
  padding:7px 14px;border-radius:980px;cursor:pointer;transition:.14s;letter-spacing:-.01em}
.tf-qchip:hover{background:var(--accent);color:#fff}
/* typing */
.tf-typing{align-self:flex-start;background:var(--in);border-radius:20px;border-bottom-left-radius:7px;padding:13px 15px;display:flex;gap:5px}
.tf-typing i{width:7px;height:7px;border-radius:50%;background:#B0B0B6;animation:tft 1.15s infinite}
.tf-typing i:nth-child(2){animation-delay:.14s}.tf-typing i:nth-child(3){animation-delay:.28s}
@keyframes tft{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}
/* composer */
.tf-foot{flex:none;padding:8px 14px 8px;background:rgba(255,255,255,.9);backdrop-filter:blur(20px);border-top:1px solid var(--hair)}
.tf-inp{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:980px;padding:5px 5px 5px 16px}
.tf-inp:focus-within{border-color:#D7D7DB}
.tf-inp input{flex:1;border:0;outline:none;background:transparent;font-size:15px;font-family:inherit;color:var(--ink);padding:6px 0;letter-spacing:-.01em}
.tf-inp input::placeholder{color:#B0B0B6}
.tf-snd{width:33px;height:33px;border-radius:50%;border:0;background:var(--accent);color:#fff;cursor:pointer;flex:none;display:grid;place-items:center;transition:.12s}
.tf-snd:active{transform:scale(.92)}
.tf-snd:disabled{background:#D7D7DB;cursor:default}
/* home indicator */
.tf-home{height:22px;flex:none;display:grid;place-items:center;background:rgba(255,255,255,.9)}
.tf-home i{width:128px;height:5px;border-radius:980px;background:#1D1D1F}
.tf-foot-note{font-size:12px;color:#8A8F98;letter-spacing:.01em}
.tf-foot-note b{color:#4A4E57;font-weight:600}
@media (prefers-reduced-motion:reduce){.tf-fade,.tf-typing i{animation:none}.tf-pill:active,.tf-snd:active{transform:none}}
`;

/* tiny inline glyphs */
const Plane = ({ s = 13, c = "#007AFF" }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L11 19v-5.5z"/></svg>);
const Check = ({ s = 17 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>);
const Undo = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/></svg>);
const SendI = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>);
const Sig = () => (<svg width="17" height="11" viewBox="0 0 18 12" fill="#1D1D1F"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>);
const Wifi = () => (<svg width="16" height="12" viewBox="0 0 16 12" fill="#1D1D1F"><path d="M8 11.2 9.9 9A2.6 2.6 0 0 0 8 8.2 2.6 2.6 0 0 0 6.1 9zM8 2.2c2.3 0 4.4.9 6 2.4l-1.3 1.5A6.6 6.6 0 0 0 8 4.2 6.6 6.6 0 0 0 3.3 6.1L2 4.6A8.6 8.6 0 0 1 8 2.2z"/><path d="M8 5.2c1.5 0 2.9.6 3.9 1.6L10.6 8.3A3.7 3.7 0 0 0 8 7.2a3.7 3.7 0 0 0-2.6 1.1L4.1 6.8A5.6 5.6 0 0 1 8 5.2z"/></svg>);
const Batt = () => (<svg width="26" height="12" viewBox="0 0 26 12"><rect x="1" y="1" width="21" height="10" rx="3" fill="none" stroke="#1D1D1F" strokeOpacity=".4"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.6" fill="#1D1D1F"/><rect x="23" y="4" width="2" height="4" rx="1" fill="#1D1D1F" fillOpacity=".4"/></svg>);

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
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: SYSTEM, messages: history }),
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
          <div className="tf-screen">
            <div className="tf-island" />
            <div className="tf-status">
              <span>9:41</span>
              <span className="r"><Sig /><Wifi /><Batt /></span>
            </div>

            <div className="tf-head">
              <div className="tf-ava"><Plane s={19} c="#fff" /></div>
              <div className="tf-hn">{BRAND.name}</div>
              <div className="tf-hs"><span className="tf-live" /> {BRAND.handle} · online</div>
            </div>

            <div className="tf-thread" ref={thread}>
              {msgs.map((m, i) => <Msg key={i} m={m} onAction={send} disabled={loading} />)}
              {loading && <div className="tf-typing tf-fade"><i /><i /><i /></div>}
            </div>

            <div className="tf-foot">
              <div className="tf-inp">
                <input value={input} placeholder="Message" disabled={loading}
                  onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} aria-label="Message" />
                <button className="tf-snd" onClick={() => send(input)} disabled={loading || !input.trim()} aria-label="Send"><SendI /></button>
              </div>
            </div>
            <div className="tf-home"><i /></div>
          </div>
        </div>
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

import { useState, useEffect, useCallback, useRef } from "react";

const SURL = "https://pdllrsezowkvhdufoowl.supabase.co";
const SKEY = "sb_publishable_flo0bbWwp5HpuAR8Oo14sw_VE5RgkqB";

const api = async (path, method = "GET", body = null) => {
  const headers = {
    "apikey": SKEY,
    "Authorization": `Bearer ${SKEY}`,
    "Content-Type": "application/json",
  };
  if (method === "POST" || method === "PATCH") headers["Prefer"] = "return=representation";
  const res = await fetch(`${SURL}/rest/v1/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : null,
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(txt);
  return txt ? JSON.parse(txt) : null;
};

const dbGet  = (t, q = "") => api(`${t}?${q}&order=created_at.desc`);
const dbPost = (t, d)       => api(t, "POST", d);
const dbPatch= (t, id, d)   => api(`${t}?id=eq.${id}`, "PATCH", d);
const dbDel  = (t, id)      => api(`${t}?id=eq.${id}`, "DELETE");

const ls     = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch { return d; } };
const lsSave = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const uid  = () => Math.random().toString(36).slice(2, 9);
const fmt  = v => v ? new Date(v).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const ini  = (n = "", a = "") => ((n[0] || "") + (a[0] || "")).toUpperCase();
const G    = "#2d7a22";
const MESES  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const ICONOS = ["ti-star","ti-star-half","ti-crown","ti-trophy","ti-diamond","ti-medal","ti-award","ti-flame","ti-bolt","ti-heart","ti-shield","ti-rocket"];

const NV_DEF = [
  { id:"nv1", nombre:"Hilachero",           color:"#cd7f32", min_visitas:0,  max_visitas:4,   icono:"ti-star",      beneficios:"Bienvenida, descuento 10% cumpleaños" },
  { id:"nv2", nombre:"Hilachero Frecuente", color:"#7a9ab0", min_visitas:5,  max_visitas:14,  icono:"ti-star-half",  beneficios:"Descuento 10%, postre gratis cumpleaños" },
  { id:"nv3", nombre:"Hilachero VIP",       color:"#d4af37", min_visitas:15, max_visitas:29,  icono:"ti-crown",     beneficios:"Descuento 20%, mesa reservada" },
  { id:"nv4", nombre:"Hilachero Legendario",color:"#7b2fbe", min_visitas:30, max_visitas:999, icono:"ti-trophy",    beneficios:"Descuento 25%, VIP total" },
];
const RC_DEF = [
  { id:"rc1", nombre:"Descuento 10%", puntos:100, tipo:"Descuento", descripcion:"10% desc. próxima visita" },
  { id:"rc2", nombre:"Postre gratis", puntos:80,  tipo:"Cortesía",  descripcion:"Postre a elección" },
  { id:"rc3", nombre:"Bebida gratis", puntos:60,  tipo:"Cortesía",  descripcion:"Bebida a elección" },
];

const getNv = (vis, nvs) => {
  const s = [...nvs].sort((a, b) => a.min_visitas - b.min_visitas);
  return s.slice().reverse().find(n => vis >= n.min_visitas) || s[0];
};

const theme = (dark) => ({
  dark,
  bg0: dark ? "#0f1a0f" : "#f2f6f2",
  bg1: dark ? "#182018" : "#ffffff",
  bg2: dark ? "#1e281e" : "#f8fdf8",
  bdr: dark ? "#2a3a2a" : "#e0eae0",
  t0:  dark ? "#d4e8d4" : "#1a2e1a",
  t1:  dark ? "#7aaa7a" : "#4a6a4a",
  t2:  dark ? "#4a6a4a" : "#8aaa8a",
  GL:  dark ? "#1a3a14" : "#e4f4de",
});

/* ── atoms ─────────────────────────────────────────────── */
const Btn = ({ onClick, v = "out", sm, children, style = {}, disabled = false }) => {
  const col = v === "pri" ? { background: G, color: "#fff", border: "none" }
    : v === "red" ? { background: "transparent", color: "#c0392b", border: "1px solid #e8c0bd" }
    : { background: "transparent", color: "#4a6a4a", border: "1px solid #c0d8c0" };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display:"inline-flex", alignItems:"center", gap:6, borderRadius:8, cursor: disabled ? "not-allowed" : "pointer",
        fontWeight:500, fontSize: sm ? 12 : 13, padding: sm ? "5px 10px" : "8px 14px",
        transition:"all .15s", opacity: disabled ? .6 : 1, ...col, ...style }}>
      {children}
    </button>
  );
};
const Bdg = ({ children, bg, color }) => (
  <span style={{ display:"inline-block", padding:"3px 8px", borderRadius:20, fontSize:11, fontWeight:600, background:bg, color }}>{children}</span>
);
const Av = ({ n, a, size = 32, bg = "#e4f4de" }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color:G,
    display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.34, fontWeight:700, flexShrink:0 }}>
    {ini(n, a)}
  </div>
);
const KPI = ({ label, val, sub, th }) => (
  <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:16 }}>
    <div style={{ fontSize:11, color:th.t2, textTransform:"uppercase", letterSpacing:.5, marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:700, color:th.t0 }}>{val}</div>
    {sub && <div style={{ fontSize:11, color:G, marginTop:4 }}>{sub}</div>}
  </div>
);
const TH_ = ({ children, th }) => (
  <th style={{ textAlign:"left", fontSize:11, fontWeight:600, color:th.t2, textTransform:"uppercase",
    letterSpacing:.4, padding:"8px 12px", borderBottom:`1px solid ${th.bdr}` }}>{children}</th>
);
const TD_ = ({ children, th, sx = {} }) => (
  <td style={{ padding:"11px 12px", borderBottom:`1px solid ${th.bdr}20`, fontSize:13, verticalAlign:"middle", ...sx }}>{children}</td>
);
const Inp = ({ value, onChange, type = "text", placeholder = "", th }) => (
  <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder}
    style={{ width:"100%", padding:"8px 12px", border:`1px solid ${th.bdr}`, borderRadius:8,
      fontSize:13, outline:"none", background:th.bg2, color:th.t0 }} />
);
const Sel = ({ value, onChange, children, th }) => (
  <select value={value || ""} onChange={onChange}
    style={{ width:"100%", padding:"8px 12px", border:`1px solid ${th.bdr}`, borderRadius:8,
      fontSize:13, outline:"none", background:th.bg2, color:th.t0, cursor:"pointer" }}>
    {children}
  </select>
);
const Txa = ({ value, onChange, rows = 3, th }) => (
  <textarea value={value || ""} onChange={onChange} rows={rows}
    style={{ width:"100%", padding:"8px 12px", border:`1px solid ${th.bdr}`, borderRadius:8,
      fontSize:13, outline:"none", background:th.bg2, color:th.t0, resize:"vertical" }} />
);
const Fld = ({ label, children }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#4a6a4a", marginBottom:5 }}>{label}</label>
    {children}
  </div>
);
const R2 = ({ children }) => <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>{children}</div>;

function Modal({ onClose, title, children, th, maxW = 560 }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex",
        alignItems:"center", justifyContent:"center", zIndex:100, padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:th.bg1, borderRadius:16, width:"100%", maxWidth:maxW, maxHeight:"90vh", overflowY:"auto", padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:600, color:th.t0 }}>{title}</span>
          <Btn onClick={onClose} sm><i className="ti ti-x" /></Btn>
        </div>
        {children}
      </div>
    </div>
  );
}

function NvBdg({ vis, nvs }) {
  const nv = getNv(vis, nvs);
  return (
    <Bdg bg={nv.color + "22"} color={nv.color}>
      <i className={`ti ${nv.icono || "ti-star"}`} style={{ marginRight:4, fontSize:10 }} />{nv.nombre}
    </Bdg>
  );
}

/* ── PIN Login ──────────────────────────────────────────── */
function PinLogin({ onLogin, cfg, th }) {
  const [pin, setPin]       = useState("");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!pin) { setErr("Ingresa tu código de acceso."); return; }
    setLoading(true); setErr("");
    try {
      const rows = await dbGet("configuracion_seguridad", "select=pin&limit=1");
      const pinBD = rows?.[0]?.pin || "1300";
      if (pin === pinBD) {
        lsSave("lh_sesion", true);
        onLogin();
      } else {
        setErr("El código ingresado no es correcto.");
        setPin("");
        inputRef.current?.focus();
      }
    } catch {
      if (pin === "1300") { lsSave("lh_sesion", true); onLogin(); }
      else { setErr("El código ingresado no es correcto."); setPin(""); }
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        background:th.bg0, padding:20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .pin-btn:hover{opacity:.88}`}</style>
      <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:24,
          padding:44, width:"100%", maxWidth:360, textAlign:"center" }}>
        {cfg?.logo
          ? <img src={cfg.logo} alt="logo" style={{ height:64, objectFit:"contain", marginBottom:20 }} />
          : (
            <div style={{ width:72, height:72, borderRadius:20, background:th.GL,
                display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <i className="ti ti-building-store" style={{ fontSize:34, color:G }} />
            </div>
          )
        }
        <div style={{ fontWeight:800, fontSize:20, color:G, letterSpacing:-.3 }}>
          {cfg?.nombre || "La Hilacha"}
        </div>
        <div style={{ fontSize:12, color:th.t2, marginTop:4, marginBottom:32, textTransform:"uppercase", letterSpacing:1 }}>
          CRM · Fidelización
        </div>

        <div style={{ fontSize:13, color:th.t1, fontWeight:500, marginBottom:10, textAlign:"left" }}>
          Código de acceso
        </div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={e => { setPin(e.target.value); setErr(""); }}
          onKeyDown={handleKey}
          placeholder="••••"
          style={{ width:"100%", padding:"13px 16px", border:`1.5px solid ${err ? "#e74c3c" : th.bdr}`,
            borderRadius:10, fontSize:22, outline:"none", background:th.bg2, color:th.t0,
            textAlign:"center", letterSpacing:6, marginBottom:err ? 8 : 16 }}
        />
        {err && (
          <div style={{ background:th.dark?"#3a1010":"#fde8e8", color:"#c0392b",
              padding:"9px 12px", borderRadius:8, fontSize:13, marginBottom:14, textAlign:"left" }}>
            <i className="ti ti-alert-circle" style={{ marginRight:6 }} />{err}
          </div>
        )}
        <button onClick={handleLogin} disabled={loading} className="pin-btn"
          style={{ width:"100%", padding:"13px", borderRadius:10, background:G, color:"#fff",
            border:"none", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center", gap:8, opacity: loading ? .7 : 1 }}>
          {loading
            ? <><i className="ti ti-loader" style={{ animation:"spin .8s linear infinite" }} />Verificando…</>
            : <><i className="ti ti-login" />Ingresar</>}
        </button>
      </div>
    </div>
  );
}

/* ── App ────────────────────────────────────────────────── */
export default function App() {
  const [dark, setDark]       = useState(() => ls("lh_dk", false));
  const [sesion, setSesion]   = useState(false);
  const [page, setPage]       = useState("dashboard");
  const [clientes, setClientes] = useState([]);
  const [promos, setPromos]   = useState([]);
  const [movs, setMovs]       = useState([]);
  const [nvs, setNvs]         = useState(NV_DEF);
  const [recs, setRecs]       = useState(RC_DEF);
  const [cfg, setCfg]         = useState({ nombre:"La Hilacha", logo:"", puntos_x_visita:25, puntos_x_peso:1 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState({ msg:"", show:false, err:false });
  const [notifOpen, setNotifOpen] = useState(false);
  const tRef = useRef();
  const th = theme(dark);

  const toast$ = useCallback((msg, err = false) => {
    setToast({ msg, show:true, err });
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToast(t => ({ ...t, show:false })), 2800);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p, m, n, r, cfgArr] = await Promise.all([
        dbGet("clientes", "select=*"),
        dbGet("promociones", "select=*"),
        dbGet("movimientos", "select=*"),
        dbGet("niveles", "select=*&order=min_visitas.asc"),
        dbGet("recompensas", "select=*&order=puntos.asc"),
        dbGet("configuracion", "select=*&limit=1"),
      ]);
      setClientes(c || []);
      setPromos(p || []);
      setMovs(m || []);
      if (n?.length) setNvs(n);
      if (r?.length) setRecs(r);
      if (cfgArr?.length) setCfg(cfgArr[0]);
    } catch(e) {
      const msg = e?.message || JSON.stringify(e) || "Error desconocido";
      toast$("Error: " + msg.slice(0, 120), true);
    }
    finally { setLoading(false); }
  }, [toast$]);

  useEffect(() => { if (sesion) loadAll(); }, [sesion, loadAll]);
  useEffect(() => { lsSave("lh_dk", dark); }, [dark]);

  const addMov = async (clienteId, tipo, puntos, descripcion) => {
    const m = { cliente_id:clienteId, tipo, puntos, descripcion, fecha:new Date().toISOString().slice(0,10) };
    try { const [c] = await dbPost("movimientos", m); setMovs(p => [c, ...p]); }
    catch { setMovs(p => [{ ...m, id:uid() }, ...p]); }
  };

  const logout = () => { localStorage.removeItem("lh_sesion"); setSesion(false); setPage("dashboard"); };

  if (!sesion) return <PinLogin onLogin={() => setSesion(true)} cfg={cfg} th={th} />;

  const mesAct  = new Date().getMonth();
  const cumples = clientes.filter(c => c.nacimiento && new Date(c.nacimiento).getMonth() === mesAct);
  const notifs  = [
    ...cumples.map(c => ({ id:"b"+c.id, icon:"ti-cake",  text:`Cumpleaños: ${c.nombre}`, color:"#d4af37" })),
    ...clientes.filter(c => c.puntos > 500).map(c => ({ id:"p"+c.id, icon:"ti-star", text:`${c.nombre} tiene ${c.puntos} pts`, color:"#7b2fbe" })),
  ].slice(0, 8);

  const nav = [
    { id:"dashboard",    icon:"ti-layout-dashboard", label:"Dashboard" },
    { id:"clientes",     icon:"ti-users",            label:"Clientes" },
    { id:"promociones",  icon:"ti-speakerphone",     label:"Promociones" },
    { id:"lealtad",      icon:"ti-star",             label:"Pa' Hilacheros" },
    { id:"configuracion",icon:"ti-settings",         label:"Configuración" },
  ];

  const shared = { clientes, setClientes, promos, setPromos, movs, setMovs, addMov,
    toast$, cfg, setCfg, nvs, setNvs, recs, setRecs, loadAll, th };

  if (loading && !clientes.length) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh",
        background:th.bg0, flexDirection:"column", gap:16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, border:`3px solid ${th.GL}`, borderTopColor:G,
          borderRadius:"50%", animation:"spin .8s linear infinite" }} />
      <div style={{ color:th.t1, fontSize:14 }}>Cargando La Hilacha…</div>
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:th.bg0, color:th.t0,
        fontFamily:"system-ui,sans-serif", fontSize:14 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {notifOpen && <div style={{ position:"fixed", inset:0, zIndex:89 }} onClick={() => setNotifOpen(false)} />}

      {/* Sidebar */}
      <div style={{ width:220, background:th.bg1, borderRight:`1px solid ${th.bdr}`, display:"flex",
          flexDirection:"column", height:"100vh", position:"sticky", top:0, flexShrink:0 }}>
        <div style={{ padding:"20px 16px 12px", borderBottom:`1px solid ${th.bdr}` }}>
          {cfg.logo
            ? <img src={cfg.logo} alt="logo" style={{ height:36, objectFit:"contain", display:"block", marginBottom:6 }} />
            : null}
          <div style={{ fontWeight:700, fontSize:17, color:G }}>{cfg.nombre}</div>
          <div style={{ fontSize:10, color:th.t2, marginTop:3 }}>CRM Fidelización</div>
        </div>
        <div style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
          {nav.map(n => (
            <div key={n.id} onClick={() => setPage(n.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8,
                cursor:"pointer", marginBottom:2,
                background: page === n.id ? th.GL : "transparent",
                color: page === n.id ? G : th.t1,
                fontWeight: page === n.id ? 600 : 500, fontSize:13, transition:"all .15s" }}>
              <i className={`ti ${n.icon}`} style={{ fontSize:16, width:20, textAlign:"center" }} />{n.label}
            </div>
          ))}
        </div>
        <div style={{ padding:"12px 8px", borderTop:`1px solid ${th.bdr}` }}>
          <div onClick={logout}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8,
              cursor:"pointer", color:"#c0392b", fontSize:13 }}>
            <i className="ti ti-logout" style={{ fontSize:16 }} />Cerrar sesión
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <div style={{ background:th.bg1, borderBottom:`1px solid ${th.bdr}`, padding:"12px 20px",
            display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:30 }}>
          <span style={{ fontWeight:600, fontSize:17, color:th.t0 }}>{nav.find(n => n.id === page)?.label}</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:th.t2 }}>
              {new Date().toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" })}
            </span>
            <button onClick={loadAll}
              style={{ background:"none", border:`1px solid ${th.bdr}`, borderRadius:8,
                padding:"6px 10px", cursor:"pointer", color:th.t1, fontSize:16 }}>
              <i className="ti ti-refresh" />
            </button>
            <div style={{ position:"relative" }}>
              <button onClick={() => setNotifOpen(!notifOpen)}
                style={{ background:"none", border:`1px solid ${th.bdr}`, borderRadius:8,
                  padding:"6px 10px", cursor:"pointer", color:th.t1, fontSize:16, position:"relative" }}>
                <i className="ti ti-bell" />
                {notifs.length > 0 && (
                  <span style={{ position:"absolute", top:4, right:4, width:7, height:7,
                    borderRadius:"50%", background:"#e74c3c" }} />
                )}
              </button>
              {notifOpen && (
                <div style={{ position:"absolute", right:0, top:42, width:290, background:th.bg1,
                    border:`1px solid ${th.bdr}`, borderRadius:12, zIndex:90, overflow:"hidden" }}>
                  <div style={{ padding:"10px 14px", borderBottom:`1px solid ${th.bdr}`,
                      fontWeight:600, fontSize:13, color:th.t0 }}>Notificaciones</div>
                  {notifs.length === 0 && (
                    <div style={{ padding:20, textAlign:"center", color:th.t2, fontSize:13 }}>Sin notificaciones</div>
                  )}
                  {notifs.map(n => (
                    <div key={n.id} style={{ padding:"9px 14px", borderBottom:`1px solid ${th.bdr}`, display:"flex", gap:10 }}>
                      <i className={`ti ${n.icon}`} style={{ color:n.color, fontSize:15, marginTop:2 }} />
                      <span style={{ fontSize:12, color:th.t1 }}>{n.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setDark(!dark)}
              style={{ background:"none", border:`1px solid ${th.bdr}`, borderRadius:8,
                padding:"6px 10px", cursor:"pointer", color:th.t1, fontSize:16 }}>
              <i className={`ti ti-${dark ? "sun" : "moon"}`} />
            </button>
          </div>
        </div>
        <div style={{ flex:1, padding:24, overflowY:"auto" }}>
          {page === "dashboard"     && <Dashboard {...shared} />}
          {page === "clientes"      && <Clientes {...shared} />}
          {page === "promociones"   && <Promociones {...shared} />}
          {page === "lealtad"       && <Lealtad {...shared} />}
          {page === "configuracion" && <Configuracion {...shared} />}
        </div>
      </div>

      <div style={{ position:"fixed", bottom:22, right:22,
          background: toast.err ? "#c0392b" : dark ? "#1a4a1a" : "#1a2e1a",
          color:"#fff", padding:"10px 16px", borderRadius:10, fontSize:13, zIndex:200,
          display:"flex", alignItems:"center", gap:8,
          opacity: toast.show ? 1 : 0, transform: toast.show ? "translateY(0)" : "translateY(10px)",
          transition:"all .25s", pointerEvents:"none" }}>
        <i className={`ti ti-${toast.err ? "alert-circle" : "check"}`} style={{ fontSize:15 }} />{toast.msg}
      </div>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────────── */
function Dashboard({ clientes, promos, movs, nvs, th }) {
  const totalPts = clientes.reduce((a, c) => a + c.puntos, 0);
  const canjes   = movs.filter(m => m.tipo === "canje").reduce((a, m) => a + Math.abs(m.puntos), 0);
  const mesAct   = new Date().getMonth();
  const cumples  = clientes.filter(c => c.nacimiento && new Date(c.nacimiento).getMonth() === mesAct);
  const visXmes  = MESES.map((mes, i) => ({ mes, v: movs.filter(m => m.tipo === "visita" && new Date(m.fecha).getMonth() === i).length }));
  const maxV     = Math.max(...visXmes.map(x => x.v), 1);
  const top      = [...clientes].sort((a, b) => b.visitas - a.visitas).slice(0, 5);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
        <KPI label="Clientes"      val={clientes.length} sub={`${clientes.filter(c=>c.estado==="activo").length} activos`} th={th} />
        <KPI label="Puntos activos" val={totalPts.toLocaleString()} th={th} />
        <KPI label="Canjeados"     val={canjes.toLocaleString()} th={th} />
        <KPI label="Promociones"   val={promos.filter(p=>p.estado==="activo").length} sub={`de ${promos.length}`} th={th} />
        <KPI label="Cumpleaños"    val={cumples.length} sub="este mes" th={th} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:16 }}>
        <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:20 }}>
          <div style={{ fontWeight:600, fontSize:14, color:th.t0, marginBottom:14 }}>Visitas por mes</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:110 }}>
            {visXmes.map((x, i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                {x.v > 0 && <div style={{ fontSize:9, color:th.t2 }}>{x.v}</div>}
                <div style={{ width:"100%", background: x.v ? G : th.bdr, borderRadius:"3px 3px 0 0",
                  height:`${Math.max(4, Math.round(x.v / maxV * 90))}px`, transition:"height .3s" }} />
                <div style={{ fontSize:9, color:th.t2 }}>{x.mes}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:20 }}>
          <div style={{ fontWeight:600, fontSize:14, color:th.t0, marginBottom:14 }}>Top clientes</div>
          {top.length === 0 && <div style={{ color:th.t2, textAlign:"center", padding:20, fontSize:13 }}>Sin clientes aún</div>}
          {top.map((c, i) => (
            <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:`1px solid ${th.bdr}30` }}>
              <span style={{ fontWeight:700, fontSize:11, color:th.t2, width:14 }}>{i+1}</span>
              <Av n={c.nombre} a={c.apellidos} size={26} bg={th.GL} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:500, fontSize:12, color:th.t0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {c.nombre} {c.apellidos}
                </div>
                <div style={{ fontSize:10, color:th.t2 }}>{getNv(c.visitas, nvs).nombre}</div>
              </div>
              <span style={{ fontWeight:700, color:G, fontSize:13 }}>{c.visitas}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:20 }}>
        <div style={{ fontWeight:600, fontSize:14, color:th.t0, marginBottom:12 }}>Actividad reciente</div>
        {movs.length === 0 && <div style={{ color:th.t2, textAlign:"center", padding:20, fontSize:13 }}>Sin actividad aún</div>}
        {movs.slice(0, 8).map(m => {
          const c = clientes.find(x => x.id === m.cliente_id);
          return (
            <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"8px 0", borderBottom:`1px solid ${th.bdr}30`, fontSize:12 }}>
              <div>
                <div style={{ fontWeight:500, color:th.t0 }}>{m.descripcion}</div>
                <div style={{ color:th.t2, fontSize:11 }}>{c ? c.nombre : "—"} · {fmt(m.fecha)}</div>
              </div>
              <span style={{ fontWeight:600, color: m.puntos > 0 ? "#2d7a22" : "#c0392b" }}>
                {m.puntos > 0 ? "+" : ""}{m.puntos} pts
              </span>
            </div>
          );
        })}
      </div>

      {cumples.length > 0 && (
        <div style={{ background: th.dark?"#3a2e08":"#fffbea", border:`1px solid ${th.dark?"#6a5010":"#f0dfa0"}`,
            borderRadius:12, padding:14, marginTop:16, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
          <i className="ti ti-cake" style={{ fontSize:18, color:"#d4af37" }} />
          <span style={{ fontWeight:600, fontSize:13, color: th.dark?"#f5d878":"#856404" }}>Cumpleaños este mes:</span>
          {cumples.map(c => (
            <span key={c.id} style={{ background: th.dark?"#4a3e14":"#fef3cd", color: th.dark?"#f5d878":"#856404",
                padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:500 }}>
              {c.nombre} — {new Date(c.nacimiento).toLocaleDateString("es-MX", { day:"numeric", month:"short" })}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Clientes ───────────────────────────────────────────── */
function Clientes({ clientes, setClientes, movs, addMov, toast$, cfg, nvs, th }) {
  const [buscar, setBuscar] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});
  const [ver, setVer]       = useState(null);
  const [tab, setTab]       = useState("info");
  const [saving, setSaving] = useState(false);
  const up = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const filtrados = clientes.filter(c => {
    const q  = buscar.toLowerCase();
    const ok = `${c.nombre} ${c.apellidos||""} ${c.tel||""} ${c.email||""}`.toLowerCase().includes(q);
    if (filtro === "todos") return ok;
    if (filtro === "activo" || filtro === "inactivo") return ok && c.estado === filtro;
    return ok && getNv(c.visitas, nvs).id === filtro;
  });

  const guardar = async () => {
    if (!form.nombre?.trim()) { toast$("Nombre requerido", true); return; }
    setSaving(true);
    try {
      if (!form.id) {
        const data = { nombre:form.nombre, apellidos:form.apellidos||"", tel:form.tel||"",
          wa:form.wa||"", email:form.email||"", nacimiento:form.nacimiento||null,
          registro:new Date().toISOString().slice(0,10), visitas:0, puntos:0,
          estado:form.estado||"activo", platillo:form.platillo||"",
          bebida:form.bebida||"", alergias:form.alergias||"", notas:form.notas||"" };
        const [c] = await dbPost("clientes", data);
        setClientes(p => [c, ...p]);
        toast$("Cliente registrado");
      } else {
        const { id, ...rest } = form;
        await dbPatch("clientes", id, rest);
        setClientes(p => p.map(c => c.id === id ? form : c));
        if (ver?.id === id) setVer(form);
        toast$("Cliente actualizado");
      }
      setModal(null);
    } catch(e) { toast$("Error: " + (e?.message||"").slice(0,100), true); console.error(e); }
    finally { setSaving(false); }
  };

  const eliminar = async id => {
    if (!window.confirm("¿Eliminar este cliente?")) return;
    try { await dbDel("clientes", id); setClientes(p => p.filter(c => c.id !== id)); setVer(null); toast$("Eliminado"); }
    catch(e) { toast$("Error: " + (e?.message||"").slice(0,100), true); }
  };

  const regVisita = async c => {
    const pts = cfg.puntos_x_visita || 25;
    try {
      await dbPatch("clientes", c.id, { visitas:c.visitas+1, puntos:c.puntos+pts });
      const u = { ...c, visitas:c.visitas+1, puntos:c.puntos+pts };
      setClientes(p => p.map(x => x.id === c.id ? u : x));
      await addMov(c.id, "visita", pts, "Visita registrada");
      if (ver?.id === c.id) setVer(u);
      toast$(`Visita +${pts} pts`);
    } catch { toast$("Error", true); }
  };

  const ajustar = async (c, delta, desc) => {
    const np = Math.max(0, c.puntos + delta);
    try {
      await dbPatch("clientes", c.id, { puntos:np });
      const u = { ...c, puntos:np };
      setClientes(p => p.map(x => x.id === c.id ? u : x));
      await addMov(c.id, delta > 0 ? "bono" : "ajuste", delta, desc);
      if (ver?.id === c.id) setVer(u);
      toast$("Puntos actualizados");
    } catch { toast$("Error", true); }
  };

  const exportar = () => {
    const rows = [["Nombre","Apellidos","Tel","Email","Visitas","Puntos","Nivel","Estado"],
      ...clientes.map(c => [c.nombre,c.apellidos,c.tel,c.email,c.visitas,c.puntos,getNv(c.visitas,nvs).nombre,c.estado])];
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.map(r => r.join(",")).join("\n"));
    a.download = "clientes.csv"; a.click(); toast$("Exportado");
  };

  if (ver) {
    const c = ver; const hist = movs.filter(m => m.cliente_id === c.id);
    return (
      <div>
        <Btn onClick={() => setVer(null)} style={{ marginBottom:16 }}><i className="ti ti-arrow-left" />Volver</Btn>
        <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
            <Av n={c.nombre} a={c.apellidos} size={56} bg={th.GL} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:20, fontWeight:700, color:th.t0 }}>{c.nombre} {c.apellidos}</div>
              <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                <NvBdg vis={c.visitas} nvs={nvs} />
                <Bdg bg={c.estado==="activo"?th.GL:th.bg2} color={c.estado==="activo"?G:th.t2}>{c.estado}</Bdg>
              </div>
              <div style={{ display:"flex", gap:20, marginTop:12, flexWrap:"wrap" }}>
                {[["Visitas",c.visitas,th.t0],["Puntos",c.puntos?.toLocaleString(),G],["Registro",fmt(c.registro),th.t1]].map(([l,v,col]) => (
                  <div key={l}><div style={{ fontSize:10, color:th.t2 }}>{l}</div><div style={{ fontSize:20, fontWeight:700, color:col }}>{v}</div></div>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <Btn v="pri" onClick={() => regVisita(c)}><i className="ti ti-plus" />Registrar visita</Btn>
              <Btn onClick={() => { setForm({...c}); setModal("e"); }}><i className="ti ti-edit" />Editar</Btn>
              <Btn v="red" sm onClick={() => eliminar(c.id)}><i className="ti ti-trash" /></Btn>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn sm onClick={() => ajustar(c, 50, "Bono manual +50 pts")}><i className="ti ti-plus" />+50 pts</Btn>
            <Btn sm onClick={() => ajustar(c,-50, "Ajuste −50 pts")}><i className="ti ti-minus" />−50 pts</Btn>
          </div>
        </div>
        <div style={{ display:"flex", gap:4, marginBottom:16, background:th.bg2, borderRadius:8, padding:4, width:"fit-content" }}>
          {["info","historial"].map(t => (
            <div key={t} onClick={() => setTab(t)}
              style={{ padding:"7px 14px", borderRadius:6, fontSize:13, cursor:"pointer", fontWeight:500,
                background: tab===t?th.bg1:"transparent", color: tab===t?G:th.t1, transition:"all .15s" }}>
              {t === "info" ? "Información" : "Historial"}
            </div>
          ))}
        </div>
        {tab === "info" && (
          <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {[["Teléfono",c.tel],["WhatsApp",c.wa],["Email",c.email],["Nacimiento",fmt(c.nacimiento)],["Platillo favorito",c.platillo],["Bebida favorita",c.bebida]].map(([l,v]) => (
                <div key={l}><div style={{ fontSize:11, color:th.t2, marginBottom:3 }}>{l}</div><div style={{ fontWeight:500, color:th.t0 }}>{v||"—"}</div></div>
              ))}
            </div>
            {c.alergias && <div style={{ marginTop:14 }}><div style={{ fontSize:11, color:th.t2, marginBottom:4 }}>Restricciones</div><Bdg bg={th.dark?"#3a1010":"#fde8e8"} color={th.dark?"#f5a0a0":"#c0392b"}>{c.alergias}</Bdg></div>}
            {c.notas    && <div style={{ marginTop:14 }}><div style={{ fontSize:11, color:th.t2, marginBottom:4 }}>Notas</div><div style={{ color:th.t1 }}>{c.notas}</div></div>}
          </div>
        )}
        {tab === "historial" && (
          <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, overflow:"hidden" }}>
            {hist.length === 0 && <div style={{ textAlign:"center", padding:40, color:th.t2 }}>Sin movimientos</div>}
            {hist.map(m => (
              <div key={m.id} style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px", borderBottom:`1px solid ${th.bdr}30`, fontSize:13 }}>
                <div><div style={{ fontWeight:500, color:th.t0 }}>{m.descripcion}</div><div style={{ color:th.t2, fontSize:11, marginTop:2 }}>{fmt(m.fecha)}</div></div>
                <span style={{ fontWeight:600, color: m.puntos>0?"#2d7a22":"#c0392b" }}>{m.puntos>0?"+":""}{m.puntos} pts</span>
              </div>
            ))}
          </div>
        )}
        {modal && <FormCli form={form} setForm={setForm} guardar={guardar} onClose={()=>setModal(null)} th={th} up={up} saving={saving} />}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar clientes…"
          style={{ flex:1, minWidth:180, padding:"8px 12px", border:`1px solid ${th.bdr}`, borderRadius:8, fontSize:13, outline:"none", background:th.bg2, color:th.t0 }} />
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
          style={{ padding:"8px 12px", border:`1px solid ${th.bdr}`, borderRadius:8, fontSize:13, background:th.bg2, color:th.t0, cursor:"pointer" }}>
          <option value="todos">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
          {nvs.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
        </select>
        <Btn v="pri" onClick={() => { setForm({estado:"activo"}); setModal("n"); }}><i className="ti ti-plus" />Nuevo</Btn>
        <Btn onClick={exportar}><i className="ti ti-download" />Exportar</Btn>
      </div>
      <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, overflow:"hidden" }}>
        {filtrados.length === 0 && <div style={{ textAlign:"center", padding:48, color:th.t2 }}>Sin clientes</div>}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              <TH_ th={th}>Cliente</TH_><TH_ th={th}>Tel</TH_><TH_ th={th}>Visitas</TH_>
              <TH_ th={th}>Puntos</TH_><TH_ th={th}>Nivel</TH_><TH_ th={th}>Estado</TH_><TH_ th={th}></TH_>
            </tr></thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} style={{ cursor:"pointer" }} onClick={() => setVer(c)}>
                  <TD_ th={th}><div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Av n={c.nombre} a={c.apellidos} size={30} bg={th.GL} />
                    <div><div style={{ fontWeight:500, color:th.t0 }}>{c.nombre} {c.apellidos}</div><div style={{ fontSize:11, color:th.t2 }}>{c.email}</div></div>
                  </div></TD_>
                  <TD_ th={th} sx={{ color:th.t1 }}>{c.tel}</TD_>
                  <TD_ th={th}><span style={{ fontWeight:600, color:th.t0 }}>{c.visitas}</span></TD_>
                  <TD_ th={th}><span style={{ fontWeight:600, color:G }}>{c.puntos?.toLocaleString()}</span></TD_>
                  <TD_ th={th}><NvBdg vis={c.visitas} nvs={nvs} /></TD_>
                  <TD_ th={th}><Bdg bg={c.estado==="activo"?th.GL:th.bg2} color={c.estado==="activo"?G:th.t2}>{c.estado}</Bdg></TD_>
                  <TD_ th={th}><div onClick={e => e.stopPropagation()} style={{ display:"flex", gap:5 }}>
                    <Btn sm onClick={() => regVisita(c)}><i className="ti ti-plus" /></Btn>
                    <Btn sm onClick={() => { setForm({...c}); setModal("e"); }}><i className="ti ti-edit" /></Btn>
                    <Btn v="red" sm onClick={() => eliminar(c.id)}><i className="ti ti-trash" /></Btn>
                  </div></TD_>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <FormCli form={form} setForm={setForm} guardar={guardar} onClose={() => setModal(null)} th={th} up={up} saving={saving} />}
    </div>
  );
}

function FormCli({ form, setForm, guardar, onClose, th, up, saving }) {
  return (
    <Modal onClose={onClose} title={form.id ? "Editar cliente" : "Nuevo cliente"} th={th}>
      <R2><Fld label="Nombre *"><Inp value={form.nombre} onChange={e=>up("nombre",e.target.value)} th={th}/></Fld><Fld label="Apellidos"><Inp value={form.apellidos} onChange={e=>up("apellidos",e.target.value)} th={th}/></Fld></R2>
      <R2><Fld label="Teléfono"><Inp value={form.tel} onChange={e=>up("tel",e.target.value)} th={th}/></Fld><Fld label="WhatsApp"><Inp value={form.wa} onChange={e=>up("wa",e.target.value)} th={th}/></Fld></R2>
      <Fld label="Email"><Inp type="email" value={form.email} onChange={e=>up("email",e.target.value)} th={th}/></Fld>
      <R2><Fld label="Nacimiento"><Inp type="date" value={form.nacimiento} onChange={e=>up("nacimiento",e.target.value)} th={th}/></Fld><Fld label="Estado"><Sel value={form.estado||"activo"} onChange={e=>up("estado",e.target.value)} th={th}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></Sel></Fld></R2>
      <R2><Fld label="Platillo fav."><Inp value={form.platillo} onChange={e=>up("platillo",e.target.value)} th={th}/></Fld><Fld label="Bebida fav."><Inp value={form.bebida} onChange={e=>up("bebida",e.target.value)} th={th}/></Fld></R2>
      <Fld label="Restricciones"><Inp value={form.alergias} onChange={e=>up("alergias",e.target.value)} th={th}/></Fld>
      <Fld label="Notas"><Txa value={form.notas} onChange={e=>up("notas",e.target.value)} th={th}/></Fld>
      <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:8 }}>
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn v="pri" onClick={guardar}><i className="ti ti-check" />{saving?"Guardando…":"Guardar"}</Btn>
      </div>
    </Modal>
  );
}

/* ── Promociones ────────────────────────────────────────── */
function Promociones({ promos, setPromos, nvs, toast$, th }) {
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const up = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const guardar = async () => {
    if (!form.nombre?.trim()) { toast$("Nombre requerido", true); return; }
    setSaving(true);
    try {
      if (form.id) {
        const { id, ...r } = form; await dbPatch("promociones", id, r);
        setPromos(p => p.map(x => x.id === id ? form : x)); toast$("Actualizada");
      } else {
        const [c] = await dbPost("promociones", { ...form, usos:0 });
        setPromos(p => [c, ...p]); toast$("Creada");
      }
      setModal(false);
    } catch(e) { toast$("ERR: " + (e?.message||JSON.stringify(e)).slice(0,120), true); }
    finally { setSaving(false); }
  };

  const toggle = async p => {
    const e = p.estado === "activo" ? "inactivo" : "activo";
    try { await dbPatch("promociones", p.id, { estado:e }); setPromos(pr => pr.map(x => x.id===p.id?{...x,estado:e}:x)); toast$("Actualizado"); }
    catch { toast$("Error", true); }
  };

  const dupl = async p => {
    try { const [c] = await dbPost("promociones", { ...p, id:undefined, nombre:p.nombre+" (copia)", usos:0, created_at:undefined }); setPromos(pr => [c, ...pr]); toast$("Duplicada"); }
    catch { toast$("Error", true); }
  };

  const del = async id => {
    if (!window.confirm("¿Eliminar?")) return;
    try { await dbDel("promociones", id); setPromos(p => p.filter(x => x.id !== id)); toast$("Eliminada"); }
    catch { toast$("Error", true); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <span style={{ fontSize:13, color:th.t2 }}>{promos.length} promociones</span>
        <Btn v="pri" onClick={() => { setForm({estado:"activo",limite:100,usos:0,tipo:"Descuento",objetivo:"Todos"}); setModal(true); }}><i className="ti ti-plus" />Nueva</Btn>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
        {promos.map(p => (
          <div key={p.id} style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div><div style={{ fontWeight:600, fontSize:15, color:th.t0 }}>{p.nombre}</div><div style={{ fontSize:11, color:th.t2 }}>{p.tipo} · {p.objetivo}</div></div>
              <Bdg bg={p.estado==="activo"?th.GL:th.bg2} color={p.estado==="activo"?G:th.t2}>{p.estado}</Bdg>
            </div>
            <div style={{ fontSize:12, color:th.t1, marginBottom:8 }}>{p.descripcion}</div>
            <div style={{ fontSize:11, color:th.t2, marginBottom:8 }}><i className="ti ti-calendar" style={{ marginRight:4 }} />{fmt(p.inicio)} — {fmt(p.fin)}</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:700, color:G, background:th.GL, padding:"3px 8px", borderRadius:6 }}>{p.codigo}</span>
              <span style={{ fontSize:11, color:th.t2 }}>{p.usos||0}/{p.limite} usos</span>
            </div>
            <div style={{ height:4, background:th.bdr, borderRadius:2, overflow:"hidden", marginBottom:12 }}>
              <div style={{ height:"100%", background:G, width:`${Math.min(100,Math.round((p.usos||0)/Math.max(p.limite||1,1)*100))}%` }} />
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Btn sm onClick={() => toggle(p)}>{p.estado==="activo"?"Desactivar":"Activar"}</Btn>
              <Btn sm onClick={() => { setForm({...p}); setModal(true); }}><i className="ti ti-edit" /></Btn>
              <Btn sm onClick={() => dupl(p)}><i className="ti ti-copy" /></Btn>
              <Btn v="red" sm onClick={() => del(p.id)}><i className="ti ti-trash" /></Btn>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal onClose={() => setModal(false)} title={form.id?"Editar":"Nueva promoción"} th={th}>
          <Fld label="Nombre *"><Inp value={form.nombre} onChange={e=>up("nombre",e.target.value)} th={th}/></Fld>
          <Fld label="Descripción"><Txa value={form.descripcion} onChange={e=>up("descripcion",e.target.value)} th={th}/></Fld>
          <R2><Fld label="Tipo"><Sel value={form.tipo} onChange={e=>up("tipo",e.target.value)} th={th}><option>Descuento</option><option>Promoción</option><option>Cortesía</option><option>Evento</option></Sel></Fld><Fld label="Objetivo"><Sel value={form.objetivo} onChange={e=>up("objetivo",e.target.value)} th={th}><option>Todos</option>{nvs.map(n=><option key={n.id}>{n.nombre}</option>)}</Sel></Fld></R2>
          <R2><Fld label="Inicio"><Inp type="date" value={form.inicio} onChange={e=>up("inicio",e.target.value)} th={th}/></Fld><Fld label="Fin"><Inp type="date" value={form.fin} onChange={e=>up("fin",e.target.value)} th={th}/></Fld></R2>
          <R2><Fld label="Código"><Inp value={form.codigo} onChange={e=>up("codigo",e.target.value.toUpperCase())} th={th}/></Fld><Fld label="Límite"><Inp type="number" value={form.limite} onChange={e=>up("limite",+e.target.value)} th={th}/></Fld></R2>
          <Fld label="Estado"><Sel value={form.estado} onChange={e=>up("estado",e.target.value)} th={th}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></Sel></Fld>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:8 }}>
            <Btn onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn v="pri" onClick={guardar}><i className="ti ti-check" />{saving?"Guardando…":"Guardar"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Lealtad ────────────────────────────────────────────── */
function Lealtad({ clientes, setClientes, movs, addMov, toast$, nvs, setNvs, recs, setRecs, th }) {
  const [tab, setTab]       = useState("niveles");
  const [modalN, setModalN] = useState(false);
  const [modalR, setModalR] = useState(false);
  const [modalC, setModalC] = useState(false);
  const [formN, setFormN]   = useState({});
  const [formR, setFormR]   = useState({});
  const [cliSel, setCliSel] = useState("");
  const [recSel, setRecSel] = useState("");
  const [saving, setSaving] = useState(false);
  const upN = (k, v) => setFormN(f => ({ ...f, [k]:v }));
  const upR = (k, v) => setFormR(f => ({ ...f, [k]:v }));

  const saveNv = async () => {
    if (!formN.nombre?.trim()) { toast$("Nombre requerido", true); return; }
    const min = +formN.min_visitas||0, max = +formN.max_visitas||999;
    setSaving(true);
    try {
      if (formN.id) {
        await dbPatch("niveles", formN.id, { ...formN, min_visitas:min, max_visitas:max });
        setNvs(p => p.map(n => n.id===formN.id ? {...formN, min_visitas:min, max_visitas:max} : n));
        toast$("Nivel actualizado");
      } else {
        const [c] = await dbPost("niveles", { ...formN, min_visitas:min, max_visitas:max });
        setNvs(p => [...p, c].sort((a,b) => a.min_visitas-b.min_visitas));
        toast$("Nivel creado");
      }
      setModalN(false);
    } catch { toast$("Error", true); }
    finally { setSaving(false); }
  };

  const delNv = async id => {
    if (nvs.length <= 1) { toast$("Mínimo un nivel", true); return; }
    if (!window.confirm("¿Eliminar nivel?")) return;
    try { await dbDel("niveles", id); setNvs(p => p.filter(n => n.id !== id)); toast$("Eliminado"); }
    catch { toast$("Error", true); }
  };

  const saveRec = async () => {
    if (!formR.nombre?.trim() || !+formR.puntos) { toast$("Nombre y puntos requeridos", true); return; }
    setSaving(true);
    try {
      if (formR.id) {
        await dbPatch("recompensas", formR.id, { ...formR, puntos:+formR.puntos });
        setRecs(p => p.map(r => r.id===formR.id ? {...formR, puntos:+formR.puntos} : r));
        toast$("Actualizada");
      } else {
        const [c] = await dbPost("recompensas", { ...formR, puntos:+formR.puntos });
        setRecs(p => [...p, c]); toast$("Creada");
      }
      setModalR(false);
    } catch { toast$("Error", true); }
    finally { setSaving(false); }
  };

  const delRec = async id => {
    if (!window.confirm("¿Eliminar?")) return;
    try { await dbDel("recompensas", id); setRecs(p => p.filter(r => r.id !== id)); toast$("Eliminada"); }
    catch { toast$("Error", true); }
  };

  const canjear = async () => {
    if (!cliSel || !recSel) { toast$("Selecciona cliente y recompensa", true); return; }
    const c = clientes.find(x => x.id===cliSel), r = recs.find(x => x.id===recSel);
    if (c.puntos < r.puntos) { toast$("Puntos insuficientes", true); return; }
    try {
      await dbPatch("clientes", c.id, { puntos:c.puntos-r.puntos });
      setClientes(p => p.map(x => x.id===c.id ? {...x, puntos:x.puntos-r.puntos} : x));
      await addMov(c.id, "canje", -r.puntos, `Canje: ${r.nombre}`);
      toast$(`Canje exitoso — ${r.nombre}`);
      setModalC(false); setCliSel(""); setRecSel("");
    } catch { toast$("Error", true); }
  };

  const sorted   = [...nvs].sort((a,b) => a.min_visitas-b.min_visitas);
  const totalPts = clientes.reduce((a,c) => a+c.puntos, 0);
  const canjes   = movs.filter(m => m.tipo==="canje").reduce((a,m) => a+Math.abs(m.puntos), 0);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
        {[["Puntos activos",totalPts.toLocaleString()],["Canjeados",canjes.toLocaleString()],["Movimientos",movs.length],["En programa",clientes.length]].map(([l,v]) => (
          <KPI key={l} label={l} val={v} th={th} />
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:4, background:th.bg2, borderRadius:8, padding:4 }}>
          {["niveles","recompensas","historial"].map(t => (
            <div key={t} onClick={() => setTab(t)}
              style={{ padding:"7px 14px", borderRadius:6, fontSize:13, cursor:"pointer", fontWeight:500,
                background: tab===t?th.bg1:"transparent", color: tab===t?G:th.t1, transition:"all .15s" }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {tab==="niveles"     && <Btn v="pri" onClick={() => { setFormN({color:"#2d7a22",icono:"ti-star",min_visitas:0,max_visitas:9}); setModalN(true); }}><i className="ti ti-plus" />Nuevo nivel</Btn>}
          {tab==="recompensas" && <><Btn v="pri" onClick={() => { setFormR({tipo:"Descuento",puntos:100}); setModalR(true); }}><i className="ti ti-plus" />Nueva</Btn><Btn onClick={() => setModalC(true)}><i className="ti ti-gift" />Canjear</Btn></>}
        </div>
      </div>

      {tab==="niveles" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:16 }}>
          {sorted.map(nv => {
            const cnt = clientes.filter(c => getNv(c.visitas,nvs).id===nv.id).length;
            return (
              <div key={nv.id} style={{ background:th.bg1, border:`2px solid ${nv.color}40`, borderRadius:14, padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:nv.color+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <i className={`ti ${nv.icono||"ti-star"}`} style={{ fontSize:22, color:nv.color }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:th.t0 }}>{nv.nombre}</div>
                    <span style={{ fontSize:11, background:nv.color+"22", color:nv.color, padding:"2px 8px", borderRadius:20, fontWeight:600 }}>
                      {nv.min_visitas}–{nv.max_visitas===999?"∞":nv.max_visitas} vis · {cnt} clientes
                    </span>
                  </div>
                </div>
                <div style={{ fontSize:12, color:th.t1, marginBottom:12, minHeight:30, lineHeight:1.6 }}>{nv.beneficios}</div>
                <div style={{ height:4, background:th.bdr, borderRadius:2, marginBottom:14, overflow:"hidden" }}>
                  <div style={{ height:"100%", background:nv.color, width:`${Math.round(cnt/Math.max(clientes.length,1)*100)}%` }} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn v="pri" sm onClick={() => { setFormN({...nv}); setModalN(true); }} style={{ flex:1, justifyContent:"center" }}><i className="ti ti-edit" />Editar nivel</Btn>
                  {nvs.length > 1 && <Btn v="red" sm onClick={() => delNv(nv.id)}><i className="ti ti-trash" /></Btn>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab==="recompensas" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
          {recs.map(r => (
            <div key={r.id} style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <div><div style={{ fontWeight:600, color:th.t0 }}>{r.nombre}</div><Bdg bg={th.GL} color={G}>{r.tipo}</Bdg></div>
                <div style={{ fontSize:22, fontWeight:700, color:G }}>{r.puntos}<span style={{ fontSize:11, fontWeight:400, color:th.t2 }}> pts</span></div>
              </div>
              {r.descripcion && <div style={{ fontSize:12, color:th.t1, marginBottom:10 }}>{r.descripcion}</div>}
              <div style={{ display:"flex", gap:6 }}>
                <Btn sm onClick={() => { setFormR({...r}); setModalR(true); }} style={{ flex:1, justifyContent:"center" }}><i className="ti ti-edit" />Editar</Btn>
                <Btn v="red" sm onClick={() => delRec(r.id)}><i className="ti ti-trash" /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="historial" && (
        <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><TH_ th={th}>Fecha</TH_><TH_ th={th}>Cliente</TH_><TH_ th={th}>Tipo</TH_><TH_ th={th}>Descripción</TH_><TH_ th={th}>Puntos</TH_></tr></thead>
              <tbody>
                {movs.map(m => { const c=clientes.find(x=>x.id===m.cliente_id); return (
                  <tr key={m.id}>
                    <TD_ th={th} sx={{ fontSize:11, color:th.t2 }}>{fmt(m.fecha)}</TD_>
                    <TD_ th={th} sx={{ color:th.t1 }}>{c?`${c.nombre} ${c.apellidos||""}`:"—"}</TD_>
                    <TD_ th={th}><Bdg bg={th.bg2} color={th.t1}>{m.tipo}</Bdg></TD_>
                    <TD_ th={th}>{m.descripcion}</TD_>
                    <TD_ th={th}><span style={{ fontWeight:600, color:m.puntos>0?"#2d7a22":"#c0392b" }}>{m.puntos>0?"+":""}{m.puntos}</span></TD_>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalN && (
        <Modal onClose={() => setModalN(false)} title={formN.id?"Editar nivel":"Nuevo nivel"} th={th} maxW={480}>
          <Fld label="Nombre *"><Inp value={formN.nombre} onChange={e=>upN("nombre",e.target.value)} placeholder="Ej: Hilachero VIP" th={th}/></Fld>
          <Fld label="Beneficios"><Txa value={formN.beneficios} onChange={e=>upN("beneficios",e.target.value)} th={th} rows={3}/></Fld>
          <R2>
            <Fld label="Visitas mínimas"><Inp type="number" value={formN.min_visitas} onChange={e=>upN("min_visitas",+e.target.value)} th={th}/></Fld>
            <Fld label="Visitas máximas"><Inp type="number" value={formN.max_visitas===999?"":formN.max_visitas} onChange={e=>upN("max_visitas",e.target.value===""?999:+e.target.value)} placeholder="Vacío = sin límite" th={th}/></Fld>
          </R2>
          <R2>
            <Fld label="Color">
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input type="color" value={formN.color||G} onChange={e=>upN("color",e.target.value)} style={{ width:44, height:36, border:`1px solid ${th.bdr}`, borderRadius:8, cursor:"pointer", padding:2, background:th.bg2 }}/>
                <Inp value={formN.color} onChange={e=>upN("color",e.target.value)} th={th}/>
              </div>
            </Fld>
            <Fld label="Ícono"><Sel value={formN.icono||"ti-star"} onChange={e=>upN("icono",e.target.value)} th={th}>{ICONOS.map(ic=><option key={ic} value={ic}>{ic.replace("ti-","")}</option>)}</Sel></Fld>
          </R2>
          <div style={{ background:th.bg2, borderRadius:10, padding:14, marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:(formN.color||G)+"22", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className={`ti ${formN.icono||"ti-star"}`} style={{ fontSize:22, color:formN.color||G }} />
            </div>
            <div>
              <div style={{ fontWeight:700, color:th.t0 }}>{formN.nombre||"Vista previa"}</div>
              <span style={{ fontSize:11, background:(formN.color||G)+"22", color:formN.color||G, padding:"2px 8px", borderRadius:20, fontWeight:600 }}>{formN.nombre||"Nivel"}</span>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <Btn onClick={() => setModalN(false)}>Cancelar</Btn>
            <Btn v="pri" onClick={saveNv}><i className="ti ti-check" />{saving?"Guardando…":"Guardar nivel"}</Btn>
          </div>
        </Modal>
      )}

      {modalR && (
        <Modal onClose={() => setModalR(false)} title={formR.id?"Editar recompensa":"Nueva recompensa"} th={th} maxW={420}>
          <Fld label="Nombre *"><Inp value={formR.nombre} onChange={e=>upR("nombre",e.target.value)} th={th}/></Fld>
          <Fld label="Descripción"><Txa value={formR.descripcion} onChange={e=>upR("descripcion",e.target.value)} th={th} rows={2}/></Fld>
          <R2>
            <Fld label="Puntos *"><Inp type="number" value={formR.puntos} onChange={e=>upR("puntos",e.target.value)} th={th}/></Fld>
            <Fld label="Tipo"><Sel value={formR.tipo||"Descuento"} onChange={e=>upR("tipo",e.target.value)} th={th}><option>Descuento</option><option>Cortesía</option><option>Producto</option><option>Experiencia</option></Sel></Fld>
          </R2>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <Btn onClick={() => setModalR(false)}>Cancelar</Btn>
            <Btn v="pri" onClick={saveRec}><i className="ti ti-check" />{saving?"Guardando…":"Guardar"}</Btn>
          </div>
        </Modal>
      )}

      {modalC && (
        <Modal onClose={() => setModalC(false)} title="Canjear recompensa" th={th} maxW={420}>
          <Fld label="Cliente"><Sel value={cliSel} onChange={e=>setCliSel(e.target.value)} th={th}><option value="">Seleccionar…</option>{clientes.filter(c=>c.estado==="activo").map(c=><option key={c.id} value={c.id}>{c.nombre} {c.apellidos||""} — {c.puntos} pts</option>)}</Sel></Fld>
          <Fld label="Recompensa"><Sel value={recSel} onChange={e=>setRecSel(e.target.value)} th={th}><option value="">Seleccionar…</option>{recs.map(r=><option key={r.id} value={r.id}>{r.nombre} — {r.puntos} pts</option>)}</Sel></Fld>
          {cliSel && recSel && (() => {
            const c=clientes.find(x=>x.id===cliSel), r=recs.find(x=>x.id===recSel);
            const ok=c&&r&&c.puntos>=r.puntos;
            return <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:12,
              background: ok?(th.dark?"#1a3a14":"#e8f5e2"):(th.dark?"#3a1010":"#fde8e8"),
              color: ok?"#1a5214":"#c0392b", fontSize:13 }}>
              {ok ? `✓ Quedarán ${c.puntos-r.puntos} pts` : `✗ Faltan ${r.puntos-c.puntos} pts`}
            </div>;
          })()}
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <Btn onClick={() => setModalC(false)}>Cancelar</Btn>
            <Btn v="pri" onClick={canjear}><i className="ti ti-gift" />Confirmar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Configuración ──────────────────────────────────────── */
function Configuracion({ cfg, setCfg, toast$, th }) {
  const [form, setForm]         = useState({ ...cfg });
  const [pinActual, setPinActual] = useState("");
  const [pinNuevo, setPinNuevo]   = useState("");
  const [pinConf, setPinConf]     = useState("");
  const [savingCfg, setSavingCfg] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const logoRef = useRef();
  const up = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const guardarCfg = async () => {
    setSavingCfg(true);
    try {
      if (cfg.id) await dbPatch("configuracion", cfg.id, { nombre:form.nombre, logo:form.logo, puntos_x_visita:form.puntos_x_visita, puntos_x_peso:form.puntos_x_peso });
      setCfg(form); toast$("Configuración guardada");
    } catch { toast$("Error al guardar", true); }
    finally { setSavingCfg(false); }
  };

  const guardarPin = async () => {
    if (!pinNuevo || pinNuevo.length < 4) { toast$("El PIN debe tener al menos 4 dígitos", true); return; }
    if (pinNuevo !== pinConf) { toast$("Los PINs no coinciden", true); return; }
    setSavingPin(true);
    try {
      const rows = await dbGet("configuracion_seguridad", "select=id,pin&limit=1");
      const pinBD = rows?.[0]?.pin || "1300";
      if (pinActual !== pinBD) { toast$("El PIN actual no es correcto", true); setSavingPin(false); return; }
      if (rows?.[0]?.id) {
        await dbPatch("configuracion_seguridad", rows[0].id, { pin:pinNuevo });
      } else {
        await dbPost("configuracion_seguridad", { pin:pinNuevo });
      }
      toast$("PIN actualizado correctamente");
      setPinActual(""); setPinNuevo(""); setPinConf("");
    } catch { toast$("Error al actualizar PIN", true); }
    finally { setSavingPin(false); }
  };

  const subirLogo = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setForm(fm => ({ ...fm, logo:ev.target.result })); r.readAsDataURL(f);
  };

  return (
    <div style={{ maxWidth:520 }}>
      {/* Restaurante */}
      <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:20, marginBottom:16 }}>
        <div style={{ fontWeight:600, fontSize:14, color:th.t0, marginBottom:16 }}>Restaurante</div>
        <Fld label="Nombre"><Inp value={form.nombre} onChange={e=>up("nombre",e.target.value)} th={th}/></Fld>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:500, color:th.t1, display:"block", marginBottom:6 }}>Logotipo</label>
          {form.logo && <img src={form.logo} alt="logo" style={{ height:52, objectFit:"contain", display:"block", marginBottom:8, border:`1px solid ${th.bdr}`, borderRadius:8, padding:4 }} />}
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={() => logoRef.current.click()}><i className="ti ti-upload" />Subir logo</Btn>
            {form.logo && <Btn v="red" sm onClick={() => up("logo","")}>Quitar</Btn>}
          </div>
          <input ref={logoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={subirLogo} />
        </div>
        <Btn v="pri" onClick={guardarCfg}><i className="ti ti-check" />{savingCfg?"Guardando…":"Guardar"}</Btn>
      </div>

      {/* Puntos */}
      <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:20, marginBottom:16 }}>
        <div style={{ fontWeight:600, fontSize:14, color:th.t0, marginBottom:16 }}>Programa de puntos</div>
        <R2>
          <Fld label="Puntos por visita"><Inp type="number" value={form.puntos_x_visita} onChange={e=>up("puntos_x_visita",+e.target.value)} th={th}/></Fld>
          <Fld label="Puntos por peso gastado"><Inp type="number" value={form.puntos_x_peso} onChange={e=>up("puntos_x_peso",+e.target.value)} th={th}/></Fld>
        </R2>
        <Btn v="pri" onClick={guardarCfg}><i className="ti ti-check" />{savingCfg?"Guardando…":"Guardar"}</Btn>
      </div>

      {/* Seguridad — PIN */}
      <div style={{ background:th.bg1, border:`1px solid ${th.bdr}`, borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <i className="ti ti-shield-lock" style={{ fontSize:20, color:G }} />
          <div style={{ fontWeight:600, fontSize:14, color:th.t0 }}>Seguridad</div>
        </div>
        <div style={{ background:th.dark?"#1a3a14":"#f0fae8", border:`1px solid ${th.dark?"#2a5a24":"#c8e8b0"}`, borderRadius:8, padding:"10px 12px", marginBottom:16, fontSize:12, color:th.dark?"#9fca9f":"#3a6a1a" }}>
          <i className="ti ti-info-circle" style={{ marginRight:6 }} />
          El PIN es la clave de acceso al CRM. Cámbialo desde aquí cuando lo necesites.
        </div>
        <Fld label="PIN actual">
          <input type="password" inputMode="numeric" maxLength={8} value={pinActual} onChange={e=>setPinActual(e.target.value)}
            placeholder="Ingresa el PIN actual" style={{ width:"100%", padding:"8px 12px", border:`1px solid ${th.bdr}`, borderRadius:8, fontSize:13, outline:"none", background:th.bg2, color:th.t0 }} />
        </Fld>
        <R2>
          <Fld label="Nuevo PIN">
            <input type="password" inputMode="numeric" maxLength={8} value={pinNuevo} onChange={e=>setPinNuevo(e.target.value)}
              placeholder="Mínimo 4 dígitos" style={{ width:"100%", padding:"8px 12px", border:`1px solid ${th.bdr}`, borderRadius:8, fontSize:13, outline:"none", background:th.bg2, color:th.t0 }} />
          </Fld>
          <Fld label="Confirmar nuevo PIN">
            <input type="password" inputMode="numeric" maxLength={8} value={pinConf} onChange={e=>setPinConf(e.target.value)}
              placeholder="Repite el nuevo PIN" style={{ width:"100%", padding:"8px 12px", border:`1px solid ${th.bdr}`, borderRadius:8, fontSize:13, outline:"none", background:th.bg2, color:th.t0 }} />
          </Fld>
        </R2>
        {pinNuevo && pinConf && pinNuevo !== pinConf && (
          <div style={{ color:"#c0392b", fontSize:12, marginBottom:10 }}><i className="ti ti-alert-circle" style={{ marginRight:4 }} />Los PINs no coinciden</div>
        )}
        {pinNuevo && pinConf && pinNuevo === pinConf && (
          <div style={{ color:G, fontSize:12, marginBottom:10 }}><i className="ti ti-check" style={{ marginRight:4 }} />PINs coinciden</div>
        )}
        <Btn v="pri" onClick={guardarPin} disabled={savingPin}>
          <i className="ti ti-lock" />{savingPin ? "Guardando…" : "Cambiar PIN"}
        </Btn>
      </div>
    </div>
  );
}
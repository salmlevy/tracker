import React, { useState } from "react";
import { pullUser, setUser } from "./cloud.js";

export default function Login({ onReady }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const enter = async () => {
    const u = name.trim().toLowerCase();
    if (!u) return;
    setBusy(true); setErr("");
    try {
      await pullUser(u);
      setUser(u);
      onReady();
    } catch {
      setErr("No pude conectar. Revisa tu internet.");
    }
    setBusy(false);
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "-apple-system,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#E8102E", fontWeight: 800 }}>ENTRENO</div>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>¿Quién entrena?</div>
        <div style={{ fontSize: 13, color: "#5B6470", marginBottom: 16 }}>Escribe tu nombre. Tus datos te siguen en cualquier dispositivo.</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="tu nombre"
          style={{ width: "100%", height: 52, fontSize: 17, padding: "0 14px", borderRadius: 12, border: "1.5px solid #CFD5DD", background: "#fff", outline: "none", marginBottom: 10 }} />
        <button onClick={enter} disabled={busy}
          style={{ width: "100%", height: 54, borderRadius: 12, border: "none", fontSize: 17, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#E8102E,#FF6A00)" }}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
        {err && <div style={{ color: "#C81E1E", fontSize: 13, marginTop: 10 }}>{err}</div>}
      </div>
    </div>
  );
}

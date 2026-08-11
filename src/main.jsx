import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Login from "./Login.jsx";
import { CLOUD, getUser, pullUser, installStorage } from "./cloud.js";

installStorage();

function Root() {
  const [ready, setReady] = useState(!CLOUD || !!getUser());
  const [boot, setBoot] = useState(CLOUD && !!getUser());
  useEffect(() => {
    if (!boot) return;
    pullUser(getUser()).catch(() => {}).finally(() => setBoot(false));
  }, [boot]);
  if (!ready) return <Login onReady={() => setReady(true)} />;
  if (boot) return <div style={{ padding: 40, textAlign: "center", color: "#8A93A0" }}>Sincronizando…</div>;
  return <App />;
}

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 20, fontFamily: "-apple-system,sans-serif" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#C81E1E", marginBottom: 8 }}>Algo falló al cargar</div>
          <div style={{ fontSize: 13, color: "#5B6470", marginBottom: 12 }}>Copia este texto y mándalo al chat:</div>
          <textarea readOnly rows={10} onFocus={(e) => e.target.select()}
            style={{ width: "100%", fontSize: 11, fontFamily: "monospace", padding: 8, borderRadius: 8, border: "1px solid #CFD5DD" }}
            value={String(this.state.err && (this.state.err.stack || this.state.err.message || this.state.err))} />
          <button onClick={() => { localStorage.clear(); location.reload(); }}
            style={{ marginTop: 12, width: "100%", height: 48, borderRadius: 10, border: "none", color: "#fff", fontWeight: 800, background: "#E8102E" }}>
            Borrar datos locales y reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

window.addEventListener("error", (e) => {
  const el = document.getElementById("root");
  if (el && !el.firstChild) el.innerHTML = '<pre style="padding:16px;font-size:11px;white-space:pre-wrap;color:#C81E1E">' + String(e.message) + "\n" + String((e.error && e.error.stack) || "") + "</pre>";
});

createRoot(document.getElementById("root")).render(
  <Boundary>
    <Root />
  </Boundary>
);

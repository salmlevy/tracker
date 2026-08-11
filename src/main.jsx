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

createRoot(document.getElementById("root")).render(<Root />);

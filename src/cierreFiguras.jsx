/* Figuras del estiramiento final.
   Dibujo original en SVG, animado con SMIL y CSS. No hay GIFs ni fotos de terceros.
   Obra propia de esta app: se publica como CC0 1.0 (dominio público).
   https://creativecommons.org/publicdomain/zero/1.0/legalcode */
import React, { useEffect, useState } from "react";
import { C } from "./theme.js";

const TRAZO = { fill: "none", strokeWidth: 8, strokeLinecap: "round", strokeLinejoin: "round" };

function useMovimiento() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setOn(!mq.matches);
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else if (mq.addListener) mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else if (mq.removeListener) mq.removeListener(apply);
    };
  }, []);
  return on;
}

function Marco({ id, children }) {
  return (
    <div data-cierre-figura={id} style={{ width: "100%", maxWidth: "100%", borderRadius: 12, overflow: "hidden", background: C.card2, border: `1px solid ${C.line}` }}>
      <svg viewBox="0 0 320 150" width="100%" role="img" aria-label="Animación del ejercicio" style={{ display: "block", height: "auto" }}>
        <line x1="16" y1="128" x2="304" y2="128" stroke={C.line} strokeWidth="3" strokeLinecap="round" />
        {children}
      </svg>
    </div>
  );
}

function Dead({ mov }) {
  return (
    <Marco id="deadbug">
      <style>{`
        .cierre-dead-arm, .cierre-dead-leg { transform-box: view-box; }
        .cierre-dead-arm { transform-origin: 124px 86px; animation: cierre-dead-arm 2.4s ease-in-out infinite; }
        .cierre-dead-leg { transform-origin: 186px 90px; animation: cierre-dead-leg 2.4s ease-in-out infinite; }
        @keyframes cierre-dead-arm { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(36deg); } }
        @keyframes cierre-dead-leg { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(34deg); } }
        @media (prefers-reduced-motion: reduce) {
          .cierre-dead-arm, .cierre-dead-leg { animation: none; }
        }
      `}</style>
      <circle cx="70" cy="84" r="13" fill={C.txt} />
      <line x1="84" y1="90" x2="196" y2="90" stroke={C.txt} {...TRAZO} />
      <line x1="124" y1="86" x2="98" y2="50" stroke={C.dim} {...TRAZO} />
      <g className={mov ? "cierre-dead-arm" : ""}>
        <line x1="124" y1="86" x2="158" y2="46" stroke={C.acc} {...TRAZO} />
      </g>
      <line x1="186" y1="90" x2="160" y2="48" stroke={C.dim} {...TRAZO} />
      <g className={mov ? "cierre-dead-leg" : ""}>
        <line x1="186" y1="90" x2="236" y2="52" stroke={C.acc} {...TRAZO} />
      </g>
    </Marco>
  );
}

function Bird({ mov }) {
  return (
    <Marco id="birddog">
      <style>{`
        .cierre-bird-arm, .cierre-bird-leg { transform-box: view-box; }
        .cierre-bird-arm { transform-origin: 132px 92px; animation: cierre-bird-arm 2.4s ease-in-out infinite; }
        .cierre-bird-leg { transform-origin: 188px 92px; animation: cierre-bird-leg 2.4s ease-in-out infinite; }
        @keyframes cierre-bird-arm { 0%, 100% { transform: rotate(28deg); } 50% { transform: rotate(-8deg); } }
        @keyframes cierre-bird-leg { 0%, 100% { transform: rotate(-24deg); } 50% { transform: rotate(6deg); } }
        @media (prefers-reduced-motion: reduce) {
          .cierre-bird-arm, .cierre-bird-leg { animation: none; }
        }
      `}</style>
      <circle cx="78" cy="78" r="12" fill={C.txt} />
      <line x1="92" y1="86" x2="210" y2="96" stroke={C.txt} {...TRAZO} />
      <line x1="118" y1="100" x2="118" y2="128" stroke={C.dim} {...TRAZO} />
      <line x1="196" y1="104" x2="196" y2="128" stroke={C.dim} {...TRAZO} />
      <g className={mov ? "cierre-bird-arm" : ""}>
        <line x1="132" y1="92" x2="46" y2="78" stroke={C.acc} {...TRAZO} />
      </g>
      <g className={mov ? "cierre-bird-leg" : ""}>
        <line x1="188" y1="92" x2="286" y2="78" stroke={C.acc} {...TRAZO} />
      </g>
    </Marco>
  );
}

function Plancha() {
  return (
    <Marco id="plancha">
      <style>{`
        .cierre-plancha { transform-box: view-box; transform-origin: 160px 96px; animation: cierre-plancha 2.8s ease-in-out infinite; }
        @keyframes cierre-plancha { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @media (prefers-reduced-motion: reduce) { .cierre-plancha { animation: none; } }
      `}</style>
      <g className="cierre-plancha">
        <circle cx="86" cy="86" r="12" fill={C.txt} />
        <line x1="98" y1="92" x2="236" y2="96" stroke={C.txt} {...TRAZO} />
        <line x1="118" y1="96" x2="108" y2="128" stroke={C.acc} {...TRAZO} />
        <line x1="236" y1="98" x2="262" y2="128" stroke={C.dim} {...TRAZO} />
      </g>
    </Marco>
  );
}

function Lateral({ mov }) {
  return (
    <Marco id="lateral">
      <line x1="78" y1="128" x2="78" y2="102" stroke={C.acc} {...TRAZO} />
      <g>
        <line x1="84" y1="104" x2="250" y2="86" stroke={C.txt} {...TRAZO}>
          {mov ? <animate attributeName="y2" values="98;78;98" dur="2.6s" repeatCount="indefinite" /> : null}
          {mov ? <animate attributeName="y1" values="112;100;112" dur="2.6s" repeatCount="indefinite" /> : null}
        </line>
        <circle cx="262" cy="82" r="12" fill={C.txt}>
          {mov ? <animate attributeName="cy" values="90;74;90" dur="2.6s" repeatCount="indefinite" /> : null}
        </circle>
      </g>
    </Marco>
  );
}

function Puente({ mov }) {
  return (
    <Marco id="puente">
      <circle cx="72" cy="104" r="12" fill={C.txt} />
      <line x1="84" y1="108" x2="168" y2="108" stroke={C.txt} {...TRAZO}>
        {mov ? <animate attributeName="y2" values="112;70;112" dur="2.4s" repeatCount="indefinite" /> : null}
      </line>
      <line x1="168" y1="108" x2="236" y2="124" stroke={C.acc} {...TRAZO}>
        {mov ? <animate attributeName="y1" values="112;70;112" dur="2.4s" repeatCount="indefinite" /> : null}
      </line>
      <line x1="236" y1="124" x2="268" y2="128" stroke={C.dim} {...TRAZO} />
    </Marco>
  );
}

function Pallof({ mov }) {
  return (
    <Marco id="pallof">
      <line x1="20" y1="78" x2="168" y2="78" stroke={C.acc} strokeWidth="4" strokeLinecap="round">
        {mov ? <animate attributeName="x2" values="168;236;168" dur="2.4s" repeatCount="indefinite" /> : null}
      </line>
      <circle cx="156" cy="52" r="12" fill={C.txt} />
      <line x1="156" y1="64" x2="156" y2="108" stroke={C.txt} {...TRAZO} />
      <line x1="140" y1="128" x2="156" y2="108" stroke={C.dim} {...TRAZO} />
      <line x1="172" y1="128" x2="156" y2="108" stroke={C.dim} {...TRAZO} />
      <line x1="156" y1="78" x2="168" y2="78" stroke={C.acc} {...TRAZO}>
        {mov ? <animate attributeName="x2" values="168;236;168" dur="2.4s" repeatCount="indefinite" /> : null}
      </line>
    </Marco>
  );
}

function Cadera({ mov }) {
  return (
    <Marco id="cadera">
      <circle cx="168" cy="42" r="12" fill={C.txt} />
      <line x1="168" y1="54" x2="168" y2="96" stroke={C.txt} {...TRAZO} />
      <line x1="168" y1="96" x2="118" y2="118" stroke={C.dim} {...TRAZO} />
      <line x1="118" y1="118" x2="86" y2="118" stroke={C.dim} {...TRAZO} />
      <line x1="168" y1="96" x2="214" y2="96" stroke={C.acc} {...TRAZO}>
        {mov ? <animate attributeName="y2" values="96;112;96" dur="2.6s" repeatCount="indefinite" /> : null}
      </line>
      <line x1="214" y1="96" x2="252" y2="78" stroke={C.acc} {...TRAZO}>
        {mov ? <animate attributeName="y1" values="96;112;96" dur="2.6s" repeatCount="indefinite" /> : null}
        {mov ? <animate attributeName="y2" values="78;96;78" dur="2.6s" repeatCount="indefinite" /> : null}
      </line>
    </Marco>
  );
}

function Flexor({ mov }) {
  return (
    <Marco id="flexor">
      <g>
        <circle cx="150" cy="40" r="12" fill={C.txt}>
          {mov ? <animate attributeName="cx" values="146;166;146" dur="2.6s" repeatCount="indefinite" /> : null}
        </circle>
        <line x1="150" y1="52" x2="132" y2="108" stroke={C.txt} {...TRAZO}>
          {mov ? <animate attributeName="x1" values="146;166;146" dur="2.6s" repeatCount="indefinite" /> : null}
          {mov ? <animate attributeName="x2" values="132;150;132" dur="2.6s" repeatCount="indefinite" /> : null}
        </line>
      </g>
      <line x1="132" y1="108" x2="108" y2="128" stroke={C.dim} {...TRAZO} />
      <line x1="132" y1="108" x2="214" y2="128" stroke={C.acc} {...TRAZO}>
        {mov ? <animate attributeName="x1" values="132;150;132" dur="2.6s" repeatCount="indefinite" /> : null}
      </line>
    </Marco>
  );
}

function Isquio({ mov }) {
  return (
    <Marco id="isquio">
      <circle cx="64" cy="96" r="12" fill={C.txt} />
      <line x1="78" y1="100" x2="176" y2="104" stroke={C.txt} {...TRAZO} />
      <line x1="176" y1="104" x2="250" y2="120" stroke={C.dim} {...TRAZO} />
      <line x1="150" y1="100" x2="168" y2="46" stroke={C.acc} {...TRAZO}>
        {mov ? <animate attributeName="y2" values="118;40;118" dur="2.6s" repeatCount="indefinite" /> : null}
        {mov ? <animate attributeName="x2" values="210;168;210" dur="2.6s" repeatCount="indefinite" /> : null}
      </line>
    </Marco>
  );
}

function Gato({ mov }) {
  return (
    <Marco id="gato">
      <circle cx="78" cy="86" r="12" fill={C.txt}>
        {mov ? <animate attributeName="cy" values="86;74;98;86" dur="2.8s" repeatCount="indefinite" /> : null}
      </circle>
      <line x1="92" y1="92" x2="160" y2="86" stroke={C.txt} {...TRAZO}>
        {mov ? <animate attributeName="y2" values="86;62;112;86" dur="2.8s" repeatCount="indefinite" /> : null}
      </line>
      <line x1="160" y1="86" x2="228" y2="96" stroke={C.acc} {...TRAZO}>
        {mov ? <animate attributeName="y1" values="86;62;112;86" dur="2.8s" repeatCount="indefinite" /> : null}
      </line>
      <line x1="118" y1="100" x2="118" y2="128" stroke={C.dim} {...TRAZO} />
      <line x1="206" y1="104" x2="206" y2="128" stroke={C.dim} {...TRAZO} />
    </Marco>
  );
}

const FIGURA = {
  deadbug: Dead,
  birddog: Bird,
  plancha: Plancha,
  lateral: Lateral,
  puente: Puente,
  pallof: Pallof,
  cadera: Cadera,
  flexor: Flexor,
  isquio: Isquio,
  gato: Gato,
};

export function FiguraCierre({ id }) {
  const mov = useMovimiento();
  const Dibujo = FIGURA[id] || Dead;
  return <Dibujo mov={mov} />;
}

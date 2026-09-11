import assert from "node:assert/strict";
import {
  afterCompleteOpenIds, applyVuelta, fmtClock, isKeyboardChromeOpen, lastOptFor,
  nextSessionExId, noteDockGap, noteScrollDelta, optLabel, padPlan, resolveOpt,
  sessionExIds, TAB_BAR_H, viewportKeyboardPx,
} from "./exTools.js";

function checkClock() {
  assert.equal(fmtClock(0), "0:00");
  assert.equal(fmtClock(1000), "0:01");
  assert.equal(fmtClock(59000), "0:59");
  assert.equal(fmtClock(60000), "1:00");
  assert.equal(fmtClock(125000), "2:05");
  assert.equal(fmtClock(-5), "0:00");
}

function checkVuelta() {
  const t0 = 1_000_000;
  const start = applyVuelta(null, t0);
  assert.deepEqual(start, { startedAt: t0, phase: "work", phaseAt: t0 });

  const rest = applyVuelta(start, t0 + 45_000);
  assert.equal(rest.startedAt, t0, "clock keeps the original start");
  assert.equal(rest.phase, "rest");
  assert.equal(rest.phaseAt, t0 + 45_000);

  const work2 = applyVuelta(rest, t0 + 90_000);
  assert.equal(work2.startedAt, t0, "still the same continuous clock");
  assert.equal(work2.phase, "work");
  assert.equal(work2.phaseAt, t0 + 90_000);

  const rest2 = applyVuelta(work2, t0 + 140_000);
  assert.equal(rest2.phase, "rest");
  assert.equal(rest2.startedAt, t0);
}

function checkOpt() {
  const ex = {
    id: "c10",
    opts: [{ id: "flat", n: "Plana" }, { id: "dec10", n: "Declive ~10°" }],
    optDefault: "dec10",
  };
  assert.equal(resolveOpt(null, null, ex), "dec10");
  assert.equal(resolveOpt("flat", "dec10", ex), "flat");
  assert.equal(resolveOpt(null, "flat", ex), "flat");
  assert.equal(resolveOpt("nope", "flat", ex), "flat");
  assert.equal(optLabel(ex, "dec10"), "Declive ~10°");
  assert.equal(optLabel(ex, "flat"), "Plana");

  const hist = [
    { day: "C", logs: { c10: { v: "main", opt: "flat", sets: [] } } },
  ];
  assert.equal(lastOptFor(hist, "C", ex, "main"), "flat");
  assert.equal(lastOptFor([], "C", ex, "main"), null);
  assert.equal(lastOptFor(hist, "A", ex, "main"), null);
}

function checkNoteDock() {
  assert.equal(noteDockGap(280, 67), 8, "keyboard up: dock just above keys, footer hidden");
  assert.equal(noteDockGap(0, 67, true), 8, "note focused in PWA shrink: same dock, tabs hidden");
  assert.equal(noteDockGap(0, 67), 75, "keyboard down: clear the 67px tab bar + 8px gap");
  assert.equal(noteDockGap(0), TAB_BAR_H + 8, "default tab height");
}

function checkViewportKeyboard() {
  assert.equal(viewportKeyboardPx(844, { height: 844, offsetTop: 0 }), 0, "no keys");
  assert.equal(viewportKeyboardPx(844, { height: 500, offsetTop: 0 }), 344, "Safari: layout stays, visual shrinks");
  assert.equal(viewportKeyboardPx(844, { height: 500, offsetTop: 40 }), 304, "subtract offsetTop");
  assert.equal(viewportKeyboardPx(500, { height: 500, offsetTop: 0 }), 0, "iOS PWA: innerHeight already shrunk");
  assert.equal(viewportKeyboardPx(844, null), 0);
  assert.equal(isKeyboardChromeOpen(0, false), false);
  assert.equal(isKeyboardChromeOpen(0, true), true, "note focus hides footer even when kb px is 0");
  assert.equal(isKeyboardChromeOpen(280, false), true);
}

function checkNoteScroll() {
  const box = { top: 0, bottom: 500 };
  assert.equal(noteScrollDelta({ top: 400, bottom: 480, height: 80 }, box, 80, 8), 0, "already in the band");
  assert.equal(noteScrollDelta({ top: 430, bottom: 510, height: 80 }, box, 80, 8), 18, "too low: scroll down");
  assert.equal(noteScrollDelta({ top: 40, bottom: 120, height: 80 }, box, 80, 8), -48, "under header: scroll up");
  assert.equal(noteScrollDelta({ top: 0, bottom: 500, height: 500 }, box, 80, 8), 8, "taller than the band: pin bottom so it grows up");
  assert.equal(noteScrollDelta({ top: 200, bottom: 280, height: 80 }, box, 80, 8, true), -212, "keyboard up: pull the note down onto the dock");
  assert.equal(noteScrollDelta({ top: 300, bottom: 500, height: 200 }, box, 80, 8, true), 8, "keyboard up: extra lines push the bottom — scroll so it grows up");
}

function checkSessionAdvance() {
  const pull = {
    secs: [
      { ids: ["b1"] },
      { ids: ["b2", "b3", "b4"] },
      { ids: ["b10", "b5"] },
      { ids: ["b6", "b7", "b8"] },
      { ids: ["b9", "b11"] },
    ],
  };
  const ids = sessionExIds(pull);
  assert.deepEqual(ids, ["b1", "b2", "b3", "b4", "b10", "b5", "b6", "b7", "b8", "b9", "b11"]);
  assert.equal(nextSessionExId(ids, "b4"), "b10", "Pull order uses sections, not catalog (b5)");
  assert.equal(nextSessionExId(ids, "b11"), null, "last exercise has no next");
  assert.deepEqual(afterCompleteOpenIds({ b4: true }, "b4", ids), { b4: false, b10: true });
  assert.deepEqual(afterCompleteOpenIds({ b11: true }, "b11", ids), { b11: false });
  const legs = { secs: [{ ids: ["c1", "c2"] }, { ids: ["c4", "c11", "c5"] }, { ids: ["c7", "c12", "c9", "c10"] }] };
  assert.equal(nextSessionExId(sessionExIds(legs), "c4"), "c11");
  assert.equal(nextSessionExId(sessionExIds(legs), "c10"), null);
}

function checkPadPlan() {
  const two = [{ w: 20, r: 15 }, { w: 15, r: 15 }];
  const three = padPlan(two, 3, { w: 0, r: 12 });
  assert.equal(three.length, 3);
  assert.deepEqual(three[0], { w: 20, r: 15 });
  assert.deepEqual(three[2], { w: 15, r: 15 }, "third set copies the last planned set");
  assert.equal(padPlan(two, 2).length, 2);
  assert.equal(padPlan([], 3, { w: 0, r: 12 }).length, 3);
}

checkClock();
checkVuelta();
checkOpt();
checkPadPlan();
checkNoteDock();
checkViewportKeyboard();
checkNoteScroll();
checkSessionAdvance();
console.log("exTools ok");

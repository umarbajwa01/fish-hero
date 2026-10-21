import assert from "node:assert/strict";
import { createExperience } from "../src/scene/createExperience.js";
import { createCanvasRenderer } from "../src/scene/renderers.js";
import { createSwimmer, advanceSwimmer, pointerToLocal, resolveTarget, angleDifference } from "../src/scene/steering.js";
import { makeSurface, deformSurface, fishSize, NOSE_U } from "../src/scene/fishSurface.js";

import { createSwimRig, updateSwimRig, skinPoint, sampleSpine, JOINTS } from "../src/scene/swimRig.js";

function browserHarness({ failAtStart = false, reduced = false, noCanvas = false } = {}) {
  const events = new Map(), raf = new Map(), children = [];
  const context = new Proxy({ draws: 0 }, { get(target, key) {
    if (key === "drawImage") return () => target.draws++;
    if (key in target) return target[key];
    return () => {};
  } });
  let now = performance.now(), id = 0, readyCount = 0, frame, fail, resize;
  const host = {
    clientWidth: 1200, clientHeight: 800, style: {}, dataset: {},
    getBoundingClientRect: () => ({ left: 37, top: 83, width: host.clientWidth, height: host.clientHeight }),
    appendChild: child => children.push(child),
    querySelectorAll: () => [...children],
  };
  globalThis.window = {
    devicePixelRatio: 1,
    addEventListener: (name, listener) => events.set(name, listener),
    removeEventListener: (name, listener) => { if (events.get(name) === listener) events.delete(name); },
    requestAnimationFrame: fn => { raf.set(++id, fn); return id; },
    cancelAnimationFrame: key => raf.delete(key),
  };
  globalThis.document = {
    hidden: false,
    createElement: tag => {
      const element = { style: {}, setAttribute() {}, getContext: () => noCanvas ? null : context,
        remove: () => { const i = children.indexOf(element); if (i >= 0) children.splice(i, 1); },
      };
      return element;
    },
  };
  globalThis.ResizeObserver = class { constructor(fn) { resize = fn; } observe() {} disconnect() {} };
  globalThis.Image = class {
    naturalWidth = 1774; naturalHeight = 887;
    set src(value) { this.url = value; this.onload?.(); }
    get src() { return this.url; }
  };
  const wrap = renderer => {
    const render = renderer.render.bind(renderer);
    renderer.render = args => { frame = { ...args, state: { ...args.state } }; render(args); };
    return renderer;
  };
  const engine = createExperience(host, {
    scroll: { current: 0 }, reducedMotion: reduced, onReady: () => readyCount++,
    rendererFactory: (host, onFailure) => {
      fail = onFailure;
      if (failAtStart) throw new Error("Expected test: GPU unavailable");
      return wrap({ type: "webgl", resize() {}, setImage() {}, render() {}, dispose() {} });
    },
    fallbackFactory: host => wrap(createCanvasRenderer(host)),
  });
  function tick(count = 1, hz = 60) {
    for (let i = 0; i < count; i++) {
      now += 1000 / hz;
      const jobs = [...raf.values()];
      raf.clear();
      jobs.forEach(fn => fn(now));
    }
  }
  function pointer(x, y, type = "pointermove", pointerType = "mouse") {
    events.get(type)?.({ clientX: x + 37, clientY: y + 83, pointerType, type });
  }
  return { engine, tick, pointer, host, events, raf, context, children,
    get frame() { return frame; }, get readyCount() { return readyCount; },
    loseContext: () => fail(new Error("Expected test: GPU context loss")),
    resize: (width, height) => { host.clientWidth = width; host.clientHeight = height; resize(); },
  };
}

const originalWarn = console.warn;
console.warn = () => {};
try {
  for (const failAtStart of [false, true]) {
    for (const reduced of [false, true]) {
      const h = browserHarness({ failAtStart, reduced });
      h.pointer(1010, 640);
      h.tick(240);
      assert.ok(Math.hypot(h.frame.state.x - 1010, h.frame.state.y - 640) < 1, "The fish nose must reach the actual pointer in every renderer/motion mode");
      h.tick(600);
      assert.ok(Math.hypot(h.frame.state.x - 1010, h.frame.state.y - 640) < 1, "Cursor ownership must survive more than five seconds of inactivity");
      h.pointer(120, 110, "pointermove", "touch");
      h.tick(240);
      assert.ok(Math.hypot(h.frame.state.x - 120, h.frame.state.y - 110) < 1, "Touch movement must update the same target");
      h.engine.setPaused(true);
      const before = { ...h.frame.state };
      h.pointer(950, 420);
      h.tick(60);
      assert.deepEqual(h.frame.state, before, "Explicit pause must hold position");
      h.engine.setPaused(false);
      h.tick(240);
      assert.ok(Math.abs(h.frame.state.x - 950) < 1, "Resume must follow the newest pointer");
      h.resize(600, 400);
      h.tick(240);
      assert.ok(Math.abs(h.frame.state.x - 475) < 1 && Math.abs(h.frame.state.y - 210) < 1, "Resize must preserve normalized target coordinates");
      h.engine.setWireframe(true);
      h.tick();
      assert.equal(h.frame.skeleton, true);
      h.engine.setWireframe(false);
      h.tick();
      assert.equal(h.frame.skeleton, false);
      assert.equal(h.readyCount, 1);
      if (failAtStart) assert.ok(h.context.draws > 0, "Fallback must draw animated texture frames");
      h.engine.dispose();
      assert.equal(h.events.size, 0, "No leaked pointer listeners after unmount");
      assert.equal(h.raf.size, 0, "No leaked animation loop after unmount");
      assert.equal(h.children.length, 0);
    }
  }
  const h = browserHarness();
  h.pointer(100, 600);
  h.tick(5);
  const beforeLoss = h.frame.state.x;
  h.loseContext();
  h.tick();
  assert.equal(h.host.dataset.renderer, "canvas");
  assert.ok(Math.abs(h.frame.state.x - beforeLoss) < 30, "Context loss must preserve position without a reset");
  h.pointer(1100, 100);
  h.tick(240);
  assert.ok(Math.abs(h.frame.state.x - 1100) < 1);
  assert.ok(h.context.draws > 0);
  h.engine.dispose();

  const dom = browserHarness({ failAtStart: true, noCanvas: true });
  dom.pointer(500, 300);
  dom.tick(240);
  assert.equal(dom.host.dataset.renderer, "dom");
  assert.match(dom.children[0].style.transform, /translate\(500/);
  dom.engine.dispose();
} finally { console.warn = originalWarn; }

const pointer = { x: 0.8, y: 0.1, seen: true };
assert.deepEqual(resolveTarget(pointer, 1000, 700, 1000, true, 1), { x: 800, y: 70 });
assert.deepEqual(pointerToLocal({ clientX: 137, clientY: 233 }, { left: 37, top: 83, width: 1000, height: 500 }), { x: 0.1, y: 0.3 });
function simulate(hz) {
  const state = createSwimmer();
  for (let i = 0; i < hz * 4; i++) advanceSwimmer(state, { x: 80, y: 650 }, 1 / hz);
  return state;
}
const slow = simulate(30), fast = simulate(144);
assert.ok(Math.hypot(slow.x - fast.x, slow.y - fast.y) < 0.00001);
assert.ok(Math.abs(angleDifference(-Math.PI + 0.02, Math.PI - 0.02) - 0.04) < 1e-8);
const surface = makeSurface();
const size = fishSize(1200, 800, 2);
const state = createSwimmer();
const rig = createSwimRig(state, size);
let maxBend = 0, maxSlip = 0, maxBodyArc = 0;
for (let i = 0; i < 900; i++) {
  advanceSwimmer(state, { x: 600 + Math.sin(i / 50) * 360, y: 400 + Math.cos(i / 70) * 240 }, 1 / 60);
  updateSwimRig(rig, state, size, 1 / 60, false);
  deformSurface(surface, rig);
  assert.ok(surface.positions.every(Number.isFinite));
  const nose = skinPoint(rig, NOSE_U, 0.5);
  assert.ok(Math.hypot(nose.x, nose.y) < 0.001, "The nose stays attached to the pointer-following head");
  for (let j = 1; j < rig.joints.length; j++) {
    const a = rig.joints[j - 1], b = rig.joints[j];
    assert.ok(Math.abs(Math.hypot(b.x - a.x, b.y - a.y) - size.length * NOSE_U / JOINTS) < 0.001, "Curving must not stretch the body");
  }
  const peduncle = sampleSpine(rig, 0.34);
  const belly = skinPoint(rig, 0.61, 0.5);
  const chord = Math.hypot(peduncle.x, peduncle.y);
  maxBodyArc = Math.max(maxBodyArc, Math.abs(belly.x * peduncle.y - belly.y * peduncle.x) / Math.max(1, chord));
  maxBend = Math.max(maxBend, Math.abs(angleDifference(peduncle.angle, rig.joints[0].angle)));
  maxSlip = Math.max(maxSlip, Math.abs(state.vx * Math.sin(state.heading) - state.vy * Math.cos(state.heading)));
}
assert.ok(maxBodyArc > size.length * 0.08, "The visible belly must form a substantial arc, not just bend hidden tail vertices");
assert.ok(maxBend > 1.1, "Turns must visibly articulate the torso, not rotate a straight stick");
assert.ok(maxSlip < 0.001, "Forward motion must align with the head, never slide sideways or backwards");

for (const reduced of [false, true]) {
  const s = createSwimmer();
  const r = createSwimRig(s, size);
  s.heading += Math.PI / 2;
  updateSwimRig(r, s, size, 0.05, reduced);
  assert.ok(Math.abs(angleDifference(r.joints[0].angle, s.heading)) < 0.001);
  assert.ok(Math.abs(angleDifference(r.joints[28].angle, s.heading)) > 0.5, "The tail must lag the head in both motion preference modes");
}

// Pectoral membranes animate independently even when spine pose is held fixed.
rig.reduced = false;
rig.phase = 0;
const finA = skinPoint(rig, 0.74, 0.09);
rig.phase = Math.PI / 2;
const finB = skinPoint(rig, 0.74, 0.09);
assert.ok(Math.hypot(finB.x - finA.x, finB.y - finA.y) > 8, "Fins require their own stroke, not just the body transform");

// Reduced-motion users still steer articulated turns, then settle completely.
const still = createSwimmer();
const resting = createSwimRig(still, size);
for (let i = 0; i < 360; i++) {
  advanceSwimmer(still, { x: 120, y: 650 }, 1 / 60, true);
  updateSwimRig(resting, still, size, 1 / 60, true);
}
const lastPhase = still.phase;
advanceSwimmer(still, { x: 120, y: 650 }, 1 / 60, true);
assert.equal(still.phase, lastPhase, "Reduced motion must stop the ambient swim cycle at rest");
console.log(`PASS: pointer/touch and renderer failover regressions; 900 articulated poses; ${Math.round(maxBend * 180 / Math.PI)}° torso bend and ${Math.round(maxBodyArc)}px visible belly arc; fixed segment lengths; no sideways slip; delayed tail; independent fins; reduced-motion articulation and rest.`);

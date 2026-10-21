import { angleDifference, clamp } from "./steering.js";

export const JOINTS = 40;
export const NOSE_U = 0.968;
const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function createSwimRig(state, size) {
  const rig = {
    time: 0, phase: state.phase, activity: 0, turn: 0, reduced: false,
    history: [{ time: -3, angle: state.heading }, { time: 0, angle: state.heading }],
    joints: Array.from({ length: JOINTS + 1 }, () => ({ x: 0, y: 0, angle: state.heading })),
    size,
  };
  updateSwimRig(rig, state, size, 0, false);
  return rig;
}

function pastHeading(history, time) {
  let low = 0, high = history.length - 1;
  if (time <= history[0].time) return history[0].angle;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (history[mid].time <= time) low = mid;
    else high = mid;
  }
  const a = history[low], b = history[high];
  const blend = clamp((time - a.time) / Math.max(0.00001, b.time - a.time), 0, 1);
  return a.angle + angleDifference(b.angle, a.angle) * blend;
}

export function updateSwimRig(rig, state, size, dt, reduced) {
  rig.size = size;
  rig.reduced = reduced;
  rig.time += dt;
  rig.phase = state.phase;
  rig.turn += (state.turn - rig.turn) * (1 - Math.exp(-4 * dt));
  const effort = clamp(state.speed / (size.length * 1.1), 0, 1);
  rig.activity += (effort - rig.activity) * (1 - Math.exp(-3.5 * dt));
  rig.history.push({ time: rig.time, angle: state.heading });
  while (rig.history.length > 2 && rig.history[1].time < rig.time - 2) rig.history.shift();

  // The same turn reaches the shoulders, belly, peduncle and tail at different
  // times. Integrating joint directions preserves body length through C turns.
  const delay = reduced ? 0.42 : 0.90 - rig.activity * 0.10;
  const spacing = size.length * NOSE_U / JOINTS;
  for (let i = 0; i <= JOINTS; i++) {
    const q = i / JOINTS;
    const lag = smooth(0.06, 0.67, q) * delay;
    const envelope = smooth(0.10, 0.70, q);
    const amplitude = 0.54 + rig.activity * 0.72;
    const wave = Math.sin(rig.phase - q * 7.1) * amplitude * envelope * (reduced ? rig.activity * 0.55 : 1);
    const remembered = pastHeading(rig.history, rig.time - lag);
    let angle = remembered + wave;
    if (i) {
      const parent = rig.joints[i - 1];
      angle = parent.angle + clamp(angleDifference(angle, parent.angle), -0.14, 0.14);
      const middleAngle = parent.angle + angleDifference(angle, parent.angle) / 2;
      rig.joints[i].x = parent.x - Math.cos(middleAngle) * spacing;
      rig.joints[i].y = parent.y - Math.sin(middleAngle) * spacing;
    } else {
      rig.joints[i].x = 0;
      rig.joints[i].y = 0;
    }
    rig.joints[i].angle = angle;
  }
  return rig;
}

export function sampleSpine(rig, u) {
  const index = (NOSE_U - u) / NOSE_U * JOINTS;
  if (index <= 0) {
    const head = rig.joints[0], distance = (u - NOSE_U) * rig.size.length;
    return { x: Math.cos(head.angle) * distance, y: Math.sin(head.angle) * distance, angle: head.angle };
  }
  const low = Math.min(JOINTS - 1, Math.floor(index));
  const blend = Math.min(1, index - low);
  const a = rig.joints[low], b = rig.joints[low + 1];
  return {
    x: a.x + (b.x - a.x) * blend,
    y: a.y + (b.y - a.y) * blend,
    angle: a.angle + angleDifference(b.angle, a.angle) * blend,
  };
}

function finPoint(rig, u, v, rootU, rootRadius, phaseOffset, strength) {
  const side = v < 0.5 ? -1 : 1;
  const root = sampleSpine(rig, rootU);
  const rootY = side * rig.size.height * rootRadius;
  const dx = (u - rootU) * rig.size.length;
  const dy = (v - 0.5) * rig.size.height - rootY;
  const reach = clamp(Math.hypot(dx, dy) / (rig.size.length * 0.30), 0, 1);
  const stroke = Math.sin(rig.phase * 0.78 - phaseOffset + side * 0.6);
  const drag = Math.sin(rig.phase * 1.12 - reach * 3.1 - phaseOffset);
  const flex = rig.reduced ? 0 : side * strength * (stroke * 0.65 + drag * reach * reach * 0.35);
  const angle = root.angle + flex - clamp(rig.turn, -2, 2) * reach * 0.075;
  const fan = rig.reduced ? 1 : 0.91 + 0.09 * Math.cos(rig.phase * 0.78 - phaseOffset + side * 0.6);
  return {
    x: root.x - Math.sin(root.angle) * rootY + Math.cos(angle) * dx - Math.sin(angle) * dy * fan,
    y: root.y + Math.cos(root.angle) * rootY + Math.sin(angle) * dx + Math.cos(angle) * dy * fan,
  };
}

export function skinPoint(rig, u, v) {
  const spine = sampleSpine(rig, u);
  const offset = (v - 0.5) * rig.size.height;
  const point = {
    x: spine.x - Math.sin(spine.angle) * offset,
    y: spine.y + Math.cos(spine.angle) * offset,
  };
  const lateral = Math.abs(v - 0.5);
  // Pectoral and pelvic fins pivot around their roots, then ripple towards tips.
  // Continuous weights keep the original texture joined to the body.
  const pectoral = smooth(0.11, 0.25, lateral) * smooth(0.54, 0.66, u) * (1 - smooth(0.89, 0.96, u));
  const pelvic = smooth(0.10, 0.23, lateral) * smooth(0.40, 0.48, u) * (1 - smooth(0.58, 0.66, u));
  if (pectoral > 0) {
    const fin = finPoint(rig, u, v, 0.83, 0.10, 0.9, 0.32);
    point.x += (fin.x - point.x) * pectoral;
    point.y += (fin.y - point.y) * pectoral;
  }
  if (pelvic > 0) {
    const fin = finPoint(rig, u, v, 0.64, 0.075, 1.7, 0.23);
    point.x += (fin.x - point.x) * pelvic;
    point.y += (fin.y - point.y) * pelvic;
  }
  // Separate flexible caudal membrane, driven behind the peduncle's stroke.
  const tail = 1 - smooth(0.22, 0.37, u);
  if (tail > 0) {
    const root = sampleSpine(rig, 0.34);
    const reach = clamp((0.34 - u) / 0.34, 0, 1);
    const motion = rig.reduced ? rig.activity : 1;
    const angle = root.angle + Math.sin(rig.phase - 4.8 - reach * 1.7) * (0.12 + rig.activity * 0.20) * reach * motion;
    const dx = (u - 0.34) * rig.size.length;
    const sway = Math.sin(rig.phase - 5.1 - reach * 2) * reach * reach * rig.size.length * 0.028 * motion;
    const fan = 1 - (0.06 - Math.sin(rig.phase - 4.9) * 0.06) * motion;
    const x = root.x + Math.cos(angle) * dx - Math.sin(angle) * (offset * fan + sway);
    const y = root.y + Math.sin(angle) * dx + Math.cos(angle) * (offset * fan + sway);
    point.x += (x - point.x) * tail;
    point.y += (y - point.y) * tail;
  }
  return point;
}

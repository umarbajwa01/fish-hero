const TAU = Math.PI * 2;
export const CURSOR_SPEED_SCALE = 0.995;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const angleDifference = (to, from) =>
  ((((to - from + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

export function createSwimmer(width = 1200, height = 800) {
  return {
    x: width * 0.67, y: height * 0.36,
    vx: 0, vy: 0, heading: -0.48, turn: 0, speed: 0, phase: 0,
  };
}

function step(state, target, dt, reduced, length, speedScale) {
  const dx = target.x - state.x, dy = target.y - state.y;
  const distance = Math.hypot(dx, dy);
  // A fish steers before it translates: velocity always follows its heading.
  // Unlike a spring on x/y, this cannot slide backwards through a sharp turn.
  const error = distance > 1.5 ? angleDifference(Math.atan2(dy, dx), state.heading) : 0;
  const maxTurn = reduced ? 5.2 : 3.8;
  const desiredTurn = distance > 1.5 ? clamp(error * 5.2, -maxTurn, maxTurn) : 0;
  const acceleration = reduced ? 24 : 15;
  const turnChange = clamp(desiredTurn - state.turn, -acceleration * dt, acceleration * dt);
  state.turn += turnChange;
  if (Math.abs(state.turn * dt) > Math.abs(error)) state.turn = error / dt;
  state.heading += state.turn * dt;
  const alignment = Math.max(0.12, Math.cos(error));
  const cruise = Math.min(length * 1.55, distance * 3.4) * speedScale;
  const pulse = 0.94 + Math.sin(state.phase - 0.7) * 0.06;
  const requestedSpeed = distance < 1.5 ? 0 : cruise * alignment * pulse;
  state.speed += (requestedSpeed - state.speed) * (1 - Math.exp(-7 * dt));
  // Brake before arrival and through tight corners, rather than orbiting a
  // stationary cursor because residual speed exceeds the available turn radius.
  state.speed = Math.min(state.speed, distance * 3 * alignment * alignment * speedScale);
  const travel = Math.min(state.speed * dt, distance);
  if (distance < 1.5 || (travel >= distance && Math.abs(error) < 0.2)) {
    state.x = target.x;
    state.y = target.y;
    state.vx = state.vy = state.speed = 0;
  } else {
    state.vx = Math.cos(state.heading) * state.speed;
    state.vy = Math.sin(state.heading) * state.speed;
    state.x += Math.cos(state.heading) * travel;
    state.y += Math.sin(state.heading) * travel;
  }
  // Integrating phase avoids a jump in the swim cycle when speed changes.
  const activity = Math.min(1, state.speed / (length * 1.1));
  if (!reduced || state.speed > 4) state.phase += dt * TAU * (0.52 + activity * 0.58);
}

export function advanceSwimmer(state, target, delta, reduced = false, length = 660, speedScale = CURSOR_SPEED_SCALE) {
  // Small substeps keep steering stable under low refresh rates and tab resumes.
  let remaining = clamp(delta, 0, 0.05);
  while (remaining > 1e-8) {
    const dt = Math.min(remaining, 1 / 120);
    step(state, target, dt, reduced, length, speedScale);
    remaining -= dt;
  }
  return state;
}

export function pointerToLocal(event, rect) {
  if (!rect.width || !rect.height) return null;
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
  };
}

export function resolveTarget(pointer, width, height, time, reduced, scroll = 0) {
  if (pointer.seen) return { x: pointer.x * width, y: pointer.y * height };
  return {
    x: width * (0.67 + (reduced ? 0 : Math.sin(time * 0.28) * 0.055)),
    y: height * (0.36 + (reduced ? 0 : Math.sin(time * 0.38) * 0.07) - scroll * 0.06),
  };
}

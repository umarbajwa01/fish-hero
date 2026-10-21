import { createSwimmer, advanceSwimmer, pointerToLocal, resolveTarget, CURSOR_SPEED_SCALE } from "./steering.js";
import { fishSize } from "./fishSurface.js";
import { createSwimRig, updateSwimRig } from "./swimRig.js";
import { createWebGLRenderer, createCanvasRenderer } from "./renderers.js";
import { THEMES } from "../themes.js";

export function createExperience(host, options) {
  let width = host.clientWidth || window.innerWidth;
  let height = host.clientHeight || window.innerHeight;
  const state = createSwimmer(width, height);
  const rig = createSwimRig(state, fishSize(width, height, 2));
  const pointer = { x: 0.67, y: 0.36, seen: false };
  let alive = true, paused = false, reduced = !!options.reducedMotion;
  let time = 0, reveal = 0, ready = false, wireframe = null;
  let previous = performance.now(), frameId, failure = null, asset = null;
  let renderer;
  const factory = options.rendererFactory || createWebGLRenderer;
  const fallbackFactory = options.fallbackFactory || createCanvasRenderer;
  const onFailure = (error) => { failure = error; };
  try {
    renderer = factory(host, onFailure);
  } catch (error) {
    console.warn("Koi: using animated Canvas renderer.", error);
    host.querySelectorAll("canvas").forEach((canvas) => canvas.remove());
    renderer = fallbackFactory(host);
  }
  host.dataset.renderer = renderer.type;
  renderer.resize(width, height);
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    if (!alive) return;
    asset = image;
    renderer.setImage(image);
  };
  image.onerror = () => {
    console.error("Koi texture could not load.");
    if (alive && !ready) { ready = true; options.onReady(); }
  };
  image.src = "/assets/koi-coral-v2.png";

  function onPointer(event) {
    const local = pointerToLocal(event, host.getBoundingClientRect());
    if (!local) return;
    Object.assign(pointer, local, { seen: true });
  }
  // Capture also receives events above buttons, dialogs and the title layer.
  window.addEventListener("pointermove", onPointer, { passive: true, capture: true });
  window.addEventListener("pointerdown", onPointer, { passive: true, capture: true });
  function resize() {
    const nextWidth = host.clientWidth || width;
    const nextHeight = host.clientHeight || height;
    state.x *= nextWidth / width;
    state.y *= nextHeight / height;
    width = nextWidth;
    height = nextHeight;
    renderer.resize(width, height);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  function frame(now) {
    if (!alive) return;
    frameId = window.requestAnimationFrame(frame);
    const delta = Math.min(Math.max((now - previous) / 1000, 0), 0.05);
    previous = now;
    if (document.hidden) return;
    if (failure) {
      console.warn("Koi: switching to the animated Canvas renderer.", failure);
      renderer.dispose();
      renderer = fallbackFactory(host);
      renderer.resize(width, height);
      if (asset) renderer.setImage(asset);
      host.dataset.renderer = renderer.type;
      failure = null;
    }
    const size = fishSize(width, height, asset ? asset.naturalWidth / asset.naturalHeight : 2);
    if (!paused) {
      time += delta;
      const target = resolveTarget(pointer, width, height, time, reduced, options.scroll?.current || 0);
      // Reduced motion suppresses ambient swimming, never direct user input.
      advanceSwimmer(state, target, delta, reduced, size.length, pointer.seen ? CURSOR_SPEED_SCALE : 1);
      updateSwimRig(rig, state, size, delta, reduced);
    }
    if (asset) {
      reveal = Math.min(1, reveal + delta * (reduced ? 20 : 5));
      if (!ready) { ready = true; options.onReady(); }
    }
    try {
      renderer.render({ state, rig, size, time, reduced, skeleton: wireframe === true, reveal });
    } catch (error) {
      if (renderer.type === "webgl") failure = error;
      else throw error;
    }
  }
  frameId = window.requestAnimationFrame(frame);
  return {
    setTheme(theme) { host.style.filter = (THEMES[theme] || THEMES.coral).fishFilter; },
    setWireframe(value) { wireframe = value; },
    setPaused(value) { paused = value; previous = performance.now(); },
    setReducedMotion(value) { reduced = value; },
    dispose() {
      alive = false;
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer, true);
      window.removeEventListener("pointerdown", onPointer, true);
      image.onload = null;
      image.onerror = null;
      renderer.dispose();
    },
  };
}

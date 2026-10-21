import * as THREE from "three";
import { makeSurface, deformSurface, skeletonPaths } from "./fishSurface.js";

export function createWebGLRenderer(host, onFailure) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "default" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10);
  camera.position.z = 1;
  const group = new THREE.Group();
  scene.add(group);
  const surface = makeSurface();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(surface.positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("uv", new THREE.BufferAttribute(surface.uvs, 2));
  geometry.setIndex(surface.indices);
  const material = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  group.add(mesh);
  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array(1800);
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
  const lineMaterial = new THREE.LineBasicMaterial({ color: "#f5f0e0", transparent: true, opacity: 0.85, depthTest: false });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  lines.frustumCulled = false;
  group.add(lines);
  let texture = null;
  const lost = (event) => { event.preventDefault(); onFailure(new Error("WebGL context lost")); };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  renderer.debug.onShaderError = () => onFailure(new Error("WebGL shader compilation failed"));
  return {
    type: "webgl",
    resize(width, height) {
      camera.right = width;
      camera.bottom = height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    },
    setImage(image) {
      texture?.dispose();
      texture = new THREE.Texture(image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      material.map = texture;
      material.needsUpdate = true;
    },
    render({ state, rig, skeleton, reveal }) {
      group.position.set(state.x, state.y, 0);
      deformSurface(surface, rig);
      geometry.attributes.position.needsUpdate = true;
      mesh.visible = !!texture && !skeleton;
      material.opacity = reveal;
      lines.visible = skeleton;
      if (lines.visible) {
        let index = 0;
        for (const path of skeletonPaths(rig)) {
          for (let i = 1; i < path.length; i++) {
            for (const point of [path[i - 1], path[i]]) {
              linePositions[index++] = point.x;
              linePositions[index++] = point.y;
              linePositions[index++] = 0.1;
            }
          }
        }
        lineGeometry.setDrawRange(0, index / 3);
        lineGeometry.attributes.position.needsUpdate = true;
        lineMaterial.opacity = 0.85;
      }
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      geometry.dispose();
      lineGeometry.dispose();
      material.dispose();
      lineMaterial.dispose();
      texture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export function createCanvasRenderer(host) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return createDOMRenderer(host);
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  const surface = makeSurface(48, 12);
  let image, width = 1, height = 1, cells = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  function prepareCells() {
    let pixels;
    try {
      const source = document.createElement("canvas");
      source.width = image.naturalWidth;
      source.height = image.naturalHeight;
      const reader = source.getContext("2d", { willReadFrequently: true });
      reader.drawImage(image, 0, 0);
      pixels = reader.getImageData(0, 0, source.width, source.height)?.data;
    } catch { /* The complete grid works when pixel readback is unavailable. */ }
    cells = [];
    for (let col = 0; col < surface.columns; col++) {
      for (let row = 0; row < surface.rows; row++) {
        const sx = col / surface.columns * image.naturalWidth;
        const sy = row / surface.rows * image.naturalHeight;
        const sw = image.naturalWidth / surface.columns;
        const sh = image.naturalHeight / surface.rows;
        let visible = !pixels;
        if (pixels) {
          for (let y = Math.floor(sy); y < Math.min(image.naturalHeight, sy + sh + 1) && !visible; y++) {
            for (let x = Math.floor(sx); x < Math.min(image.naturalWidth, sx + sw + 1); x++) {
              if (pixels[(y * image.naturalWidth + x) * 4 + 3] > 2) { visible = true; break; }
            }
          }
        }
        if (visible) cells.push({ col, row, sx, sy, sw, sh });
      }
    }
  }

  function triangle(cell, originX, originY, ax, ay, bx, by, second) {
    ctx.save();
    ctx.transform(ax, ay, bx, by, originX, originY);
    // A small clip overlap removes antialiased cracks between adjacent patches.
    const e = 0.035;
    ctx.beginPath();
    if (second) {
      ctx.moveTo(1 + e, -2 * e); ctx.lineTo(1 + e, 1 + e); ctx.lineTo(-2 * e, 1 + e);
    } else {
      ctx.moveTo(-e, -e); ctx.lineTo(1 + 2 * e, -e); ctx.lineTo(-e, 1 + 2 * e);
    }
    ctx.closePath();
    ctx.clip();
    const padX = 3 / cell.sw, padY = 3 / cell.sh;
    ctx.drawImage(image, cell.sx - 3, cell.sy - 3, cell.sw + 6, cell.sh + 6,
      -padX, -padY, 1 + 2 * padX, 1 + 2 * padY);
    ctx.restore();
  }

  return {
    type: "canvas",
    setImage(value) { image = value; prepareCells(); },
    resize(w, h) { width = w; height = h; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); },
    render({ state, rig, skeleton, reveal }) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.translate(state.x, state.y);
      if (image && !skeleton) {
        ctx.globalAlpha = reveal;
        deformSurface(surface, rig);
        const p = surface.positions;
        for (const cell of cells) {
          const a = (cell.row * (surface.columns + 1) + cell.col) * 3;
          const b = a + 3, c = a + (surface.columns + 1) * 3, d = c + 3;
          triangle(cell, p[a], p[a + 1], p[b] - p[a], p[b + 1] - p[a + 1], p[c] - p[a], p[c + 1] - p[a + 1], false);
          triangle(cell, p[b] + p[c] - p[d], p[b + 1] + p[c + 1] - p[d + 1],
            p[d] - p[c], p[d + 1] - p[c + 1], p[d] - p[b], p[d + 1] - p[b + 1], true);
        }
      }
      if (skeleton) {
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = "#f5f0e0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const path of skeletonPaths(rig)) {
          path.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    dispose() { canvas.remove(); },
  };
}

// Even a browser without either canvas context still receives live pointer motion.
function createDOMRenderer(host) {
  const image = document.createElement("img");
  image.className = "koi-dom-surface";
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  host.appendChild(image);
  return {
    type: "dom",
    resize() {},
    setImage(value) { image.src = value.src; },
    render({ state, size, reveal }) {
      image.style.width = `${size.length}px`;
      image.style.height = `${size.height}px`;
      image.style.opacity = reveal;
      image.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.heading}rad) translate(-96.8%, -50%)`;
    },
    dispose() { image.remove(); },
  };
}

/**
 * The 3D spark plug: geometry, materials, lighting, the electric arc and the
 * spark particles. Framework-free — `createPlugScene` mounts into a host
 * element and returns a small control API. Loaded lazily (three.js is only
 * fetched on devices that can run it), driven by Plug3D.tsx.
 */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type PlugSceneApi = {
  /** Throw a spark: `power` 0.3 = idle crackle, 1+ = full ignition. */
  fire: (power?: number) => void;
  /** Where the spark gap is on screen, in viewport pixels. */
  gapClient: () => { x: number; y: number } | null;
  /** 0 → 1 as the hero scrolls away; turns and lifts the plug. */
  setScroll: (p: number) => void;
  /** Pointer position over the page, -1 → 1 on each axis. */
  setPointer: (x: number, y: number) => void;
  dispose: () => void;
};

const GAP = new THREE.Vector3(0, -0.775, 0);

/** A helix for the threads. */
class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(
    private r: number,
    private y0: number,
    private y1: number,
    private pitch: number,
  ) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const turns = (this.y1 - this.y0) / this.pitch;
    const a = t * turns * Math.PI * 2;
    return target.set(Math.cos(a) * this.r, this.y0 + t * (this.y1 - this.y0), Math.sin(a) * this.r);
  }
}

function lathe(points: [number, number][], segments = 72) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}

/** Ribbed ceramic insulator profile (radius, y), bottom → top. */
function insulatorProfile(): [number, number][] {
  const p: [number, number][] = [
    [0.0, 0.6],
    [0.26, 0.6],
    [0.3, 0.7],
    [0.3, 1.24],
  ];
  const ribs = 5;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const y = 1.24 + t * 0.78;
    const r = 0.262 + 0.04 * (0.5 + 0.5 * Math.cos(t * ribs * Math.PI * 2));
    p.push([r, y]);
  }
  p.push([0.24, 2.06], [0.15, 2.12], [0.0, 2.12]);
  return p;
}

/** The "JOE'S" label printed on the insulator, as a transparent texture. */
function labelTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  const cx = c.width / 2;
  g.textAlign = "center";
  g.textBaseline = "middle";
  // Shield panel, like the logo's label.
  g.strokeStyle = "rgba(20,20,20,0.85)";
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(cx - 250, 60);
  g.lineTo(cx + 250, 60);
  g.lineTo(cx + 250, 360);
  g.lineTo(cx, 470);
  g.lineTo(cx - 250, 360);
  g.closePath();
  g.stroke();
  g.fillStyle = "#c8101a";
  g.font = "italic 900 170px Kanit, Impact, sans-serif";
  g.fillText("JOE'S", cx, 170);
  g.fillStyle = "#151515";
  g.font = "italic 800 66px Kanit, Impact, sans-serif";
  g.fillText("GARAGE", cx, 300);
  g.font = "700 34px Kanit, sans-serif";
  g.fillText("HELENA, MT", cx, 380);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Soft round glow used for the spark halo and particles. */
function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(200,240,255,0.8)");
  grd.addColorStop(1, "rgba(120,200,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Midpoint-displacement lightning between two points. */
function boltPoints(a: THREE.Vector3, b: THREE.Vector3, spread: number, depth: number): THREE.Vector3[] {
  if (depth === 0) return [a, b];
  const m = a.clone().lerp(b, 0.5);
  m.x += (Math.random() - 0.5) * spread;
  m.y += (Math.random() - 0.5) * spread;
  m.z += (Math.random() - 0.5) * spread;
  return [...boltPoints(a, m, spread / 2, depth - 1).slice(0, -1), ...boltPoints(m, b, spread / 2, depth - 1)];
}

export function createPlugScene(host: HTMLElement, onFirstFrame: () => void): PlugSceneApi {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, 0.35, 10);
  camera.lookAt(0, 0.35, 0);

  // Brand lighting: red rim from behind-left, cool key from the right.
  const rim = new THREE.PointLight(0xff1a24, 60, 0, 2);
  rim.position.set(-3.2, 2.4, -2.5);
  const key = new THREE.PointLight(0x9fd8ff, 22, 0, 2);
  key.position.set(3.5, 1.2, 3.5);
  const sparkLight = new THREE.PointLight(0xbfe9ff, 0, 0, 2);
  scene.add(rim, key, new THREE.AmbientLight(0xffffff, 0.15));

  // ── Materials ──
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xe2e6eb, metalness: 1, roughness: 0.14 });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xb4bac2, metalness: 1, roughness: 0.3 });
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xf2eee5,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });
  const electrode = new THREE.MeshStandardMaterial({ color: 0x9aa0a7, metalness: 1, roughness: 0.38 });
  const label = new THREE.MeshStandardMaterial({ map: labelTexture(), transparent: true, roughness: 0.5 });

  // ── Geometry (axis = +Y, gap at y ≈ -0.78) ──
  const plug = new THREE.Group();
  plug.add(new THREE.Mesh(lathe(insulatorProfile(), 96), ceramic));
  const decal = new THREE.Mesh(new THREE.CylinderGeometry(0.303, 0.303, 0.5, 96, 1, true, -Math.PI, Math.PI * 2), label);
  decal.position.y = 0.97;
  plug.add(decal);
  plug.add(
    new THREE.Mesh(
      lathe([
        [0.0, 2.1],
        [0.11, 2.1],
        [0.11, 2.2],
        [0.145, 2.22],
        [0.145, 2.28],
        [0.1, 2.3],
        [0.1, 2.44],
        [0.07, 2.49],
        [0.0, 2.5],
      ]),
      chrome,
    ),
  );
  const crimp = new THREE.Mesh(
    lathe([
      [0.34, 0.6],
      [0.36, 0.64],
      [0.33, 0.7],
      [0.3, 0.72],
    ]),
    chrome,
  );
  plug.add(crimp);
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.34, 6), chrome);
  hex.position.y = 0.43;
  plug.add(hex);
  const hexBevel = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.05, 6), chrome);
  hexBevel.position.y = 0.625;
  plug.add(hexBevel);
  const gasket = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.07, 64), steel);
  gasket.position.y = 0.225;
  plug.add(gasket);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.74, 48), steel);
  core.position.y = -0.18;
  plug.add(core);
  plug.add(new THREE.Mesh(new THREE.TubeGeometry(new Helix(0.29, -0.52, 0.17, 0.075), 420, 0.026, 6), steel));
  plug.add(
    new THREE.Mesh(
      lathe([
        [0.0, -0.66],
        [0.06, -0.64],
        [0.13, -0.56],
        [0.17, -0.5],
      ]),
      ceramic,
    ),
  );
  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.14, 16), electrode);
  center.position.y = -0.69;
  plug.add(center);
  const ground = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.27, -0.52, 0),
    new THREE.Vector3(0.27, -0.74, 0),
    new THREE.Vector3(0.23, -0.85, 0),
    new THREE.Vector3(0.11, -0.875, 0),
    new THREE.Vector3(-0.04, -0.875, 0),
  ]);
  plug.add(new THREE.Mesh(new THREE.TubeGeometry(ground, 40, 0.04, 8), electrode));

  sparkLight.position.copy(GAP);
  plug.add(sparkLight);

  // ── Arc + halo ──
  const arcMat = new THREE.MeshBasicMaterial({ color: 0xeefcff, toneMapped: false });
  const bolts: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), arcMat);
    m.visible = false;
    plug.add(m);
    bolts.push(m);
  }
  const glowTex = glowTexture();
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0x9fdcff,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  halo.position.copy(GAP);
  halo.scale.setScalar(0.5);
  plug.add(halo);

  // ── Spark particles ──
  const MAX = 220;
  const pos = new Float32Array(MAX * 3);
  const vel = new Float32Array(MAX * 3);
  const life = new Float32Array(MAX);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const sparks = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      map: glowTex,
      color: 0xffc27a,
      size: 0.09,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  plug.add(sparks);
  let nextP = 0;

  const holder = new THREE.Group();
  holder.add(plug);
  plug.position.y = -0.7; // centre the plug on the holder's pivot
  holder.rotation.z = -0.24;
  scene.add(holder);

  // ── State ──
  let surgeUntil = 0;
  let surgePower = 0;
  let scrollP = 0;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let lastBolt = 0;
  let visible = true;
  let raf = 0;
  let first = true;
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();

  const setBolt = (m: THREE.Mesh, pts: THREE.Vector3[], radius: number) => {
    m.geometry.dispose();
    m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, radius, 4);
    m.visible = true;
  };

  const emit = (n: number, speed: number) => {
    for (let i = 0; i < n; i++) {
      const k = nextP++ % MAX;
      pos[k * 3] = GAP.x;
      pos[k * 3 + 1] = GAP.y;
      pos[k * 3 + 2] = GAP.z;
      const a = Math.random() * Math.PI * 2;
      const up = Math.random() * 0.6 - 0.1;
      const s = speed * (0.4 + Math.random());
      vel[k * 3] = Math.cos(a) * s;
      vel[k * 3 + 1] = up * s;
      vel[k * 3 + 2] = Math.sin(a) * s;
      life[k] = 0.5 + Math.random() * 0.7;
    }
  };

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole plug in frame however narrow the box gets.
    camera.position.z = 10 / Math.min(1, camera.aspect / 0.62);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
  });
  io.observe(host);

  const frame = () => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden) return;
    const t = clock.elapsedTime;
    const now = performance.now();
    const surging = now < surgeUntil;

    // Motion: idle sway + pointer + scroll.
    ptr.x += (ptr.tx - ptr.x) * 0.06;
    ptr.y += (ptr.ty - ptr.y) * 0.06;
    holder.rotation.y = Math.sin(t * 0.45) * 0.45 + ptr.x * 0.5 + scrollP * Math.PI * 1.2;
    holder.rotation.x = ptr.y * 0.25 + scrollP * 0.3;
    holder.position.y = Math.sin(t * 1.2) * 0.06 + scrollP * 1.4;

    // Arc: small crackle always, long bolts while surging.
    if (now - lastBolt > 45) {
      lastBolt = now;
      const top = new THREE.Vector3(0, -0.76, 0);
      const bottom = new THREE.Vector3(0, -0.84, 0);
      setBolt(bolts[0], boltPoints(top, bottom, 0.05, 3), 0.008);
      for (let i = 1; i < bolts.length; i++) {
        if (surging) {
          const a = Math.random() * Math.PI * 2;
          const len = 0.6 + Math.random() * 1.4 * Math.min(surgePower, 1.6);
          const end = GAP.clone().add(tmp.set(Math.cos(a) * len, -Math.random() * len, Math.sin(a) * len * 0.6));
          setBolt(bolts[i], boltPoints(GAP.clone(), end, len * 0.4, 5), 0.012);
        } else {
          bolts[i].visible = false;
        }
      }
    }
    const flicker = 0.7 + Math.random() * 0.6;
    sparkLight.intensity = (surging ? 18 * surgePower : 1.2) * flicker;
    halo.scale.setScalar((surging ? 0.9 + surgePower * 0.6 : 0.42) * flicker);
    (halo.material as THREE.SpriteMaterial).opacity = surging ? 1 : 0.7;

    // Particles.
    for (let k = 0; k < MAX; k++) {
      if (life[k] <= 0) {
        pos[k * 3 + 1] = -999;
        continue;
      }
      life[k] -= dt;
      vel[k * 3 + 1] -= 6 * dt;
      pos[k * 3] += vel[k * 3] * dt;
      pos[k * 3 + 1] += vel[k * 3 + 1] * dt;
      pos[k * 3 + 2] += vel[k * 3 + 2] * dt;
    }
    pGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    if (first) {
      first = false;
      onFirstFrame();
    }
  };
  raf = requestAnimationFrame(frame);

  return {
    fire(power = 1) {
      surgePower = power;
      surgeUntil = performance.now() + 250 + 700 * Math.min(power, 1.5);
      emit(Math.round(40 * power), 2.2 + power);
    },
    gapClient() {
      const r = canvas.getBoundingClientRect();
      const p = GAP.clone().applyMatrix4(plug.matrixWorld).project(camera);
      return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
    },
    setScroll(p) {
      scrollP = p;
    },
    setPointer(x, y) {
      ptr.tx = x;
      ptr.ty = y;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      [chrome, steel, ceramic, electrode, label, arcMat, halo.material, sparks.material].forEach((m) => m.dispose());
      label.map?.dispose();
      glowTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}

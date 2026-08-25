"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
// Named imports rather than `import * as THREE` — the namespace form makes it
// impossible for the bundler to prove which of three.js's exports are
// actually reachable, so the whole library (every geometry, material and
// loader) rides along in the chunk regardless of what this file touches.
// Naming exactly the five symbols used here lets tree-shaking drop the rest.
import { Color, Mesh, ShaderMaterial, Vector2 } from "three";
import { BACKDROPS } from "@/content/backdrops";

/* ==========================================================================
   LIVING BACKDROP

   One WebGL layer behind the entire page, not one per section.

   A single full-screen quad runs a domain-warped noise field. Each section
   declares a MOOD — three palette colours and one of five field modes — and
   the layer cross-fades between the mood of the section you are leaving and
   the one you are entering. So every section has its own background, but
   there is never a cut: the field flows from one into the next.

   Why one quad and not real geometry:
   · A fullscreen shader costs one draw call regardless of how elaborate the
     result looks. Five sections of distinct 3D scenes would cost five scenes'
     worth of geometry, materials and state changes.
   · The heavy part of the shader (the fbm warp) is computed once per pixel
     and shared by both blended modes, so a transition costs barely more than
     a static frame.
   · The playground's object cluster is the place for real geometry. This
     layer's job is atmosphere, and it must never compete with the type.
   ========================================================================== */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Bypass the projection matrix: the quad is already in clip space.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uAspect;
  uniform float uMixAB;      // 0 = mode A, 1 = mode B
  uniform float uModeA;
  uniform float uModeB;
  uniform float uIntensity;  // dialled down in the light theme
  uniform float uDark;       // 1 = ink, 0 = paper
  uniform vec2  uMouse;
  uniform vec3  uC1;
  uniform vec3  uC2;
  uniform vec3  uC3;
  uniform vec3  uC4;

  // -- noise ---------------------------------------------------------------
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    // Four octaves. Five was imperceptibly finer at this scale but is called
    // three times per pixel every frame — the single biggest lever on the
    // fragment cost of this shader, so it stays as low as the field can take
    // without resolving into a few big blobs.
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  // -- field modes ---------------------------------------------------------
  // Each takes the shared warped coordinate and warp value, so the expensive
  // part is computed once and only the cheap modulation differs per mode.
  float field(float mode, vec2 p, float n, float t) {
    if (mode < 0.5) {
      // 0 — AURORA: broad drifting bands.
      return 0.5 + 0.5 * sin((p.y * 1.6 + n * 2.6 + t * 0.12) * 3.14159);
    } else if (mode < 1.5) {
      // 1 — RIPPLE: concentric rings pushed around by the warp.
      float d = length(p - vec2(0.0, 0.0)) * 3.2;
      return 0.5 + 0.5 * sin(d * 2.4 - t * 0.5 + n * 3.0);
    } else if (mode < 2.5) {
      // 2 — LATTICE: a soft grid, bent by the warp. Reads as structure.
      vec2 g = fract((p + n * 0.5) * 2.4) - 0.5;
      float line = 1.0 - smoothstep(0.0, 0.16, min(abs(g.x), abs(g.y)));
      return clamp(line * 0.9 + n * 0.5 + 0.35, 0.0, 1.0);
    } else if (mode < 3.5) {
      // 3 — STRANDS: vertical filaments, like fibre under light.
      return 0.5 + 0.5 * sin(p.x * 5.0 + n * 5.5 + t * 0.2);
    }
    // 4 — ORBS: three slow metaball-ish wells.
    float s = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 c = vec2(sin(t * 0.14 + fi * 2.1) * 1.1, cos(t * 0.11 + fi * 1.7) * 0.7);
      s += 0.34 / (0.22 + length(p - c) * (1.1 + fi * 0.25));
    }
    return clamp(s * 0.5 + n * 0.4, 0.0, 1.0);
  }

  void main() {
    // Centred, aspect-corrected coordinates.
    vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.3;
    float t = uTime;

    // Pointer parallax — a slow lean, not a cursor-follow.
    uv += uMouse * 0.16;

    // Shared domain warp. This is the expensive part, done once.
    vec2 q = vec2(fbm(uv + t * 0.045), fbm(uv + vec2(3.2, 1.7) - t * 0.035));
    vec2 r = vec2(fbm(uv + q * 1.7 + t * 0.02), fbm(uv + q * 1.4 + vec2(8.3, 2.8)));
    float n = fbm(uv + r * 1.9);

    float a = field(uModeA, uv + r * 0.6, n, t);
    float b = field(uModeB, uv + r * 0.6, n, t);
    float f = mix(a, b, uMixAB);

    // Opacity follows the field, it is not applied flat across the quad.
    //
    // Painting the whole quad and relying on a low alpha floods the page with
    // a coloured wash — at any intensity high enough to see, the mid tone
    // covers everything and the page turns brown. Driving alpha from the field
    // instead means the flat page colour shows through everywhere except the
    // filaments themselves, so the layer can be vivid and still leave the page
    // black where it matters.
    // Trace a contour of the field rather than filling a region of it.
    //
    // Thresholding ("everything above 0.7 is lit") lights up a third of the
    // frame and the page turns to lava. A narrow Gaussian band around one
    // level set lights only where the field *crosses* that level, which draws
    // thin flowing threads — the same data, read as line work instead of as
    // fill. Two bands at different levels keep it from looking like a single
    // contour map.
    // One wide, soft band. Two narrow ones produced a dense craquelure that
    // fought every line of type on the page.
    float band = exp(-pow((f - 0.5) * 6.5, 2.0));
    float haze = smoothstep(0.30, 0.98, f);

    // Two light stops, not one. The thread's hue slides between them across
    // the frame and with the warp, so a single section reads as a colour
    // *combination* rather than one tinted glow — and the two hues meeting in
    // the middle is where the good part happens.
    float hue = clamp(0.5 + (uv.x * 0.22) + (r.y * 0.9) + sin(t * 0.06) * 0.18, 0.0, 1.0);
    vec3 lit = mix(uC3, uC4, smoothstep(0.15, 0.85, hue));

    vec3 col = mix(uC2, lit, band);
    col = mix(uC1, col, clamp(haze * 0.5 + band, 0.0, 1.0));

    // The field frames the page rather than sitting under it: strongest at the
    // edges, pulled well back through the middle where the type lives.
    float centre = 1.0 - smoothstep(0.05, 1.05, length((vUv - 0.5) * vec2(uAspect, 1.0)) * 1.35);
    float calm = 1.0 - centre * 0.88;

    // The light theme needs far less of this to read as atmosphere rather
    // than as a graphic printed on the page.
    float alpha = uIntensity * calm * (haze * 0.10 + band * 0.95) * mix(0.45, 1.0, uDark);

    // Slight dither. Large, very dark gradients band badly on 8-bit displays.
    float d = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
    col += (d - 0.5) * 0.012;

    gl_FragColor = vec4(col, alpha);
  }
`;

function Field({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const mat = useRef<ShaderMaterial>(null);
  const quad = useRef<Mesh>(null);
  const { size } = useThree();

  // The playground runs its own WebGL context with real geometry and
  // transmission. Two full-screen GPU workloads at once is the one place on
  // the page where they genuinely contend, and the playground already lights
  // itself — so this layer stands down while that section owns the screen.
  const yielded = useRef(false);
  useEffect(() => {
    const el = document.querySelector("#playground");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      yielded.current = e.isIntersecting;
      if (quad.current) quad.current.visible = !e.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Section elements, looked up once. This used to run `document.querySelector`
  // for every one of the nine sections on every single animation frame —
  // forever, for as long as the tab stayed open — which is a full DOM search
  // plus a forced layout read sixty times a second. The elements themselves
  // never change after mount, only their position on scroll, so they're
  // resolved once here and the frame loop below just reads `getBoundingClientRect`
  // off the cached nodes.
  const els = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    els.current = BACKDROPS.map((b) => document.querySelector<HTMLElement>(b.selector));
  }, []);

  // Live mood state, lerped toward the section's target every frame.
  const state = useRef({
    c1: new Color(), c2: new Color(), c3: new Color(), c4: new Color(),
    modeA: 0, modeB: 0, mix: 0, ready: false,
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uMixAB: { value: 0 },
      uModeA: { value: 0 },
      uModeB: { value: 0 },
      uIntensity: { value: 0.5 },
      uDark: { value: 1 },
      uMouse: { value: new Vector2() },
      uC1: { value: new Color("#08090b") },
      uC2: { value: new Color("#1a1520") },
      uC3: { value: new Color("#ff6a33") },
      uC4: { value: new Color("#6f88ac") },
    }),
    []
  );

  useEffect(() => {
    uniforms.uAspect.value = size.width / Math.max(1, size.height);
  }, [size, uniforms]);

  useFrame((_, dt) => {
    const u = mat.current?.uniforms;
    if (!u || yielded.current) return;
    const d = Math.min(dt, 1 / 30);
    u.uTime.value += d;

    const dark = document.documentElement.dataset.theme !== "paper";
    u.uDark.value += ((dark ? 1 : 0) - u.uDark.value) * Math.min(1, d * 3);

    // --- which section are we in, and how far between it and the next ------
    const vhMid = window.innerHeight * 0.42;
    let idx = 0;
    let blend = 0;
    for (let i = 0; i < BACKDROPS.length; i++) {
      const el = els.current[i];
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= vhMid) {
        idx = i;
        const next = els.current[Math.min(i + 1, BACKDROPS.length - 1)];
        const nextTop = next ? next.getBoundingClientRect().top : Infinity;
        const span = nextTop - top;
        blend = span > 0 && Number.isFinite(span) ? Math.min(1, Math.max(0, (vhMid - top) / span)) : 0;
      }
    }

    const from = BACKDROPS[idx];
    const to = BACKDROPS[Math.min(idx + 1, BACKDROPS.length - 1)];
    // Ease the hand-off so the change lands over the section boundary rather
    // than creeping the whole way down a section.
    const k = Math.min(1, Math.max(0, (blend - 0.55) / 0.4));
    const eased = k * k * (3 - 2 * k);

    const s = state.current;
    const palFrom = dark ? from.ink : from.paper;
    const palTo = dark ? to.ink : to.paper;

    const t1 = new Color(palFrom[0]).lerp(new Color(palTo[0]), eased);
    const t2 = new Color(palFrom[1]).lerp(new Color(palTo[1]), eased);
    const t3 = new Color(palFrom[2]).lerp(new Color(palTo[2]), eased);
    const t4 = new Color(palFrom[3]).lerp(new Color(palTo[3]), eased);

    const rate = s.ready ? Math.min(1, d * 2.2) : 1;
    s.ready = true;
    s.c1.lerp(t1, rate);
    s.c2.lerp(t2, rate);
    s.c3.lerp(t3, rate);
    s.c4.lerp(t4, rate);

    u.uC1.value.copy(s.c1);
    u.uC2.value.copy(s.c2);
    u.uC3.value.copy(s.c3);
    u.uC4.value.copy(s.c4);
    u.uModeA.value = from.mode;
    u.uModeB.value = to.mode;
    u.uMixAB.value += (eased - u.uMixAB.value) * Math.min(1, d * 4);

    const targetI = (dark ? from.intensity : from.intensity * 0.62) * (1 - eased) +
      (dark ? to.intensity : to.intensity * 0.62) * eased;
    u.uIntensity.value += (targetI - u.uIntensity.value) * Math.min(1, d * 2.5);

    u.uMouse.value.x += (mouse.current.x - u.uMouse.value.x) * Math.min(1, d * 1.6);
    u.uMouse.value.y += (mouse.current.y - u.uMouse.value.y) * Math.min(1, d * 1.6);
  });

  return (
    <mesh ref={quad} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Drives the render loop by hand instead of leaving the canvas on
 * `frameloop="always"`.
 *
 * `"always"` calls `gl.render` on every single display refresh for as long
 * as the canvas exists — a background layer never needs 60 (or 120) fresh
 * frames a second, the field drifts slowly enough that half that is
 * indistinguishable, and a hidden tab needs zero. Here the canvas runs in
 * `"demand"` mode and this component is the only thing calling `invalidate`,
 * on its own timer, so both the target rate and the pause condition are
 * explicit instead of inherited from the display's refresh rate.
 */
function Clock({ fps, paused }: { fps: number; paused: React.MutableRefObject<boolean> }) {
  const { invalidate } = useThree();
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const interval = 1000 / fps;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (paused.current) return;
      if (t - last < interval) return;
      last = t;
      invalidate();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate, paused]);
  return null;
}

export default function Backdrop() {
  const mouse = useRef({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);
  // Capped lower on small/coarse-pointer screens — same shader, same look,
  // just fewer physical pixels behind it. A phone's backing store at dpr
  // 2–3 pushes several times the fragment-shader work of a desktop tab at
  // the same CSS size, and the field is smooth by nature so it loses
  // nothing visible at a lower pixel ratio.
  const [maxDpr, setMaxDpr] = useState(1.2);
  const [fps, setFps] = useState(30);
  // Tab-hidden pause. A `requestAnimationFrame` loop is already throttled by
  // the browser in a background tab, but on desktop Chrome that throttle is
  // only ~1fps, not zero — this stops the `invalidate` calls outright rather
  // than relying on that.
  const paused = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!reduced);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = coarse || window.innerWidth < 768;
    setMaxDpr(small ? 1 : 1.2);
    setFps(small ? 24 : 30);
  }, []);

  useEffect(() => {
    const onVis = () => {
      paused.current = document.hidden;
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [enabled]);

  // Reduced motion: no shader, no per-frame GPU/JS dispatch at all — just the
  // flat page colour underneath, same as before the canvas has ever mounted.
  if (!enabled) return null;

  return (
    <div className="backdrop-layer" aria-hidden="true">
      <Canvas
        // The field is smooth by nature, so it survives a low pixel ratio far
        // better than geometry would — and this runs on every single section.
        dpr={[1, maxDpr]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
        frameloop="demand"
      >
        <Field mouse={mouse} />
        <Clock fps={fps} paused={paused} />
      </Canvas>
    </div>
  );
}

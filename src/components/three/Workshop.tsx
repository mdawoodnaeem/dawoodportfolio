"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/**
 * THE WORKSHOP
 *
 * Seven objects hanging in space that answer to the pointer: they lean away
 * as it passes, and a click shoves the whole cluster outward before it springs
 * back into formation. Nothing here is decorative motion on a timer — every
 * frame of it is a direct response to something the visitor did, which is the
 * difference between a toy and a screensaver.
 *
 * PERFORMANCE
 * · Three glass objects use the renderer's *built-in* transmission, which
 *   resolves in one shared pass for the whole scene. Drei's per-mesh
 *   MeshTransmissionMaterial would cost seven render targets a frame.
 * · The environment is built from Lightformers, not a downloaded HDR — the
 *   scene has no network dependency at all.
 * · The canvas only mounts near the viewport, drops to a single static frame
 *   under reduced motion, and sheds transmission entirely on small screens.
 */

type Kind = "glass" | "metal" | "ember";

type PieceDef = {
  kind: Kind;
  home: [number, number, number];
  scale: number;
  geometry: "ico" | "torus" | "knot" | "box" | "capsule" | "octa" | "sphere";
  /**
   * Idle angular velocity in rad/s about the world x, y and z axes. Mixed
   * signs and no shared factor between the three, on purpose: aligned or
   * proportional rates give a visible repeating loop, and a tumbling object
   * in free fall has no loop.
   */
  spin: [number, number, number];
};

/**
 * Positions are hand-placed, not random: the cluster reads as an arrangement
 * with a front, a back and a hole in the middle for the light to come through.
 */
const PIECES: PieceDef[] = [
  { kind: "glass", home: [-4.3, 0.35, 0.2], scale: 1.0, geometry: "ico", spin: [0.19, -0.34, 0.11] },
  { kind: "ember", home: [-2.6, -1.25, 1.2], scale: 0.58, geometry: "sphere", spin: [-0.27, 0.16, -0.21] },
  { kind: "metal", home: [-1.5, 1.5, -1.0], scale: 0.68, geometry: "torus", spin: [0.36, 0.09, -0.24] },
  { kind: "glass", home: [0.2, -0.25, 0.9], scale: 0.95, geometry: "knot", spin: [-0.14, 0.31, 0.18] },
  { kind: "metal", home: [2.1, 1.25, -0.5], scale: 0.78, geometry: "octa", spin: [0.23, -0.4, -0.13] },
  { kind: "ember", home: [2.9, -1.4, 0.4], scale: 0.62, geometry: "capsule", spin: [-0.33, -0.12, 0.26] },
  { kind: "glass", home: [4.4, 0.55, 0.6], scale: 0.62, geometry: "box", spin: [0.28, 0.22, -0.35] },
];

/**
 * The same seven objects, re-hung for a tall frame.
 *
 * The landscape arrangement spans about 9 units across. A phone at this
 * camera distance only sees ~4.5 units of width, so five of the seven sat
 * off-screen and the three that remained were cropped at the edges — which is
 * why the section looked broken on mobile rather than sparse.
 *
 * This is a re-layout, not a zoom-out: pulling the camera back far enough to
 * fit the wide cluster would shrink every object to a speck. The pieces are
 * stacked into a vertical drift instead, which is the shape a portrait
 * viewport actually has.
 */
const PIECES_PORTRAIT: PieceDef[] = PIECES.map((p, i) => ({
  ...p,
  home: [
    [-1.15, 1.2, -1.3, 0.3, -1.35, 1.25, -0.3][i],
    [2.05, 1.45, 0.15, -0.35, -1.25, -1.8, -2.5][i],
    [0.1, 1.0, -0.8, 0.7, -0.5, 0.4, 0.5][i],
  ] as [number, number, number],
}));

/** Shared mutable state — cheaper than React state for per-frame reads. */
type Burst = { at: number; origin: THREE.Vector3 } | null;

/** Which object the pointer currently has hold of, and where it grabbed it. */
type Drag = { index: number; offset: THREE.Vector3 } | null;

/**
 * Every object's live world position, written each frame. Pieces read it to
 * get out of the way of whichever one is being dragged — 7x7 checks a frame is
 * nothing, and "the cluster parts around the thing in your hand" is most of
 * what makes dragging feel physical rather than like moving a sprite.
 */
type Shared = { pos: THREE.Vector3[]; drag: Drag };

function geometryFor(g: PieceDef["geometry"]) {
  switch (g) {
    case "ico":
      return <icosahedronGeometry args={[1, 0]} />;
    case "torus":
      return <torusGeometry args={[0.78, 0.3, 24, 64]} />;
    case "knot":
      return <torusKnotGeometry args={[0.62, 0.22, 128, 20]} />;
    case "box":
      return <boxGeometry args={[1.25, 1.25, 1.25]} />;
    case "capsule":
      return <capsuleGeometry args={[0.5, 0.75, 8, 24]} />;
    case "octa":
      return <octahedronGeometry args={[1, 0]} />;
    default:
      return <sphereGeometry args={[1, 48, 32]} />;
  }
}

function Piece({
  piece,
  index,
  burst,
  shared,
  quality,
  accent,
}: {
  piece: PieceDef;
  index: number;
  burst: React.MutableRefObject<Burst>;
  shared: React.MutableRefObject<Shared>;
  quality: "high" | "low";
  accent: THREE.Color;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const home = useMemo(() => new THREE.Vector3(...piece.home), [piece.home]);
  const pos = useMemo(() => home.clone(), [home]);
  const vel = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pointer3 = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const handled = useRef(0);
  const plane = useMemo(() => new THREE.Plane(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const nrm = useMemo(() => new THREE.Vector3(), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const [held, setHeld] = useState(false);
  const [hover, setHover] = useState(false);

  /**
   * ANGULAR STATE
   *
   * Incrementing `mesh.rotation.x/y/z` by a fixed amount each frame — which is
   * what this did — reads as machinery: three constant rates about three fixed
   * axes, looping visibly. A weightless object doesn't do that. It tumbles
   * about a single arbitrary axis, and nothing rights it.
   *
   * So rotation is integrated from a real angular velocity into the mesh's
   * quaternion instead. Idle tumble is the baseline; pushes and throws add
   * torque; the velocity eases back toward the baseline over a couple of
   * seconds rather than being damped to a stop.
   */
  const baseSpin = useMemo(() => new THREE.Vector3(...piece.spin), [piece.spin]);
  const angVel = useMemo(() => baseSpin.clone(), [baseSpin]);
  /** Where a push is taken to land relative to the centre, giving r x F a moment arm. */
  const arm = useMemo(
    () =>
      new THREE.Vector3(
        Math.sin(index * 2.3),
        Math.cos(index * 1.7),
        Math.sin(index * 3.1)
      ).normalize(),
    [index]
  );
  const torque = useMemo(() => new THREE.Vector3(), []);
  const spinQ = useMemo(() => new THREE.Quaternion(), []);
  const spinE = useMemo(() => new THREE.Euler(), []);

  /** Integrate the tumble and ease the rate back toward its idle baseline. */
  const tumble = (mesh: THREE.Mesh, d: number) => {
    angVel.lerp(baseSpin, Math.min(1, 0.45 * d));
    spinE.set(angVel.x * d, angVel.y * d, angVel.z * d);
    spinQ.setFromEuler(spinE);
    // premultiply: the tumble is about world axes, so it never settles into
    // the self-righting look that local-axis rotation gives.
    mesh.quaternion.premultiply(spinQ);
  };

  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = Math.min(dt, 1 / 30); // clamp so a dropped frame can't launch anything
    const t = state.clock.elapsedTime;

    // 1. Resting target: home plus a slow, per-object drift.
    target
      .copy(home)
      .add(
        tmp.set(
          Math.sin(t * 0.35 + index * 1.7) * 0.16,
          Math.cos(t * 0.29 + index * 2.3) * 0.2,
          Math.sin(t * 0.23 + index) * 0.14
        )
      );

    const dragging = shared.current.drag?.index === index;

    if (dragging) {
      // 2a. Held. Track the pointer on a plane that faces the camera and
      //     passes through the object, so it follows the cursor exactly
      //     regardless of how far back it sits or how the group is rotated.
      state.camera.getWorldDirection(nrm);
      mesh.getWorldPosition(hit);
      plane.setFromNormalAndCoplanarPoint(nrm, hit);
      ray.setFromCamera(state.pointer as THREE.Vector2, state.camera);
      if (ray.ray.intersectPlane(plane, hit)) {
        mesh.parent?.worldToLocal(hit);
        target.copy(hit).add(shared.current.drag!.offset);
      }
      // Stiff and heavily damped: it arrives under the cursor without the
      // rubber-band wobble a soft spring would give a held object.
      tmp.copy(target).sub(pos);
      vel.addScaledVector(tmp, 90 * d);
      vel.multiplyScalar(Math.exp(-14 * d));
      pos.addScaledVector(vel, d);
      shared.current.pos[index].copy(pos);
      mesh.position.copy(pos);
      // Shaking a held object spins it. Torque from the drag velocity is what
      // makes it feel like something swinging in your hand rather than a
      // model glued to the cursor.
      torque.crossVectors(arm, vel).multiplyScalar(0.9 * d);
      angVel.add(torque);
      tumble(mesh, d);
      return;
    }

    // 2b. Free. Repel from the pointer on the z = 0 plane the cluster occupies.
    pointer3.set(
      (state.pointer.x * state.viewport.width) / 2,
      (state.pointer.y * state.viewport.height) / 2,
      0
    );
    tmp.copy(pos).sub(pointer3);
    const dist = tmp.length();
    const reach = 2.6;
    if (dist < reach && dist > 0.0001) {
      // Inverse falloff, capped — objects lean away rather than bolting.
      const push = (1 - dist / reach) ** 2 * 2.1;
      vel.addScaledVector(tmp.normalize(), push * d * 9);
    }

    // 2c. Get out of the way of whatever is being dragged.
    const heldIndex = shared.current.drag?.index ?? -1;
    if (heldIndex >= 0) {
      tmp.copy(pos).sub(shared.current.pos[heldIndex]);
      const gap = tmp.length();
      if (gap < 2.2 && gap > 0.0001) {
        vel.addScaledVector(tmp.normalize(), (1 - gap / 2.2) ** 2 * d * 26);
      }
    }

    // 3. Click impulse, applied exactly once per burst.
    const b = burst.current;
    if (b && b.at !== handled.current) {
      handled.current = b.at;
      tmp.copy(pos).sub(b.origin);
      const len = Math.max(tmp.length(), 0.35);
      tmp.normalize();
      vel.addScaledVector(tmp, 7.5 / len);
      vel.y += 1.1;
      // The shove lands off-centre, so it also spins the object: r x F, with
      // a per-object moment arm. Objects nearer the click tumble harder.
      torque.crossVectors(arm, tmp).multiplyScalar(9 / len);
      angVel.add(torque);
    }

    // 4. Critically-damped spring home. Stiffness and damping are paired so
    //    the return settles without a visible bounce at either end.
    tmp.copy(target).sub(pos);
    vel.addScaledVector(tmp, 26 * d);
    vel.multiplyScalar(Math.exp(-4.6 * d));
    pos.addScaledVector(vel, d);

    shared.current.pos[index].copy(pos);
    mesh.position.copy(pos);
    tumble(mesh, d);
  });

  const common = { roughness: 0.08, envMapIntensity: 1.4 };

  return (
    <mesh
      ref={ref}
      position={piece.home}
      scale={piece.scale * (held ? 1.14 : hover ? 1.06 : 1)}
      castShadow={false}
      onPointerDown={(e) => {
        // Stop the event reaching the catcher plane behind, or grabbing an
        // object would also fire the burst that throws it out of your hand.
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        // Grab offset: the object keeps its position relative to the cursor
        // instead of snapping its centre to the pointer.
        const local = hit.copy(e.point);
        ref.current?.parent?.worldToLocal(local);
        shared.current.drag = { index, offset: local.clone().negate().add(pos) };
        setHeld(true);
      }}
      onPointerUp={(e) => {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
        if (shared.current.drag?.index === index) shared.current.drag = null;
        setHeld(false);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      {geometryFor(piece.geometry)}
      {piece.kind === "glass" ? (
        <meshPhysicalMaterial
          {...common}
          // Built-in transmission: one shared resolve pass for the scene.
          //
          // Phones don't get transmission — but the fallback used to be a flat
          // 0.25-metalness slab, which rendered as blue-grey plastic and looked
          // like a bug rather than a choice. Polished pearl with full
          // iridescence costs nothing extra and reads as a deliberate material:
          // it still catches the lightformers and still shifts hue as it turns.
          transmission={quality === "high" ? 1 : 0}
          thickness={1.4}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.1}
          iridescence={quality === "high" ? 0.7 : 1}
          iridescenceIOR={quality === "high" ? 1.3 : 1.9}
          iridescenceThicknessRange={[100, 640]}
          color={quality === "high" ? "#ffffff" : "#eef2f7"}
          metalness={quality === "high" ? 0 : 0.88}
          roughness={quality === "high" ? 0.08 : 0.14}
        />
      ) : piece.kind === "metal" ? (
        <meshStandardMaterial {...common} metalness={0.92} roughness={0.24} color="#cfd3d9" />
      ) : (
        <meshStandardMaterial
          metalness={0.25}
          roughness={0.32}
          color={accent}
          emissive={accent}
          emissiveIntensity={0.22}
        />
      )}
    </mesh>
  );
}

/**
 * Backdrop.
 *
 * Transmission refracts whatever is behind the mesh. On a transparent canvas
 * with an empty scene that is nothing, so the "glass" resolves to flat white
 * plastic. A soft gradient plane a few units back is all it takes for the
 * refraction to actually read — and it gives the cluster a room to sit in.
 */
function Backdrop({
  accent,
  page,
  light,
}: {
  accent: THREE.Color;
  page: THREE.Color;
  light: boolean;
}) {
  // A soft additive glow. Alpha does the falloff so the disc has no edge.
  const glow = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 4, 128, 128, 126);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.3, "rgba(255,255,255,0.42)");
    grad.addColorStop(0.65, "rgba(255,255,255,0.1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useEffect(() => () => glow.dispose(), [glow]);

  return (
    <group>
      {/* Ground. Painted in the page's own colour, so its edges are invisible
          against the page while still giving transmission something to bend.
          Without it the glass resolves to flat white plastic. */}
      <mesh position={[0, 0, -5]} scale={[40, 24, 1]}>
        <planeGeometry />
        <meshBasicMaterial color={page} toneMapped={false} />
      </mesh>

      {/* Warm pool of light behind the cluster.
          Additive blending is right over graphite — it reads as a glow sitting
          in the dark. Over bone stock it has nowhere to go but up, so it
          clipped to a pale yellow-white slab with hard edges exactly where the
          canvas ended, which is what made the whole stage look like a pasted
          rectangle on light mode. On paper it blends normally at low opacity
          instead, so the pool tints rather than blows out. */}
      <mesh position={[0, -0.2, -4.6]} scale={[30, 16, 1]}>
        <planeGeometry />
        <meshBasicMaterial
          map={glow}
          color={accent}
          transparent
          depthWrite={false}
          blending={light ? THREE.NormalBlending : THREE.AdditiveBlending}
          toneMapped={false}
          opacity={light ? 0.16 : 0.85}
        />
      </mesh>
    </group>
  );
}

/** Slow rotation of the whole arrangement, scrubbed by section progress. */
function Rig({
  group,
  progress,
}: {
  group: React.RefObject<THREE.Group | null>;
  progress: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current;
    const d = Math.min(dt, 1 / 30);
    // Ease toward the scrubbed pose so a fast scroll doesn't snap the cluster.
    g.rotation.y += ((p - 0.5) * 0.9 - g.rotation.y) * Math.min(1, d * 3.5);
    g.rotation.x += ((p - 0.5) * 0.24 - g.rotation.x) * Math.min(1, d * 3.5);
    camera.position.z += (7.2 - p * 0.9 - camera.position.z) * Math.min(1, d * 2.5);
  });
  return null;
}

export default function Workshop({
  progress,
  onPush,
}: {
  progress: React.MutableRefObject<number>;
  onPush?: () => void;
}) {
  const burst = useRef<Burst>(null);
  const shared = useRef<Shared>({
    pos: PIECES.map((p) => new THREE.Vector3(...p.home)),
    drag: null,
  });

  // A pointerup that lands outside the canvas still has to let go, or the
  // object stays welded to the cursor for the rest of the session.
  useEffect(() => {
    const release = () => {
      shared.current.drag = null;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);
  const group = useRef<THREE.Group>(null);
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [portrait, setPortrait] = useState(false);
  const pieces = portrait ? PIECES_PORTRAIT : PIECES;
  const [accent, setAccent] = useState(() => new THREE.Color("#ff5a1f"));
  const [page, setPage] = useState(() => new THREE.Color("#08090b"));
  const [light, setLight] = useState(false);

  // Transmission is the single most expensive thing here; small screens and
  // low core counts get the cheaper material set instead of a dropped frame rate.
  // Re-hang the cluster whenever the frame is taller than it is wide.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const sync = () => setPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const small = window.matchMedia("(max-width: 900px)").matches;
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
    if (small || weak) setQuality("low");
  }, []);

  // Keep the ember objects and the backdrop glow on the page's accent token,
  // so a theme switch restyles the scene instead of stranding it in one mode.
  useEffect(() => {
    const read = (name: string) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const [r, g, b] = raw.split(/\s+/).map(Number);
      if (Number.isNaN(r)) return null;
      // The tokens are sRGB bytes; the renderer works in linear space.
      return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
    };
    const sync = () => {
      const a = read("--accent");
      const p = read("--page");
      if (a) setAccent(a);
      if (p) setPage(p);
      setLight(document.documentElement.getAttribute("data-theme") === "paper");
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  const push = (e: { point?: THREE.Vector3 } | null) => {
    if (shared.current.drag) return;
    burst.current = {
      at: performance.now(),
      origin: e?.point ? e.point.clone() : new THREE.Vector3(0, 0, 0),
    };
    onPush?.();
  };

  return (
    <Canvas
      dpr={quality === "high" ? [1, 1.75] : 1}
      camera={{ position: [0, 0, 7.2], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      onPointerMissed={() => push(null)}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} />
      <directionalLight position={[-5, -2, -3]} intensity={0.8} color="#7aa2ff" />

      {/* A self-contained studio: four soft rect sources the glass and metal
          have something to actually reflect, generated locally. */}
      <Environment resolution={256}>
        {/* Key, and the two side panels that shape the edges. */}
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[9, 3, 1]} />
        <Lightformer form="rect" intensity={1.1} position={[-5, 0, 2]} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[5, -1, 1]} scale={[3, 6, 1]} color="#ffb08a" />
        <Lightformer form="ring" intensity={1.4} position={[0, -3, -4]} scale={5} />

        {/* Fill. A polished metal can only show what is around it, and with
            four small sources the rest of the sphere was empty — which is why
            the metal pieces read as almost black. These two large, dim panels
            give them something to reflect from the front and below without
            flattening the shaping the key lights do. */}
        <Lightformer form="rect" intensity={0.42} position={[0, 0, 9]} scale={[18, 18, 1]} />
        <Lightformer form="rect" intensity={0.3} position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[16, 16, 1]} color="#b8c4d6" />
      </Environment>

      <Backdrop accent={accent} page={page} light={light} />
      <Rig group={group} progress={progress} />

      <group ref={group} scale={portrait ? 0.72 : 1}>
        {pieces.map((p, i) => (
          <Piece
            key={i}
            piece={p}
            index={i}
            burst={burst}
            shared={shared}
            quality={quality}
            accent={accent}
          />
        ))}

        {/* Invisible catcher so a click anywhere in the frame has a world-space
            origin to push from, not just a click that lands on a mesh. */}
        <mesh position={[0, 0, -1]} onPointerDown={(e) => push(e)} visible={false}>
          <planeGeometry args={[40, 24]} />
          <meshBasicMaterial />
        </mesh>
      </group>
    </Canvas>
  );
}

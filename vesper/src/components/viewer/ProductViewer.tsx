"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import clsx from "clsx";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { duration } from "@/motion/tokens";
import { createStudio, frameObject } from "@/three/studio";
import { buildStandin, type StandinSpec } from "@/three/standins";
import type { Capability } from "./capability";

export interface ViewerHotspot {
  id: string;
  anchor: string;
  kicker: string;
  title: string;
  body: string;
}

export interface ProductViewerProps {
  spec: StandinSpec;
  angle: { azimuth: number; elevation: number };
  hotspots: ViewerHotspot[];
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  capability: Capability;
  reducedMotion: boolean;
  mobile: boolean;
  label: string;
  onReady: () => void;
  onError: () => void;
}

/** Imperative camera API the keyboard handler and buttons call into. */
interface ViewerApi {
  rotate: (dAzimuth: number, dPolar: number) => void;
  zoom: (factor: number) => void;
  reset: () => void;
  focus: (anchor: string) => void;
}

const MIN_POLAR = 0.2;
const MAX_POLAR = 1.45; // never look from under the floor
// Step 7 · camera ease, cubic-bezier(0.65, 0, 0.35, 1) ≈ ease-in-out cubic.
const cameraEase = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Level 2 product viewer (Step 5): orbit + zoom, hotspots with camera moves,
 * and live material switching. Rendered on demand only, so an idle viewer
 * costs no GPU time.
 */
export default function ProductViewer(props: ProductViewerProps) {
  const { hotspots, activeId, onActiveChange, capability, label, onError } = props;
  const apiRef = useRef<ViewerApi | null>(null);
  const spotRefs = useRef(new Map<string, HTMLButtonElement>());
  const [touched, setTouched] = useState(false);
  const active = hotspots.find((h) => h.id === activeId) ?? null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const api = apiRef.current;
    if (!api) return;
    const step = Math.PI / 12;
    const map: Record<string, () => void> = {
      ArrowLeft: () => api.rotate(-step, 0),
      ArrowRight: () => api.rotate(step, 0),
      ArrowUp: () => api.rotate(0, -step / 2),
      ArrowDown: () => api.rotate(0, step / 2),
      "+": () => api.zoom(0.85),
      "=": () => api.zoom(0.85),
      "-": () => api.zoom(1.18),
      r: () => {
        onActiveChange(null);
        api.reset();
      },
      R: () => {
        onActiveChange(null);
        api.reset();
      },
      Escape: () => onActiveChange(null),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      setTouched(true);
      fn();
    }
  };

  return (
    <div
      tabIndex={0}
      role="group"
      aria-roledescription="3D viewer"
      aria-label={`${label}. Drag or use the arrow keys to rotate, plus and minus to zoom, R to reset.`}
      onKeyDown={onKeyDown}
      onPointerDown={() => setTouched(true)}
      // Touch: vertical swipes keep scrolling the page; sideways drags rotate, pinch zooms.
      style={{ touchAction: props.mobile ? "pan-y" : "none" }}
      className="absolute inset-0 cursor-grab bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,#3A3430_0%,#171514_58%,#0E0D0E_100%)] outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-ivory active:cursor-grabbing"
    >
      <ViewerErrorBoundary onError={onError}>
        <Canvas
          frameloop="demand"
          dpr={capability.dpr}
          shadows={capability.shadows}
          camera={{ fov: 26, near: 0.01, far: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl, scene }) => {
            createStudio(gl, scene, { shadows: capability.shadows });
            gl.domElement.addEventListener("webglcontextlost", onError, { once: true });
          }}
          aria-hidden="true"
        >
          <Scene {...props} apiRef={apiRef} spotRefs={spotRefs} onInteract={() => setTouched(true)} />
        </Canvas>
      </ViewerErrorBoundary>

      {/* Hotspots: real buttons, positioned every frame by the scene. */}
      {hotspots.map((h, i) => (
        <button
          key={h.id}
          ref={(el) => {
            if (el) spotRefs.current.set(h.id, el);
            else spotRefs.current.delete(h.id);
          }}
          type="button"
          aria-label={`Detail: ${h.title}`}
          aria-pressed={activeId === h.id}
          onClick={(e) => {
            e.stopPropagation();
            onActiveChange(activeId === h.id ? null : h.id);
          }}
          style={{ animationDelay: `${300 + i * 80}ms` }}
          className={clsx(
            "anim-fade-quick absolute left-0 top-0 -ml-[22px] -mt-[22px] grid h-11 w-11 place-items-center transition-opacity duration-standard ease-glide data-[behind]:pointer-events-none data-[behind]:opacity-0",
            active && activeId !== h.id ? "opacity-40" : "opacity-100",
          )}
        >
          <span
            className={clsx(
              "h-3.5 w-3.5 rounded-full border border-ivory transition-[background-color,box-shadow] duration-quick",
              activeId === h.id ? "bg-ivory shadow-[0_0_0_7px_rgba(239,234,224,0.22)]" : "bg-ink/40 shadow-[0_0_0_6px_rgba(239,234,224,0.12)]",
            )}
          />
        </button>
      ))}

      {active ? (
        <div className="anim-fade-quick absolute bottom-4 left-4 right-4 max-w-sm border border-line bg-ink/85 p-5 backdrop-blur-sm sm:right-auto" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <p className="label text-bronze">{active.kicker}</p>
            <button type="button" onClick={() => onActiveChange(null)} className="label -mr-2 -mt-3 min-h-11 px-2 text-mist hover:text-ivory">
              Close
            </button>
          </div>
          <p className="mt-1 font-display text-2xl">{active.title}</p>
          <p className="mt-2 text-sm font-light leading-relaxed text-mist">{active.body}</p>
        </div>
      ) : (
        <p
          className={clsx(
            "label pointer-events-none absolute bottom-5 left-5 text-smoke transition-opacity duration-standard",
            touched && "opacity-0",
          )}
        >
          {props.mobile ? "Swipe sideways to rotate · Pinch to zoom" : "Drag to rotate · Scroll or pinch to zoom"}
        </p>
      )}

      <div className="absolute right-3 top-3 flex flex-col gap-1">
        {[
          { label: "Zoom in", text: "+", run: () => apiRef.current?.zoom(0.8) },
          { label: "Zoom out", text: "−", run: () => apiRef.current?.zoom(1.25) },
          { label: "Reset view", text: "↺", run: () => { onActiveChange(null); apiRef.current?.reset(); } },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            title={b.label}
            onClick={(e) => {
              e.stopPropagation();
              setTouched(true);
              b.run();
            }}
            className="grid h-11 w-11 place-items-center border border-line bg-ink/60 text-lg text-ivory backdrop-blur-sm transition-colors duration-quick hover:bg-ivory hover:text-ink"
          >
            {b.text}
          </button>
        ))}
      </div>
    </div>
  );
}

interface SceneProps extends ProductViewerProps {
  apiRef: React.MutableRefObject<ViewerApi | null>;
  spotRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  onInteract: () => void;
}

interface Tween {
  start: number;
  ms: number;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
}

interface ColorTween {
  start: number;
  ms: number;
  items: { mat: THREE.MeshPhysicalMaterial; from: THREE.Color; to: THREE.Color; fromR: number; toR: number }[];
}

function Scene({ spec, angle, hotspots, activeId, reducedMotion, mobile, onReady, apiRef, spotRefs, onInteract }: SceneProps) {
  const { camera, gl, scene, invalidate, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const specKey = JSON.stringify(spec);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const home = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; dist: number; center: THREE.Vector3; half: THREE.Vector3 } | null>(null);
  const tween = useRef<Tween | null>(null);
  const colorTween = useRef<ColorTween | null>(null);
  const readyFired = useRef(false);
  const ms = (desktop: number, phone: number) => (reducedMotion ? 0 : mobile ? phone : desktop);

  const controls = useMemo(() => {
    const c = new OrbitControls(cam, gl.domElement);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.enablePan = false;
    c.rotateSpeed = 0.7;
    c.zoomSpeed = 0.6;
    c.minPolarAngle = MIN_POLAR;
    c.maxPolarAngle = MAX_POLAR;
    // OrbitControls sets touch-action: none; on phones let vertical swipes scroll the page.
    if (mobile) gl.domElement.style.touchAction = "pan-y";
    return c;
  }, [cam, gl, mobile]);

  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;
  useEffect(() => {
    const onChange = () => invalidate();
    const onStart = () => {
      tween.current = null; // the customer is always in control
      onInteractRef.current();
    };
    controls.addEventListener("change", onChange);
    controls.addEventListener("start", onStart);
    return () => {
      controls.removeEventListener("change", onChange);
      controls.removeEventListener("start", onStart);
      controls.dispose();
    };
  }, [controls, invalidate]);

  // Build (or rebuild on colour change) the model; blend materials across.
  useEffect(() => {
    const next = buildStandin(JSON.parse(specKey) as StandinSpec);
    const prev = modelRef.current;
    if (prev) {
      const before: THREE.Mesh[] = [];
      const after: THREE.Mesh[] = [];
      prev.traverse((o) => (o as THREE.Mesh).isMesh && before.push(o as THREE.Mesh));
      next.traverse((o) => (o as THREE.Mesh).isMesh && after.push(o as THREE.Mesh));
      const items: ColorTween["items"] = [];
      after.forEach((mesh, i) => {
        const old = before[i]?.material as THREE.MeshPhysicalMaterial | undefined;
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        if (!old || before[i].name !== mesh.name || !mat.color) return;
        items.push({ mat, from: old.color.clone(), to: mat.color.clone(), fromR: old.roughness, toR: mat.roughness });
        mat.color.copy(old.color);
        mat.roughness = old.roughness;
      });
      colorTween.current = { start: performance.now(), ms: ms(duration.standard, 480), items };
    }
    let cancelled = false;
    const show = () => {
      if (cancelled) return;
      modelRef.current = next;
      setModel(next);
      invalidate();
    };
    // First model: compile its shaders in the background (KHR_parallel_shader_compile
    // where available) before it is shown, instead of blocking the first frame.
    // Colour changes reuse the same shader programs, so they show at once.
    if (prev) show();
    else gl.compileAsync(next, cam, scene).then(show, show);
    return () => {
      cancelled = true;
      // Dispose the replaced model's materials. Geometry is shared with the
      // cached template (buildStandin), so it stays.
      if (prev) prev.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey]);

  // Frame the product once, from the poster angle, so 3D picks up exactly where the photo was.
  useEffect(() => {
    if (!model || home.current) return;
    cam.aspect = size.width / size.height;
    const { center, radius } = frameObject(cam, model, angle.azimuth, angle.elevation, (spec.framing ?? 1.18) * 1.05);
    const dist = cam.position.distanceTo(center);
    const half = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).multiplyScalar(0.5).max(new THREE.Vector3(0.01, 0.01, 0.01));
    home.current = { pos: cam.position.clone(), target: center.clone(), dist, center, half };
    controls.target.copy(center);
    controls.minDistance = Math.max(radius * 0.6, dist * 0.32);
    controls.maxDistance = dist * 1.5;
    controls.update();
    invalidate();
  }, [model, cam, controls, angle.azimuth, angle.elevation, spec.framing, size.width, size.height, invalidate]);

  const flyTo = (toPos: THREE.Vector3, toTarget: THREE.Vector3, durationMs: number) => {
    if (durationMs === 0) {
      cam.position.copy(toPos);
      controls.target.copy(toTarget);
      controls.update();
      invalidate();
      return;
    }
    tween.current = { start: performance.now(), ms: durationMs, fromPos: cam.position.clone(), toPos, fromTarget: controls.target.clone(), toTarget };
    invalidate();
  };

  apiRef.current = {
    rotate(dAz, dPolar) {
      const offset = cam.position.clone().sub(controls.target);
      const s = new THREE.Spherical().setFromVector3(offset);
      s.theta += dAz;
      s.phi = THREE.MathUtils.clamp(s.phi + dPolar, MIN_POLAR, MAX_POLAR);
      flyTo(controls.target.clone().add(new THREE.Vector3().setFromSpherical(s)), controls.target.clone(), ms(duration.quick, duration.quick));
    },
    zoom(factor) {
      const offset = cam.position.clone().sub(controls.target);
      const len = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
      flyTo(controls.target.clone().add(offset.setLength(len)), controls.target.clone(), ms(duration.quick, duration.quick));
    },
    reset() {
      if (!home.current) return;
      flyTo(home.current.pos.clone(), home.current.target.clone(), ms(duration.hotspotCamera.desktop, duration.hotspotCamera.mobile));
    },
    focus(anchor) {
      const h = home.current;
      const node = modelRef.current?.getObjectByName(anchor);
      if (!h || !node) return;
      const point = node.getWorldPosition(new THREE.Vector3());
      const out = point.clone().sub(h.center);
      out.y = Math.max(out.y, out.length() * 0.35);
      out.normalize();
      const dist = Math.max(controls.minDistance, h.dist * 0.62);
      flyTo(point.clone().add(out.multiplyScalar(dist)), point, ms(duration.hotspotCamera.desktop, duration.hotspotCamera.mobile));
    },
  };

  // Hotspot selection drives the camera.
  useEffect(() => {
    if (!home.current) return;
    const h = hotspots.find((x) => x.id === activeId);
    if (h) apiRef.current?.focus(h.anchor);
    else apiRef.current?.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const tmp = useMemo(() => ({ v: new THREE.Vector3(), n: new THREE.Vector3(), c: new THREE.Vector3() }), []);

  useFrame(() => {
    let animating = controls.update();

    const t = tween.current;
    if (t) {
      const p = Math.min(1, (performance.now() - t.start) / t.ms);
      const e = cameraEase(p);
      cam.position.lerpVectors(t.fromPos, t.toPos, e);
      controls.target.lerpVectors(t.fromTarget, t.toTarget, e);
      cam.lookAt(controls.target);
      if (p >= 1) tween.current = null;
      animating = true;
    }

    const ct = colorTween.current;
    if (ct) {
      const p = ct.ms === 0 ? 1 : Math.min(1, (performance.now() - ct.start) / ct.ms);
      const e = cameraEase(p);
      for (const it of ct.items) {
        it.mat.color.lerpColors(it.from, it.to, e);
        it.mat.roughness = it.fromR + (it.toR - it.fromR) * e;
      }
      if (p >= 1) colorTween.current = null;
      animating = true;
    }

    // Project hotspot anchors to screen space; hide those facing away.
    const m = modelRef.current;
    if (m && home.current) {
      for (const h of hotspots) {
        const el = spotRefs.current.get(h.id);
        const node = m.getObjectByName(h.anchor);
        if (!el || !node) continue;
        node.getWorldPosition(tmp.v);
        // Outward normal of the product's bounding ellipsoid at the anchor:
        // works for long shoes, flat garments and upright bags alike.
        tmp.n.copy(tmp.v).sub(home.current.center).divide(home.current.half).divide(home.current.half).normalize();
        tmp.c.copy(cam.position).sub(tmp.v).normalize();
        const facing = tmp.n.dot(tmp.c) > -0.05;
        tmp.v.project(cam);
        const x = ((tmp.v.x + 1) / 2) * size.width;
        const y = ((1 - tmp.v.y) / 2) * size.height;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.toggleAttribute("data-behind", !facing);
      }
    }

    if (animating) invalidate();
    if (m && !readyFired.current) {
      readyFired.current = true;
      requestAnimationFrame(() => onReady());
    }
  });

  return model ? <primitive object={model} /> : null;
}

class ViewerErrorBoundary extends Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

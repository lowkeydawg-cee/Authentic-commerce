"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { createStudio, frameObject } from "@/three/studio";
import { buildStandin, type StandinSpec } from "@/three/standins";

export interface StageKeyframe {
  azimuth: number;
  elevation: number;
  /** Relative to the opening shot's camera distance. */
  distance: number;
  /** Named model anchor the camera looks at; the model centre when omitted. */
  anchor?: string;
  label: { anchor: string; text: string };
}

export interface StageDriver {
  /** Chapter progress, 0 … keyframes.length - 1 (fractional while scrolling). */
  progress: number;
  /** Set by the stage; call after changing `progress` to request a frame. */
  invalidate?: () => void;
}

interface Props {
  spec: StandinSpec;
  keyframes: StageKeyframe[];
  driver: React.MutableRefObject<StageDriver>;
  dpr: [number, number];
  shadows: boolean;
  onReady: () => void;
  onError: () => void;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Homepage live stage (milestone 6): the scroll chapters drive a real camera
 * around the hero product. Rendered on demand, only while the page scrolls.
 */
export default function HomeStage3D(props: Props) {
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_45%,#4A423C_0%,#1D1A18_55%,#0B0B0C_100%)]" aria-hidden="true">
      <StageErrorBoundary onError={props.onError}>
        <Canvas
          frameloop="demand"
          dpr={props.dpr}
          shadows={props.shadows}
          camera={{ fov: 26, near: 0.01, far: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl, scene }) => {
            createStudio(gl, scene, { shadows: props.shadows });
            gl.domElement.addEventListener("webglcontextlost", props.onError, { once: true });
          }}
        >
          <StageScene {...props} labelRefs={labelRefs} />
        </Canvas>
      </StageErrorBoundary>
      {props.keyframes.map((k, i) => (
        <div
          key={i}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
          style={{ opacity: i === 0 ? 1 : 0 }}
          className="pointer-events-none absolute left-0 top-0 flex items-center gap-3 will-change-transform"
        >
          <span className="-ml-[7px] -mt-[7px] h-3.5 w-3.5 shrink-0 rounded-full border border-ivory bg-ivory/90 shadow-[0_0_0_7px_rgba(239,234,224,0.16)]" />
          <span className="label -mt-[7px] whitespace-nowrap bg-ink/70 px-3 py-1.5 text-ivory backdrop-blur-sm">{k.label.text}</span>
        </div>
      ))}
    </div>
  );
}

function StageScene({ spec, keyframes, driver, onReady, labelRefs }: Props & { labelRefs: React.MutableRefObject<(HTMLDivElement | null)[]> }) {
  const { camera, gl, scene, invalidate, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const model = useMemo(() => buildStandin(spec), [spec]);
  // Compile shaders in the background before the model is shown (see ProductViewer).
  const [compiled, setCompiled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const done = () => !cancelled && (setCompiled(true), invalidate());
    gl.compileAsync(model, camera, scene).then(done, done);
    return () => {
      cancelled = true;
    };
  }, [gl, model, camera, scene, invalidate]);
  const shots = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 }[] | null>(null);
  const ready = useRef(false);
  const tmp = useMemo(() => ({ s: new THREE.Spherical(), v: new THREE.Vector3(), t: new THREE.Vector3(), p: new THREE.Vector3() }), []);

  useEffect(() => {
    const d = driver.current;
    d.invalidate = invalidate;
    return () => {
      d.invalidate = undefined;
    };
  }, [driver, invalidate]);

  // Resolve every chapter's camera once the model and viewport size are known.
  useEffect(() => {
    cam.aspect = size.width / size.height;
    const first = keyframes[0];
    const { center } = frameObject(cam, model, first.azimuth, first.elevation, spec.framing ?? 1.18);
    const baseDist = cam.position.distanceTo(center);
    model.updateMatrixWorld(true);
    shots.current = keyframes.map((k) => {
      const node = k.anchor ? model.getObjectByName(k.anchor) : null;
      // Look slightly toward the detail rather than straight at it, so the product keeps context.
      const target = node ? center.clone().lerp(node.getWorldPosition(new THREE.Vector3()), 0.8) : center.clone();
      const offset = new THREE.Vector3().setFromSpherical(new THREE.Spherical(baseDist * k.distance, Math.PI / 2 - k.elevation, k.azimuth));
      return { pos: target.clone().add(offset), target };
    });
    invalidate();
  }, [cam, model, keyframes, spec.framing, size.width, size.height, invalidate]);

  useFrame(() => {
    const s = shots.current;
    if (!s || !compiled) return;
    const p = THREE.MathUtils.clamp(driver.current.progress, 0, s.length - 1);
    const i = Math.min(Math.floor(p), s.length - 2);
    const f = ease(p - i);
    const a = s[i], b = s[i + 1] ?? s[i];
    // Move around the target (spherical blend) so the camera orbits rather than cutting through.
    tmp.t.lerpVectors(a.target, b.target, f);
    const sa = new THREE.Spherical().setFromVector3(tmp.v.copy(a.pos).sub(a.target));
    const sb = new THREE.Spherical().setFromVector3(tmp.v.copy(b.pos).sub(b.target));
    tmp.s.set(sa.radius + (sb.radius - sa.radius) * f, sa.phi + (sb.phi - sa.phi) * f, sa.theta + (sb.theta - sa.theta) * f);
    cam.position.copy(tmp.t).add(tmp.v.setFromSpherical(tmp.s));
    cam.lookAt(tmp.t);

    keyframes.forEach((k, idx) => {
      const el = labelRefs.current[idx];
      const node = model.getObjectByName(k.label.anchor);
      if (!el || !node) return;
      node.getWorldPosition(tmp.p).project(cam);
      el.style.transform = `translate(${((tmp.p.x + 1) / 2) * size.width}px, ${((1 - tmp.p.y) / 2) * size.height}px)`;
      el.style.opacity = String(Math.max(0, 1 - Math.abs(p - idx) * 2.5));
    });

    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(() => onReady());
    }
  });

  return compiled ? <primitive object={model} /> : null;
}

class StageErrorBoundary extends Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
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

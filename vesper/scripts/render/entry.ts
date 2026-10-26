/**
 * Browser entry for the poster renderer. Bundled by esbuild and driven by
 * scripts/render/render.mjs through Playwright.
 */
import * as THREE from "three";
import { createStudio, frameObject } from "../../src/three/studio";
import { buildStandin, type StandinSpec } from "../../src/three/standins";

declare global {
  interface Window {
    renderStandin: (spec: StandinSpec, angle: { azimuth: number; elevation: number }, w: number, h: number, format?: string) => string;
  }
}

window.renderStandin = (spec, angle, w, h, format = "image/png") => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const studio = createStudio(renderer, scene);
  const object = buildStandin(spec);
  scene.add(object);
  const camera = new THREE.PerspectiveCamera(26, w / h, 0.01, 50);
  frameObject(camera, object, angle.azimuth, angle.elevation, spec.framing ?? 1.18);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL(format, 0.9);
  studio.dispose();
  renderer.dispose();
  return url;
};

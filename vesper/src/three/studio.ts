import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * VESPER studio: one warm hard key from above-left, a cool rim from behind,
 * a dim fill and a shadow-catching floor. Shared by the poster renders and
 * the live 3D viewer so photos and 3D always match.
 */
export function createStudio(renderer: THREE.WebGLRenderer, scene: THREE.Scene, { shadows = true } = {}) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const key = new THREE.SpotLight("#ffe7cc", 38, 0, Math.PI / 7, 0.65, 1.6);
  key.position.set(-1.6, 2.6, 1.9);
  key.target.position.set(0, 0.1, 0);
  key.castShadow = shadows;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight("#cfd6e6", 1.6);
  rim.position.set(1.8, 1.4, -2.4);
  scene.add(rim);

  const fill = new THREE.HemisphereLight("#f3e9dc", "#0b0b0c", 0.35);
  scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  return { key, rim, fill, floor, dispose: () => pmrem.dispose() };
}

/** Frame an object for a given camera angle, keeping it centred with headroom. */
export function frameObject(camera: THREE.PerspectiveCamera, object: THREE.Object3D, azimuth: number, elevation: number, padding = 1.25) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = size.length() / 2;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const dist = (radius * padding) / Math.sin(fov / 2);
  camera.position.set(
    center.x + dist * Math.cos(elevation) * Math.sin(azimuth),
    center.y + dist * Math.sin(elevation),
    center.z + dist * Math.cos(elevation) * Math.cos(azimuth),
  );
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  return { center, radius };
}

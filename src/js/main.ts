import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "../styles/main.scss";

import nebula from "../img/nebula.jpg";
import stars from "../img/stars.jpg";

const monkeyUrl = new URL("../assets/monkey.glb", import.meta.url);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const orbit = new OrbitControls(camera, renderer.domElement);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

camera.position.set(-10, 30, 30);
orbit.update();

// Box
const boxGeometry = new THREE.BoxGeometry();
const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(box);

// Plane
const planeGeometry = new THREE.PlaneGeometry(30, 30);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);
plane.rotation.x = -0.5 * Math.PI;
plane.receiveShadow = true;

// Grid
const gridHelper = new THREE.GridHelper(30);
scene.add(gridHelper);

// Sphere
const sphereGeometry = new THREE.SphereGeometry(4, 50, 50);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);
sphere.position.set(-10, 10, 0);
sphere.castShadow = true;

// Lights
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(-100, 100, 0);
spotLight.castShadow = true;
scene.add(spotLight);
spotLight.angle = 0.2;

const sLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(sLightHelper);

// Fog
scene.fog = new THREE.FogExp2(0xffffff, 0.01);

// Background
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
  nebula,
  nebula,
  stars,
  stars,
  stars,
  stars,
]);

// Box with multiple materials
const box2Geometry = new THREE.BoxGeometry(4, 4, 4);
const box2MultiMaterial = [
  new THREE.MeshBasicMaterial({ map: textureLoader.load(stars) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(stars) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(nebula) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(stars) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(nebula) }),
  new THREE.MeshBasicMaterial({ map: textureLoader.load(stars) }),
];
const box2 = new THREE.Mesh(box2Geometry, box2MultiMaterial);
box2.position.set(0, 15, 10);
box2.name = "theBox";
scene.add(box2);

// Plane2 with displacement
const plane2Geometry = new THREE.PlaneGeometry(10, 10, 10, 10);
const plane2Material = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
});
const plane2 = new THREE.Mesh(plane2Geometry, plane2Material);
plane2.position.set(10, 10, 15);
scene.add(plane2);

const plane2Positions = plane2.geometry.attributes.position
  .array as Float32Array;
plane2Positions[0] -= 10 * Math.random();
plane2Positions[1] -= 10 * Math.random();
plane2Positions[2] -= 10 * Math.random();
const lastPointZ = plane2Positions.length - 1;
plane2Positions[lastPointZ] -= 10 * Math.random();

// Shader Sphere
const vertexShader = (
  document.getElementById("vertexShader") as HTMLScriptElement
).textContent!;
const fragmentShader = (
  document.getElementById("fragmentShader") as HTMLScriptElement
).textContent!;

const sphere2Geometry = new THREE.SphereGeometry(4);
const sphere2Material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
});
const sphere2 = new THREE.Mesh(sphere2Geometry, sphere2Material);
sphere2.position.set(-5, 10, 10);
scene.add(sphere2);

// GLTF Model
const assetLoader = new GLTFLoader();
let mixer: THREE.AnimationMixer | undefined;

assetLoader.load(
  monkeyUrl.href,
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    model.position.set(-12, 4, 10);
    mixer = new THREE.AnimationMixer(model);
  },
  undefined,
  (error) => console.error(error)
);

// GUI
const gui = new dat.GUI();
const options = {
  sphereColor: "#ffea00",
  wireframe: false,
  speed: 0.01,
  angle: 0.2,
  penumbra: 0,
  intensity: 1,
};

gui.addColor(options, "sphereColor").onChange((e: string) => {
  sphere.material.color.set(e);
});
gui.add(options, "wireframe").onChange((e: boolean) => {
  sphere.material.wireframe = e;
});
gui.add(options, "speed", 0, 0.1);
gui.add(options, "angle", 0, 1);
gui.add(options, "penumbra", 0, 1);
gui.add(options, "intensity", 0, 1);

let step = 0;
const mousePosition = new THREE.Vector2();
const rayCaster = new THREE.Raycaster();
const clock = new THREE.Clock();

window.addEventListener("mousemove", (e: MouseEvent) => {
  mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Animate
function animate(time: number) {
  if (mixer) mixer.update(clock.getDelta());

  box.rotation.x = time / 1000;
  box.rotation.y = time / 1000;

  step += options.speed;
  sphere.position.y = 10 * Math.abs(Math.sin(step));

  spotLight.angle = options.angle;
  spotLight.penumbra = options.penumbra;
  spotLight.intensity = options.intensity;
  sLightHelper.update();

  rayCaster.setFromCamera(mousePosition, camera);
  const intersects = rayCaster.intersectObjects(scene.children);

  for (const intersect of intersects) {
    if (intersect.object.name === "theBox") {
      intersect.object.rotation.x = time / 1000;
      intersect.object.rotation.y = time / 1000;
    }
  }

  plane2Positions[0] = 10 * Math.random();
  plane2Positions[1] = 10 * Math.random();
  plane2Positions[2] = 10 * Math.random();
  plane2Positions[lastPointZ] = 10 * Math.random();
  plane2.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

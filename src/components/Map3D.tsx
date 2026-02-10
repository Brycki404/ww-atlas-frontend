import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import type { MarkerLocation } from "../types/my_types";
import { API_URL } from "../main";

type Map3DProps = {
  onSelectLocation: (loc: MarkerLocation | null) => void;
  selectedLocation: MarkerLocation | null;
};

export default function Map3D({
  onSelectLocation,
  selectedLocation
}: Map3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [locations, setLocations] = useState<MarkerLocation[]>([]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const composerRef = useRef<EffectComposer | null>(null);
  const outlinePassRef = useRef<OutlinePass | null>(null);

  const markerGroupRef = useRef<THREE.Group | null>(null);
  const selectedMarkerRef = useRef<THREE.Mesh | null>(null);

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Fetch locations
  useEffect(() => {
    fetch(`${API_URL}/locations`)
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error("Failed to fetch locations", err));
  }, []);

  // Smooth camera fly-to animation
  const flyTo = (targetPos: THREE.Vector3) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const startPos = camera.position.clone();
    const endPos = targetPos.clone().add(new THREE.Vector3(5, 5, 5));

    const startTarget = controls.target.clone();
    const endTarget = targetPos.clone();

    let t = 0;
    const duration = 60;

    const animateFly = () => {
      t += 1 / duration;
      const k = t * t * (3 - 2 * t);

      camera.position.lerpVectors(startPos, endPos, k);
      controls.target.lerpVectors(startTarget, endTarget, k);
      controls.update();

      if (t < 1) requestAnimationFrame(animateFly);
    };

    animateFly();
  };

  // Highlight a marker
  const highlightMarker = (mesh: THREE.Mesh) => {
    const outlinePass = outlinePassRef.current;
    if (!outlinePass) return;

    // Clear previous highlight
    outlinePass.selectedObjects = [];
    selectedMarkerRef.current = null;

    // Apply new highlight
    outlinePass.selectedObjects = [mesh];
    selectedMarkerRef.current = mesh;
  };

  // Clear highlight (when panel closes)
  const clearHighlight = () => {
    const outlinePass = outlinePassRef.current;
    if (!outlinePass) return;

    outlinePass.selectedObjects = [];
    selectedMarkerRef.current = null;
  };

  // Clear highlight when selectedLocation becomes null
  useEffect(() => {
    if (selectedLocation === null) {
      clearHighlight();
    }
  }, [selectedLocation]);

  // Setup scene
  useEffect(() => {
    const mount = mountRef.current!;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(20, 20, 20);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    const grid = new THREE.GridHelper(200, 200, 0xcccccc, 0x888888);
    scene.add(grid);

    // const light = new THREE.DirectionalLight(0xffffff, 0);
    // light.position.set(10, 20, 10);
    // scene.add(light);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    // Postprocessing setup
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composerRef.current = composer;

    const outlinePass = new OutlinePass(
      new THREE.Vector2(width, height),
      scene,
      camera
    );
    outlinePass.edgeStrength = 4;
    outlinePass.edgeGlow = 0.5;
    outlinePass.edgeThickness = 1.5;
    outlinePass.visibleEdgeColor.set("#ffffff"); // white glow
    outlinePass.hiddenEdgeColor.set("#ffffff");
    composer.addPass(outlinePass);
    outlinePassRef.current = outlinePass;

    // Click handler
    const handleClick = (event: MouseEvent) => {
      if (
        !rendererRef.current ||
        !cameraRef.current ||
        !markerGroupRef.current
      )
        return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();

      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, cameraRef.current);

      const intersects = raycaster.current.intersectObjects(
        markerGroupRef.current.children,
        true
      );

      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Mesh;
        const loc = obj.userData as MarkerLocation;

        highlightMarker(obj);
        onSelectLocation(loc);
        flyTo(new THREE.Vector3(loc.x, loc.y, loc.z));
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    const animate = () => {
      controls.update();
      composer.render();
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;

      const w = mount.clientWidth;
      const h = mount.clientHeight;

      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      composer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      renderer.domElement.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // Render markers when locations change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const oldGroup = scene.getObjectByName("markers");
    if (oldGroup) scene.remove(oldGroup);

    const markerGroup = new THREE.Group();
    markerGroup.name = "markers";
    markerGroupRef.current = markerGroup;
    scene.add(markerGroup);

    locations.forEach(loc => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xff00ff })
      );
      marker.position.set(loc.x, loc.y, loc.z);
      marker.userData = loc;
      markerGroup.add(marker);
    });
  }, [locations]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
}
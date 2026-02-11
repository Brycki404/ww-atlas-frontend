import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import type { LocationRow } from "../types/my_types";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

interface Map3DProps {
  locations: LocationRow[];
  showMine: boolean;
  USER_ID: string | null;
  onSelectLocation: (loc: LocationRow | null) => void;
  selectedLocation: LocationRow | null;   // ⭐ ADD THIS
}

const Map3D = forwardRef(function Map3D({ locations, showMine, USER_ID, onSelectLocation, selectedLocation }: Map3DProps, ref) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const outlinePassRef = useRef<OutlinePass | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);

  const markerGroupRef = useRef<THREE.Group | null>(null);
  const selectedMarkerRef = useRef<THREE.Mesh | null>(null);
  const profileCardRef = useRef<THREE.Object3D | null>(null);

  const flyTo = (target: THREE.Vector3) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    const endPos = target.clone().add(new THREE.Vector3(5, 5, 5)); // offset
    const endTarget = target.clone();

    const duration = 1000;
    const startTime = performance.now();

    const animateFly = () => {
      const t = (performance.now() - startTime) / duration;
      const k = Math.min(t, 1);

      camera.position.lerpVectors(startPos, endPos, k);
      controls.target.lerpVectors(startTarget, endTarget, k);
      controls.update();

      if (k < 1) requestAnimationFrame(animateFly);
    };

    animateFly();
  };

  useImperativeHandle(ref, () => ({
    flyTo,
  }));

  // --------------------------------------
  // Setup scene, camera, renderer, controls
  // --------------------------------------
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

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composerRef.current = composer;

    const outlinePass = new OutlinePass(new THREE.Vector2(width, height), scene, camera);
    outlinePass.edgeStrength = 4;
    outlinePass.edgeGlow = 0.5;
    outlinePass.edgeThickness = 1.5;
    outlinePass.visibleEdgeColor.set("#ffffff");
    outlinePass.hiddenEdgeColor.set("#ffffff");
    composer.addPass(outlinePass);
    outlinePassRef.current = outlinePass;

    // CSS2DRenderer for tooltips / 3D UI
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.pointerEvents = "none";
    mount.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // ⭐ WIPE ANY OLD DOM NODES FROM PREVIOUS RENDERS
    const dom = labelRenderer.domElement;
    while (dom.firstChild) dom.removeChild(dom.firstChild);

    // --------------------------------------
    // Click handling (no profile card)
    // --------------------------------------
    const handleClick = (event: MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current || !markerGroupRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(markerGroupRef.current.children, true);
      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Mesh;
        const loc = obj.userData as LocationRow;

        // Highlight marker
        selectedMarkerRef.current = obj;
        if (outlinePassRef.current) {
          outlinePassRef.current.selectedObjects = [obj];
        }

        onSelectLocation(loc);
        flyTo(new THREE.Vector3(loc.x, loc.y, loc.z));
      } else {
        // Deselect everything
        selectedMarkerRef.current = null;
        if (outlinePassRef.current) {
          outlinePassRef.current.selectedObjects = [];
        }

        onSelectLocation(null);
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    // --------------------------------------
    // Animation loop
    // --------------------------------------
    const animate = () => {
      requestAnimationFrame(animate);

      // OrbitControls smoothing
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Pulse selected marker
      if (selectedMarkerRef.current) {
        const t = performance.now() * 0.003;
        const scale = 1 + Math.sin(t) * 0.1;
        selectedMarkerRef.current.scale.set(scale, scale, scale);
      }

      // Render 3D scene with postprocessing
      if (composerRef.current) {
        composerRef.current.render();
      }

      // Render CSS2D tooltips + profile cards
      if (labelRendererRef.current && cameraRef.current && sceneRef.current) {
        labelRendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // --------------------------------------
    // Resize handling
    // --------------------------------------
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !composerRef.current || !labelRendererRef.current) return;

      const w = mount.clientWidth;
      const h = mount.clientHeight;

      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      composerRef.current.setSize(w, h);
      labelRendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      renderer.domElement.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }

      if (labelRendererRef.current) {
        const dom = labelRendererRef.current.domElement;
        if (dom.parentNode) {
          dom.parentNode.removeChild(dom);
        }
      }
    };
  }, [onSelectLocation]);

  // --------------------------------------
  // Render markers when locations or showMine change
  // --------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (profileCardRef.current && sceneRef.current) {
      sceneRef.current.remove(profileCardRef.current);
      profileCardRef.current = null;
    }

    // ⭐ 1. Clear old tooltip DOM nodes BEFORE rebuilding
    if (labelRendererRef.current) {
      const dom = labelRendererRef.current.domElement;
      while (dom.firstChild) dom.removeChild(dom.firstChild);
    }

    // ⭐ 2. Remove old marker group
    const oldGroup = scene.getObjectByName("markers");
    if (oldGroup) scene.remove(oldGroup);

    // ⭐ 3. Create new marker group
    const markerGroup = new THREE.Group();
    markerGroup.name = "markers";
    markerGroupRef.current = markerGroup;
    scene.add(markerGroup);

    const visibleLocations =
      showMine && USER_ID
        ? locations.filter((loc) => loc.user_id === USER_ID)
        : locations;

    visibleLocations.forEach((loc) => {
      const isMine = USER_ID && loc.user_id === USER_ID;

      const hue = (parseInt((loc as any).discord_id || "0", 10) % 360) || 200;
      const color = isMine
        ? new THREE.Color(0x00ff00)
        : new THREE.Color(`hsl(${hue}, 70%, 60%)`);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshStandardMaterial({ color })
      );

      marker.position.set(loc.x, loc.y, loc.z);
      marker.userData = loc;
      markerGroup.add(marker);

      // ⭐ 4. Tooltip ALWAYS created
      if (labelRendererRef.current) {
        const tooltip = document.createElement("div");
        tooltip.style.padding = "4px 8px";
        tooltip.style.background = "rgba(0,0,0,0.7)";
        tooltip.style.color = "white";
        tooltip.style.borderRadius = "6px";
        tooltip.style.fontSize = "11px";
        tooltip.style.whiteSpace = "nowrap";
        tooltip.style.pointerEvents = "none";

        // ⭐ Username + avatar row
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "6px";

        if ((loc as any).discord_id && (loc as any).discord_avatar) {
          const img = document.createElement("img");
          img.src = `https://cdn.discordapp.com/avatars/${(loc as any).discord_id}/${(loc as any).discord_avatar}.png`;
          img.style.width = "18px";
          img.style.height = "18px";
          img.style.borderRadius = "50%";
          row.appendChild(img);
        }

        const nameSpan = document.createElement("span");
        nameSpan.textContent = (loc as any).discord_username ?? "Unknown";
        row.appendChild(nameSpan);

        tooltip.appendChild(row);

        // ⭐ Marker name row
        const nameRow = document.createElement("div");
        nameRow.textContent = `Marker: ${loc.name}`;
        nameRow.style.opacity = "0.8";
        nameRow.style.marginTop = "4px";
        tooltip.appendChild(nameRow);

        const label = new CSS2DObject(tooltip);
        label.position.set(0, 1.8, 0);
        marker.add(label);
      }
    });
  }, [locations, showMine, USER_ID]);

  useEffect(() => {
    if (!selectedLocation && profileCardRef.current && sceneRef.current) {
      sceneRef.current.remove(profileCardRef.current);
      profileCardRef.current = null;
    }
  }, [selectedLocation]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
    />
  );
});

export default Map3D;
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

    // --------------------------------------
    // Click handling
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

        // Create / move 3D profile card near marker
        if (profileCardRef.current) {
          scene.remove(profileCardRef.current);
          profileCardRef.current = null;
        }

        const cardGroup = new THREE.Group();
        cardGroup.position.set(loc.x + 2, loc.y + 2, loc.z);

        const cardDiv = document.createElement("div");
        cardDiv.style.padding = "10px 14px";
        cardDiv.style.background = "rgba(0,0,0,0.85)";
        cardDiv.style.color = "white";
        cardDiv.style.borderRadius = "8px";
        cardDiv.style.fontSize = "12px";
        cardDiv.style.display = "flex";
        cardDiv.style.flexDirection = "column";
        cardDiv.style.gap = "6px";
        cardDiv.style.minWidth = "160px";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.gap = "8px";

        const avatarImg = document.createElement("img");
        avatarImg.src = `https://cdn.discordapp.com/avatars/${(loc as any).discord_id}/${(loc as any).discord_avatar}.png`;
        avatarImg.style.width = "32px";
        avatarImg.style.height = "32px";
        avatarImg.style.borderRadius = "50%";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = (loc as any).discord_username ?? "Unknown";

        header.appendChild(avatarImg);
        header.appendChild(nameSpan);

        const markerName = document.createElement("div");
        markerName.textContent = `Marker: ${loc.name}`;
        markerName.style.opacity = "0.8";

        cardDiv.appendChild(header);
        cardDiv.appendChild(markerName);

        const labelObj = new CSS2DObject(cardDiv);
        cardGroup.add(labelObj);

        scene.add(cardGroup);
        profileCardRef.current = cardGroup;

        onSelectLocation(loc);
        flyTo(new THREE.Vector3(loc.x, loc.y, loc.z));
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
      mount.removeChild(renderer.domElement);
      if (labelRendererRef.current) {
        mount.removeChild(labelRendererRef.current.domElement);
      }
    };
  }, [onSelectLocation]);

  // --------------------------------------
  // Render markers when locations or showMine change
  // --------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const oldGroup = scene.getObjectByName("markers");
    if (oldGroup) scene.remove(oldGroup);

    const markerGroup = new THREE.Group();
    markerGroup.name = "markers";
    markerGroupRef.current = markerGroup;
    scene.add(markerGroup);

    const visibleLocations = showMine && USER_ID
      ? locations.filter((loc) => loc.user_id === USER_ID)
      : locations;

    const textureLoader = new THREE.TextureLoader();

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

      // Avatar sprite above marker
      if ((loc as any).discord_id && (loc as any).discord_avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${(loc as any).discord_id}/${(loc as any).discord_avatar}.png`;
        const avatarTexture = textureLoader.load(avatarUrl);

        const spriteMaterial = new THREE.SpriteMaterial({ map: avatarTexture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1.5, 1.5, 1.5);
        sprite.position.set(0, 1.2, 0);
        marker.add(sprite);

        // Tooltip using CSS2D
        if (labelRendererRef.current) {
          const tooltip = document.createElement("div");
          tooltip.style.padding = "4px 8px";
          tooltip.style.background = "rgba(0,0,0,0.7)";
          tooltip.style.color = "white";
          tooltip.style.borderRadius = "6px";
          tooltip.style.fontSize = "11px";
          tooltip.style.whiteSpace = "nowrap";
          tooltip.style.opacity = "0";
          tooltip.style.transition = "opacity 0.15s";

          tooltip.textContent = (loc as any).discord_username ?? "Unknown";

          const label = new CSS2DObject(tooltip);
          label.position.set(0, 1.8, 0);
          marker.add(label);

          // Hover via raycaster: we can't attach DOM events to meshes directly,
          // so we handle hover in the click/raycast loop if you want later.
          // For now, you can always show tooltip or wire a hover system similarly.
        }
      }
    });
  }, [locations, showMine, USER_ID]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
    />
  );
});

export default Map3D;
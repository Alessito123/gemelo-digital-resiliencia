import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Compass, 
  RotateCcw, 
  Eye, 
  Maximize2, 
  Layers, 
  Home, 
  ShieldCheck, 
  AlertOctagon, 
  Users,
  Sun,
  Moon,
  Camera,
  Activity,
  Navigation,
  Play,
  Pause,
  Mountain,
  Sliders
} from 'lucide-react';
import { SettlementPreset, DisasterScenario, SimulationMetrics, AgentHousehold } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface DigitalTwin3DCanvasProps {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  onSelectAgent: (agentId: string) => void;
  selectedAgentId: string | null;
  showTopography: boolean;
  showRoofMaterials: boolean;
  showSocialNetwork: boolean;
  showBottlenecks: boolean;
  showMeetingPoints: boolean;
  showHazardWave: boolean;
}

export const DigitalTwin3DCanvas: React.FC<DigitalTwin3DCanvasProps> = ({
  settlement,
  scenario,
  metrics,
  onSelectAgent,
  selectedAgentId,
  showTopography,
  showRoofMaterials,
  showSocialNetwork,
  showBottlenecks,
  showMeetingPoints,
  showHazardWave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  const [hoveredAgent, setHoveredAgent] = useState<AgentHousehold | null>(null);
  const [cameraMode, setCameraMode] = useState<'perspective' | 'top' | 'drone' | 'street'>('perspective');
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [elevationScale, setElevationScale] = useState(1.4); // Exaggeration factor

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const agentsGroupRef = useRef<THREE.Group | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const getRoofColorHex = (material: AgentHousehold['roofMaterial']): number => {
    switch (material) {
      case 'cardboard_plastic': return 0xF43F5E; // Neon Rose Red
      case 'corrugated_metal': return 0xF59E0B; // Amber Zinc
      case 'unreinforced_masonry': return 0xA855F7; // Purple Masonry
      case 'reinforced_concrete': return 0x10B981; // Emerald Concrete
      default: return 0x94A3B8;
    }
  };

  const getStateColorHex = (state: AgentHousehold['state']): number => {
    switch (state) {
      case 'normal': return 0x38BDF8; // Cyan Sky
      case 'alerted': return 0xFBBF24; // Amber
      case 'preparing': return 0xF97316; // Orange
      case 'evacuating': return 0xEAB308; // Yellow
      case 'helping_others': return 0x06B6D4; // Cyan
      case 'safe': return 0x22C55E; // Green
      case 'trapped': return 0xEF4444; // Red
      case 'injured': return 0xEC4899; // Pink
      default: return 0x94A3B8;
    }
  };

  // Compute realistic hillside elevation with terraces and ravines
  const getElevation = (x: number, y: number, scale = elevationScale): number => {
    const normX = x / 100;
    const normY = y / 100;
    
    // Mountain slope from valley (Y=0) to mountain ridge (Y=100)
    const slope = normY * (settlement.avgSlopeDeg / 30);
    
    // Natural ravines (quebradas) & terraces
    const ridge1 = Math.sin(normX * Math.PI * 2.5) * 0.25;
    const ridge2 = Math.cos((normY + normX * 0.3) * Math.PI * 3) * 0.15;
    const terrace = Math.floor(normY * 6) * 0.08; // Step effect
    
    const rawHeight = Math.max(0, slope + ridge1 + ridge2 + terrace);
    return (rawHeight * 18 + 1.2) * scale;
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 580;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const bgColor = isDark ? 0x07080B : 0xEDF2F7;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.005);

    // 2. Camera Setup (Dramatic Isometric Perspective)
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 1000);
    camera.position.set(-45, 55, 65);
    cameraRef.current = camera;

    // 3. High Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 15;
    controls.maxDistance = 220;
    controls.target.set(0, 10, 0);
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    // 5. Lighting with Rich Atmospheric Shadows
    const ambientLight = new THREE.AmbientLight(isDark ? 0x333848 : 0xF0F4F8, isDark ? 1.6 : 1.9);
    scene.add(ambientLight);

    // Warm Sun Light
    const sunLight = new THREE.DirectionalLight(isDark ? 0xF27D26 : 0xFFFAF0, isDark ? 2.5 : 2.2);
    sunLight.position.set(50, 90, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(isDark ? 0x06B6D4 : 0x94A3B8, 1.0);
    fillLight.position.set(-50, 60, -40);
    scene.add(fillLight);

    // Bottom Ambient bounce
    const groundLight = new THREE.DirectionalLight(isDark ? 0x1E1B4B : 0xE2E8F0, 0.4);
    groundLight.position.set(0, -20, 0);
    scene.add(groundLight);

    // 6. Terrain Mesh with Hillside Shading
    const gridSize = 90;
    const terrainGeo = new THREE.PlaneGeometry(gridSize, gridSize, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const normX = ((vx + gridSize / 2) / gridSize) * 100;
      const normY = ((vz + gridSize / 2) / gridSize) * 100;
      const h = getElevation(normX, normY);
      pos.setY(i, h);

      // Vertex color blending: Valley (lush green/clay) -> Hill (slate/stone) -> Ridge (terracotta)
      const ratio = h / 30;
      if (isDark) {
        colors[i * 3] = 0.1 + ratio * 0.15;     // R
        colors[i * 3 + 1] = 0.12 + (1 - ratio) * 0.08; // G
        colors[i * 3 + 2] = 0.16 + ratio * 0.1; // B
      } else {
        colors[i * 3] = 0.8 + ratio * 0.1;
        colors[i * 3 + 1] = 0.85 - ratio * 0.08;
        colors[i * 3 + 2] = 0.88 - ratio * 0.15;
      }
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.name = 'terrain';
    scene.add(terrainMesh);

    // Elevation Contour Wireframe lines
    const wireMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x334155 : 0x94A3B8,
      wireframe: true,
      transparent: true,
      opacity: showTopography ? 0.35 : 0.08,
    });
    const wireMesh = new THREE.Mesh(terrainGeo, wireMat);
    wireMesh.position.y = 0.04;
    scene.add(wireMesh);

    // Stylized Architectural Pedestal Base (Plinth)
    const baseGeo = new THREE.BoxGeometry(gridSize, 4, gridSize);
    const baseMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0A0B10 : 0xCBD5E1,
      roughness: 0.9,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -2, 0);
    scene.add(baseMesh);

    // Base Grid Ring
    const gridHelper = new THREE.GridHelper(gridSize, 18, 0xF27D26, isDark ? 0x1E222D : 0xE2E8F0);
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    // 7. Safe Zones (Meeting Points 3D Canopies & Beacons)
    settlement.meetingPoints.forEach((mp) => {
      const wx = (mp.x - 50) * 0.85;
      const wz = (mp.y - 50) * 0.85;
      const wy = getElevation(mp.x, mp.y);

      // Safe Plaza Floor
      const plazaGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.4, 24);
      const plazaMat = new THREE.MeshStandardMaterial({
        color: 0x10B981,
        roughness: 0.3,
        metalness: 0.2,
      });
      const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
      plazaMesh.position.set(wx, wy + 0.2, wz);
      scene.add(plazaMesh);

      // Translucent forcefield beacon
      const beaconGeo = new THREE.CylinderGeometry(3.8, 3.8, 22, 24, 1, true);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x10B981,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(wx, wy + 11, wz);
      scene.add(beaconMesh);

      // Pulsing Base Ring
      const ringGeo = new THREE.RingGeometry(3.5, 4.6, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x34D399, side: THREE.DoubleSide });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(wx, wy + 0.45, wz);
      scene.add(ringMesh);
    });

    // 8. Chokepoints (3D Danger Beacons)
    settlement.bottlenecks.forEach((bn) => {
      const bx = (bn.x - 50) * 0.85;
      const bz = (bn.y - 50) * 0.85;
      const by = getElevation(bn.x, bn.y);

      const dangerGeo = new THREE.OctahedronGeometry(1.8, 0);
      const dangerMat = new THREE.MeshStandardMaterial({
        color: bn.severity === 'critical' ? 0xEF4444 : 0xF59E0B,
        emissive: bn.severity === 'critical' ? 0xEF4444 : 0xF59E0B,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const dangerMesh = new THREE.Mesh(dangerGeo, dangerMat);
      dangerMesh.position.set(bx, by + 5, bz);
      dangerMesh.name = `bottleneck_${bn.id}`;
      scene.add(dangerMesh);
    });

    // 9. Hazard Wave (Flood / Tsunami / Mudslide)
    const waterGeo = new THREE.PlaneGeometry(gridSize, gridSize, 32, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: scenario.type === 'landslide' ? 0x78350F : 0x0284C7,
      transparent: true,
      opacity: 0.72,
      roughness: 0.1,
      metalness: 0.8,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, 2, 0);
    waterMeshRef.current = waterMesh;
    scene.add(waterMesh);

    // 10. Dwellings & Agents Group
    const agentsGroup = new THREE.Group();
    agentsGroupRef.current = agentsGroup;
    scene.add(agentsGroup);

    // 11. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Dynamic water level & wave oscillations
      if (waterMeshRef.current && showHazardWave) {
        const hazardLevel = (metrics.currentStep / 50) * (scenario.parameters.intensityScale / 10);
        const baseH = scenario.type === 'flood' || scenario.type === 'compound' ? 3.5 + hazardLevel * 7.5 : 1.5;
        waterMeshRef.current.position.y = baseH + Math.sin(elapsedTime * 2.5) * 0.2;
      }

      // Rotate hazard octahedrons
      scene.children.forEach((child) => {
        if (child.name.startsWith('bottleneck_')) {
          child.rotation.y = elapsedTime * 2;
          child.rotation.x = Math.sin(elapsedTime * 2) * 0.3;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight || 580;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      scene.clear();
    };
  }, [settlement, isDark, showTopography, showHazardWave, elevationScale, isAutoRotating]);

  // Build Rich 3D Informal Dwellings & Agents
  useEffect(() => {
    if (!agentsGroupRef.current || !sceneRef.current) return;
    const group = agentsGroupRef.current;
    
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    settlement.households.forEach((agent) => {
      const hx = (agent.currentX - 50) * 0.85;
      const hz = (agent.currentY - 50) * 0.85;
      const hy = getElevation(agent.currentX, agent.currentY);
      const isSelected = selectedAgentId === agent.id;

      const houseContainer = new THREE.Group();
      houseContainer.position.set(hx, hy, hz);
      houseContainer.userData = { agentId: agent.id };

      // Dimensions
      const w = 2.4;
      const h = 2.0;
      const d = 2.4;

      // 1. Foundation Stilts (Pillars into ground)
      const stiltGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.5);
      const stiltMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      [[-w/2.4, -d/2.4], [w/2.4, -d/2.4], [-w/2.4, d/2.4], [w/2.4, d/2.4]].forEach(([sx, sz]) => {
        const stilt = new THREE.Mesh(stiltGeo, stiltMat);
        stilt.position.set(sx, -0.6, sz);
        houseContainer.add(stilt);
      });

      // 2. Main Wall Body
      const wallGeo = new THREE.BoxGeometry(w, h, d);
      const wallMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x242838 : 0xE2E8F0,
        roughness: 0.8,
      });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.y = h / 2;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      houseContainer.add(wallMesh);

      // 3. Colored Sloped Roof
      const roofGeo = new THREE.BoxGeometry(w * 1.15, 0.25, d * 1.15);
      const roofColor = showRoofMaterials ? getRoofColorHex(agent.roofMaterial) : 0x64748B;
      const roofMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xFFFFFF : roofColor,
        emissive: isSelected ? 0xF27D26 : (isDark ? roofColor : 0x000000),
        emissiveIntensity: isSelected ? 0.8 : 0.15,
        roughness: 0.35,
      });
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(0, h + 0.12, 0);
      roofMesh.rotation.x = 0.08; // Sloped roof
      roofMesh.castShadow = true;
      houseContainer.add(roofMesh);

      // 4. Rooftop Water Tank (Tinaco) - Latin American Informal Iconic Element
      const tankGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.65, 12);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x1E3A8A, roughness: 0.4 });
      const tankMesh = new THREE.Mesh(tankGeo, tankMat);
      tankMesh.position.set(w * 0.22, h + 0.55, d * 0.15);
      houseContainer.add(tankMesh);

      // 5. Glowing Windows / Door
      const windowGeo = new THREE.PlaneGeometry(0.6, 0.6);
      const windowMat = new THREE.MeshBasicMaterial({ 
        color: isDark ? 0xFDE047 : 0x334155, 
        side: THREE.DoubleSide 
      });
      const winMesh = new THREE.Mesh(windowGeo, windowMat);
      winMesh.position.set(0, h * 0.55, d / 2 + 0.01);
      houseContainer.add(winMesh);

      // 6. Dynamic Agent Beacon Pin (Pedestrian / Household Status)
      const stateColor = getStateColorHex(agent.state);
      const pinHeadGeo = new THREE.SphereGeometry(0.55, 16, 16);
      const pinHeadMat = new THREE.MeshStandardMaterial({
        color: stateColor,
        emissive: stateColor,
        emissiveIntensity: 0.6,
      });
      const pinHead = new THREE.Mesh(pinHeadGeo, pinHeadMat);
      pinHead.position.set(0, h + 1.6, 0);
      houseContainer.add(pinHead);

      // Leader Golden Star
      if (agent.isLeader) {
        const starGeo = new THREE.OctahedronGeometry(0.4, 0);
        const starMat = new THREE.MeshBasicMaterial({ color: 0xFACC15 });
        const starMesh = new THREE.Mesh(starGeo, starMat);
        starMesh.position.set(0, h + 2.4, 0);
        houseContainer.add(starMesh);
      }

      // Selection Ring
      if (isSelected) {
        const selRingGeo = new THREE.RingGeometry(1.8, 2.3, 24);
        selRingGeo.rotateX(-Math.PI / 2);
        const selRingMat = new THREE.MeshBasicMaterial({ color: 0xF27D26, side: THREE.DoubleSide });
        const selRing = new THREE.Mesh(selRingGeo, selRingMat);
        selRing.position.set(0, 0.2, 0);
        houseContainer.add(selRing);
      }

      group.add(houseContainer);
    });
  }, [settlement.households, selectedAgentId, showRoofMaterials, metrics.currentStep, isDark, elevationScale]);

  // Raycasting for Mouse Interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !agentsGroupRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(agentsGroupRef.current.children, true);

    if (intersects.length > 0) {
      let current: THREE.Object3D | null = intersects[0].object;
      while (current && !current.userData?.agentId) {
        current = current.parent;
      }
      if (current?.userData?.agentId) {
        onSelectAgent(current.userData.agentId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !agentsGroupRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(agentsGroupRef.current.children, true);

    if (intersects.length > 0) {
      let current: THREE.Object3D | null = intersects[0].object;
      while (current && !current.userData?.agentId) {
        current = current.parent;
      }
      if (current?.userData?.agentId) {
        const found = settlement.households.find((h) => h.id === current?.userData?.agentId);
        setHoveredAgent(found || null);
        return;
      }
    }
    setHoveredAgent(null);
  };

  const setCameraPreset = (mode: 'perspective' | 'top' | 'drone' | 'street') => {
    if (!cameraRef.current || !controlsRef.current) return;
    setCameraMode(mode);
    if (mode === 'perspective') {
      cameraRef.current.position.set(-45, 55, 65);
      controlsRef.current.target.set(0, 10, 0);
    } else if (mode === 'top') {
      cameraRef.current.position.set(0, 110, 0.1);
      controlsRef.current.target.set(0, 5, 0);
    } else if (mode === 'drone') {
      cameraRef.current.position.set(55, 42, 55);
      controlsRef.current.target.set(0, 12, 0);
    } else if (mode === 'street') {
      cameraRef.current.position.set(-25, 14, 25);
      controlsRef.current.target.set(0, 12, 0);
    }
    controlsRef.current.update();
  };

  return (
    <div ref={containerRef} className="relative w-full h-[580px] rounded-2xl overflow-hidden select-none bg-[#07080B] shadow-2xl border border-white/10">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Left HUD Telemetry */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/15 text-white text-xs font-mono font-bold w-fit shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
          <span>3D Twin · {settlement.name}</span>
          <span className="text-[10px] text-[#F27D26] px-1.5 py-0.2 rounded bg-[#F27D26]/20">PBR WebGL</span>
        </div>

        {hoveredAgent && (
          <div className="p-3.5 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/20 text-white text-xs max-w-xs shadow-2xl animate-rise pointer-events-auto">
            <div className="flex items-center justify-between font-bold text-[#F27D26] mb-2 pb-1.5 border-b border-white/10">
              <span className="flex items-center gap-1.5 text-sm">
                <Home className="w-4 h-4" />
                {hoveredAgent.name}
              </span>
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase"
                style={{ backgroundColor: `${getStateColorHex(hoveredAgent.state).toString(16)}30`, color: `#${getStateColorHex(hoveredAgent.state).toString(16).padStart(6, '0')}` }}
              >
                {hoveredAgent.state}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-300 font-mono">
              <div>Habitantes: <strong className="text-white">{hoveredAgent.residentsCount} ({hoveredAgent.vulnerableCount} vul.)</strong></div>
              <div>Pendiente: <strong className="text-amber-400">{hoveredAgent.slopeAngleDeg}°</strong></div>
              <div>Techo: <strong className="text-white capitalize">{hoveredAgent.roofMaterial.replace('_', ' ')}</strong></div>
              <div>Movilidad: <strong className="text-emerald-400">{Math.round(hoveredAgent.mobilityScore * 100)}%</strong></div>
              <div>Alerta: <strong className="text-[#F27D26] capitalize">{hoveredAgent.warningChannel}</strong></div>
              <div>Apoyo Vecinal: <strong className="text-cyan-400">{hoveredAgent.socialTies.length} lazos</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Viewport & 3D Steering Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        {/* Turntable Auto-Rotate Button */}
        <button
          type="button"
          onClick={() => {
            setIsAutoRotating(!isAutoRotating);
            if (controlsRef.current) controlsRef.current.autoRotate = !isAutoRotating;
          }}
          title={isAutoRotating ? "Pausar Rotación Automática" : "Giro 3D Automático"}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 backdrop-blur-xl border cursor-pointer transition-all shadow-lg ${
            isAutoRotating
              ? 'bg-[#F27D26] text-black border-[#F27D26]'
              : 'bg-black/80 text-white border-white/15 hover:border-[#F27D26]'
          }`}
        >
          {isAutoRotating ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>Giro 3D</span>
        </button>

        {/* View Angles */}
        <button
          type="button"
          onClick={() => setCameraPreset('perspective')}
          title="Vista 3D Isométrica"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 backdrop-blur-xl border cursor-pointer transition-all shadow-lg ${
            cameraMode === 'perspective'
              ? 'bg-[#F27D26] text-black border-[#F27D26]'
              : 'bg-black/80 text-white border-white/15 hover:border-[#F27D26]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Isométrica</span>
        </button>

        <button
          type="button"
          onClick={() => setCameraPreset('drone')}
          title="Vista Dron / Sobrevuelo"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 backdrop-blur-xl border cursor-pointer transition-all shadow-lg ${
            cameraMode === 'drone'
              ? 'bg-[#F27D26] text-black border-[#F27D26]'
              : 'bg-black/80 text-white border-white/15 hover:border-[#F27D26]'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Dron / Talud</span>
        </button>

        <button
          type="button"
          onClick={() => setCameraPreset('top')}
          title="Vista Cenital"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 backdrop-blur-xl border cursor-pointer transition-all shadow-lg ${
            cameraMode === 'top'
              ? 'bg-[#F27D26] text-black border-[#F27D26]'
              : 'bg-black/80 text-white border-white/15 hover:border-[#F27D26]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Cenital</span>
        </button>

        <button
          type="button"
          onClick={() => setCameraPreset('street')}
          title="Vista Rasante"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 backdrop-blur-xl border cursor-pointer transition-all shadow-lg ${
            cameraMode === 'street'
              ? 'bg-[#F27D26] text-black border-[#F27D26]'
              : 'bg-black/80 text-white border-white/15 hover:border-[#F27D26]'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Rasante</span>
        </button>

        {/* Topography Relief Exaggeration Toggle */}
        <button
          type="button"
          onClick={() => setElevationScale((s) => (s >= 2.0 ? 1.0 : s + 0.5))}
          title="Exagerar Relieve 3D"
          className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 bg-black/80 text-[#F27D26] border border-white/15 hover:border-[#F27D26] backdrop-blur-xl cursor-pointer transition-all shadow-lg"
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>Relieve {elevationScale.toFixed(1)}x</span>
        </button>
      </div>

      {/* Bottom Floating Legend HUD */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/90 bg-black/75 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 font-mono shadow-2xl">
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="text-gray-400 font-bold uppercase text-[10px]">Material Techo:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E]" /> Cartón/Plástico</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" /> Calamina/Zinc</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#A855F7]" /> Mampostería</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" /> Concreto</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-300">
          <Activity className="w-3.5 h-3.5 text-[#F27D26]" />
          <span>Arrastrar para rotar · Rueda para zoom · Clic en vivienda para telemetría</span>
        </div>
      </div>
    </div>
  );
};

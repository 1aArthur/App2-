/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BoardSkinId, CharacterId, BOARD_SKINS, CHARACTERS } from '../types';
import { sound } from '../sound';

interface SubwayRendererProps {
  isPlaying: boolean;
  isPaused: boolean;
  isInRevivePrompt: boolean;
  isGameOver: boolean;
  speed: number;
  hoverboardActive: boolean;
  selectedBoardSkin: BoardSkinId;
  selectedCharacter: CharacterId;
  invulnerableTimer: number;
  activePowers: {
    magnet: number;
    multiplier: number;
    sneakers: number;
  };
  onCollectCoin: (amount: number) => void;
  onCollectPowerup: (kind: 'magnet' | 'multiplier' | 'sneakers') => void;
  onPlayerCrash: () => void;
  onHoverboardBroken: () => void;
  onScoreTick: (deltaDist: number) => void;
  onActivateBoardRequest: () => void;
  onPhaseUpdate: (phaseName: string, phaseIndex: number, speedKmh: number) => void;
}

// Module-level reusable math objects for ZERO Garbage Collection in game loop
const _vec3 = new THREE.Vector3();
const _playerBox = new THREE.Box3();

const LANE_WIDTH = 3.6;
const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];

// Procedural Canvas Texture for Train & Tunnel Graffiti Murals
function createGraffitiTexture(text: string, bgColor: string, fgColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);

  // Urban spray splash dots
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? fgColor : '#facc15';
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 128, Math.random() * 8 + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bold Graffiti Text
  ctx.font = 'bold 54px Impact, "Arial Black", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(text, 24, 88);
  ctx.fillStyle = fgColor;
  ctx.fillText(text, 20, 84);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const SubwayRenderer: React.FC<SubwayRendererProps> = ({
  isPlaying,
  isPaused,
  isInRevivePrompt,
  isGameOver,
  speed,
  hoverboardActive,
  selectedBoardSkin,
  selectedCharacter,
  invulnerableTimer,
  activePowers,
  onCollectCoin,
  onCollectPowerup,
  onPlayerCrash,
  onHoverboardBroken,
  onScoreTick,
  onActivateBoardRequest,
  onPhaseUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const propsRef = useRef({
    isPlaying,
    isPaused,
    isInRevivePrompt,
    isGameOver,
    speed,
    hoverboardActive,
    selectedBoardSkin,
    selectedCharacter,
    invulnerableTimer,
    activePowers,
    onCollectCoin,
    onCollectPowerup,
    onPlayerCrash,
    onHoverboardBroken,
    onScoreTick,
    onActivateBoardRequest,
    onPhaseUpdate,
  });

  useEffect(() => {
    propsRef.current = {
      isPlaying,
      isPaused,
      isInRevivePrompt,
      isGameOver,
      speed,
      hoverboardActive,
      selectedBoardSkin,
      selectedCharacter,
      invulnerableTimer,
      activePowers,
      onCollectCoin,
      onCollectPowerup,
      onPlayerCrash,
      onHoverboardBroken,
      onScoreTick,
      onActivateBoardRequest,
      onPhaseUpdate,
    };
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL safely
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    const sceneBgColor = new THREE.Color(0x0a0c16);
    const sceneFog = new THREE.FogExp2(0x0a0c16, 0.008);
    scene.background = sceneBgColor;
    scene.fog = sceneFog;

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      350
    );
    camera.position.set(0, 4.4, 7.8);
    camera.lookAt(0, 1.8, -14);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Procedural Studio Environment for metallic reflections
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback
    }

    // 3. LIGHTING RIG
    const hemiLight = new THREE.HemisphereLight(0x7080ff, 0x1a1a2e, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.4);
    keyLight.position.set(15, 30, 20);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 5;
      keyLight.shadow.camera.far = 100;
      keyLight.shadow.camera.left = -15;
      keyLight.shadow.camera.right = 15;
      keyLight.shadow.camera.top = 20;
      keyLight.shadow.camera.bottom = -10;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0x334466, 0.7);
    scene.add(ambientLight);

    // 4. SUBWAY TRACKS, GROUND & SCENERY
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // Ground bed (ballast gravel)
    const groundGeo = new THREE.PlaneGeometry(40, 600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111625,
      roughness: 0.85,
      metalness: 0.15,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, -150);
    groundMesh.receiveShadow = !isSoftwareGl;
    trackGroup.add(groundMesh);

    // Rails and Wooden Ties
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x8899aa,
      metalness: 0.9,
      roughness: 0.25,
    });
    const tieMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.95,
      metalness: 0.05,
    });
    const neonLineMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Build 3 track lines
    LANES.forEach((laneX) => {
      for (const railOffset of [-0.9, 0.9]) {
        const railGeo = new THREE.BoxGeometry(0.12, 0.15, 600);
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(laneX + railOffset, 0.08, -150);
        trackGroup.add(rail);
      }

      // Center neon glow wire along the track
      const wireGeo = new THREE.BoxGeometry(0.04, 0.02, 600);
      const wire = new THREE.Mesh(wireGeo, neonLineMat);
      wire.position.set(laneX, 0.02, -150);
      trackGroup.add(wire);
    });

    // Instanced wooden ties
    const tieCount = 200;
    const tieGeo = new THREE.BoxGeometry(2.2, 0.1, 0.4);
    const tieInstanced = new THREE.InstancedMesh(tieGeo, tieMat, tieCount * 3);
    const dummyMat4 = new THREE.Matrix4();
    let idx = 0;
    for (let i = 0; i < tieCount; i++) {
      const z = -i * 2.8;
      for (const laneX of LANES) {
        dummyMat4.setPosition(laneX, 0.05, z);
        tieInstanced.setMatrixAt(idx++, dummyMat4);
      }
    }
    tieInstanced.instanceMatrix.needsUpdate = true;
    trackGroup.add(tieInstanced);

    // GRAFFITI WALLS & BILLBOARDS
    const wallGeo = new THREE.BoxGeometry(0.5, 4.5, 600);
    const graffitiTex1 = createGraffitiTexture('SUBWAY SURF', '#1e293b', '#00f0ff');
    const graffitiTex2 = createGraffitiTexture('8000Hz SPEED', '#1e293b', '#ff0055');
    const wallMat1 = new THREE.MeshStandardMaterial({ map: graffitiTex1, roughness: 0.8 });
    const wallMat2 = new THREE.MeshStandardMaterial({ map: graffitiTex2, roughness: 0.8 });

    const leftWall = new THREE.Mesh(wallGeo, wallMat1);
    leftWall.position.set(-8.5, 2.25, -150);
    trackGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat2);
    rightWall.position.set(8.5, 2.25, -150);
    trackGroup.add(rightWall);

    // Street Lamps with volumetric light along the tracks
    const lampPosts: THREE.Group[] = [];
    for (let z = -10; z > -300; z -= 30) {
      for (const side of [-8.0, 8.0]) {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(side, 0, z);

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 5.5, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2.75;
        lampGroup.add(pole);

        // Arm
        const armGeo = new THREE.BoxGeometry(side > 0 ? -1.2 : 1.2, 0.1, 0.1);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(side > 0 ? -0.6 : 0.6, 5.4, 0);
        lampGroup.add(arm);

        // Glowing Lantern
        const lanternGeo = new THREE.BoxGeometry(0.35, 0.2, 0.35);
        const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffea75 });
        const lantern = new THREE.Mesh(lanternGeo, lanternMat);
        lantern.position.set(side > 0 ? -1.1 : 1.1, 5.25, 0);
        lampGroup.add(lantern);

        scene.add(lampGroup);
        lampPosts.push(lampGroup);
      }
    }

    // Overhead Steel Truss Gantries with Power Lines
    const gantryGeo = new THREE.BoxGeometry(18, 0.45, 0.5);
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const gantries: THREE.Mesh[] = [];
    for (let z = -20; z > -300; z -= 35) {
      const gantry = new THREE.Mesh(gantryGeo, gantryMat);
      gantry.position.set(0, 6.2, z);
      scene.add(gantry);
      gantries.push(gantry);
    }

    // High voltage power lines running above tracks
    for (const laneX of LANES) {
      const wireGeo = new THREE.CylinderGeometry(0.025, 0.025, 600, 4);
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.rotation.x = Math.PI / 2;
      wire.position.set(laneX, 5.8, -150);
      trackGroup.add(wire);
    }

    // 5. PLAYER CHARACTER MODEL & CUSTOM EFFECTS (Composite 3-12 parts)
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    // Torso / Street Jacket
    const torsoGeo = new THREE.BoxGeometry(0.85, 1.1, 0.55);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.6,
      metalness: 0.1,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.35;
    torso.castShadow = !isSoftwareGl;
    playerGroup.add(torso);

    // Urban Backpack
    const backpackGeo = new THREE.BoxGeometry(0.68, 0.85, 0.38);
    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.7,
      metalness: 0.2,
    });
    const backpack = new THREE.Mesh(backpackGeo, backpackMat);
    backpack.position.set(0, 1.4, 0.4);
    backpack.castShadow = !isSoftwareGl;
    playerGroup.add(backpack);

    // Spray Can hanging on hip
    const sprayCanGroup = new THREE.Group();
    sprayCanGroup.position.set(0.48, 1.0, 0.15);
    const canGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 10);
    const canMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8 });
    const canMesh = new THREE.Mesh(canGeo, canMat);
    sprayCanGroup.add(canMesh);
    const tipGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.y = 0.2;
    sprayCanGroup.add(tipMesh);
    playerGroup.add(sprayCanGroup);

    // Head
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.5,
      metalness: 0.05,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.15;
    head.castShadow = !isSoftwareGl;
    playerGroup.add(head);

    // Headwear (Backwards Cap / Headband)
    const capGeo = new THREE.BoxGeometry(0.62, 0.26, 0.68);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.4,
      metalness: 0.2,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 2.38, -0.05);
    playerGroup.add(cap);

    const visorGeo = new THREE.BoxGeometry(0.52, 0.08, 0.36);
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.position.set(0, 2.32, 0.45);
    playerGroup.add(visor);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.3, 0.85, 0.35);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
    });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.25, 0.45, 0);
    leftLeg.castShadow = !isSoftwareGl;
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.25, 0.45, 0);
    rightLeg.castShadow = !isSoftwareGl;
    playerGroup.add(rightLeg);

    // High-top Sneakers
    const shoeGeo = new THREE.BoxGeometry(0.32, 0.22, 0.55);
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.2,
    });
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.25, 0.1, -0.05);
    playerGroup.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.25, 0.1, -0.05);
    playerGroup.add(rightShoe);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.22, 0.75, 0.25);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.55, 1.35, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.55, 1.35, 0);
    playerGroup.add(rightArm);

    // CHARACTER CUSTOM VISUAL EFFECTS SYSTEM (Spray trails, sparks, embers, soundwaves)
    const effectGroup = new THREE.Group();
    playerGroup.add(effectGroup);

    // Spray Drip / Spark particles (Instanced / Multi-point mesh)
    const particleCount = 24;
    const particleGeo = new THREE.DodecahedronGeometry(0.08, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const particleMeshes: THREE.Mesh[] = [];
    for (let p = 0; p < particleCount; p++) {
      const pm = new THREE.Mesh(particleGeo, particleMat);
      pm.visible = false;
      effectGroup.add(pm);
      particleMeshes.push(pm);
    }

    // 6. 3D HOVERBOARD MODEL
    const hoverboardGroup = new THREE.Group();
    playerGroup.add(hoverboardGroup);
    hoverboardGroup.position.set(0, 0.08, 0);
    hoverboardGroup.visible = false;

    const deckGeo = new THREE.BoxGeometry(1.2, 0.09, 2.6);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.85,
      roughness: 0.2,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    hoverboardGroup.add(deck);

    const trimGeo = new THREE.BoxGeometry(1.26, 0.04, 2.66);
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    hoverboardGroup.add(trim);

    // Dual Thrusters
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (const tx of [-0.35, 0.35]) {
      const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.35, 12);
      const thruster = new THREE.Mesh(thrusterGeo, deckMat);
      thruster.rotation.x = Math.PI / 2;
      thruster.position.set(tx, 0.02, 1.25);
      hoverboardGroup.add(thruster);

      const glowConeGeo = new THREE.ConeGeometry(0.15, 0.8, 8);
      const glowCone = new THREE.Mesh(glowConeGeo, thrusterMat);
      glowCone.rotation.x = -Math.PI / 2;
      glowCone.position.set(tx, 0.02, 1.6);
      hoverboardGroup.add(glowCone);
    }

    // Shield aura
    const shieldGeo = new THREE.SphereGeometry(1.85, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.y = 1.3;
    shieldMesh.visible = false;
    playerGroup.add(shieldMesh);

    // Contact shadow
    const shadowGeo = new THREE.PlaneGeometry(1.6, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.03;
    playerGroup.add(contactShadow);

    // 7. WORLD OBSTACLES, COINS & POWERUPS
    interface ObstacleData {
      group: THREE.Group;
      box: THREE.Box3;
      lane: number;
      kind: 'train' | 'barrier_low' | 'barrier_high';
    }

    interface CoinData {
      mesh: THREE.Mesh;
      lane: number;
      initialZ: number;
      collected: boolean;
    }

    interface PowerupData {
      group: THREE.Group;
      kind: 'magnet' | 'multiplier' | 'sneakers';
      lane: number;
      collected: boolean;
    }

    const activeObstacles: ObstacleData[] = [];
    const activeCoins: CoinData[] = [];
    const activePowerups: PowerupData[] = [];

    const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0xffa500,
      emissiveIntensity: 0.25,
    });

    // Helper: Build Detailed 3D Subway Train (with wheels, bogeys, graffiti murals)
    function createTrainMesh(laneX: number, z: number): THREE.Group {
      const train = new THREE.Group();
      train.position.set(laneX, 0, z);

      // Main Train Car body
      const bodyGeo = new THREE.BoxGeometry(2.7, 3.4, 16);
      const trainBodyTex = createGraffitiTexture('SURF STREET', '#1d4ed8', '#00f0ff');
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        metalness: 0.6,
        roughness: 0.3,
        map: trainBodyTex,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.8;
      body.castShadow = !isSoftwareGl;
      train.add(body);

      // Roof with vents
      const roofGeo = new THREE.BoxGeometry(2.65, 0.35, 16);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 3.6;
      train.add(roof);

      // Front Window Shield
      const frontWinGeo = new THREE.BoxGeometry(2.2, 1.1, 0.2);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.1,
        metalness: 0.9,
      });
      const frontWin = new THREE.Mesh(frontWinGeo, winMat);
      frontWin.position.set(0, 2.2, 8.05);
      train.add(frontWin);

      // Dual Headlights
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
      for (const lx of [-0.85, 0.85]) {
        const headlightGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12);
        const headlight = new THREE.Mesh(headlightGeo, lightMat);
        headlight.rotation.x = Math.PI / 2;
        headlight.position.set(lx, 1.0, 8.05);
        train.add(headlight);
      }

      // Wheels / Bogeys underneath train
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
      for (const bz of [-6, -4, 4, 6]) {
        for (const bx of [-1.15, 1.15]) {
          const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(bx, 0.3, bz);
          train.add(wheel);
        }
      }

      // Yellow Front Bumper
      const stripeGeo = new THREE.BoxGeometry(2.72, 0.35, 0.2);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.7, 8.02);
      train.add(stripe);

      scene.add(train);
      return train;
    }

    // Helper: Build Low Barrier
    function createLowBarrier(laneX: number, z: number): THREE.Group {
      const barrier = new THREE.Group();
      barrier.position.set(laneX, 0, z);

      const barGeo = new THREE.BoxGeometry(2.5, 0.45, 0.25);
      const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.y = 0.55;
      bar.castShadow = !isSoftwareGl;
      barrier.add(bar);

      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      for (const px of [-1.1, 1.1]) {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(px, 0.45, 0);
        barrier.add(post);
      }

      scene.add(barrier);
      return barrier;
    }

    // Helper: Build High Barrier
    function createHighBarrier(laneX: number, z: number): THREE.Group {
      const barrier = new THREE.Group();
      barrier.position.set(laneX, 0, z);

      const signGeo = new THREE.BoxGeometry(2.6, 1.2, 0.2);
      const signMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.y = 2.1;
      sign.castShadow = !isSoftwareGl;
      barrier.add(sign);

      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.7, 8);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      for (const px of [-1.2, 1.2]) {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(px, 1.35, 0);
        barrier.add(post);
      }

      scene.add(barrier);
      return barrier;
    }

    // Helper: Build 3D Powerup Item
    function createPowerupItem(kind: 'magnet' | 'multiplier' | 'sneakers', laneX: number, z: number): THREE.Group {
      const group = new THREE.Group();
      group.position.set(laneX, 1.2, z);

      let color = 0xff0055;
      if (kind === 'magnet') color = 0xef4444;
      if (kind === 'multiplier') color = 0x10b981;
      if (kind === 'sneakers') color = 0x3b82f6;

      const orbGeo = new THREE.DodecahedronGeometry(0.55, 0);
      const orbMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: color,
        emissiveIntensity: 0.6,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      group.add(orb);

      const ringGeo = new THREE.TorusGeometry(0.75, 0.06, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      scene.add(group);
      return group;
    }

    // Procedural Spawner with Difficulty Scaling
    let nextSpawnZ = -30;
    function spawnChunk(zPos: number, currentPhase: number) {
      // In higher phases, spawn multiple obstacles or narrower lanes
      const laneIdx = Math.floor(Math.random() * 3);
      const laneX = LANES[laneIdx];
      const roll = Math.random();

      // Increased obstacle density as phase increases
      const trainProb = 0.35 + currentPhase * 0.05;
      const barrierLowProb = trainProb + 0.25;
      const barrierHighProb = barrierLowProb + 0.18;

      if (roll < trainProb) {
        // Subway Train
        const train = createTrainMesh(laneX, zPos);
        const box = new THREE.Box3();
        activeObstacles.push({ group: train, box, lane: laneIdx, kind: 'train' });
      } else if (roll < barrierLowProb) {
        // Low Barrier (Jump)
        const barrier = createLowBarrier(laneX, zPos);
        const box = new THREE.Box3();
        activeObstacles.push({ group: barrier, box, lane: laneIdx, kind: 'barrier_low' });
      } else if (roll < barrierHighProb) {
        // High Barrier (Roll)
        const barrier = createHighBarrier(laneX, zPos);
        const box = new THREE.Box3();
        activeObstacles.push({ group: barrier, box, lane: laneIdx, kind: 'barrier_high' });
      } else if (roll < 0.94) {
        // Coins Row (4 coins)
        for (let c = 0; c < 4; c++) {
          const coin = new THREE.Mesh(coinGeo, coinMat);
          coin.rotation.x = Math.PI / 2;
          const coinZ = zPos - c * 2.6;
          coin.position.set(laneX, 0.8, coinZ);
          scene.add(coin);
          activeCoins.push({ mesh: coin, lane: laneIdx, initialZ: coinZ, collected: false });
        }
      } else {
        // Powerup
        const powerKinds: ('magnet' | 'multiplier' | 'sneakers')[] = ['magnet', 'multiplier', 'sneakers'];
        const chosen = powerKinds[Math.floor(Math.random() * powerKinds.length)];
        const powerup = createPowerupItem(chosen, laneX, zPos);
        activePowerups.push({ group: powerup, kind: chosen, lane: laneIdx, collected: false });
      }
    }

    // Initialize initial track chunks
    for (let z = -25; z > -280; z -= 25) {
      spawnChunk(z, 0);
      nextSpawnZ = z - 25;
    }

    // 8. INPUT HANDLER (8000Hz Ultra Low Latency Ready)
    let currentLane = 1;
    let targetX = 0;
    let isJumping = false;
    let isRolling = false;
    let yVel = 0;
    const GRAVITY = -48;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const p = propsRef.current;
      if (!p.isPlaying || p.isPaused || p.isInRevivePrompt || p.isGameOver) return;

      switch (e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          if (currentLane > 0) {
            currentLane--;
            targetX = LANES[currentLane];
          }
          break;

        case 'KeyD':
        case 'ArrowRight':
          if (currentLane < 2) {
            currentLane++;
            targetX = LANES[currentLane];
          }
          break;

        case 'KeyW':
        case 'ArrowUp':
        case 'Space':
          if (!isJumping) {
            isJumping = true;
            const hasSneakers = p.activePowers.sneakers > 0;
            yVel = hasSneakers ? 24 : 17;
            sound.playJump();
          }
          break;

        case 'KeyS':
        case 'ArrowDown':
          if (isJumping) {
            yVel = -32;
            sound.playRoll();
          } else if (!isRolling) {
            isRolling = true;
            sound.playRoll();
            playerGroup.scale.set(1, 0.45, 1);
            setTimeout(() => {
              playerGroup.scale.set(1, 1, 1);
              isRolling = false;
            }, 600);
          }
          break;

        case 'ShiftLeft':
        case 'ShiftRight':
          p.onActivateBoardRequest();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });

    // Touch & Swipe Controls
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();

        const now = performance.now();
        if (now - lastTapTime < 300) {
          propsRef.current.onActivateBoardRequest();
        }
        lastTapTime = now;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const timeDiff = performance.now() - touchStartTime;

        if (timeDiff < 400 && (absX > 30 || absY > 30)) {
          if (absX > absY) {
            if (deltaX < 0 && currentLane > 0) {
              currentLane--;
              targetX = LANES[currentLane];
            } else if (deltaX > 0 && currentLane < 2) {
              currentLane++;
              targetX = LANES[currentLane];
            }
          } else {
            if (deltaY < 0 && !isJumping) {
              isJumping = true;
              const hasSneakers = propsRef.current.activePowers.sneakers > 0;
              yVel = hasSneakers ? 24 : 17;
              sound.playJump();
            } else if (deltaY > 0) {
              if (isJumping) {
                yVel = -32;
                sound.playRoll();
              } else if (!isRolling) {
                isRolling = true;
                sound.playRoll();
                playerGroup.scale.set(1, 0.45, 1);
                setTimeout(() => {
                  playerGroup.scale.set(1, 1, 1);
                  isRolling = false;
                }, 600);
              }
            }
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 9. ANIMATION & GAME LOOP WITH TIME PROGRESSION DIFFICULTY
    let animId = 0;
    let lastTime = performance.now();
    let runTime = 0;
    let totalDistance = 0;

    const tick = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const p = propsRef.current;

      if (p.isPlaying && !p.isPaused && !p.isInRevivePrompt && !p.isGameOver) {
        runTime += delta;
        const currentSpeed = p.speed;
        totalDistance += currentSpeed * delta;

        // Advance score tick
        p.onScoreTick(currentSpeed * delta);

        // DIFFICULTY PHASES BASED ON TIME
        let phaseName = 'Estação Central';
        let phaseIdx = 0;
        if (runTime > 90) {
          phaseName = 'Hiper Velocidade 8000Hz 🔥';
          phaseIdx = 3;
          sceneFog.color.set(0x1e0826);
          sceneBgColor.set(0x1e0826);
          hemiLight.color.set(0xa855f7);
        } else if (runTime > 55) {
          phaseName = 'Ponte Noturna Express ⚡';
          phaseIdx = 2;
          sceneFog.color.set(0x0a192f);
          sceneBgColor.set(0x0a192f);
          hemiLight.color.set(0x06b6d4);
        } else if (runTime > 25) {
          phaseName = 'Túnel do Metrô 🚇';
          phaseIdx = 1;
          sceneFog.color.set(0x180b18);
          sceneBgColor.set(0x180b18);
          hemiLight.color.set(0xf43f5e);
        } else {
          sceneFog.color.set(0x0a0c16);
          sceneBgColor.set(0x0a0c16);
          hemiLight.color.set(0x7080ff);
        }

        // Notify HUD of real-time phase & speed (e.g. 65 km/h)
        p.onPhaseUpdate(phaseName, phaseIdx, Math.round(currentSpeed * 1.8));

        // Lateral lane shift with ultra snappy damping
        playerGroup.position.x += (targetX - playerGroup.position.x) * Math.min(32 * delta, 1);
        const tiltTarget = (targetX - playerGroup.position.x) * 0.12;
        playerGroup.rotation.z = tiltTarget;

        // Jumping & Gravity
        if (isJumping) {
          playerGroup.position.y += yVel * delta;
          yVel += GRAVITY * delta;
          if (playerGroup.position.y <= 0) {
            playerGroup.position.y = 0;
            isJumping = false;
            yVel = 0;
          }
        }

        // Running gait animation
        if (!isJumping && !isRolling && !p.hoverboardActive) {
          const runPhase = runTime * 14;
          leftLeg.rotation.x = Math.sin(runPhase) * 0.75;
          rightLeg.rotation.x = -Math.sin(runPhase) * 0.75;
          leftArm.rotation.x = -Math.sin(runPhase) * 0.65;
          rightArm.rotation.x = Math.sin(runPhase) * 0.65;
        } else if (p.hoverboardActive) {
          leftLeg.rotation.x = 0.2;
          rightLeg.rotation.x = -0.2;
          leftArm.rotation.x = -0.4;
          rightArm.rotation.x = 0.4;
        }

        // UPDATE CURRENT CHARACTER COLORS & EFFECT PARTICLES
        const activeChar = CHARACTERS.find((c) => c.id === p.selectedCharacter) || CHARACTERS[0];
        torsoMat.color.set(activeChar.hoodieColor);
        legMat.color.set(activeChar.pantsColor);
        capMat.color.set(activeChar.capColor);
        headMat.color.set(activeChar.skinColor);
        particleMat.color.set(activeChar.effectColor);

        // ANIMATE CHARACTER'S UNIQUE EFFECT
        for (let i = 0; i < particleMeshes.length; i++) {
          const pm = particleMeshes[i];
          pm.visible = true;
          const phase = runTime * 8 + i * 0.6;

          if (activeChar.id === 'jake_graffiti') {
            // SPRAY DRIPS ON ARMS (Masculino: Tinta no braço)
            const armSide = i % 2 === 0 ? -0.65 : 0.65;
            pm.position.set(
              armSide + Math.sin(phase) * 0.1,
              1.2 + Math.sin(phase * 1.5) * 0.25,
              Math.cos(phase) * 0.2
            );
          } else if (activeChar.id === 'tricky_neon') {
            // SPRAY ON FEET / SNEAKERS (Feminino: Tinta nos pés)
            const footSide = i % 2 === 0 ? -0.28 : 0.28;
            pm.position.set(
              footSide + Math.sin(phase) * 0.15,
              0.15 + (Math.sin(phase * 2) + 1) * 0.1,
              0.2 + (i * 0.08)
            );
          } else if (activeChar.id === 'cyber_8000hz') {
            // ELECTRIC LIGHTNING ON CHEST & EYES
            pm.position.set(
              Math.sin(phase * 3) * 0.35,
              1.5 + Math.cos(phase * 4) * 0.4,
              -0.2 + Math.sin(phase * 2) * 0.2
            );
          } else if (activeChar.id === 'ignis_lava') {
            // FLAMING EMBERS ON SHOULDERS & HEAD
            pm.position.set(
              (Math.random() - 0.5) * 0.8,
              2.0 + Math.random() * 0.6,
              (Math.random() - 0.5) * 0.5
            );
          } else if (activeChar.id === 'kage_shadow') {
            // PURPLE SHADOW MIST BEHIND BACK
            pm.position.set(
              Math.sin(phase) * 0.4,
              1.3 + Math.cos(phase) * 0.3,
              0.5 + (i * 0.05)
            );
          } else if (activeChar.id === 'aura_galaxy') {
            // ORBITING GOLDEN STELLAR DUST
            const angle = phase + i * (Math.PI / 6);
            pm.position.set(Math.cos(angle) * 0.9, 1.4 + Math.sin(angle * 2) * 0.4, Math.sin(angle) * 0.9);
          } else if (activeChar.id === 'zack_bboy') {
            // SOUNDWAVES & EQUALIZER RINGS
            const rad = 0.5 + Math.sin(phase) * 0.3;
            pm.position.set(Math.cos(phase * 2) * rad, 1.2 + Math.sin(phase * 2) * rad, Math.sin(phase) * 0.3);
          }
        }

        // Update Hoverboard Visibility & Skin
        hoverboardGroup.visible = p.hoverboardActive;
        if (p.hoverboardActive) {
          const currentSkin = BOARD_SKINS.find((s) => s.id === p.selectedBoardSkin) || BOARD_SKINS[0];
          deckMat.color.set(currentSkin.color);
          trimMat.color.set(currentSkin.glowColor);
          thrusterMat.color.set(currentSkin.thrusterColor);
          hoverboardGroup.position.y = 0.08 + Math.sin(runTime * 10) * 0.04;
        }

        // Shield aura visibility
        shieldMesh.visible = p.invulnerableTimer > 0;
        if (shieldMesh.visible) {
          shieldMesh.rotation.y += delta * 4;
        }

        // Camera follow with dynamic FOV
        camera.fov = 65 + Math.min(currentSpeed * 0.2, 20);
        camera.updateProjectionMatrix();

        // Move Obstacles
        _playerBox.setFromObject(playerGroup);

        for (let i = activeObstacles.length - 1; i >= 0; i--) {
          const obs = activeObstacles[i];
          obs.group.position.z += currentSpeed * delta;

          obs.box.setFromObject(obs.group);
          const isColliding = _playerBox.intersectsBox(obs.box);

          if (isColliding && p.invulnerableTimer <= 0) {
            let hitFatal = true;
            if (obs.kind === 'barrier_low' && playerGroup.position.y > 1.0) {
              hitFatal = false;
            } else if (obs.kind === 'barrier_high' && isRolling) {
              hitFatal = false;
            }

            if (hitFatal) {
              if (p.hoverboardActive) {
                // HOVERBOARD CRASH PROTECTION
                sound.playBoardCrash();
                p.onHoverboardBroken();
                obs.group.position.z = 999;
                continue;
              } else {
                sound.playCrash();
                p.onPlayerCrash();
                break;
              }
            }
          }

          // Recycle obstacles behind player
          if (obs.group.position.z > 20) {
            scene.remove(obs.group);
            activeObstacles.splice(i, 1);
            spawnChunk(nextSpawnZ, phaseIdx);
            nextSpawnZ -= 25;
          }
        }

        // Coins (Magnet & Collection)
        const hasMagnet = p.activePowers.magnet > 0;
        const playerPos = playerGroup.position;

        for (let i = activeCoins.length - 1; i >= 0; i--) {
          const c = activeCoins[i];
          c.mesh.position.z += currentSpeed * delta;
          c.mesh.rotation.z += delta * 6;

          if (hasMagnet && !c.collected && c.mesh.position.z > -40 && c.mesh.position.z < 10) {
            c.mesh.position.x += (playerPos.x - c.mesh.position.x) * (15 * delta);
            c.mesh.position.y += (playerPos.y + 1.0 - c.mesh.position.y) * (15 * delta);
          }

          _vec3.set(playerPos.x, playerPos.y + 0.9, playerPos.z);
          if (!c.collected && _vec3.distanceTo(c.mesh.position) < 1.7) {
            c.collected = true;
            sound.playCoin();
            scene.remove(c.mesh);
            activeCoins.splice(i, 1);
            const multiplierActive = p.activePowers.multiplier > 0;
            p.onCollectCoin(multiplierActive ? 2 : 1);
            continue;
          }

          if (c.mesh.position.z > 15) {
            scene.remove(c.mesh);
            activeCoins.splice(i, 1);
          }
        }

        // Powerups
        for (let i = activePowerups.length - 1; i >= 0; i--) {
          const pw = activePowerups[i];
          pw.group.position.z += currentSpeed * delta;
          pw.group.rotation.y += delta * 3;
          pw.group.position.y = 1.2 + Math.sin(runTime * 4) * 0.25;

          _vec3.set(playerPos.x, playerPos.y + 1.0, playerPos.z);
          if (!pw.collected && _vec3.distanceTo(pw.group.position) < 1.8) {
            pw.collected = true;
            sound.playPowerup();
            scene.remove(pw.group);
            activePowerups.splice(i, 1);
            p.onCollectPowerup(pw.kind);
            continue;
          }

          if (pw.group.position.z > 15) {
            scene.remove(pw.group);
            activePowerups.splice(i, 1);
          }
        }

        // Move overhead gantries & streetlamps for high speed parallax
        for (const g of gantries) {
          g.position.z += currentSpeed * delta;
          if (g.position.z > 15) {
            g.position.z = -300;
          }
        }
        for (const lp of lampPosts) {
          lp.position.z += currentSpeed * delta;
          if (lp.position.z > 15) {
            lp.position.z = -300;
          }
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full relative" />;
};

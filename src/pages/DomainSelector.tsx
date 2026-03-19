import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Palette, DollarSign, Brain, Microscope, Zap, Activity, Eye, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortalTransition } from '../hooks/usePortalTransition';

interface DomainPathway {
  id: string;
  color: string;
  glowColor: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  curve?: THREE.CubicBezierCurve3;
  tube?: THREE.Mesh;
  particles?: THREE.Points;
  nodeGeometry?: THREE.Mesh;
  isHovered?: boolean;
  particleCount: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  domain: DomainPathway | null;
}

const DomainSelector: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const centerCoreRef = useRef<THREE.Group>();
  const domainsRef = useRef<DomainPathway[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const touchRef = useRef({ x: 0, y: 0, distance: 0 });
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isHoveringRef = useRef(false);
  const baseRadiusRef = useRef(28); // Store the base radius
  const hoverZoomFactorRef = useRef(0.92); // Fixed zoom factor (8% closer)
  
  const cameraControlsRef = useRef({ 
    theta: 0, 
    phi: Math.PI / 4, 
    radius: 28,
    targetTheta: 0,
    targetPhi: Math.PI / 4,
    targetRadius: 28
  });

  const { isTransitioning, portalColor, startTransition } = usePortalTransition();

  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    domain: null
  });
  const [stats, setStats] = useState({
    fps: 0,
    domains: 4,
    particles: 800,
    status: 'Initializing Domain Matrix...'
  });

  // Add FPS calculation variables
  const fpsRef = useRef({
    frameCount: 0,
    lastTime: performance.now(),
    fps: 0
  });

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup with enhanced atmosphere
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2a0a3f, 18, 85); // Darker violet fog
    scene.background = new THREE.Color(0x1a0a2a); // Dark violet background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 75 : 65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(22, 16, 22);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Enhanced renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile,
      alpha: true,
      powerPreference: isMobile ? "low-power" : "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting system
    createLightingSystem(scene);

    // Create Central Core (represents your educational platform)
    createCentralCore(scene);

    // Create Domain Pathways
    createDomainPathways(scene);

    // Create Enhanced Background
    createEnhancedBackground(scene);

    // Setup controls
    setupControls(renderer.domElement);

    // Handle window resize
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        setIsMobile(window.innerWidth < 768);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('click', handleClick);

    // Start animation loop
    setIsLoading(false);
    setStats(prev => ({ ...prev, status: 'Domain Network Online' }));
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      cleanupControls(renderer.domElement);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isMobile]);

  const createLightingSystem = (scene: THREE.Scene) => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x581c87, 0.4); // Base violet ambient light
    scene.add(ambientLight);

    // Central core light
    const coreLight = new THREE.PointLight(0x581c87, 2.5, 70); // Base violet core light
    coreLight.position.set(0, 0, 0);
    if (!isMobile) {
      coreLight.castShadow = true;
      coreLight.shadow.mapSize.width = 1024;
      coreLight.shadow.mapSize.height = 1024;
    }
    scene.add(coreLight);

    // Domain accent lights
    const domainLights: { color: number; pos: [number, number, number] }[] = [
      { color: 0xff4488, pos: [14, 9, 0] }, // Fun/Creative - Pink
      { color: 0x44ff88, pos: [-14, 9, 0] }, // Finance - Green
      { color: 0x4488ff, pos: [0, 9, 14] }, // Health - Blue
      { color: 0xffaa44, pos: [0, 9, -14] }, // Research - Orange
      { color: 0xff66cc, pos: [13, 9, -13] } // Casual - Pink
    ];

    domainLights.forEach(light => {
      const pointLight = new THREE.PointLight(light.color, 1.2, 45);
      pointLight.position.set(...light.pos);
      scene.add(pointLight);
    });

    // Rim lighting for depth
    const rimLight = new THREE.DirectionalLight(0x581c87, 0.6); // Base violet rim light
    rimLight.position.set(60, 60, 60);
    scene.add(rimLight);
  };

  const createCentralCore = (scene: THREE.Scene) => {
    const coreGroup = new THREE.Group();
    
    // Main educational platform core
    const coreGeometry = new THREE.DodecahedronGeometry(2.8, 1);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x8a2be2, // Brighter violet for better visibility
      transparent: true,
      opacity: 0.9, // Increased opacity
      roughness: 0.2, // Increased roughness for better light reflection
      metalness: 0.8,
      emissive: 0x4b0082, // Brighter emissive color
      emissiveIntensity: 0.8 // Increased emissive intensity
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    coreGroup.add(coreMesh);

    // Inner knowledge core
    const innerGeometry = new THREE.SphereGeometry(2.2, 32, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x9370db, // Brighter violet for inner core
      transparent: true,
      opacity: 0.8, // Increased opacity
      blending: THREE.AdditiveBlending
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    coreGroup.add(innerMesh);

    // Knowledge pulse rings
    for (let i = 0; i < 4; i++) {
      const pulseGeometry = new THREE.TorusGeometry(3.5 + i * 0.9, 0.12, 8, 32);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.75 + i * 0.08, 0.9, 0.7), // Increased saturation and lightness
        transparent: true,
        opacity: 0.6, // Increased opacity
        blending: THREE.AdditiveBlending
      });
      const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulseMesh.rotation.x = Math.random() * Math.PI;
      pulseMesh.rotation.y = Math.random() * Math.PI;
      pulseMesh.rotation.z = Math.random() * Math.PI;
      coreGroup.add(pulseMesh);
    }

    // Core knowledge particles
    const particleCount = isMobile ? 120 : 220;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 4.5 + Math.random() * 3.5;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = new THREE.Color().setHSL(Math.random() * 0.2 + 0.7, 0.9, 0.8); // Brighter particles
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.25 : 0.35, // Increased particle size
      transparent: true,
      opacity: 0.95, // Increased opacity
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    const coreParticles = new THREE.Points(particleGeometry, particleMaterial);
    coreGroup.add(coreParticles);

    centerCoreRef.current = coreGroup;
    scene.add(coreGroup);
  };

  const createDomainPathways = (scene: THREE.Scene) => {
    const domains: DomainPathway[] = [
      {
        id: 'creative',
        color: '#ff4488',
        glowColor: '#ff77aa',
        label: 'Fun / Creative',
        description: '🎨 Art, writing, storytelling, and creative expression. Unleash your imagination!',
        icon: <Palette className="w-5 h-5" />,
        emoji: '🎨',
        startPos: new THREE.Vector3(0, 0, 0),
        endPos: new THREE.Vector3(13, 7, 0),
        particleCount: isMobile ? 35 : 65
      },
      {
        id: 'finance',
        color: '#44ff88',
        glowColor: '#77ffaa',
        label: 'Finance',
        description: '💸 Budgeting, investing, crypto, and financial literacy. Master your money!',
        icon: <DollarSign className="w-5 h-5" />,
        emoji: '💸',
        startPos: new THREE.Vector3(0, 0, 0),
        endPos: new THREE.Vector3(-13, 7, 0),
        particleCount: isMobile ? 35 : 65
      },
      {
        id: 'health',
        color: '#4488ff',
        glowColor: '#77aaff',
        label: 'Health',
        description: '🧠 Mindfulness, psychology, wellness, and mental health. Nurture your wellbeing!',
        icon: <Brain className="w-5 h-5" />,
        emoji: '🧠',
        startPos: new THREE.Vector3(0, 0, 0),
        endPos: new THREE.Vector3(0, 7, 13),
        particleCount: isMobile ? 35 : 65
      },
      {
        id: 'research',
        color: '#ffaa44',
        glowColor: '#ffcc77',
        label: 'Deep Research',
        description: '🔬 Factual and scientific exploration. Dive deep into knowledge!',
        icon: <Microscope className="w-5 h-5" />,
        emoji: '🔬',
        startPos: new THREE.Vector3(0, 0, 0),
        endPos: new THREE.Vector3(0, 7, -13),
        particleCount: isMobile ? 35 : 65
      },
      {
        id: 'casual',
        color: '#ff66cc',
        glowColor: '#ff99dd',
        label: 'Casual',
        description: '🎮 Relaxed learning, fun activities, and casual entertainment. Enjoy the journey!',
        icon: <Zap className="w-5 h-5" />,
        emoji: '🎮',
        startPos: new THREE.Vector3(0, 0, 0),
        endPos: new THREE.Vector3(13, 7, -13),
        particleCount: isMobile ? 35 : 65
      }
    ];

    // Calculate positions for equal spacing (72 degrees between each domain)
    const radius = 13; // Keep the same radius as before
    const height = 7;  // Keep the same height as before
    domains.forEach((domain, index) => {
      const angle = (index * 72 * Math.PI) / 180; // Convert degrees to radians
      domain.endPos = new THREE.Vector3(
        radius * Math.cos(angle),
        height,
        radius * Math.sin(angle)
      );
    });

    domains.forEach((domain, index) => {
      // Enhanced curved paths with more organic feel
      const mid1 = domain.startPos.clone().lerp(domain.endPos, 0.3).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 7,
          Math.random() * 5 + 4,
          (Math.random() - 0.5) * 7
        )
      );
      const mid2 = domain.startPos.clone().lerp(domain.endPos, 0.7).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 4 + 3,
          (Math.random() - 0.5) * 5
        )
      );

      domain.curve = new THREE.CubicBezierCurve3(
        domain.startPos,
        mid1,
        mid2,
        domain.endPos
      );

      // Enhanced tube pathway
      const tubeGeometry = new THREE.TubeGeometry(domain.curve, 140, 0.18, 18, false);
      const tubeMaterial = new THREE.MeshPhysicalMaterial({
        color: domain.color,
        transparent: true,
        opacity: 0.8,
        emissive: domain.color,
        emissiveIntensity: 0.25,
        roughness: 0.1,
        metalness: 0.85
      });
      domain.tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      domain.tube.userData = { domain, type: 'tube' };
      scene.add(domain.tube);

      // Outer glow tube for enhanced visual impact
      const glowTubeGeometry = new THREE.TubeGeometry(domain.curve, 70, 0.28, 12, false);
      const glowTubeMaterial = new THREE.MeshBasicMaterial({
        color: domain.glowColor,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
      });
      const glowTube = new THREE.Mesh(glowTubeGeometry, glowTubeMaterial);
      scene.add(glowTube);

      // Enhanced flowing particles with slower speeds
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(domain.particleCount * 3);
      const velocities = new Float32Array(domain.particleCount);
      
      for (let i = 0; i < domain.particleCount; i++) {
        const t = i / (domain.particleCount - 1);
        const point = domain.curve.getPoint(t);
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
        // Reduced particle speed for more mesmerizing effect
        velocities[i] = Math.random() * 0.015 + 0.008;
      }

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
      
      const particleMaterial = new THREE.PointsMaterial({
        color: domain.color,
        size: isMobile ? 0.35 : 0.45,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });

      domain.particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(domain.particles);

      // Enhanced domain endpoint nodes
      const nodeGeometry = new THREE.OctahedronGeometry(0.9, 2);
      const nodeMaterial = new THREE.MeshPhysicalMaterial({
        color: domain.color,
        transparent: true,
        opacity: 0.95,
        emissive: domain.color,
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.95
      });
      domain.nodeGeometry = new THREE.Mesh(nodeGeometry, nodeMaterial);
      domain.nodeGeometry.position.copy(domain.endPos);
      domain.nodeGeometry.userData = { domain, type: 'node' };
      scene.add(domain.nodeGeometry);

      // Add floating domain icons around each node
      const iconRingGeometry = new THREE.TorusGeometry(1.5, 0.05, 8, 24);
      const iconRingMaterial = new THREE.MeshBasicMaterial({
        color: domain.color,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const iconRing = new THREE.Mesh(iconRingGeometry, iconRingMaterial);
      iconRing.position.copy(domain.endPos);
      iconRing.rotation.x = Math.PI / 2;
      scene.add(iconRing);
    });

    domainsRef.current = domains;
  };

  const createEnhancedBackground = (scene: THREE.Scene) => {
    // Animated knowledge starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = isMobile ? 600 : 1800;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 350;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 350;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 350;

      const color = new THREE.Color().setHSL(0.75, 0.8, Math.random() * 0.6 + 0.4); // Violet to purple stars
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      size: 2.2,
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Educational platform grid
    const gridSize = 70;
    const gridDivisions = 35;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x581c87, 0x2a0a3f); // Base violet grid
    gridHelper.position.y = -18;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.35;
    scene.add(gridHelper);

    // Knowledge energy field
    const fieldGeometry = new THREE.BufferGeometry();
    const fieldCount = isMobile ? 180 : 360;
    const fieldPositions = new Float32Array(fieldCount * 3);
    const fieldColors = new Float32Array(fieldCount * 3);

    for (let i = 0; i < fieldCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 18 + Math.random() * 25;
      
      fieldPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      fieldPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 6;
      fieldPositions[i * 3 + 2] = r * Math.cos(phi);

      const color = new THREE.Color().setHSL(0.75, 0.8, Math.random() * 0.6 + 0.4); // Violet energy field
      fieldColors[i * 3] = color.r;
      fieldColors[i * 3 + 1] = color.g;
      fieldColors[i * 3 + 2] = color.b;
    }

    fieldGeometry.setAttribute('position', new THREE.BufferAttribute(fieldPositions, 3));
    fieldGeometry.setAttribute('color', new THREE.BufferAttribute(fieldColors, 3));
    
    const fieldMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.12 : 0.18,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    const energyField = new THREE.Points(fieldGeometry, fieldMaterial);
    scene.add(energyField);
  };

  const setupControls = (domElement: HTMLElement) => {
    // Mouse controls
    const handleMouseDown = (event: MouseEvent) => {
      isMouseDownRef.current = true;
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isMouseDownRef.current) {
        const deltaX = event.clientX - mouseRef.current.x;
        const deltaY = event.clientY - mouseRef.current.y;
        
        cameraControlsRef.current.targetTheta += deltaX * 0.008;
        cameraControlsRef.current.targetPhi += deltaY * 0.008;
        cameraControlsRef.current.targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraControlsRef.current.targetPhi));
        
        mouseRef.current.x = event.clientX;
        mouseRef.current.y = event.clientY;
      } else {
        handleHover(event);
      }
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      // Only allow manual zoom when not hovering
      if (!isHoveringRef.current) {
        const newRadius = cameraControlsRef.current.targetRadius + event.deltaY * 0.025;
        const clampedRadius = Math.max(12, Math.min(70, newRadius));
        cameraControlsRef.current.targetRadius = clampedRadius;
        baseRadiusRef.current = clampedRadius; // Update base radius
      }
    };

    // Touch controls
    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length === 1) {
        isMouseDownRef.current = true;
        touchRef.current.x = event.touches[0].clientX;
        touchRef.current.y = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        touchRef.current.distance = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length === 1 && isMouseDownRef.current) {
        const deltaX = event.touches[0].clientX - touchRef.current.x;
        const deltaY = event.touches[0].clientY - touchRef.current.y;
        
        cameraControlsRef.current.targetTheta += deltaX * 0.012;
        cameraControlsRef.current.targetPhi += deltaY * 0.012;
        cameraControlsRef.current.targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraControlsRef.current.targetPhi));
        
        touchRef.current.x = event.touches[0].clientX;
        touchRef.current.y = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const deltaDistance = distance - touchRef.current.distance;
        
        cameraControlsRef.current.targetRadius -= deltaDistance * 0.06;
        cameraControlsRef.current.targetRadius = Math.max(12, Math.min(70, cameraControlsRef.current.targetRadius));
        
        touchRef.current.distance = distance;
      }
    };

    const handleTouchEnd = () => {
      isMouseDownRef.current = false;
    };

    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    if (isMobile) {
      domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      domElement.addEventListener('touchend', handleTouchEnd);
    }

    domElement.style.touchAction = 'none';
  };

  const cleanupControls = (domElement: HTMLElement) => {
    // Event listener cleanup would go here
  };

  const handleHover = useCallback((event: MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    
    const intersectables: THREE.Object3D[] = [];
    domainsRef.current.forEach(domain => {
      if (domain.tube) intersectables.push(domain.tube);
      if (domain.nodeGeometry) intersectables.push(domain.nodeGeometry);
    });

    const intersects = raycasterRef.current.intersectObjects(intersectables);

    // Reset all domains and hovering state
    let anyHovered = false;
    domainsRef.current.forEach(domain => {
      domain.isHovered = false;
    });

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      const domainData = intersected.userData.domain as DomainPathway;
      
      if (domainData) {
        domainData.isHovered = true;
        anyHovered = true;
        
        // Apply fixed zoom-in effect when starting to hover
        if (!isHoveringRef.current) {
          baseRadiusRef.current = cameraControlsRef.current.targetRadius;
          cameraControlsRef.current.targetRadius = baseRadiusRef.current * hoverZoomFactorRef.current;
        }
        
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          domain: domainData
        });
      }
    } else {
      // Restore original zoom when stopping hover
      if (isHoveringRef.current) {
        cameraControlsRef.current.targetRadius = baseRadiusRef.current;
      }
      setTooltip(prev => ({ ...prev, visible: false }));
    }

    // Update global hover state to control auto-rotation
    isHoveringRef.current = anyHovered;
  }, []);

  const handleClick = useCallback((event: MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    
    const intersectables: THREE.Object3D[] = [];
    domainsRef.current.forEach(domain => {
      if (domain.tube) intersectables.push(domain.tube);
      if (domain.nodeGeometry) intersectables.push(domain.nodeGeometry);
    });

    const intersects = raycasterRef.current.intersectObjects(intersectables);

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      const domainData = intersected.userData.domain as DomainPathway;
      
      if (domainData) {
        setSelectedDomain(domainData.id);
        console.log(`Selected domain: ${domainData.id} - ${domainData.label}`);
        toast.success(`🎯 Selected: ${domainData.label}`, {
          description: domainData.description.replace(/^.{2}\s/, ''),
          duration: 3000,
        });

        // Start portal transition
        startTransition({
          id: domainData.id,
          label: domainData.label,
          color: domainData.color,
          description: domainData.description
        });
      }
    }
  }, [startTransition]);

  const animate = useCallback(() => {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;
    frameCountRef.current++;

    // Calculate FPS using performance.now() for more accurate timing
    const currentTime = performance.now();
    fpsRef.current.frameCount++;

    if (currentTime - fpsRef.current.lastTime >= 1000) {
      fpsRef.current.fps = Math.round((fpsRef.current.frameCount * 1000) / (currentTime - fpsRef.current.lastTime));
      fpsRef.current.frameCount = 0;
      fpsRef.current.lastTime = currentTime;

      setStats(prev => ({
        ...prev,
        fps: fpsRef.current.fps
      }));
    }

    // Update camera controls with smooth interpolation
    const controls = cameraControlsRef.current;
    controls.theta += (controls.targetTheta - controls.theta) * 0.05;
    controls.phi += (controls.targetPhi - controls.phi) * 0.05;
    controls.radius += (controls.targetRadius - controls.radius) * 0.05;

    // Auto-rotate when not hovering or interacting - reduced speed
    if (!isMouseDownRef.current && !isHoveringRef.current) {
      controls.targetTheta += 0.002; // Reduced from 0.004 for calmer effect
    }

    // Update camera position
    if (cameraRef.current) {
      cameraRef.current.position.x = controls.radius * Math.sin(controls.phi) * Math.cos(controls.theta);
      cameraRef.current.position.y = controls.radius * Math.cos(controls.phi);
      cameraRef.current.position.z = controls.radius * Math.sin(controls.phi) * Math.sin(controls.theta);
      cameraRef.current.lookAt(0, 0, 0);
    }

    // Animate Central Core with reduced speed
    if (centerCoreRef.current) {
      centerCoreRef.current.rotation.x = Math.sin(time * 0.15) * 0.08; // Reduced from 0.25 and 0.12
      centerCoreRef.current.rotation.y += 0.005; // Reduced from 0.009
      centerCoreRef.current.rotation.z = Math.cos(time * 0.2) * 0.08; // Reduced from 0.35 and 0.12

      // Enhanced pulse effects for knowledge rings - slower
      centerCoreRef.current.children.forEach((child, index) => {
        if (index >= 2 && index <= 5) { // Knowledge rings
          const pulse = Math.sin(time * 1.5 + index * 0.6) * 0.35 + 1; // Reduced from 2.2
          child.scale.setScalar(pulse);
          const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          material.opacity = (Math.sin(time * 2.5 + index) * 0.2 + 0.3) * (2 - pulse); // Reduced from 3.5
        }
      });

      // Animate core knowledge particles - slower
      const coreParticles = centerCoreRef.current.children[centerCoreRef.current.children.length - 1] as THREE.Points;
      if (coreParticles && coreParticles.geometry) {
        coreParticles.rotation.y += 0.008; // Reduced from 0.012
        coreParticles.rotation.x = Math.sin(time * 0.4) * 0.2; // Reduced from 0.6 and 0.25
      }
    }

    // Animate domain pathways with enhanced hover effects
    domainsRef.current.forEach((domain, index) => {
      const hoverMultiplier = domain.isHovered ? 2.2 : 1;
      const selectedMultiplier = selectedDomain === domain.id ? 1.5 : 1;
      const finalMultiplier = hoverMultiplier * selectedMultiplier;
      
      if (domain.tube) {
        const material = domain.tube.material as THREE.MeshPhysicalMaterial;
        const targetOpacity = domain.isHovered ? 0.95 : (selectedDomain === domain.id ? 0.85 : 0.75);
        material.opacity += (targetOpacity - material.opacity) * 0.12;
        material.emissiveIntensity = (Math.sin(time * 3.5 + index) * 0.3 + 0.5) * finalMultiplier; // Reduced from 4.5
      }

      if (domain.nodeGeometry) {
        const scale = domain.isHovered ? 1.4 : (selectedDomain === domain.id ? 1.2 : 1);
        domain.nodeGeometry.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.12);
        
        domain.nodeGeometry.rotation.x += 0.015 * finalMultiplier; // Reduced from 0.025
        domain.nodeGeometry.rotation.y += 0.012 * finalMultiplier; // Reduced from 0.018
        
        const material = domain.nodeGeometry.material as THREE.MeshPhysicalMaterial;
        material.emissiveIntensity = (Math.sin(time * 2.8 + index) * 0.4 + 0.6) * finalMultiplier; // Reduced from 3.8
      }

      if (domain.particles && domain.curve) {
        const positions = domain.particles.geometry.attributes.position.array as Float32Array;
        const velocities = domain.particles.geometry.attributes.velocity.array as Float32Array;
        
        for (let i = 0; i < domain.particleCount; i++) {
          const currentT = (positions[i * 3] + positions[i * 3 + 1] + positions[i * 3 + 2]) % 100 / 100;
          const newT = (currentT + velocities[i] * finalMultiplier) % 1;
          const point = domain.curve.getPoint(newT);
          
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }
        domain.particles.geometry.attributes.position.needsUpdate = true;
        
        const material = domain.particles.material as THREE.PointsMaterial;
        material.opacity = domain.isHovered ? 1 : (selectedDomain === domain.id ? 0.95 : 0.85);
        material.size = domain.isHovered ? (isMobile ? 0.6 : 0.75) : (selectedDomain === domain.id ? (isMobile ? 0.5 : 0.6) : (isMobile ? 0.35 : 0.45));
      }
    });

    // Render
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [isMobile, selectedDomain]);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* Portal Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Darkening Background */}
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            
            {/* Central Star Portal */}
            <motion.div
              className="relative z-10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 2, 50],
                opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                duration: 2.5,
                times: [0, 0.2, 0.8, 1],
                ease: "easeOut"
              }}
            >
              {/* Main Star Core */}
              <motion.div
                className="w-6 h-6 rounded-full"
                style={{ 
                  backgroundColor: portalColor,
                  boxShadow: `0 0 30px ${portalColor}, 0 0 60px ${portalColor}60, 0 0 90px ${portalColor}30`
                }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Radiating Star Points */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-12 rounded-full"
                  style={{ 
                    backgroundColor: portalColor,
                    left: '50%',
                    top: '50%',
                    transformOrigin: '50% 50%',
                    transform: `translate(-50%, -50%) rotate(${i * 45}deg)`
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ 
                    scaleY: [0, 1, 1.5, 0],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{ 
                    duration: 2.5,
                    times: [0, 0.3, 0.7, 1],
                    delay: 0.2,
                    ease: "easeOut"
                  }}
                />
              ))}
              
              {/* Outer Glow Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ 
                  borderColor: `${portalColor}60`,
                  left: '50%',
                  top: '50%'
                }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: [1, 3, 6],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: 0.5,
                  ease: "easeOut"
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-black via-blue-950 to-black">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-transparent border-t-cyan-400 border-r-blue-400 mx-auto"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-transparent border-b-purple-400 border-l-pink-400 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2" style={{ animationDelay: '300ms' }}></div>
            </div>
            <div className="space-y-2">
              <div className="text-cyan-400 font-mono text-lg tracking-wider">Initializing Domain Matrix...</div>
              <div className="text-blue-300 font-mono text-sm opacity-75">Connecting Learning Pathways</div>
            </div>
          </div>
        </div>
      )}

      {/* Header UI */}
      <div className="absolute top-4 left-4 z-10 text-white">
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-cyan-500 border-opacity-30 rounded-lg p-4 shadow-2xl">
          <h1 className="text-xl md:text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 font-mono tracking-wider">
            DOMAIN SELECTOR v3.0
          </h1>
          <div className="text-xs md:text-sm opacity-90 space-y-1 font-mono">
            <div className="flex items-center space-x-2">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Choose your learning path</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-3 h-3 text-green-400" />
              <span>{isMobile ? 'Touch' : 'Click'} nodes to select</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>{isMobile ? 'Pinch' : 'Scroll'} to zoom</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="absolute top-4 right-4 z-10 text-white">
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-cyan-500 border-opacity-30 rounded-lg p-3 shadow-2xl">
          <div className="flex items-center space-x-2 mb-2">
            <Cpu className="w-4 h-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400" />
            <span className="text-sm font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">SYSTEM STATUS</span>
          </div>
          <div className="text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-300">FPS:</span>
              <span className={`${stats.fps > 45 ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400' : stats.fps > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                {stats.fps}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Domains:</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">{stats.domains}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Particles:</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">{stats.particles}</span>
            </div>
            <div className="text-xs mt-2 pt-2 border-t border-gray-600">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">{stats.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip */}
      {tooltip.visible && tooltip.domain && (
        <div 
          className="absolute z-50 pointer-events-none transition-all duration-300"
          style={{ 
            left: tooltip.x + 15, 
            top: tooltip.y - 15,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="bg-black bg-opacity-90 backdrop-blur-sm border border-cyan-500 border-opacity-50 rounded-lg p-4 shadow-2xl max-w-xs">
            <div className="flex items-center space-x-2 mb-2">
              {tooltip.domain.icon}
              <h3 className="text-sm font-bold text-cyan-400 font-mono">
                {tooltip.domain.label} {tooltip.domain.emoji}
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-mono">
              {tooltip.domain.description}
            </p>
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-xs text-gray-400 font-mono">
                Click to select this domain
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Domain Display */}
      {selectedDomain && (
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm border border-green-500 border-opacity-40 rounded-lg p-4 shadow-2xl">
            <div className="text-center text-white">
              <div className="text-sm font-mono text-green-400 mb-2">SELECTED DOMAIN</div>
              <div className="text-lg font-bold text-cyan-300 font-mono">
                {domainsRef.current.find(d => d.id === selectedDomain)?.label}
              </div>
              <div className="text-2xl mt-2">
                {domainsRef.current.find(d => d.id === selectedDomain)?.emoji}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-full px-6 py-2 shadow-2xl">
          <div className="text-center text-white text-xs font-mono">
            <span className="text-purple-400">🌟</span>
            <span className="mx-2 text-gray-300">Immersive Educational Domain Selection</span>
            <span className="text-cyan-400">🌟</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};

export default DomainSelector;

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { EmotionalManifold, EmotionalParams } from '@/lib/emotionalManifold';

export const useManifoldVisualization = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [fps, setFps] = useState(60);
  const manifoldRef = useRef(new EmotionalManifold());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const manifoldMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const vectorGroupRef = useRef<THREE.Group | null>(null);
  const trajectoryLineRef = useRef<Line2 | null>(null);
  const geodesicGroupRef = useRef<THREE.Group | null>(null);
  const fiberGroupRef = useRef<THREE.Group | null>(null);
  const christoffelGroupRef = useRef<THREE.Group | null>(null);
  const transportGroupRef = useRef<THREE.Group | null>(null);
  const trajectoryPointsRef = useRef<THREE.Vector3[]>([]);
  const geodesicPathsRef = useRef<THREE.Vector3[][]>([]);
  const transportVectorsRef = useRef<Array<{ position: THREE.Vector3; vector: THREE.Vector2 }>>([]);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef(performance.now());

  const [params, setParams] = useState<EmotionalParams>({
    EP: 0.7,
    P: 0.3,
    V: 0.8,
    SC: 0.9,
    Acc: 0.5,
    W_p: 0.85,
    T: 0.0,
  });

  const [settings, setSettings] = useState({
    resolution: 50,
    showGrid: true,
    showVectors: true,
    showTrajectory: true,
    animateTime: true,
    showFiber: false,
    showGeodesic: false,
    showChristoffel: false,
    fiberParam: 0.5,
    transportSpeed: 1.0,
    transportAnimationProgress: 0,
    isTransportAnimating: false,
  });

  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0a0a, 1);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(0x00d4ff, 0.8);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xff6b9d, 0.6);
    light2.position.set(-5, 3, -5);
    scene.add(light2);

    const cameraLight = new THREE.PointLight(0xffffff, 0.5);
    camera.add(cameraLight);
    scene.add(camera);

    // Axes
    createAxes(scene);

    // Grid
    if (settings.showGrid) {
      const grid = new THREE.GridHelper(6, 20, 0x444444, 0x222222);
      grid.position.y = -1.5;
      scene.add(grid);
    }

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (settings.animateTime) {
        setParams((prev) => {
          const newT = prev.T + 0.016;
          return { ...prev, T: newT > 10 ? 0 : newT };
        });
      }

      if (settings.isTransportAnimating) {
        setSettings((prev) => {
          const newProgress = prev.transportAnimationProgress + 0.01 * prev.transportSpeed;
          return {
            ...prev,
            transportAnimationProgress: newProgress >= 1 ? 1 : newProgress,
            isTransportAnimating: newProgress < 1,
          };
        });
      }

      controls.update();
      renderer.render(scene, camera);

      // FPS calculation
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const currentFps = 1000 / (dt || 16.7);
      setFps((prev) => 0.9 * prev + 0.1 * currentFps);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [canvasRef]);

  // Update manifold when params or settings change
  useEffect(() => {
    updateManifold();
  }, [params, settings.resolution, settings.showVectors, settings.showFiber, settings.showGeodesic, settings.showChristoffel]);

  // Add trajectory point when params change
  useEffect(() => {
    if (settings.showTrajectory) {
      addTrajectoryPoint();
    }
  }, [params.EP, params.P, params.T]);

  const createAxes = (scene: THREE.Scene) => {
    const group = new THREE.Group();
    const L = 3;
    const R = 0.02;

    const xGeom = new THREE.CylinderGeometry(R, R, L, 8);
    const xMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Mesh(xGeom, xMat);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = L / 2;
    group.add(xAxis);

    const yGeom = new THREE.CylinderGeometry(R, R, L, 8);
    const yMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Mesh(yGeom, yMat);
    yAxis.position.y = L / 2;
    group.add(yAxis);

    const zGeom = new THREE.CylinderGeometry(R, R, L, 8);
    const zMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zAxis = new THREE.Mesh(zGeom, zMat);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = L / 2;
    group.add(zAxis);

    scene.add(group);
  };

  const updateManifold = () => {
    if (!sceneRef.current) return;

    createManifoldMesh();
    createVectorField();
    createFiberBundle();
    createChristoffelVisualization();
    createGeodesicPaths();
    createTrajectoryLine();
    createParallelTransportVisualization();
  };

  const createManifoldMesh = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const manifold = manifoldRef.current;
    const res = settings.resolution;
    const size = 3;

    if (manifoldMeshRef.current) {
      scene.remove(manifoldMeshRef.current);
      manifoldMeshRef.current.geometry.dispose();
      if (Array.isArray(manifoldMeshRef.current.material)) {
        manifoldMeshRef.current.material.forEach(m => m.dispose());
      } else {
        manifoldMeshRef.current.material.dispose();
      }
    }
    if (wireframeRef.current) {
      scene.remove(wireframeRef.current);
      wireframeRef.current.geometry.dispose();
      if (Array.isArray(wireframeRef.current.material)) {
        wireframeRef.current.material.forEach(m => m.dispose());
      } else {
        wireframeRef.current.material.dispose();
      }
    }

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = ((i / res) - 0.5) * size * 2;
        const y = ((j / res) - 0.5) * size * 2;
        const z = manifold.computeManifoldHeight(x / size, y / size, params);
        positions.push(x, y, z);

        const emotions = manifold.computeAllEmotions(x / size, y / size, params.V, params.SC, params.Acc, params.W_p, params.T);
        const dom = manifold.getDominantEmotion(emotions);
        const col = manifold.colors[dom.emotion as keyof typeof manifold.colors] || new THREE.Color(0x666666);
        colors.push(col.r, col.g, col.b);
      }
    }

    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const a = i * (res + 1) + j;
        const b = a + 1;
        const c = a + res + 1;
        const d = c + 1;
        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
      shininess: 80,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    manifoldMeshRef.current = mesh;

    const wireGeom = new THREE.WireframeGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.2 });
    const wireframe = new THREE.LineSegments(wireGeom, wireMat);
    scene.add(wireframe);
    wireframeRef.current = wireframe;
  };

  const createVectorField = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    if (vectorGroupRef.current) {
      scene.remove(vectorGroupRef.current);
    }

    const group = new THREE.Group();
    if (!settings.showVectors) {
      scene.add(group);
      vectorGroupRef.current = group;
      return;
    }

    const manifold = manifoldRef.current;
    const gridSize = 10;
    const size = 3;
    const arrowLength = 0.3;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = ((i / gridSize) - 0.5) * size * 2;
        const y = ((j / gridSize) - 0.5) * size * 2;
        const z = manifold.computeManifoldHeight(x / size, y / size, params);
        const v = manifold.computeVectorField(x / size, y / size, params);
        const origin = new THREE.Vector3(x, y, z);
        const arrow = new THREE.ArrowHelper(v, origin, arrowLength, 0x00d4ff, 0.1, 0.05);
        group.add(arrow);
      }
    }

    scene.add(group);
    vectorGroupRef.current = group;
  };

  const addTrajectoryPoint = () => {
    const manifold = manifoldRef.current;
    const x = params.EP * 3;
    const y = params.P * 3;
    const z = manifold.computeManifoldHeight(params.EP, params.P, params);
    trajectoryPointsRef.current.push(new THREE.Vector3(x, y, z));
    if (trajectoryPointsRef.current.length > 200) {
      trajectoryPointsRef.current.shift();
    }
    createTrajectoryLine();
  };

  const createTrajectoryLine = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    if (trajectoryLineRef.current) {
      scene.remove(trajectoryLineRef.current);
      trajectoryLineRef.current.geometry.dispose();
      trajectoryLineRef.current.material.dispose();
    }

    if (!settings.showTrajectory || trajectoryPointsRef.current.length < 2) return;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < trajectoryPointsRef.current.length; i++) {
      const p = trajectoryPointsRef.current[i];
      positions.push(p.x, p.y, p.z);
      const t = i / trajectoryPointsRef.current.length;
      const c = new THREE.Color().setHSL(0.6 - t * 0.6, 1, 0.5);
      colors.push(c.r, c.g, c.b);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    const material = new LineMaterial({
      linewidth: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    material.resolution.set(window.innerWidth, window.innerHeight);

    const line = new Line2(geometry, material);
    scene.add(line);
    trajectoryLineRef.current = line;
  };

  const createFiberBundle = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    if (fiberGroupRef.current) {
      scene.remove(fiberGroupRef.current);
    }

    if (!settings.showFiber) return;

    const group = new THREE.Group();
    const manifold = manifoldRef.current;
    const N = 5;
    const size = 1;

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = ((i / (N - 1)) - 0.5) * size * 2;
        const y = ((j / (N - 1)) - 0.5) * size * 2;
        const pts = manifold.computeFiberBundle({ x, y }, params);
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0xff6b9d, transparent: true, opacity: 0.6 });
        const line = new THREE.Line(geom, mat);
        group.add(line);
      }
    }

    scene.add(group);
    fiberGroupRef.current = group;
  };

  const createGeodesicPaths = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    if (geodesicGroupRef.current) {
      scene.remove(geodesicGroupRef.current);
    }

    if (!settings.showGeodesic || geodesicPathsRef.current.length === 0) return;

    const group = new THREE.Group();

    for (const path of geodesicPathsRef.current) {
      const geom = new THREE.BufferGeometry().setFromPoints(path);
      const mat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2, transparent: true, opacity: 0.8 });
      const line = new THREE.Line(geom, mat);
      group.add(line);

      const startSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      startSphere.position.copy(path[0]);
      group.add(startSphere);

      const endSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      endSphere.position.copy(path[path.length - 1]);
      group.add(endSphere);
    }

    scene.add(group);
    geodesicGroupRef.current = group;
  };

  const createChristoffelVisualization = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    if (christoffelGroupRef.current) {
      scene.remove(christoffelGroupRef.current);
    }

    if (!settings.showChristoffel) return;

    const group = new THREE.Group();
    const manifold = manifoldRef.current;
    const gridSize = 8;
    const size = 3;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = ((i / gridSize) - 0.5) * size * 2;
        const y = ((j / gridSize) - 0.5) * size * 2;
        const z = manifold.computeManifoldHeight(x / size, y / size, params);
        const g111 = Math.abs(manifold.computeChristoffelSymbol(0, 0, 0, x / size, y / size, params));
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.02 + g111 * 0.1, 8, 8),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.6 - g111 * 0.6, 1, 0.5),
            transparent: true,
            opacity: 0.7,
          })
        );
        sphere.position.set(x, y, z);
        group.add(sphere);
      }
    }

    scene.add(group);
    christoffelGroupRef.current = group;
  };

  const createParallelTransportVisualization = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    if (transportGroupRef.current) {
      scene.remove(transportGroupRef.current);
    }

    if (transportVectorsRef.current.length === 0) return;

    const group = new THREE.Group();
    const idx = Math.floor(settings.transportAnimationProgress * (transportVectorsRef.current.length - 1));

    for (let i = 0; i <= idx && i < transportVectorsRef.current.length; i++) {
      const tv = transportVectorsRef.current[i];
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(tv.vector.x, tv.vector.y, 0).normalize(),
        tv.position,
        0.5,
        0xff00ff,
        0.15,
        0.1
      );
      group.add(arrow);
    }

    scene.add(group);
    transportGroupRef.current = group;
  };

  const computeGeodesic = () => {
    const manifold = manifoldRef.current;
    const start = { x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5 };
    const end = { x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5 };
    const path = manifold.computeGeodesic(start, end, params, 100);
    geodesicPathsRef.current.push(path);
    setSettings(prev => ({ ...prev, showGeodesic: true }));
  };

  const animateParallelTransport = () => {
    if (geodesicPathsRef.current.length === 0) {
      alert('Please compute a geodesic first!');
      return;
    }
    const manifold = manifoldRef.current;
    const path = geodesicPathsRef.current[geodesicPathsRef.current.length - 1];
    const initialVector = new THREE.Vector2(1, 0);
    transportVectorsRef.current = manifold.parallelTransport(initialVector, path, params);
    setSettings(prev => ({
      ...prev,
      transportAnimationProgress: 0,
      isTransportAnimating: true,
    }));
  };

  const resetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.set(5, 5, 5);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const randomizeParams = () => {
    setParams({
      EP: Math.random() * 2 - 1,
      P: Math.random() * 2 - 1,
      V: Math.random(),
      SC: Math.random(),
      Acc: Math.random(),
      W_p: Math.random(),
      T: 0,
    });
    trajectoryPointsRef.current = [];
  };

  return {
    params,
    setParams,
    settings,
    setSettings,
    fps,
    manifold: manifoldRef.current,
    computeGeodesic,
    animateParallelTransport,
    resetCamera,
    randomizeParams,
  };
};

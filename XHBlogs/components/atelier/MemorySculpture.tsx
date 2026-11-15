"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./MemorySculpture.module.css";

type Props = {
  paused?: boolean;
  variant?: "orbit" | "flow";
  className?: string;
};

/** An original parametric object. Its filaments share a path, but keep their own perspective. */
export default function MemorySculpture({
  paused = false,
  variant = "orbit",
  className = "",
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const wake = useRef<() => void>(() => {});
  const state = useRef({ paused, variant });
  const [ready, setReady] = useState(false);
  const gradientId = useId().replace(/:/g, "");
  state.current = { paused, variant };
  useEffect(() => {
    wake.current();
  }, [paused, variant]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let dispose = () => {};
    let cancelled = false;

    async function mount() {
      const THREE = await import("three");
      const { RoomEnvironment } =
        await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (cancelled || !element) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.domElement.setAttribute("aria-hidden", "true");
      element.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
      camera.position.set(0, 0, 6.4);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();

      const sculpture = new THREE.Group();
      scene.add(sculpture);
      const materials = [
        new THREE.MeshPhysicalMaterial({
          color: "#1736de",
          metalness: 0.72,
          roughness: 0.21,
          clearcoat: 1,
          clearcoatRoughness: 0.14,
          envMapIntensity: 1.1,
        }),
        new THREE.MeshPhysicalMaterial({
          color: "#315bf2",
          metalness: 0.65,
          roughness: 0.24,
          clearcoat: 1,
          envMapIntensity: 1.2,
        }),
        new THREE.MeshPhysicalMaterial({
          color: "#0c258f",
          metalness: 0.8,
          roughness: 0.2,
          clearcoat: 1,
          envMapIntensity: 1.1,
        }),
        new THREE.MeshPhysicalMaterial({
          color: "#c3d2fb",
          metalness: 0.94,
          roughness: 0.18,
          clearcoat: 1,
          envMapIntensity: 1.35,
        }),
      ];

      class MemoryPath extends THREE.Curve<InstanceType<typeof THREE.Vector3>> {
        constructor() {
          super();
        }
        getPoint(t: number, target = new THREE.Vector3()) {
          const a = t * Math.PI * 2;
          const radius = 1.02 + 0.37 * Math.cos(3 * a);
          return target.set(
            radius * Math.cos(2 * a),
            radius * Math.sin(2 * a),
            0.48 * Math.sin(3 * a),
          );
        }
      }
      const path = new MemoryPath();
      const segments = window.innerWidth < 600 ? 240 : 360;
      const frames = path.computeFrenetFrames(segments, true);
      const count = window.innerWidth < 600 ? 34 : 48;
      const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
      for (let strand = 0; strand < count; strand++) {
        const points: InstanceType<typeof THREE.Vector3>[] = [];
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = (strand / count) * Math.PI * 2 + t * Math.PI * 4;
          const radial = 0.255 + 0.024 * Math.cos(t * Math.PI * 6);
          const point = path
            .getPoint(t)
            .addScaledVector(frames.normals[i], Math.cos(angle) * radial)
            .addScaledVector(frames.binormals[i], Math.sin(angle) * radial);
          points.push(point);
        }
        const curve = new THREE.CatmullRomCurve3(points, true);
        const geometry = new THREE.TubeGeometry(
          curve,
          segments,
          strand % 12 === 0 ? 0.013 : 0.0095,
          5,
          true,
        );
        geometries.push(geometry);
        const material =
          strand % 16 === 0 ? materials[3] : materials[strand % 3];
        sculpture.add(new THREE.Mesh(geometry, material));
      }
      sculpture.rotation.set(-0.38, -0.34, -0.3);
      const key = new THREE.DirectionalLight("#ffffff", 4.5);
      key.position.set(-3, 5, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight("#c6d7ff", 3);
      rim.position.set(4, 0, -3);
      scene.add(rim, new THREE.AmbientLight("#e5ecff", 0.7));

      let visible = true;
      let reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      let frame = 0;
      let previous = 0;
      let elapsed = 0;
      let pointerX = 0;
      let pointerY = 0;
      let dragging = false;
      let dragX = 0;
      let dragY = 0;
      let previousX = 0;
      let previousY = 0;

      function resize() {
        if (!element) return;
        const { width, height } = element.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.position.z = camera.aspect < 0.85 ? 7.3 : 6.4;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      }

      function draw(time: number) {
        frame = 0;
        if (cancelled || !visible || document.hidden) return;
        const delta = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
        previous = time;
        if (!reduced && !state.current.paused) elapsed += delta;
        const flow = state.current.variant === "flow";
        const targetX =
          -0.38 + (reduced ? 0 : pointerY * 0.18 + dragY) + (flow ? 0.4 : 0);
        const targetY =
          -0.34 + elapsed * 0.085 + (reduced ? 0 : pointerX * 0.23 + dragX);
        sculpture.rotation.x += (targetX - sculpture.rotation.x) * 0.045;
        sculpture.rotation.y += (targetY - sculpture.rotation.y) * 0.045;
        sculpture.rotation.z =
          -0.3 + (flow ? Math.sin(elapsed * 0.2) * 0.12 : 0);
        sculpture.position.y =
          reduced || state.current.paused
            ? 0
            : Math.sin(elapsed * 0.65) * 0.055;
        renderer.render(scene, camera);
        const settling =
          Math.abs(targetX - sculpture.rotation.x) +
            Math.abs(targetY - sculpture.rotation.y) >
          0.0005;
        if ((!reduced && !state.current.paused) || settling)
          frame = requestAnimationFrame(draw);
      }
      function start() {
        previous = 0;
        if (!frame && visible && !document.hidden)
          frame = requestAnimationFrame(draw);
      }
      wake.current = start;
      const observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else {
            cancelAnimationFrame(frame);
            frame = 0;
          }
        },
        { rootMargin: "80px" },
      );
      observer.observe(element);
      const sizeObserver = new ResizeObserver(resize);
      sizeObserver.observe(element);
      const motionPreference = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      const motionChange = () => {
        reduced = motionPreference.matches;
        start();
      };
      motionPreference.addEventListener("change", motionChange);
      const visibilityChange = () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else start();
      };
      document.addEventListener("visibilitychange", visibilityChange);
      const pointerMove = (event: PointerEvent) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        if (dragging) {
          dragX += (event.clientX - previousX) * 0.005;
          dragY += (event.clientY - previousY) * 0.005;
          previousX = event.clientX;
          previousY = event.clientY;
        }
        start();
      };
      const pointerDown = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        dragging = true;
        previousX = event.clientX;
        previousY = event.clientY;
        element?.setPointerCapture(event.pointerId);
      };
      const pointerUp = () => {
        dragging = false;
      };
      const pointerLeave = () => {
        pointerX = 0;
        pointerY = 0;
        dragging = false;
        start();
      };
      const contextLost = () => {
        visible = false;
        setReady(false);
        cancelAnimationFrame(frame);
        frame = 0;
      };
      element.addEventListener("pointermove", pointerMove);
      element.addEventListener("pointerdown", pointerDown);
      element.addEventListener("pointerup", pointerUp);
      element.addEventListener("pointercancel", pointerUp);
      element.addEventListener("pointerleave", pointerLeave);
      renderer.domElement.addEventListener("webglcontextlost", contextLost);
      resize();
      start();
      setReady(true);

      dispose = () => {
        wake.current = () => {};
        cancelAnimationFrame(frame);
        observer.disconnect();
        sizeObserver.disconnect();
        motionPreference.removeEventListener("change", motionChange);
        document.removeEventListener("visibilitychange", visibilityChange);
        element.removeEventListener("pointermove", pointerMove);
        element.removeEventListener("pointerdown", pointerDown);
        element.removeEventListener("pointerup", pointerUp);
        element.removeEventListener("pointercancel", pointerUp);
        element.removeEventListener("pointerleave", pointerLeave);
        renderer.domElement.removeEventListener(
          "webglcontextlost",
          contextLost,
        );
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        environment.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }
    mount().catch(() => {
      if (!cancelled) setReady(false);
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return (
    <div
      className={`${styles.sculpture} ${className}`}
      role="img"
      aria-label="记忆轨道：钴蓝色丝线交织成缓缓旋转的立体环结，可用鼠标拖动欣赏。"
    >
      <div className={styles.halo} aria-hidden="true" />
      <div className={styles.shadow} aria-hidden="true" />
      <svg
        className={`${styles.fallback} ${ready ? styles.hidden : ""}`}
        viewBox="0 0 600 560"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#92aaff" />
            <stop offset=".3" stopColor="#2949ef" />
            <stop offset=".7" stopColor="#1028a5" />
            <stop offset="1" stopColor="#6987f9" />
          </linearGradient>
        </defs>
        <g transform="translate(300 266) rotate(-24)">
          {Array.from({ length: 38 }, (_, i) => (
            <ellipse
              key={i}
              rx={170 - i * 1.65}
              ry={97 + i * 1.1}
              transform={`rotate(${i * 2.9})`}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.7"
            />
          ))}
        </g>
      </svg>
      <div
        ref={host}
        className={`${styles.canvas} ${ready ? styles.ready : ""}`}
      />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface HeroThreeCanvasProps {
  className?: string;
}

/**
 * Three.js WebGL ambient architectural wave-contour & depth particle field.
 * Reacts smoothly to pointer parallax and scroll depth with full cleanup.
 */
export default function HeroThreeCanvas({ className = "" }: HeroThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 2.4, 9.5);
    camera.lookAt(0, -0.4, 0);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 1. Sculptural architectural wave mesh (wireframe + subtle vertex glow)
    const planeGeo = new THREE.PlaneGeometry(26, 15, 76, 44);
    const basePositions = new Float32Array(planeGeo.attributes.position.array);

    const waveMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#2b6e75"),
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const waveMesh = new THREE.Mesh(planeGeo, waveMat);
    waveMesh.rotation.x = -Math.PI / 2.35;
    waveMesh.position.y = -2.0;
    waveMesh.position.z = -1.5;
    scene.add(waveMesh);

    // Secondary subtle brass accent ribbon
    const accentGeo = new THREE.PlaneGeometry(22, 10, 48, 24);
    const accentBase = new Float32Array(accentGeo.attributes.position.array);
    const accentMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#d9a962"),
      wireframe: true,
      transparent: true,
      opacity: 0.11,
    });
    const accentMesh = new THREE.Mesh(accentGeo, accentMat);
    accentMesh.rotation.x = -Math.PI / 2.55;
    accentMesh.position.y = -1.45;
    accentMesh.position.z = -3.0;
    scene.add(accentMesh);

    // 2. Floating soft bokeh depth particles (brass + teal)
    const particleCount = 130;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const colBrass = new THREE.Color("#e5ba78");
    const colTeal = new THREE.Color("#4db6ac");

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 22;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1;

      const c = Math.random() > 0.45 ? colBrass : colTeal;
      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));

    // Soft circular sprite texture for particles
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 32;
    spriteCanvas.height = 32;
    const sCtx = spriteCanvas.getContext("2d");
    if (sCtx) {
      const grad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.4, "rgba(255,255,255,0.55)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 32, 32);
    }
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);

    const pMat = new THREE.PointsMaterial({
      size: 0.14,
      map: spriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // 3. Pointer parallax + scroll response
    const targetMouse = { x: 0, y: 0 };
    const currentMouse = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth pointer interpolation
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.04;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.04;

      const scrollFactor = Math.min(window.scrollY / 900, 1);

      camera.position.x = currentMouse.x * 0.85;
      camera.position.y = 2.4 - currentMouse.y * 0.45 - scrollFactor * 0.9;
      camera.lookAt(0, -0.4 - scrollFactor * 0.4, 0);

      // Animate primary wave contour
      const pos = planeGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3;
        const x = basePositions[ix];
        const y = basePositions[ix + 1];
        const z =
          Math.sin(x * 0.42 + t * 0.65) * 0.48 +
          Math.cos(y * 0.52 + t * 0.5) * 0.34 +
          Math.sin((x + y) * 0.28 - t * 0.35) * 0.22;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;

      // Animate secondary brass contour
      const aPos = accentGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < aPos.count; i++) {
        const ix = i * 3;
        const x = accentBase[ix];
        const y = accentBase[ix + 1];
        const z =
          Math.cos(x * 0.35 - t * 0.55) * 0.42 +
          Math.sin(y * 0.48 + t * 0.42) * 0.28;
        aPos.setZ(i, z);
      }
      aPos.needsUpdate = true;

      // Gentle drift for depth particles
      particles.rotation.y = t * 0.025 + currentMouse.x * 0.08;
      particles.rotation.x = Math.sin(t * 0.15) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      ro.disconnect();
      planeGeo.dispose();
      waveMat.dispose();
      accentGeo.dispose();
      accentMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      spriteTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    />
  );
}

import { Power1, TweenMax } from 'gsap';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

import styles from './index.module.scss';

interface BuildingParam {
  buildingHeight: number;
  cubeWidth: number;
  posX: number;
  posZ: number;
  rotationValue: number;
}

interface SmokeParam {
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
}

// 工具函数
function mathRandom(num = 8): number {
  return -Math.random() * num + Math.random() * num;
}

const InteractDemo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 移除容器内已存在的 canvas（避免生成多个）
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    // -----------------------------
    // Renderer & Canvas Setup
    // -----------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (window.innerWidth > 800) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.shadowMap.needsUpdate = true;
    }
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // -----------------------------
    // Camera
    // -----------------------------
    const camera = new THREE.PerspectiveCamera(
      20,
      window.innerWidth / window.innerHeight,
      1,
      500,
    );
    camera.position.set(0, 2, 14);

    // -----------------------------
    // Scene & Objects
    // -----------------------------
    const scene = new THREE.Scene();
    const city = new THREE.Object3D();
    const smoke = new THREE.Object3D();
    const town = new THREE.Object3D();

    let createCarPos = true;
    const uSpeed = 0.001;

    // -----------------------------
    // Fog & Background
    // -----------------------------
    const setcolor = 0xf02050;
    scene.background = new THREE.Color(setcolor);
    scene.fog = new THREE.Fog(setcolor, 10, 16);

    // -----------------------------
    // Add Ground Plane (Main Thread)
    // -----------------------------
    const pmaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      shininess: 10,
      opacity: 0.9,
      transparent: true,
    });
    const pgeometry = new THREE.PlaneGeometry(60, 60);
    const pelement = new THREE.Mesh(pgeometry, pmaterial);
    pelement.rotation.x = -Math.PI / 2;
    pelement.position.y = -0.001;
    pelement.receiveShadow = true;
    city.add(pelement);

    // -----------------------------
    // 使用 Worker 生成建筑与烟雾参数
    // -----------------------------
    const worker = new Worker(new URL('./cityWorker.ts', import.meta.url), {
      type: 'module',
    });
    worker.postMessage({ command: 'generate' });
    worker.onmessage = (event: MessageEvent) => {
      const { buildings, smokeParticles } = event.data as {
        buildings: BuildingParam[];
        smokeParticles: SmokeParam[];
      };

      // 创建建筑
      const segments = 2;
      // 创建基础建筑几何体（平移使底部在 y=0）
      const geometry = new THREE.BoxGeometry(
        1,
        1,
        1,
        segments,
        segments,
        segments,
      );
      geometry.translate(0, 0.5, 0);

      buildings.forEach((b) => {
        const material = new THREE.MeshStandardMaterial({
          color: 0x000000, // 固定返回黑色
          wireframe: false,
        });
        const wmaterial = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.03,
          side: THREE.DoubleSide,
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.add(new THREE.Mesh(geometry, wmaterial));

        cube.castShadow = true;
        cube.receiveShadow = true;
        cube.userData.rotationValue = b.rotationValue;

        cube.scale.y = b.buildingHeight;
        cube.scale.x = cube.scale.z = b.cubeWidth;
        cube.position.x = b.posX;
        cube.position.z = b.posZ;

        town.add(cube);
      });

      // 创建烟雾粒子
      const gmaterial = new THREE.MeshToonMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
      });
      const gparticular = new THREE.CircleGeometry(0.01, 3);
      smokeParticles.forEach((p) => {
        const particular = new THREE.Mesh(gparticular, gmaterial);
        particular.position.set(p.posX, p.posY, p.posZ);
        particular.rotation.set(p.rotX, p.rotY, p.rotZ);
        smoke.add(particular);
      });

      // 添加生成的对象到场景
      city.add(town);
      city.add(smoke);

      // Worker 用完后终止
      worker.terminate();
    };

    // -----------------------------
    // Mouse & Touch Events
    // -----------------------------
    const mouse = new THREE.Vector2();
    function onMouseMove(event: MouseEvent) {
      event.preventDefault();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    function onDocumentTouchStart(event: TouchEvent) {
      if (event.touches.length === 1) {
        event.preventDefault();
        mouse.x = event.touches[0].pageX - window.innerWidth / 2;
        mouse.y = event.touches[0].pageY - window.innerHeight / 2;
      }
    }
    function onDocumentTouchMove(event: TouchEvent) {
      if (event.touches.length === 1) {
        event.preventDefault();
        mouse.x = event.touches[0].pageX - window.innerWidth / 2;
        mouse.y = event.touches[0].pageY - window.innerHeight / 2;
      }
    }
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('touchstart', onDocumentTouchStart, false);
    window.addEventListener('touchmove', onDocumentTouchMove, false);

    // -----------------------------
    // Lighting Setup
    // -----------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 4);
    const lightFront = new THREE.SpotLight(0xffffff, 20, 10);
    const lightBack = new THREE.PointLight(0xffffff, 0.5);
    lightFront.rotation.x = Math.PI / 4;
    lightFront.rotation.z = -Math.PI / 4;
    lightFront.position.set(5, 5, 5);
    lightFront.castShadow = true;
    lightFront.shadow.mapSize.width = 6000;
    lightFront.shadow.mapSize.height = 6000;
    lightFront.penumbra = 0.1;
    lightBack.position.set(0, 6, 0);
    smoke.position.y = 2;

    scene.add(ambientLight);
    city.add(lightFront);
    scene.add(lightBack);
    scene.add(city);

    // -----------------------------
    // Optional Grid Helper
    // -----------------------------
    const gridHelper = new THREE.GridHelper(60, 120, 0xff0000, 0x000000);
    city.add(gridHelper);

    // -----------------------------
    // "Car Flow" Animation (using gsap)
    // -----------------------------
    const createCars = (cScale = 2, cPos = 20, cColor = 0xffff00) => {
      const cMat = new THREE.MeshToonMaterial({
        color: cColor,
        side: THREE.DoubleSide,
      });
      const cGeo = new THREE.BoxGeometry(1, cScale / 40, cScale / 40);
      const cElem = new THREE.Mesh(cGeo, cMat);
      const cAmp = 3;
      if (createCarPos) {
        createCarPos = false;
        cElem.position.x = -cPos;
        cElem.position.z = mathRandom(cAmp);
        TweenMax.to(cElem.position, 3, {
          x: cPos,
          repeat: -1,
          yoyo: true,
          delay: mathRandom(3),
        });
      } else {
        createCarPos = true;
        cElem.position.x = mathRandom(cAmp);
        cElem.position.z = -cPos;
        cElem.rotation.y = Math.PI / 2;
        TweenMax.to(cElem.position, 5, {
          z: cPos,
          repeat: -1,
          yoyo: true,
          delay: mathRandom(3),
          ease: Power1.easeInOut,
        });
      }
      cElem.receiveShadow = true;
      cElem.castShadow = true;
      cElem.position.y = Math.abs(mathRandom(5));
      city.add(cElem);
    };

    const generateLines = () => {
      for (let i = 0; i < 60; i++) {
        createCars(0.1, 20);
      }
    };
    generateLines();

    // -----------------------------
    // Window Resize Handling
    // -----------------------------
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize, false);

    // -----------------------------
    // Animation Loop
    // -----------------------------
    const animate = () => {
      requestAnimationFrame(animate);
      city.rotation.y -= (mouse.x * 8 - camera.rotation.y) * uSpeed;
      city.rotation.x -= (-mouse.y * 2 - camera.rotation.x) * uSpeed;
      if (city.rotation.x < -0.05) city.rotation.x = -0.05;
      else if (city.rotation.x > 1) city.rotation.x = 1;
      smoke.rotation.y += 0.01;
      smoke.rotation.x += 0.01;
      camera.lookAt(city.position);
      renderer.render(scene, camera);
    };
    animate();

    // -----------------------------
    // Cleanup on Unmount
    // -----------------------------
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onDocumentTouchStart);
      window.removeEventListener('touchmove', onDocumentTouchMove);
      window.removeEventListener('resize', onWindowResize);
      if (
        containerRef.current &&
        renderer.domElement.parentNode === containerRef.current
      ) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={styles.city3dContainer}>
      <div className={styles.canvasContainer} ref={containerRef} />
    </div>
  );
};

export default InteractDemo;

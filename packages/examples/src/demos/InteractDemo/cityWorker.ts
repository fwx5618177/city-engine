// cityWorker.ts
// 该 Worker 用于生成建筑和烟雾的参数数据，避免在主线程进行大量计算

function mathRandom(num: number = 8): number {
  return -Math.random() * num + Math.random() * num;
}

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

// 监听主线程消息
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data.command === 'generate') {
    const buildings: BuildingParam[] = [];
    const cubeWidthBase = 0.9;
    for (let i = 1; i < 100; i++) {
      const buildingHeight = 0.1 + Math.abs(mathRandom(8));
      const cubeWidth = cubeWidthBase + mathRandom(1 - cubeWidthBase);
      const posX = Math.round(mathRandom());
      const posZ = Math.round(mathRandom());
      const rotationValue = 0.1 + Math.abs(mathRandom(8));
      buildings.push({ buildingHeight, cubeWidth, posX, posZ, rotationValue });
    }

    const smokeParticles: SmokeParam[] = [];
    const aparticular = 5;
    for (let h = 1; h < 300; h++) {
      const posX = mathRandom(aparticular);
      const posY = mathRandom(aparticular);
      const posZ = mathRandom(aparticular);
      const rotX = mathRandom();
      const rotY = mathRandom();
      const rotZ = mathRandom();
      smokeParticles.push({ posX, posY, posZ, rotX, rotY, rotZ });
    }

    // 返回计算结果给主线程
    self.postMessage({ buildings, smokeParticles });
  }
});

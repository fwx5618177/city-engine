import * as THREE from 'three';

import { Config } from '../config';
import { Terrain } from '../terrain';

export interface WorldTouchInterface {
  normalizedScreenX(): number;
  normalizedScreenY(): number;
  worldPosition(): THREE.Vector3;
  normalizedScreenPointToWorldPoint(x: number, y: number): THREE.Vector3;
}

/*
  Converts a normalized screen vector to a 3D point in the world, based on the current camera position.
  The calculated point takes the terrain into account. That is, you can use this to calculate where on the
  terrain the mouse pointer/finger is touching.
*/
export function WorldTouch(
  camera: THREE.Camera,
  normalizedScreenVector: THREE.Vector3,
  terrain: Terrain,
): WorldTouchInterface {
  normalizedScreenVector = normalizedScreenVector.clone();

  // Adapted from https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z#13091694
  const screenCoordinateToWorldPosition = (
    camera: THREE.Camera,
    screenVector: THREE.Vector3 = normalizedScreenVector,
  ): THREE.Vector3 => {
    const MAX_ITERATIONS = 1000;

    screenVector.unproject(camera);
    const direction = screenVector.sub(camera.position).normalize();
    let ray = camera.position.clone();
    const movementTowardXZPlaneAmount = direction
      .clone()
      .multiplyScalar(0.3333333333333333);

    let loopCount = 0;
    let worldPosition: THREE.Vector3 | null = null;

    while (ray.y > Config.SIDEWALL_BOTTOM && loopCount < MAX_ITERATIONS) {
      ray = ray.add(movementTowardXZPlaneAmount);

      if (
        terrain.isPointInBounds(ray.x, ray.z) &&
        ray.y <= (terrain.heightAt(ray.x, ray.z) ?? Infinity)
      ) {
        worldPosition = ray.clone();
        break;
      }

      loopCount += 1;
    }

    // Ray doesn't intersect the terrain
    return worldPosition || ray;
  };

  const normalizedScreenX = normalizedScreenVector.x;
  const normalizedScreenY = normalizedScreenVector.y;
  const worldPosition = screenCoordinateToWorldPosition(camera);

  return {
    normalizedScreenX: () => normalizedScreenX,
    normalizedScreenY: () => normalizedScreenY,
    worldPosition: () => worldPosition,
    normalizedScreenPointToWorldPoint: (
      x: number,
      y: number,
    ): THREE.Vector3 => {
      const newScreenVector = new THREE.Vector3(x, y, 0);
      return screenCoordinateToWorldPosition(camera, newScreenVector);
    },
  };
}

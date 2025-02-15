import * as THREE from 'three';

import { CityTourMath } from '../math';
import { Terrain } from '../terrain';

import { WorldTouch, WorldTouchInterface } from './world_touch';

interface TouchPoint {
  x: number;
  y: number;
}

export interface WorldTouchCollectionInterface {
  touchCount(): number;
  normalizedScreenX(index: number): number;
  normalizedScreenY(index: number): number;
  worldPosition(index: number): THREE.Vector3;
  midpoint(): TouchPoint;
  distance(): number;
}

export class WorldTouchCollection implements WorldTouchCollectionInterface {
  private readonly camera: THREE.Camera;
  private readonly terrain: Terrain;
  private readonly touchPoints: TouchPoint[];
  private readonly worldTouches: WorldTouchInterface[];

  constructor(
    camera: THREE.Camera,
    terrain: Terrain,
    touchPoints: TouchPoint[],
  ) {
    this.camera = camera;
    this.terrain = terrain;
    this.touchPoints = touchPoints;
    this.worldTouches = touchPoints.map((point) => {
      const normalizedScreenVector = new THREE.Vector3(point.x, point.y, 0);
      return WorldTouch(this.camera, normalizedScreenVector, this.terrain);
    });
  }

  public touchCount(): number {
    return this.touchPoints.length;
  }

  public normalizedScreenX(index: number): number {
    return this.worldTouches[index].normalizedScreenX();
  }

  public normalizedScreenY(index: number): number {
    return this.worldTouches[index].normalizedScreenY();
  }

  public worldPosition(index: number): THREE.Vector3 {
    return this.worldTouches[index].worldPosition();
  }

  public midpoint(): TouchPoint {
    if (this.touchCount() < 2) {
      throw new Error(
        'Cannot calculate midpoint with less than 2 touch points',
      );
    }

    const x = (this.touchPoints[0].x + this.touchPoints[1].x) / 2;
    const y = (this.touchPoints[0].y + this.touchPoints[1].y) / 2;

    return { x, y };
  }

  public distance(): number {
    if (this.touchCount() < 2) {
      throw new Error(
        'Cannot calculate distance with less than 2 touch points',
      );
    }

    return CityTourMath.distanceBetweenPoints(
      this.touchPoints[0].x,
      this.touchPoints[0].y,
      this.touchPoints[1].x,
      this.touchPoints[1].y,
    );
  }
}

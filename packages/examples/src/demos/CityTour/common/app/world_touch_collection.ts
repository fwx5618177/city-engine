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
  touches(): WorldTouchInterface[];
  normalizedScreenX(index: number): number;
  normalizedScreenY(index: number): number;
  worldPosition(index: number): THREE.Vector3;
  midpoint(): TouchPoint;
  distance(): number;
  distanceInScreenPixels(): number;
  worldMidpoint(): THREE.Vector3;
  normalizedScreenMidpoint(): THREE.Vector3;
  angleBetweenTouches(): number;
}

export class WorldTouchCollection implements WorldTouchCollectionInterface {
  private readonly camera: THREE.Camera;
  private readonly terrain: Terrain;
  private readonly touchPoints: TouchPoint[];
  private readonly worldTouches: WorldTouchInterface[];
  private readonly _distanceInScreenPixels: number;
  private readonly _worldMidpoint: THREE.Vector3;
  private readonly _normalizedScreenMidpoint: THREE.Vector3;
  private readonly _angleBetweenTouches: number;

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

    if (this.touchCount() === 1) {
      this._distanceInScreenPixels = 0.0;
      this._worldMidpoint = this.worldTouches[0].worldPosition();
      this._normalizedScreenMidpoint = new THREE.Vector3(
        this.worldTouches[0].normalizedScreenX(),
        this.worldTouches[0].normalizedScreenY(),
        0.0,
      );
      this._angleBetweenTouches = 0.0;
    } else {
      this._distanceInScreenPixels = CityTourMath.distanceBetweenPoints(
        this.touchPoints[0].x,
        this.touchPoints[0].y,
        this.touchPoints[1].x,
        this.touchPoints[1].y,
      );

      this._normalizedScreenMidpoint = new THREE.Vector3(
        (this.worldTouches[0].normalizedScreenX() +
          this.worldTouches[1].normalizedScreenX()) /
          2,
        (this.worldTouches[0].normalizedScreenY() +
          this.worldTouches[1].normalizedScreenY()) /
          2,
        0.0,
      );

      const worldMidpointTouch = WorldTouch(
        this.camera,
        this._normalizedScreenMidpoint,
        this.terrain,
      );
      this._worldMidpoint = worldMidpointTouch.worldPosition();

      this._angleBetweenTouches = Math.atan2(
        -(this.touchPoints[1].x - this.touchPoints[0].x),
        -(this.touchPoints[1].y - this.touchPoints[0].y),
      );
    }
  }

  public touchCount(): number {
    return this.touchPoints.length;
  }

  public touches(): WorldTouchInterface[] {
    return this.worldTouches;
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

  public distanceInScreenPixels(): number {
    return this._distanceInScreenPixels;
  }

  public worldMidpoint(): THREE.Vector3 {
    return this._worldMidpoint;
  }

  public normalizedScreenMidpoint(): THREE.Vector3 {
    return this._normalizedScreenMidpoint;
  }

  public angleBetweenTouches(): number {
    return this._angleBetweenTouches;
  }
}

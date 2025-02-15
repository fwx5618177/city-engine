import * as THREE from 'three';

import { Config } from '../config';
import { CityTourMath } from '../math';
import { Terrain } from '../terrain';

import { WorldTouchCollection } from './world_touch_collection';

export enum GestureType {
  PAN = 'PAN',
  TILT = 'TILT',
  ROTATE = 'ROTATE',
  PINCH_ZOOM = 'PINCH_ZOOM',
}

export interface GestureProcessorInterface {
  processGesture(
    touchCollection: WorldTouchCollection,
  ): GestureType | undefined;
  setTerrain(terrain: Terrain): void;
}

export class GestureProcessor implements GestureProcessorInterface {
  private readonly camera: THREE.Camera;
  private terrain: Terrain;
  private lastTouchCollection: WorldTouchCollection | undefined;

  constructor(camera: THREE.Camera, terrain: Terrain) {
    this.camera = camera;
    this.terrain = terrain;
  }

  public processGesture(
    touchCollection: WorldTouchCollection,
  ): GestureType | undefined {
    if (touchCollection.touchCount() === 1) {
      return this.processSingleTouchGesture(touchCollection);
    } else if (touchCollection.touchCount() === 2) {
      return this.processMultiTouchGesture(touchCollection);
    }
    return undefined;
  }

  public setTerrain(terrain: Terrain): void {
    this.terrain = terrain;
  }

  private processSingleTouchGesture(
    touchCollection: WorldTouchCollection,
  ): GestureType | undefined {
    if (!this.lastTouchCollection) {
      this.lastTouchCollection = touchCollection;
      return undefined;
    }

    const deltaX =
      touchCollection.normalizedScreenX(0) -
      this.lastTouchCollection.normalizedScreenX(0);
    const deltaY =
      touchCollection.normalizedScreenY(0) -
      this.lastTouchCollection.normalizedScreenY(0);

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return GestureType.PAN;
    } else {
      return GestureType.TILT;
    }
  }

  private processMultiTouchGesture(
    touchCollection: WorldTouchCollection,
  ): GestureType | undefined {
    if (
      !this.lastTouchCollection ||
      this.lastTouchCollection.touchCount() !== 2
    ) {
      this.lastTouchCollection = touchCollection;
      return undefined;
    }

    const currentMidpoint = touchCollection.midpoint();
    const lastMidpoint = this.lastTouchCollection.midpoint();
    const currentDistance = touchCollection.distance();
    const lastDistance = this.lastTouchCollection.distance();

    const deltaDistance = Math.abs(currentDistance - lastDistance);
    const deltaMidpoint = Math.abs(
      CityTourMath.distanceBetweenPoints(
        currentMidpoint.x,
        currentMidpoint.y,
        lastMidpoint.x,
        lastMidpoint.y,
      ),
    );

    if (deltaDistance > deltaMidpoint) {
      return GestureType.PINCH_ZOOM;
    } else {
      return GestureType.ROTATE;
    }
  }
}

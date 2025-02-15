import * as THREE from 'three';

import { Config } from '../config';
import { CityTourMath } from '../math';
import { Terrain } from '../terrain';

import { MapCamera } from './map_camera';
import { SceneView } from './scene_view';
import { WorldTouch } from './world_touch';
import { WorldTouchCollection } from './world_touch_collection';

const HALF_PI = Math.PI * 0.5;

export enum GestureType {
  PAN = 'pan',
  TILT = 'tilt',
  ROTATE = 'rotate',
  PINCH_ZOOM = 'pinch zoom',
}

export interface GestureProcessorInterface {
  processGesture(
    touchCollection?: WorldTouchCollection,
    isShiftKey?: boolean,
    isAltKey?: boolean,
  ): GestureType | undefined;
  setTerrain(terrain: Terrain): void;
}

export class GestureProcessor implements GestureProcessorInterface {
  private static readonly MIN_ROTATION_ANGLE = 0.01745329; // 1 degree
  private static readonly MIN_ZOOM_DELTA = 2.0;
  private static readonly ALLOWABLE_DELTA_FOR_TILT_GESTURE = Math.PI / 16;
  private static readonly MIN_TILT_GESTURE_START_ANGLE =
    HALF_PI - GestureProcessor.ALLOWABLE_DELTA_FOR_TILT_GESTURE;
  private static readonly MAX_TILT_GESTURE_START_ANGLE =
    HALF_PI + GestureProcessor.ALLOWABLE_DELTA_FOR_TILT_GESTURE;
  private static readonly WINDOW_CENTER = new THREE.Vector3(0.0, 0.0, 0.0);

  private terrainBoundingBox: THREE.Box3;
  private currentGesture?: GestureType;
  private previousTouches?: WorldTouchCollection;

  constructor(
    private readonly sceneView: SceneView,
    private readonly mapCamera: MapCamera,
    private terrain: Terrain,
  ) {
    this.terrainBoundingBox = new THREE.Box3(
      new THREE.Vector3(
        terrain.minX(),
        Number.NEGATIVE_INFINITY,
        terrain.minZ(),
      ),
      new THREE.Vector3(
        terrain.maxX(),
        Number.POSITIVE_INFINITY,
        terrain.maxZ(),
      ),
    );
  }

  public processGesture(
    currentTouches?: WorldTouchCollection,
    isShiftKey = false,
    isAltKey = false,
  ): GestureType | undefined {
    if (!currentTouches) {
      this.currentGesture = undefined;
      this.mapCamera.setIsVelocityEnabled(true);
      this.sceneView.touchPoint1MarkerMesh().position.set(0.0, 0.0, 0.0);
      this.sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
      return undefined;
    }

    if (!this.previousTouches) {
      this.mapCamera.setCenterOfAction(undefined);
      this.mapCamera.setIsVelocityEnabled(false);
    } else if (currentTouches.touchCount() === 1) {
      this.processSingleTouchGestures(currentTouches, isShiftKey, isAltKey);
    } else if (currentTouches.touchCount() === 2) {
      this.sceneView
        .touchPoint1MarkerMesh()
        .position.set(
          currentTouches.touches()[0].worldPosition().x,
          currentTouches.touches()[0].worldPosition().y,
          currentTouches.touches()[0].worldPosition().z,
        );
      this.sceneView
        .touchPoint2MarkerMesh()
        .position.set(
          currentTouches.touches()[1].worldPosition().x,
          currentTouches.touches()[1].worldPosition().y,
          currentTouches.touches()[1].worldPosition().z,
        );

      this.processMultiTouchGestures(currentTouches);
    }

    this.previousTouches = currentTouches;
    return this.currentGesture;
  }

  public setTerrain(newTerrain: Terrain): void {
    this.terrain = newTerrain;
    this.terrainBoundingBox = new THREE.Box3(
      new THREE.Vector3(
        newTerrain.minX(),
        Number.NEGATIVE_INFINITY,
        newTerrain.minZ(),
      ),
      new THREE.Vector3(
        newTerrain.maxX(),
        Number.POSITIVE_INFINITY,
        newTerrain.maxZ(),
      ),
    );
  }

  private processSingleTouchGestures(
    currentTouches: WorldTouchCollection,
    isShiftKey: boolean,
    isAltKey: boolean,
  ): void {
    if (this.previousTouches?.touchCount() !== 1) {
      this.mapCamera.setIsVelocityEnabled(false);
      return;
    }

    if (isAltKey) {
      const distanceBetweenTouchesDeltaX =
        currentTouches.normalizedScreenMidpoint().x -
        this.previousTouches.normalizedScreenMidpoint().x;
      const distanceBetweenTouchesDeltaY =
        currentTouches.normalizedScreenMidpoint().y -
        this.previousTouches.normalizedScreenMidpoint().y;

      if (!this.mapCamera.centerOfAction()) {
        this.setCenterOfAction(currentTouches);
      }

      if (
        Math.abs(distanceBetweenTouchesDeltaX) >
        Math.abs(distanceBetweenTouchesDeltaY)
      ) {
        this.currentGesture = GestureType.ROTATE;
        this.mapCamera.setCenterOfTilt(undefined);

        const azimuthAngleDelta = CityTourMath.lerp(
          0,
          Math.PI,
          currentTouches.normalizedScreenMidpoint().x -
            this.previousTouches.normalizedScreenMidpoint().x,
        );
        const newAzimuthAngle =
          this.mapCamera.azimuthAngle() + azimuthAngleDelta;
        this.mapCamera.rotateAzimuthAroundCenterOfAction(
          newAzimuthAngle - this.mapCamera.azimuthAngle(),
        );
      } else if (
        Math.abs(distanceBetweenTouchesDeltaX) <
        Math.abs(distanceBetweenTouchesDeltaY)
      ) {
        this.currentGesture = GestureType.TILT;

        if (!this.mapCamera.centerOfTilt()) {
          const centerOfScreenTouch = WorldTouch(
            this.sceneView.camera(),
            GestureProcessor.WINDOW_CENTER,
            this.terrain,
          );
          this.mapCamera.setCenterOfTilt(centerOfScreenTouch.worldPosition());
        }

        const tiltAngleDelta =
          -(distanceBetweenTouchesDeltaY * 0.5) *
          (this.mapCamera.minTiltAngle() - this.mapCamera.maxTiltAngle());
        this.mapCamera.tiltCamera(tiltAngleDelta);
      }
    } else if (isShiftKey) {
      this.currentGesture = GestureType.PINCH_ZOOM;
      this.mapCamera.setCenterOfTilt(undefined);

      if (!this.mapCamera.centerOfAction()) {
        this.setCenterOfAction(currentTouches);
      }

      const distanceBetweenTouchesDelta =
        currentTouches.normalizedScreenMidpoint().y -
        this.previousTouches.normalizedScreenMidpoint().y;
      const zoomDistanceDelta = -1.25 * distanceBetweenTouchesDelta;

      if (zoomDistanceDelta !== 0.0) {
        this.mapCamera.zoomTowardCenterOfAction(zoomDistanceDelta);
      }
    } else {
      this.currentGesture = GestureType.PAN;
      this.mapCamera.setCenterOfAction(undefined);

      this.panCamera(currentTouches);

      this.sceneView
        .touchPoint1MarkerMesh()
        .position.set(
          currentTouches.touches()[0].worldPosition().x,
          currentTouches.touches()[0].worldPosition().y,
          currentTouches.touches()[0].worldPosition().z,
        );
      this.sceneView.touchPoint2MarkerMesh().position.set(0.0, 0.0, 0.0);
    }
  }

  private processMultiTouchGestures(
    currentTouches: WorldTouchCollection,
  ): void {
    this.currentGesture = this.determineMultiTouchGesture(currentTouches);

    if (!this.currentGesture) {
      return;
    }

    if (this.currentGesture === GestureType.TILT) {
      if (!this.mapCamera.centerOfTilt()) {
        const centerOfScreenTouch = WorldTouch(
          this.sceneView.camera(),
          GestureProcessor.WINDOW_CENTER,
          this.terrain,
        );
        this.mapCamera.setCenterOfTilt(centerOfScreenTouch.worldPosition());
      }

      const yDistanceDelta =
        currentTouches.touches()[0].normalizedScreenY() -
        this.previousTouches!.touches()[0].normalizedScreenY();
      const tiltAngleDelta =
        -yDistanceDelta *
        (this.mapCamera.minTiltAngle() - this.mapCamera.maxTiltAngle());
      this.mapCamera.tiltCamera(tiltAngleDelta);
    } else if (this.currentGesture === GestureType.ROTATE) {
      if (!this.mapCamera.centerOfAction()) {
        this.setCenterOfAction(currentTouches);
      }

      this.mapCamera.rotateAzimuthAroundCenterOfAction(
        this.previousTouches!.angleBetweenTouches() -
          currentTouches.angleBetweenTouches(),
      );
    } else if (this.currentGesture === GestureType.PINCH_ZOOM) {
      if (!this.mapCamera.centerOfAction()) {
        this.setCenterOfAction(currentTouches);
      }

      const distanceBetweenTouchesDelta =
        currentTouches.distanceInScreenPixels() -
        this.previousTouches!.distanceInScreenPixels();
      const zoomDistanceDelta = 0.01 * distanceBetweenTouchesDelta;

      this.mapCamera.zoomTowardCenterOfAction(zoomDistanceDelta);
    }
  }

  private determineMultiTouchGesture(
    currentTouches: WorldTouchCollection,
  ): GestureType | undefined {
    const screenAngleBetweenTouches = Math.abs(
      currentTouches.angleBetweenTouches(),
    );
    const touchPointsAreHorizontal =
      screenAngleBetweenTouches >=
        GestureProcessor.MIN_TILT_GESTURE_START_ANGLE &&
      screenAngleBetweenTouches <=
        GestureProcessor.MAX_TILT_GESTURE_START_ANGLE;

    if (this.previousTouches?.touchCount() !== 2) {
      return undefined;
    }

    if (this.currentGesture === GestureType.TILT) {
      return GestureType.TILT;
    } else if (!this.currentGesture && touchPointsAreHorizontal) {
      return GestureType.TILT;
    } else if (
      Math.abs(
        this.previousTouches.angleBetweenTouches() -
          currentTouches.angleBetweenTouches(),
      ) >= GestureProcessor.MIN_ROTATION_ANGLE
    ) {
      return GestureType.ROTATE;
    } else if (
      Math.abs(
        currentTouches.distanceInScreenPixels() -
          this.previousTouches.distanceInScreenPixels(),
      ) >= GestureProcessor.MIN_ZOOM_DELTA
    ) {
      return GestureType.PINCH_ZOOM;
    } else {
      return this.currentGesture;
    }
  }

  private setCenterOfAction(currentTouches: WorldTouchCollection): void {
    if (
      this.terrain.isPointInBounds(
        currentTouches.worldMidpoint().x,
        currentTouches.worldMidpoint().z,
      )
    ) {
      this.mapCamera.setCenterOfAction(currentTouches.worldMidpoint());
    } else {
      this.mapCamera.setCenterOfAction(
        this.clampedCenterOfAction(currentTouches),
      );
    }
  }

  private clampedCenterOfAction(
    currentTouches: WorldTouchCollection,
  ): THREE.Vector3 {
    const cameraPosition = new THREE.Vector3(
      this.mapCamera.positionX(),
      this.mapCamera.positionY(),
      this.mapCamera.positionZ(),
    );
    const direction = currentTouches
      .worldMidpoint()
      .clone()
      .sub(cameraPosition)
      .normalize();
    const ray = new THREE.Ray(cameraPosition, direction);
    const intersectionPoint = ray.intersectBox(
      this.terrainBoundingBox,
      new THREE.Vector3(),
    );

    if (!intersectionPoint || intersectionPoint.y < Config.SIDEWALL_BOTTOM) {
      return currentTouches.worldMidpoint();
    }

    // If camera is outside the terrain bounds, raycast again from the edge of the
    // terrain bounding box so that we choose the farthest edge of the bounding box.
    if (
      !this.terrain.isPointInBounds(
        this.mapCamera.positionX(),
        this.mapCamera.positionZ(),
      )
    ) {
      ray.origin = intersectionPoint;
      ray.recast(0.00000001);
      intersectionPoint.copy(
        ray.intersectBox(this.terrainBoundingBox, new THREE.Vector3()) ||
          intersectionPoint,
      );
    }

    return intersectionPoint;
  }

  private panCamera(currentTouches: WorldTouchCollection): void {
    const normalizedScreenDragDistance = new THREE.Vector3(
      currentTouches.normalizedScreenMidpoint().x -
        this.previousTouches!.normalizedScreenMidpoint().x,
      currentTouches.normalizedScreenMidpoint().y -
        this.previousTouches!.normalizedScreenMidpoint().y,
      0.0,
    );
    const tiltAngleDelta =
      this.mapCamera.minTiltAngle() - this.mapCamera.tiltAngle();

    this.mapCamera.setCenterOfTilt(
      WorldTouch(
        this.sceneView.camera(),
        GestureProcessor.WINDOW_CENTER,
        this.terrain,
      ).worldPosition(),
    );
    this.mapCamera.tiltCamera(tiltAngleDelta);

    const worldDragStart = new THREE.Vector3(
      this.mapCamera.positionX(),
      0.0,
      this.mapCamera.positionZ(),
    );
    const worldDragEnd = WorldTouch(
      this.sceneView.camera(),
      normalizedScreenDragDistance,
      this.terrain,
    ).worldPosition();
    const worldDragDistance = new THREE.Vector3(
      worldDragEnd.x - worldDragStart.x,
      worldDragEnd.y - worldDragStart.y,
      worldDragEnd.z - worldDragStart.z,
    );

    this.mapCamera.tiltCamera(-tiltAngleDelta);
    this.mapCamera.setCenterOfTilt(undefined);

    this.mapCamera.pan(worldDragDistance.x, worldDragDistance.z);
  }
}

import * as THREE from 'three';

import { CityTourMath } from '../math';
import { MessageBroker } from '../message_broker';
import { Terrain } from '../terrain';

import { SceneView } from './scene_view';

const HALF_PI = Math.PI * 0.5;
const TWO_PI = Math.PI * 2;

interface MapCameraInterface {
  reset(): void;
  setTerrain(terrain: Terrain): void;
  rotateXZ(deltaX: number, deltaY: number): void;
  zoomToPoint(point: THREE.Vector3, zoomDelta: number): void;
  rotateAroundPoint(point: THREE.Vector3, angle: number): void;
  camera(): THREE.Camera;
  positionX(): number;
  positionY(): number;
  positionZ(): number;
  azimuthAngle(): number;
  tiltAngle(): number;
  minTiltAngle(): number;
  maxTiltAngle(): number;
  setIsVelocityEnabled(enabled: boolean): void;
  isVelocityEnabled(): boolean;
  tickVelocity(frameCount: number): void;
  zoomTowardCenterOfAction(zoomDistancePercentage: number): void;
  setCenterOfAction(position: THREE.Vector3): void;
  setCenterOfTilt(position: THREE.Vector3): void;
  rotateAzimuthAroundCenterOfAction(azimuthAngleDelta: number): void;
  tiltCamera(tiltAngleDelta: number): void;
  centerOfAction(): THREE.Vector3 | undefined;
  centerOfTilt(): THREE.Vector3 | undefined;
}

export class MapCamera implements MapCameraInterface {
  private static readonly PAN_VELOCITY_DECAY = 0.875;
  private static readonly ZOOM_VELOCITY_DECAY = 0.85;
  private static readonly TILT_ROTATION_VELOCITY_DECAY = 0.85;
  private static readonly AZIMUTH_ROTATION_VELOCITY_DECAY = 0.85;
  private static readonly MINIMUM_VELOCITY = 0.00001;
  private static readonly MINIMUM_HEIGHT_OFF_GROUND = 0.416666666666667;
  private static readonly MIN_TILT_ANGLE = -HALF_PI;
  private static readonly MAX_TILT_ANGLE = -0.1;
  private static readonly MAX_DISTANCE_FROM_CITY_CENTER = 200.0;

  private _centerOfActionPoint?: THREE.Vector3;
  private _centerOfTiltPoint?: THREE.Vector3;
  private zoomCameraToCenterOfActionVector?: THREE.Vector3;
  private _isVelocityEnabled = false;
  private panVelocityX = 0;
  private panVelocityZ = 0;
  private zoomVelocity = 0;
  private azimuthRotationVelocity = 0;
  private tiltRotationVelocity = 0;
  private terrain?: Terrain;

  constructor(
    private readonly sceneView: SceneView,
    terrain: Terrain,
    private readonly messageBroker: MessageBroker,
  ) {
    this.terrain = terrain;
  }

  public reset(): void {
    this.camera().position.x = -60;
    this.camera().position.y = 30;
    this.camera().position.z = 60;
    this.camera().lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

    this._centerOfActionPoint = undefined;
    this._centerOfTiltPoint = undefined;
    this.zoomCameraToCenterOfActionVector = undefined;

    this.setIsVelocityEnabled(false);

    this.messageBroker.publish('camera.updated', {});
  }

  public setTerrain(newTerrain: Terrain): void {
    this.terrain = newTerrain;
  }

  public camera(): THREE.Camera {
    return this.sceneView.camera();
  }

  public positionX(): number {
    return this.camera().position.x;
  }

  public positionY(): number {
    return this.camera().position.y;
  }

  public positionZ(): number {
    return this.camera().position.z;
  }

  public azimuthAngle(): number {
    return this.camera().rotation.y;
  }

  public tiltAngle(): number {
    return this.camera().rotation.x;
  }

  public minTiltAngle(): number {
    return MapCamera.MIN_TILT_ANGLE;
  }

  public maxTiltAngle(): number {
    return MapCamera.MAX_TILT_ANGLE;
  }

  public setIsVelocityEnabled(enabled: boolean): void {
    this._isVelocityEnabled = enabled;
    if (!enabled) {
      this.resetVelocities();
    }
  }

  public isVelocityEnabled(): boolean {
    return this._isVelocityEnabled;
  }

  private minimumCameraHeightAtCoordinates(
    cameraX: number,
    cameraZ: number,
  ): number {
    let terrainHeight = Number.NEGATIVE_INFINITY;

    if (this.terrain) {
      terrainHeight =
        this.terrain.heightAt(cameraX, cameraZ) ?? Number.NEGATIVE_INFINITY;
    }

    return terrainHeight + MapCamera.MINIMUM_HEIGHT_OFF_GROUND;
  }

  private resetVelocities(): void {
    this.panVelocityX = 0.0;
    this.panVelocityZ = 0.0;
    this.zoomVelocity = 0.0;
    this.azimuthRotationVelocity = 0.0;
    this.tiltRotationVelocity = 0.0;
  }

  public pan(distanceX: number, distanceZ: number): void {
    this.camera().position.x -= distanceX;
    this.camera().position.z -= distanceZ;
    this.camera().position.y = Math.max(
      this.minimumCameraHeightAtCoordinates(
        this.camera().position.x,
        this.camera().position.z,
      ),
      this.camera().position.y,
    );

    this.resetVelocities();
    this.panVelocityX = distanceX;
    this.panVelocityZ = distanceZ;

    this.camera().updateMatrixWorld();
  }

  public setCenterOfAction(position: THREE.Vector3 | undefined): void {
    this._centerOfActionPoint = position;
    this._centerOfTiltPoint = undefined;
    this.zoomCameraToCenterOfActionVector = undefined;

    if (!position) {
      this.sceneView
        .centerOfActionMarkerMesh()
        .position.set(0.0, -100000.0, 0.0);
    } else {
      this.sceneView.centerOfActionMarkerMesh().position.copy(position);
    }
  }

  public setCenterOfTilt(position: THREE.Vector3 | undefined): void {
    this._centerOfTiltPoint = position;
  }

  public zoomTowardCenterOfAction(zoomDistancePercentage: number): void {
    if (!this._centerOfActionPoint) return;

    if (!this.zoomCameraToCenterOfActionVector) {
      this.zoomCameraToCenterOfActionVector = new THREE.Vector3(
        this.camera().position.x - this._centerOfActionPoint.x,
        this.camera().position.y - this._centerOfActionPoint.y,
        this.camera().position.z - this._centerOfActionPoint.z,
      );
    }

    const distanceToCenterOfAction = CityTourMath.distanceBetweenPoints3D(
      this.camera().position.x,
      this.camera().position.y,
      this.camera().position.z,
      this._centerOfActionPoint.x,
      this._centerOfActionPoint.y,
      this._centerOfActionPoint.z,
    );

    const distanceToCenterOfCity = CityTourMath.distanceBetweenPoints3D(
      this.camera().position.x,
      this.camera().position.y,
      this.camera().position.z,
      0.0,
      0.0,
      0.0,
    );

    if (distanceToCenterOfAction <= 2.0 && zoomDistancePercentage > 0.0) {
      return;
    }
    if (
      distanceToCenterOfCity >= MapCamera.MAX_DISTANCE_FROM_CITY_CENTER &&
      zoomDistancePercentage < 0.0
    ) {
      return;
    }

    const clonedCameraToCenterOfActionVector =
      this.zoomCameraToCenterOfActionVector.clone();
    clonedCameraToCenterOfActionVector.multiplyScalar(zoomDistancePercentage);

    this.camera().position.x -= clonedCameraToCenterOfActionVector.x;
    this.camera().position.y -= clonedCameraToCenterOfActionVector.y;
    this.camera().position.z -= clonedCameraToCenterOfActionVector.z;
    this.camera().position.y = Math.max(
      this.minimumCameraHeightAtCoordinates(
        this.camera().position.x,
        this.camera().position.z,
      ),
      this.camera().position.y,
    );
    this.zoomCameraToCenterOfActionVector.multiplyScalar(
      1.0 - zoomDistancePercentage,
    );

    this.resetVelocities();
    this.zoomVelocity = zoomDistancePercentage;

    this.camera().updateMatrixWorld();
  }

  public rotateAzimuthAroundCenterOfAction(azimuthAngleDelta: number): void {
    if (!this._centerOfActionPoint) return;

    const distanceCameraToCenterOfAction = CityTourMath.distanceBetweenPoints(
      this.camera().position.x,
      this.camera().position.z,
      this._centerOfActionPoint.x,
      this._centerOfActionPoint.z,
    );

    const originalAngleCameraToCenterOfAction = Math.atan2(
      -(this.camera().position.z - this._centerOfActionPoint.z),
      this.camera().position.x - this._centerOfActionPoint.x,
    );

    const newAngleCameraToCenterOfAction =
      originalAngleCameraToCenterOfAction + azimuthAngleDelta;

    this.zoomCameraToCenterOfActionVector = undefined;

    this.camera().position.x =
      distanceCameraToCenterOfAction *
        Math.cos(newAngleCameraToCenterOfAction) +
      this._centerOfActionPoint.x;
    this.camera().position.z =
      -(
        distanceCameraToCenterOfAction *
        Math.sin(newAngleCameraToCenterOfAction)
      ) + this._centerOfActionPoint.z;
    this.camera().rotation.y += azimuthAngleDelta;

    if (this.camera().rotation.y > Math.PI) {
      this.camera().rotation.y -= TWO_PI;
    } else if (this.camera().rotation.y < -Math.PI) {
      this.camera().rotation.y += TWO_PI;
    }

    const minimumCameraY = this.minimumCameraHeightAtCoordinates(
      this.camera().position.x,
      this.camera().position.z,
    );
    if (this.camera().position.y < minimumCameraY) {
      this.camera().position.y = minimumCameraY;
      this._centerOfActionPoint.y = minimumCameraY;
      this.setCenterOfAction(this._centerOfActionPoint);
    }

    this.resetVelocities();
    this.azimuthRotationVelocity = azimuthAngleDelta;

    this.camera().updateMatrixWorld();
    this.messageBroker.publish('camera.updated', {});
  }

  public tiltCamera(tiltAngleDelta: number): void {
    if (!this._centerOfTiltPoint) return;

    const distanceCameraToCenterOfAction = CityTourMath.distanceBetweenPoints3D(
      this.camera().position.x,
      this.camera().position.y,
      this.camera().position.z,
      this._centerOfTiltPoint.x,
      this._centerOfTiltPoint.y,
      this._centerOfTiltPoint.z,
    );

    const newTiltAngle = CityTourMath.clamp(
      this.camera().rotation.x + tiltAngleDelta,
      MapCamera.MIN_TILT_ANGLE,
      MapCamera.MAX_TILT_ANGLE,
    );

    this.zoomCameraToCenterOfActionVector = undefined;

    if (
      tiltAngleDelta < 0.0 ||
      this.camera().position.y >
        this.minimumCameraHeightAtCoordinates(
          this.camera().position.x,
          this.camera().position.z,
        )
    ) {
      const spherical = new THREE.Spherical(
        distanceCameraToCenterOfAction,
        newTiltAngle + HALF_PI,
        this.camera().rotation.y,
      );
      this.camera().position.setFromSpherical(spherical);
      this.camera().position.add(this._centerOfTiltPoint);

      this.camera().position.y = Math.max(
        this.camera().position.y,
        this.minimumCameraHeightAtCoordinates(
          this.camera().position.x,
          this.camera().position.z,
        ),
      );
    } else {
      return;
    }

    this.camera().rotation.x = newTiltAngle;

    this.resetVelocities();
    this.tiltRotationVelocity = tiltAngleDelta;

    this.camera().updateMatrixWorld();
    this.messageBroker.publish('camera.updated', {});
  }

  public tickVelocity(frameCount: number): void {
    for (let i = 0; i < frameCount; i++) {
      this.panVelocityX *= MapCamera.PAN_VELOCITY_DECAY;
      this.panVelocityZ *= MapCamera.PAN_VELOCITY_DECAY;
      this.zoomVelocity *= MapCamera.ZOOM_VELOCITY_DECAY;
      this.azimuthRotationVelocity *= MapCamera.AZIMUTH_ROTATION_VELOCITY_DECAY;
      this.tiltRotationVelocity *= MapCamera.TILT_ROTATION_VELOCITY_DECAY;

      if (
        Math.abs(this.panVelocityX) > 0.0 ||
        Math.abs(this.panVelocityZ) > 0.0
      ) {
        this.pan(this.panVelocityX, this.panVelocityZ);
      }

      if (Math.abs(this.zoomVelocity) > 0.0) {
        this.zoomTowardCenterOfAction(this.zoomVelocity);
      }

      if (Math.abs(this.azimuthRotationVelocity) > 0.0) {
        this.rotateAzimuthAroundCenterOfAction(this.azimuthRotationVelocity);
      }

      if (Math.abs(this.tiltRotationVelocity) > 0.0) {
        this.tiltCamera(this.tiltRotationVelocity);
      }
    }

    if (Math.abs(this.panVelocityX) < MapCamera.MINIMUM_VELOCITY) {
      this.panVelocityX = 0.0;
    }
    if (Math.abs(this.panVelocityZ) < MapCamera.MINIMUM_VELOCITY) {
      this.panVelocityZ = 0.0;
    }
    if (Math.abs(this.zoomVelocity) < MapCamera.MINIMUM_VELOCITY) {
      this.zoomVelocity = 0.0;
    }
    if (Math.abs(this.azimuthRotationVelocity) < MapCamera.MINIMUM_VELOCITY) {
      this.azimuthRotationVelocity = 0.0;
    }
    if (Math.abs(this.tiltRotationVelocity) < MapCamera.MINIMUM_VELOCITY) {
      this.tiltRotationVelocity = 0.0;
    }

    if (
      this.panVelocityX === 0.0 &&
      this.panVelocityZ === 0.0 &&
      this.zoomVelocity === 0.0 &&
      this.azimuthRotationVelocity === 0.0 &&
      this.tiltRotationVelocity === 0.0
    ) {
      this._isVelocityEnabled = false;
    }
  }

  public rotateXZ(deltaX: number, deltaY: number): void {
    if (!this._centerOfActionPoint) {
      return;
    }

    const distanceCameraToCenterOfAction = CityTourMath.distanceBetweenPoints(
      this.camera().position.x,
      this.camera().position.z,
      this._centerOfActionPoint.x,
      this._centerOfActionPoint.z,
    );

    const originalAngleCameraToCenterOfAction = Math.atan2(
      -(this.camera().position.z - this._centerOfActionPoint.z),
      this.camera().position.x - this._centerOfActionPoint.x,
    );

    const newAngleCameraToCenterOfAction =
      originalAngleCameraToCenterOfAction + deltaX;

    this.zoomCameraToCenterOfActionVector = undefined;

    this.camera().position.x =
      distanceCameraToCenterOfAction *
        Math.cos(newAngleCameraToCenterOfAction) +
      this._centerOfActionPoint.x;
    this.camera().position.z =
      -(
        distanceCameraToCenterOfAction *
        Math.sin(newAngleCameraToCenterOfAction)
      ) + this._centerOfActionPoint.z;
    this.camera().rotation.y += deltaX;

    if (this.camera().rotation.y > Math.PI) {
      this.camera().rotation.y -= TWO_PI;
    } else if (this.camera().rotation.y < -Math.PI) {
      this.camera().rotation.y += TWO_PI;
    }

    const minimumCameraY = this.minimumCameraHeightAtCoordinates(
      this.camera().position.x,
      this.camera().position.z,
    );
    if (this.camera().position.y < minimumCameraY) {
      this.camera().position.y = minimumCameraY;
      this._centerOfActionPoint.y = minimumCameraY;
      this.setCenterOfAction(this._centerOfActionPoint);
    }

    this.resetVelocities();
    this.azimuthRotationVelocity = deltaX;
    this.tiltRotationVelocity = deltaY;

    this.camera().updateMatrixWorld();
    this.messageBroker.publish('camera.updated', {});
  }

  public zoomToPoint(point: THREE.Vector3, zoomDelta: number): void {
    this.setCenterOfAction(point);
    this.zoomTowardCenterOfAction(zoomDelta);
  }

  public rotateAroundPoint(point: THREE.Vector3, angle: number): void {
    this.setCenterOfAction(point);
    this.rotateAzimuthAroundCenterOfAction(angle);
  }

  public centerOfAction(): THREE.Vector3 | undefined {
    return this._centerOfActionPoint;
  }

  public centerOfTilt(): THREE.Vector3 | undefined {
    return this._centerOfTiltPoint;
  }
}

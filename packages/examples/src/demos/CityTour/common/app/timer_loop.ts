import * as THREE from 'three';

import { Animation } from '../flythrough/animation';
import { SineEasing } from '../flythrough/easing';
import {
  MotionGenerator,
  StaticMotionGenerator,
} from '../flythrough/motion_generator';
import { VehicleController } from '../flythrough/vehicle_controller';
import { VehicleView } from '../flythrough/vehicle_view';
import { WorldData } from '../generators/world_generator';
import { MessageBroker } from '../message_broker';
import { Timer } from '../timer';

import { MapCamera } from './map_camera';
import { SceneView } from './scene_view';
import type { WorldTouchInterface } from './world_touch';

const HALF_PI = Math.PI * 0.5;

enum Mode {
  MANUAL = 1,
  FLYTHROUGH = 2,
  FLYTHROUGH_STOP = 3,
}

interface TimerLoopInterface {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  reset(newWorldData: WorldData): void;
  setZoomAmount(amount: number): void;
  toggleFlythrough(): void;
}

export class TimerLoop implements TimerLoopInterface {
  private static readonly END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT = 10;

  private readonly timer: Timer;
  private readonly camera: THREE.Camera;
  private mode: Mode = Mode.MANUAL;
  private zoomAmount = 0.0;
  private vehicleController?: VehicleController;
  private vehicleView?: VehicleView;
  private flythroughToManualModeAnimation?: Animation;

  constructor(
    private worldData: WorldData,
    private readonly sceneView: SceneView,
    private readonly mapCamera: MapCamera,
    private readonly messageBroker: MessageBroker,
    private readonly worldTouch: WorldTouchInterface,
  ) {
    this.timer = new Timer();
    this.camera = sceneView.camera();
    this.timer.onTick = this.onTick;
    this.timer.start();

    window.addEventListener(
      'blur',
      () => {
        this.timer.pause();
      },
      false,
    );

    window.addEventListener(
      'focus',
      () => {
        this.restartTimer();
      },
      false,
    );

    this.messageBroker.addSubscriber('touch.focus', () => {
      this.restartTimer();
    });
  }

  public start(): void {
    this.timer.start();
  }

  public stop(): void {
    this.timer.pause();
  }

  public isRunning(): boolean {
    return !this.timer.isPaused();
  }

  public reset(newWorldData: WorldData): void {
    this.worldData = newWorldData;
  }

  public setZoomAmount(amount: number): void {
    this.zoomAmount = amount;
  }

  public toggleFlythrough(): void {
    if (this.mode === Mode.MANUAL) {
      this.startFlythrough();
    } else if (this.mode === Mode.FLYTHROUGH) {
      this.requestStopFlythrough();
    }
  }

  private syncToCamera(): void {
    if (this.mode === Mode.FLYTHROUGH && this.vehicleView) {
      this.camera.position.x = this.vehicleView.positionX();
      this.camera.position.y = this.vehicleView.positionY();
      this.camera.position.z = this.vehicleView.positionZ();
      this.camera.rotation.x = this.vehicleView.rotationX();
      this.camera.rotation.y = this.vehicleView.rotationY();
    } else if (
      this.mode === Mode.FLYTHROUGH_STOP &&
      this.flythroughToManualModeAnimation
    ) {
      this.camera.position.x = this.flythroughToManualModeAnimation.positionX();
      this.camera.position.y = this.flythroughToManualModeAnimation.positionY();
      this.camera.position.z = this.flythroughToManualModeAnimation.positionZ();
      this.camera.rotation.x = this.flythroughToManualModeAnimation.rotationX();
      this.camera.rotation.y = this.flythroughToManualModeAnimation.rotationY();
    }
  }

  private startFlythrough(): void {
    const initialCoordinates = {
      positionX: this.camera.position.x,
      positionY: this.camera.position.y,
      positionZ: this.camera.position.z,
      rotationX: this.camera.rotation.x,
      rotationY: this.camera.rotation.y,
    };

    this.zoomAmount = 0.0;
    this.mapCamera.setIsVelocityEnabled(false);

    this.vehicleController = new VehicleController(
      this.worldData.terrain,
      this.worldData.roadNetwork,
      this.worldData.neighborhoods,
      this.sceneView,
      initialCoordinates,
    );
    this.vehicleView = new VehicleView(this.vehicleController);
    this.mode = Mode.FLYTHROUGH;
    this.messageBroker.publish('flythrough.started', {
      vehicleView: this.vehicleView,
    });
  }

  private requestStopFlythrough(): void {
    if (!this.vehicleController) return;

    const centerOfTiltDistance = 3;
    const rotationY = this.camera.rotation.y + HALF_PI;
    let targetPosition: THREE.Vector3;

    if (this.camera.rotation.x > this.mapCamera.maxTiltAngle()) {
      targetPosition = new THREE.Vector3(0.0, 0.0, 0.0).setFromSphericalCoords(
        centerOfTiltDistance,
        this.mapCamera.maxTiltAngle() + HALF_PI,
        this.camera.rotation.y,
      );
      targetPosition.x +=
        this.vehicleController.positionX() +
        centerOfTiltDistance * Math.cos(rotationY);
      targetPosition.y += this.vehicleController.positionY();
      targetPosition.z +=
        this.vehicleController.positionZ() +
        centerOfTiltDistance * -Math.sin(rotationY);

      this.flythroughToManualModeAnimation = new Animation(
        new MotionGenerator(
          this.vehicleController.positionX(),
          targetPosition.x,
          new SineEasing(
            TimerLoop.END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT,
            0,
            HALF_PI,
          ),
        ),
        new MotionGenerator(
          this.vehicleController.positionY(),
          targetPosition.y,
          new SineEasing(
            TimerLoop.END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT,
            0,
            HALF_PI,
          ),
        ),
        new MotionGenerator(
          this.vehicleController.positionZ(),
          targetPosition.z,
          new SineEasing(
            TimerLoop.END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT,
            0,
            HALF_PI,
          ),
        ),
        new MotionGenerator(
          this.camera.rotation.x,
          this.mapCamera.maxTiltAngle(),
          new SineEasing(
            TimerLoop.END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT,
            0,
            HALF_PI,
          ),
        ),
        new MotionGenerator(
          this.camera.rotation.y,
          this.camera.rotation.y,
          new SineEasing(
            TimerLoop.END_OF_FLYTHROUGH_ANIMATION_FRAME_COUNT,
            0,
            HALF_PI,
          ),
        ),
      );
    } else {
      this.flythroughToManualModeAnimation = new Animation(
        new StaticMotionGenerator(this.camera.position.x),
        new StaticMotionGenerator(this.camera.position.y),
        new StaticMotionGenerator(this.camera.position.z),
        new StaticMotionGenerator(this.camera.rotation.x),
        new StaticMotionGenerator(this.camera.rotation.y),
      );
    }

    this.vehicleController = undefined;
    this.vehicleView = undefined;
    this.mode = Mode.FLYTHROUGH_STOP;
  }

  private stopFlythrough(): void {
    this.flythroughToManualModeAnimation = undefined;
    this.mode = Mode.MANUAL;
    this.messageBroker.publish('flythrough.stopped', {});
  }

  private restartTimer(): void {
    if (this.timer.isPaused()) {
      this.timer.start();
    }
  }

  private onTick = (frameCount: number): void => {
    for (let i = 0; i < frameCount; i++) {
      if (this.mode === Mode.MANUAL) {
        if (this.zoomAmount !== 0.0) {
          this.mapCamera.zoomTowardCenterOfAction(this.zoomAmount);
        }
      } else if (
        this.mode === Mode.FLYTHROUGH &&
        this.vehicleController &&
        this.vehicleView
      ) {
        this.vehicleController.tick();
        this.vehicleView.tick();
      } else if (
        this.mode === Mode.FLYTHROUGH_STOP &&
        this.flythroughToManualModeAnimation
      ) {
        this.flythroughToManualModeAnimation.tick();
        if (this.flythroughToManualModeAnimation.finished()) {
          this.stopFlythrough();
        }
      }
    }

    if (this.mapCamera.isVelocityEnabled()) {
      this.mapCamera.tickVelocity(frameCount);
    }

    this.syncToCamera();
    this.sceneView.render();
  };
}

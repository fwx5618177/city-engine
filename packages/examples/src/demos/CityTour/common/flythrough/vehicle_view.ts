import { CityTourMath } from '../math';

import { SmoothStepEasing } from './easing';
import { MotionGenerator } from './motion_generator';
import { VehicleControllerInterface } from './vehicle_controller';

interface VehicleViewInterface {
  positionX: () => number;
  positionY: () => number;
  positionZ: () => number;
  rotationX: () => number;
  rotationY: () => number;
  lockedRotationOffsetX: () => number;
  lockedRotationOffsetY: () => number;
  lockAngles: () => void;
  setLockedRotationOffsetX: (newLockedRotationOffsetX: number) => void;
  setLockedRotationOffsetY: (newLockedRotationOffsetY: number) => void;
  tick: () => void;
  enableResetToCenterAnimation: () => void;
  disableResetToCenterAnimation: () => void;
}

class VehicleView implements VehicleViewInterface {
  private static readonly MIN_ROTATION_X_OFFSET = -Math.PI / 6;
  private static readonly MAX_ROTATION_X_OFFSET = Math.PI / 4;
  private static readonly MIN_ROTATION_Y_OFFSET = -Math.PI;
  private static readonly MAX_ROTATION_Y_OFFSET = Math.PI;
  private static readonly RESET_TO_CENTER_ANIMATION_FRAME_COUNT = 40;

  private resetToCenterRotationXMotionGenerator: MotionGenerator | undefined;
  private resetToCenterRotationYMotionGenerator: MotionGenerator | undefined;

  private lockedRotationX: number | undefined;
  private lockedRotationY: number | undefined;
  private _lockedRotationOffsetX = 0;
  private _lockedRotationOffsetY = 0;
  private finalLockedRotationX: number | undefined;
  private finalLockedRotationY: number | undefined;

  private _rotationX: number;
  private _rotationY: number;

  constructor(private readonly vehicleController: VehicleControllerInterface) {
    this._rotationX = vehicleController.rotationX();
    this._rotationY = vehicleController.rotationY();
  }

  public positionX(): number {
    return this.vehicleController.positionX();
  }

  public positionY(): number {
    return this.vehicleController.positionY();
  }

  public positionZ(): number {
    return this.vehicleController.positionZ();
  }

  public rotationX(): number {
    return this._rotationX;
  }

  public rotationY(): number {
    return this._rotationY;
  }

  public lockedRotationOffsetX(): number {
    return this._lockedRotationOffsetX;
  }

  public lockedRotationOffsetY(): number {
    return this._lockedRotationOffsetY;
  }

  public lockAngles(): void {
    this.lockedRotationX = this._rotationX;
    this.lockedRotationY = this._rotationY;
    this._lockedRotationOffsetX = 0.0;
    this._lockedRotationOffsetY = 0.0;
  }

  public setLockedRotationOffsetX(newLockedRotationOffsetX: number): void {
    this._lockedRotationOffsetX = CityTourMath.clamp(
      newLockedRotationOffsetX,
      VehicleView.MIN_ROTATION_X_OFFSET,
      VehicleView.MAX_ROTATION_X_OFFSET,
    );
  }

  public setLockedRotationOffsetY(newLockedRotationOffsetY: number): void {
    this._lockedRotationOffsetY = CityTourMath.clamp(
      newLockedRotationOffsetY,
      VehicleView.MIN_ROTATION_Y_OFFSET,
      VehicleView.MAX_ROTATION_Y_OFFSET,
    );
  }

  public tick(): void {
    if (this.resetToCenterRotationXMotionGenerator !== undefined) {
      this._rotationX = CityTourMath.lerp(
        this.finalLockedRotationX!,
        this.vehicleController.rotationX(),
        this.resetToCenterRotationXMotionGenerator.next(),
      );

      if (this.resetToCenterRotationXMotionGenerator.finished()) {
        this.finalLockedRotationX = undefined;
        this.resetToCenterRotationXMotionGenerator = undefined;
      }
    } else if (this.lockedRotationX === undefined) {
      this._rotationX = this.vehicleController.rotationX();
    } else {
      this._rotationX = this.lockedRotationX + this._lockedRotationOffsetX;
    }

    if (this.resetToCenterRotationYMotionGenerator !== undefined) {
      this._rotationY = CityTourMath.lerp(
        this.finalLockedRotationY!,
        this.vehicleController.rotationY(),
        this.resetToCenterRotationYMotionGenerator.next(),
      );

      if (this.resetToCenterRotationYMotionGenerator.finished()) {
        this.finalLockedRotationY = undefined;
        this.resetToCenterRotationYMotionGenerator = undefined;
      }
    } else if (this.lockedRotationY === undefined) {
      this._rotationY = this.vehicleController.rotationY();
    } else {
      this._rotationY = this.lockedRotationY + this._lockedRotationOffsetY;
    }
  }

  public enableResetToCenterAnimation(): void {
    const resetToCenterRotationXEasing = new SmoothStepEasing(
      VehicleView.RESET_TO_CENTER_ANIMATION_FRAME_COUNT,
    );
    const resetToCenterRotationYEasing = new SmoothStepEasing(
      VehicleView.RESET_TO_CENTER_ANIMATION_FRAME_COUNT,
    );

    this.finalLockedRotationX =
      this.lockedRotationX! + this._lockedRotationOffsetX;
    this.finalLockedRotationY =
      this.lockedRotationY! + this._lockedRotationOffsetY;
    this.lockedRotationX = undefined;
    this.lockedRotationY = undefined;

    this.resetToCenterRotationXMotionGenerator = new MotionGenerator(
      0.0,
      1.0,
      resetToCenterRotationXEasing,
    );
    this.resetToCenterRotationYMotionGenerator = new MotionGenerator(
      0.0,
      1.0,
      resetToCenterRotationYEasing,
    );
  }

  public disableResetToCenterAnimation(): void {
    this.resetToCenterRotationXMotionGenerator = undefined;
    this.resetToCenterRotationYMotionGenerator = undefined;
  }
}

export { VehicleView, VehicleViewInterface };

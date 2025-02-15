import * as THREE from 'three';

interface CurveAnimationInterface {
  finished: () => boolean;
  tick: () => void;
  positionX: () => number;
  positionY: () => number;
  positionZ: () => number;
  rotationX: () => number;
  rotationY: () => number;
}

class CurveAnimation implements CurveAnimationInterface {
  private static readonly HALF_PI = Math.PI / 2;

  private _positionX = 0.0;
  private _positionY = 0.0;
  private _positionZ = 0.0;
  private _rotationY = 0.0;
  private isFinished = false;

  private u = 0.0;
  private readonly curvePosition = new THREE.Vector3();
  private tangentVector: THREE.Vector3 | undefined;

  private readonly totalLength: number;
  private readonly uTickDelta: number;

  constructor(
    private readonly curve: THREE.Curve<THREE.Vector3>,
    distancePerTick: number,
    private readonly _rotationX: number,
  ) {
    this.totalLength = curve.getLength();
    this.uTickDelta = distancePerTick / this.totalLength;
  }

  public tick(): void {
    if (this.u === 1.0) {
      this.isFinished = true;
    }

    this.curvePosition.copy(this.curve.getPointAt(this.u));
    this._positionX = this.curvePosition.x;
    this._positionY = this.curvePosition.y;
    this._positionZ = this.curvePosition.z;

    this.tangentVector = this.curve.getTangentAt(this.u);
    this._rotationY =
      Math.atan2(-this.tangentVector.z, this.tangentVector.x) -
      CurveAnimation.HALF_PI;

    this.u += this.uTickDelta;
    if (this.u > 1.0) {
      this.u = 1.0;
    }
  }

  public finished(): boolean {
    return this.isFinished;
  }

  public positionX(): number {
    return this._positionX;
  }

  public positionY(): number {
    return this._positionY;
  }

  public positionZ(): number {
    return this._positionZ;
  }

  public rotationX(): number {
    return this._rotationX;
  }

  public rotationY(): number {
    return this._rotationY;
  }
}

export { CurveAnimation, CurveAnimationInterface };

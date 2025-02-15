import { MotionGenerator } from './motion_generator';

interface AnimationInterface {
  finished: () => boolean;
  tick: () => void;
  positionX: () => number;
  positionY: () => number;
  positionZ: () => number;
  rotationX: () => number;
  rotationY: () => number;
}

class Animation implements AnimationInterface {
  private _positionX: number | undefined;
  private _positionY: number | undefined;
  private _positionZ: number | undefined;
  private _rotationX: number | undefined;
  private _rotationY: number | undefined;

  constructor(
    private readonly positionXMotionGenerator: MotionGenerator,
    private readonly positionYMotionGenerator: MotionGenerator,
    private readonly positionZMotionGenerator: MotionGenerator,
    private readonly rotationXMotionGenerator: MotionGenerator,
    private readonly rotationYMotionGenerator: MotionGenerator,
  ) {}

  public tick(): void {
    this._positionX = this.positionXMotionGenerator.next();
    this._positionY = this.positionYMotionGenerator.next();
    this._positionZ = this.positionZMotionGenerator.next();
    this._rotationX = this.rotationXMotionGenerator.next();
    this._rotationY = this.rotationYMotionGenerator.next();
  }

  public finished(): boolean {
    return (
      this.positionXMotionGenerator.finished() &&
      this.positionYMotionGenerator.finished() &&
      this.positionZMotionGenerator.finished() &&
      this.rotationXMotionGenerator.finished() &&
      this.rotationYMotionGenerator.finished()
    );
  }

  public positionX(): number {
    if (this._positionX === undefined) {
      throw new Error('Animation not started: positionX is undefined');
    }
    return this._positionX;
  }

  public positionY(): number {
    if (this._positionY === undefined) {
      throw new Error('Animation not started: positionY is undefined');
    }
    return this._positionY;
  }

  public positionZ(): number {
    if (this._positionZ === undefined) {
      throw new Error('Animation not started: positionZ is undefined');
    }
    return this._positionZ;
  }

  public rotationX(): number {
    if (this._rotationX === undefined) {
      throw new Error('Animation not started: rotationX is undefined');
    }
    return this._rotationX;
  }

  public rotationY(): number {
    if (this._rotationY === undefined) {
      throw new Error('Animation not started: rotationY is undefined');
    }
    return this._rotationY;
  }
}

export { Animation, AnimationInterface };

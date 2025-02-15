interface EasingInterface {
  next: () => number;
  finished: () => boolean;
}

type EasingFunction = (x: number) => number;

class BaseEasing implements EasingInterface {
  private frame = 0;
  private readonly deltaPerFrame: number;

  constructor(
    private readonly frameCount: number,
    private readonly easingFunc: EasingFunction,
    private readonly minX: number,
    private readonly maxX: number,
  ) {
    this.frameCount = frameCount === 0 ? 1 : frameCount;
    this.deltaPerFrame = (maxX - minX) / this.frameCount;
  }

  public finished(): boolean {
    return this.frame === this.frameCount;
  }

  public next(): number {
    if (this.frame < this.frameCount) {
      this.frame += 1;
    }

    return this.easingFunc(this.minX + this.frame * this.deltaPerFrame);
  }
}

class LinearEasing extends BaseEasing {
  constructor(frameCount: number) {
    super(frameCount, (x: number) => x, 0.0, 1.0);
  }
}

class SineEasing extends BaseEasing {
  constructor(frameCount: number, minX: number, maxX: number) {
    super(frameCount, Math.sin, minX, maxX);
  }
}

class CosineEasing extends BaseEasing {
  constructor(frameCount: number, minX: number, maxX: number) {
    super(frameCount, Math.cos, minX, maxX);
  }
}

class SmoothStepEasing extends BaseEasing {
  constructor(frameCount: number) {
    super(frameCount, (x: number) => x * x * (3 - 2 * x), 0.0, 1.0);
  }
}

class SteepEasing extends BaseEasing {
  constructor(frameCount: number, minX: number, maxX: number) {
    super(
      frameCount,
      (x: number) =>
        Math.pow(
          Math.min(Math.cos((Math.PI * x) / 2.0), 1.0 - Math.abs(x)),
          3.5,
        ),
      minX,
      maxX,
    );
  }
}

export {
  EasingInterface,
  LinearEasing,
  SineEasing,
  CosineEasing,
  SmoothStepEasing,
  SteepEasing,
};

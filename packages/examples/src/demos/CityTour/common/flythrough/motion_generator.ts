import { CityTourMath } from '../math';

import { EasingInterface } from './easing';

interface MotionGeneratorInterface {
  next: () => number;
  finished: () => boolean;
}

class MotionGenerator implements MotionGeneratorInterface {
  constructor(
    protected readonly start: number,
    protected readonly target: number,
    protected readonly easingFunction: EasingInterface,
  ) {}

  public next(): number {
    const percentage = this.easingFunction.next();
    return CityTourMath.lerp(this.start, this.target, percentage);
  }

  public finished(): boolean {
    return this.easingFunction.finished();
  }
}

class StaticMotionGenerator
  extends MotionGenerator
  implements MotionGeneratorInterface
{
  constructor(target: number) {
    super(target, target, {
      next: () => 1,
      finished: () => true,
    });
  }

  public finished(): boolean {
    return true;
  }

  public next(): number {
    return this.target;
  }
}

export { MotionGenerator, StaticMotionGenerator, MotionGeneratorInterface };

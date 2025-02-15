interface CityTourMathInterface {
  distanceBetweenPoints: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => number;
  distanceBetweenPoints3D: (
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
  ) => number;
  randomInRange: (min: number, max: number) => number;
  randomInteger: (min: number, max: number) => number;
  lerp: (min: number, max: number, percentage: number) => number;
  clamp: (value: number, min: number, max: number) => number;
}

class CityTourMathImpl implements CityTourMathInterface {
  public distanceBetweenPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    const xDistance = x2 - x1;
    const yDistance = y2 - y1;
    return Math.sqrt(xDistance * xDistance + yDistance * yDistance);
  }

  public distanceBetweenPoints3D(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
  ): number {
    const xDistance = x2 - x1;
    const yDistance = y2 - y1;
    const zDistance = z2 - z1;
    return Math.sqrt(
      xDistance * xDistance + yDistance * yDistance + zDistance * zDistance,
    );
  }

  public randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  // Adapted from https://github.com/mrdoob/three.js/blob/dev/src/math/MathUtils.js
  public randomInteger(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  // Linearly interpolate between min and max
  public lerp(min: number, max: number, percentage: number): number {
    return (1.0 - percentage) * min + percentage * max;
  }

  public clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

const CityTourMath: CityTourMathInterface = new CityTourMathImpl();

export { CityTourMath, CityTourMathInterface };

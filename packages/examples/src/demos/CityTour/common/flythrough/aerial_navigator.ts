import { CityTourMath } from '../math';
import { RoadNetwork } from '../road_network';

interface AerialNavigatorInterface {
  targetX: () => number;
  targetZ: () => number;
  nextTarget: () => void;
}

class AerialNavigator implements AerialNavigatorInterface {
  private static readonly MAX_ITERATIONS = 100;
  private static readonly X_AXIS = 1;
  private static readonly Z_AXIS = 2;

  private movementAxis:
    | typeof AerialNavigator.X_AXIS
    | typeof AerialNavigator.Z_AXIS;
  private _targetX: number;
  private _targetZ: number;

  constructor(
    private readonly roadNetwork: RoadNetwork,
    initialTargetX: number,
    initialTargetZ: number,
  ) {
    this.movementAxis = AerialNavigator.X_AXIS;
    this._targetX = initialTargetX;
    this._targetZ = initialTargetZ;
  }

  private searchForTargetOnAxis(): [number, number] | undefined {
    let iterationCount = 0;
    let newTargetX = this._targetX;
    let newTargetZ = this._targetZ;

    while (
      (this._targetX === newTargetX && this._targetZ === newTargetZ) ||
      !this.roadNetwork.hasIntersection(newTargetX, newTargetZ)
    ) {
      if (iterationCount >= AerialNavigator.MAX_ITERATIONS) {
        return undefined;
      }

      if (this.movementAxis === AerialNavigator.X_AXIS) {
        newTargetX = CityTourMath.randomInteger(
          this.roadNetwork.minBoundingX(),
          this.roadNetwork.maxBoundingX(),
        );
      } else if (this.movementAxis === AerialNavigator.Z_AXIS) {
        newTargetZ = CityTourMath.randomInteger(
          this.roadNetwork.minBoundingZ(),
          this.roadNetwork.maxBoundingZ(),
        );
      }

      iterationCount += 1;
    }

    return [newTargetX, newTargetZ];
  }

  public targetX(): number {
    return this._targetX;
  }

  public targetZ(): number {
    return this._targetZ;
  }

  public nextTarget(): void {
    let newTargetCoordinates = this.searchForTargetOnAxis();

    // If target on intended axis not found, check the other axis instead
    if (newTargetCoordinates === undefined) {
      this.movementAxis =
        this.movementAxis === AerialNavigator.X_AXIS
          ? AerialNavigator.Z_AXIS
          : AerialNavigator.X_AXIS;
      newTargetCoordinates = this.searchForTargetOnAxis();

      // If target can't be found on _either_ axis (implying road network is empty),
      // then set the target to the current position.
      if (newTargetCoordinates === undefined) {
        newTargetCoordinates = [this._targetX, this._targetZ];
      }
    }

    this._targetX = newTargetCoordinates[0];
    this._targetZ = newTargetCoordinates[1];
    this.movementAxis =
      this.movementAxis === AerialNavigator.X_AXIS
        ? AerialNavigator.Z_AXIS
        : AerialNavigator.X_AXIS;
  }
}

export { AerialNavigator, AerialNavigatorInterface };

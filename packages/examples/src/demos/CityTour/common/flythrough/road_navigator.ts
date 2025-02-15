import { CityTourMath } from '../math';
import { PathFinderInterface } from '../path_finder';
import { RoadNetwork } from '../road_network';

interface RoadNavigatorInterface {
  targetX: () => number;
  targetZ: () => number;
  nextTarget: () => void;
}

/*
   Generates target points for the camera to move to, simulating the camera
   driving on the road network.

   A target road intersection is chosen at random, and the injected path finder
   then finds a path to that intersection. A path is a sequence of intersections
   to travel to that will ultimately end up at the target intersection.
*/
class RoadNavigator implements RoadNavigatorInterface {
  private path: { x: number; z: number }[] = [];
  private currentTargetX: number;
  private currentTargetZ: number;

  constructor(
    private readonly roadNetwork: RoadNetwork,
    private readonly pathFinder: PathFinderInterface,
    initialTargetX: number,
    initialTargetZ: number,
  ) {
    this.currentTargetX = initialTargetX;
    this.currentTargetZ = initialTargetZ;
  }

  private chooseNewTarget(): [number, number] {
    let newTargetX: number;
    let newTargetZ: number;

    do {
      newTargetX = CityTourMath.randomInteger(
        this.roadNetwork.minBoundingX(),
        this.roadNetwork.maxBoundingX(),
      );
      newTargetZ = CityTourMath.randomInteger(
        this.roadNetwork.minBoundingZ(),
        this.roadNetwork.maxBoundingZ(),
      );
    } while (
      (this.currentTargetX === newTargetX &&
        this.currentTargetZ === newTargetZ) ||
      !this.roadNetwork.hasIntersection(newTargetX, newTargetZ)
    );

    return [newTargetX, newTargetZ];
  }

  public nextTarget(): void {
    if (this.path.length === 0) {
      const [newTargetX, newTargetZ] = this.chooseNewTarget();
      this.path =
        this.pathFinder.shortestPath(
          this.currentTargetX,
          this.currentTargetZ,
          newTargetX,
          newTargetZ,
        ) ?? [];
    }

    const nextTargetPoint = this.path.splice(0, 1)[0];
    this.currentTargetX = nextTargetPoint.x;
    this.currentTargetZ = nextTargetPoint.z;
  }

  public targetX(): number {
    return this.currentTargetX;
  }

  public targetZ(): number {
    return this.currentTargetZ;
  }
}

export { RoadNavigator, RoadNavigatorInterface };

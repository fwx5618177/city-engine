import { PathFinder } from '../path_finder';
import { RoadNetwork } from '../road_network';

import { Building, Buildings } from './buildings_generator';

export class RoadNetworkSimplifier {
  private static blockHasBottomTouchingBuilding(block: Building[]): boolean {
    for (const building of block) {
      if (building.dimensions.bottom === 1.0) {
        return true;
      }
    }
    return false;
  }

  private static blockHasTopTouchingBuilding(block: Building[]): boolean {
    for (const building of block) {
      if (building.dimensions.top === 0.0) {
        return true;
      }
    }
    return false;
  }

  private static blockHasLeftTouchingBuilding(block: Building[]): boolean {
    for (const building of block) {
      if (building.dimensions.left === 0.0) {
        return true;
      }
    }
    return false;
  }

  private static blockHasRightTouchingBuilding(block: Building[]): boolean {
    for (const building of block) {
      if (building.dimensions.right === 1.0) {
        return true;
      }
    }
    return false;
  }

  private static simplifyHelper(
    roadNetwork: RoadNetwork,
    buildings: Buildings,
  ): number {
    const pathFinder = new PathFinder(roadNetwork);

    const roadNetworkMinColumn = roadNetwork.minBoundingX();
    const roadNetworkMaxColumn = roadNetwork.maxBoundingX();
    const roadNetworkMinRow = roadNetwork.minBoundingZ();
    const roadNetworkMaxRow = roadNetwork.maxBoundingZ();

    let edgesRemovedCount = 0;

    // Road to the east
    for (let x = roadNetworkMinColumn; x < roadNetworkMaxColumn; x++) {
      for (let z = roadNetworkMinRow; z < roadNetworkMaxRow; z++) {
        const targetX = x + 1;
        const targetZ = z;

        const edge = roadNetwork.edgeBetween(x, z, targetX, targetZ);
        if (
          roadNetwork.hasEdgeBetween(x, z, targetX, targetZ) &&
          edge?.gradeType === RoadNetwork.SURFACE_GRADE
        ) {
          const southEastBlock = buildings.blockAtCoordinates(x, z) ?? [];
          const northEastBlock = buildings.blockAtCoordinates(x, z - 1) ?? [];

          const southEastBlockHasBuildings =
            this.blockHasTopTouchingBuilding(southEastBlock);
          const northEastBlockHasBuildings =
            this.blockHasBottomTouchingBuilding(northEastBlock);

          if (
            southEastBlockHasBuildings === false &&
            northEastBlockHasBuildings === false
          ) {
            roadNetwork.removeEdge(x, z, targetX, targetZ);
            edgesRemovedCount += 1;

            // If removing the edge results in a portion of the road network being cut off from the rest of the network,
            // re-add the edge to prevent this.
            if (
              roadNetwork.hasIntersection(x, z) &&
              roadNetwork.hasIntersection(targetX, targetZ) &&
              pathFinder.shortestPath(x, z, targetX, targetZ) === undefined
            ) {
              roadNetwork.addEdge(
                x,
                z,
                targetX,
                targetZ,
                0.0,
                1.0,
                RoadNetwork.SURFACE_GRADE,
              );
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    // Road to the west
    for (let x = roadNetworkMaxColumn; x > roadNetworkMinColumn; x--) {
      for (let z = roadNetworkMinRow; z < roadNetworkMaxRow; z++) {
        const targetX = x - 1;
        const targetZ = z;

        const edge = roadNetwork.edgeBetween(x, z, targetX, targetZ);
        if (
          roadNetwork.hasEdgeBetween(x, z, targetX, targetZ) &&
          edge?.gradeType === RoadNetwork.SURFACE_GRADE
        ) {
          const southWestBlock = buildings.blockAtCoordinates(x - 1, z) ?? [];
          const northWestBlock =
            buildings.blockAtCoordinates(x - 1, z - 1) ?? [];

          const southWestBlockHasBuildings =
            this.blockHasTopTouchingBuilding(southWestBlock);
          const northWestBlockHasBuildings =
            this.blockHasBottomTouchingBuilding(northWestBlock);

          if (!southWestBlockHasBuildings && !northWestBlockHasBuildings) {
            roadNetwork.removeEdge(x, z, targetX, targetZ);
            edgesRemovedCount += 1;

            if (
              roadNetwork.hasIntersection(x, z) &&
              roadNetwork.hasIntersection(targetX, targetZ) &&
              pathFinder.shortestPath(x, z, targetX, targetZ) === undefined
            ) {
              roadNetwork.addEdge(
                x,
                z,
                targetX,
                targetZ,
                0.0,
                1.0,
                RoadNetwork.SURFACE_GRADE,
              );
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    // Road to the south
    for (let x = roadNetworkMinColumn; x < roadNetworkMaxColumn; x++) {
      for (let z = roadNetworkMinRow; z < roadNetworkMaxRow; z++) {
        const targetX = x;
        const targetZ = z + 1;

        if (
          roadNetwork.hasEdgeBetween(x, z, targetX, targetZ) &&
          roadNetwork.edgeBetween(x, z, targetX, targetZ)?.gradeType ===
            RoadNetwork.SURFACE_GRADE
        ) {
          const southWestBlock = buildings.blockAtCoordinates(x - 1, z);
          const southEastBlock = buildings.blockAtCoordinates(x, z);

          const southWestBlockHasBuildings =
            this.blockHasRightTouchingBuilding(southWestBlock);
          const southEastBlockHasBuildings =
            this.blockHasLeftTouchingBuilding(southEastBlock);

          if (!southWestBlockHasBuildings && !southEastBlockHasBuildings) {
            roadNetwork.removeEdge(x, z, targetX, targetZ);
            edgesRemovedCount += 1;

            if (
              roadNetwork.hasIntersection(x, z) &&
              roadNetwork.hasIntersection(targetX, targetZ) &&
              pathFinder.shortestPath(x, z, targetX, targetZ) === undefined
            ) {
              roadNetwork.addEdge(
                x,
                z,
                targetX,
                targetZ,
                0.0,
                1.0,
                RoadNetwork.SURFACE_GRADE,
              );
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    // Road to the north
    for (let x = roadNetworkMinColumn; x < roadNetworkMaxColumn; x++) {
      for (let z = roadNetworkMaxRow; z > roadNetworkMinRow; z--) {
        const targetX = x;
        const targetZ = z - 1;

        if (
          roadNetwork.hasEdgeBetween(x, z, targetX, targetZ) &&
          roadNetwork.hasEdgeBetween(x, z, targetX, targetZ) &&
          roadNetwork.edgeBetween(x, z, targetX, targetZ)?.gradeType ===
            RoadNetwork.SURFACE_GRADE
        ) {
          const northWestBlock = buildings.blockAtCoordinates(x - 1, z - 1);
          const northEastBlock = buildings.blockAtCoordinates(x, z - 1);

          const northWestBlockHasBuildings =
            this.blockHasRightTouchingBuilding(northWestBlock);
          const northEastBlockHasBuildings =
            this.blockHasLeftTouchingBuilding(northEastBlock);

          if (!northWestBlockHasBuildings && !northEastBlockHasBuildings) {
            roadNetwork.removeEdge(x, z, targetX, targetZ);
            edgesRemovedCount += 1;

            if (
              roadNetwork.hasIntersection(x, z) &&
              roadNetwork.hasIntersection(targetX, targetZ) &&
              pathFinder.shortestPath(x, z, targetX, targetZ) === undefined
            ) {
              roadNetwork.addEdge(
                x,
                z,
                targetX,
                targetZ,
                0.0,
                1.0,
                RoadNetwork.SURFACE_GRADE,
              );
              edgesRemovedCount -= 1;
            }
          }
        }
      }
    }

    return edgesRemovedCount;
  }

  public static simplify(
    roadNetwork: RoadNetwork,
    buildings: Buildings,
  ): number {
    return this.simplifyHelper(roadNetwork, buildings);
  }
}

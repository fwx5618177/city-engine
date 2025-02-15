import { Config } from '../config';
import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

interface NeighborhoodConfig {
  neighborhoods: {
    columnCount: number;
    rowCount: number;
  };
  safeFromDecayBlocks: number;
  maxRoadAngle: number;
}

class CircleGrowthRoadGenerator {
  public static addNeighborhoodRoads(
    terrain: Terrain,
    roadNetwork: RoadNetwork,
    neighborhoodCenterX: number,
    neighborhoodCenterZ: number,
    config: NeighborhoodConfig,
  ): void {
    const MIN_X = Math.max(
      0,
      -(config.neighborhoods.columnCount / 2) + neighborhoodCenterX,
    );
    const MAX_X = Math.min(
      terrain.maxX(),
      config.neighborhoods.columnCount / 2 + neighborhoodCenterX,
    );
    const MIN_Z = Math.max(
      0,
      -(config.neighborhoods.rowCount / 2) + neighborhoodCenterZ,
    );
    const MAX_Z = Math.min(
      terrain.maxZ(),
      config.neighborhoods.rowCount / 2 + neighborhoodCenterZ,
    );

    const DISTANCE_TO_NEIGHBORHOOD_BOUNDARY = Math.min(
      config.neighborhoods.columnCount / 2,
      config.neighborhoods.rowCount / 2,
    );
    const SAFE_FROM_DECAY_DISTANCE = config.safeFromDecayBlocks;

    const probabilityOfBranching = (
      x1: number,
      z1: number,
      x2: number,
      z2: number,
    ): number => {
      // Guarantee roads along x and z axes
      if (
        x1 === neighborhoodCenterX &&
        x2 === neighborhoodCenterX &&
        z2 >= MIN_Z &&
        z2 <= MAX_Z
      ) {
        return 1.0;
      } else if (
        z1 === neighborhoodCenterZ &&
        z2 === neighborhoodCenterZ &&
        x2 >= MIN_X &&
        x2 <= MAX_X
      ) {
        return 1.0;
      }

      const distanceFromCenter = Math.sqrt(
        Math.pow(x1 - neighborhoodCenterX, 2) +
          Math.pow(z1 - neighborhoodCenterZ, 2),
      );

      if (distanceFromCenter <= SAFE_FROM_DECAY_DISTANCE) {
        return 1.0;
      }

      const normalizedPercentageFromCenter =
        (distanceFromCenter - SAFE_FROM_DECAY_DISTANCE) /
        (DISTANCE_TO_NEIGHBORHOOD_BOUNDARY - SAFE_FROM_DECAY_DISTANCE);
      return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
    };

    const isTerrainTooSteep = (
      x: number,
      z: number,
      targetX: number,
      targetZ: number,
    ): boolean => {
      const heightAtPoint1 = terrain.heightAt(x, z) ?? 0;
      const heightAtPoint2 = terrain.heightAt(targetX, targetZ) ?? 0;
      const angle = Math.atan2(
        heightAtPoint1 - heightAtPoint2,
        Config.BLOCK_DEPTH,
      );

      return Math.abs(angle) > config.maxRoadAngle;
    };

    const shouldConnectIntersections = (
      x1: number,
      z1: number,
      x2: number,
      z2: number,
    ): boolean => {
      const edgeIsOnLand =
        (terrain.waterHeightAt(x1, z1) ?? 0) === 0.0 &&
        (terrain.waterHeightAt(x2, z2) ?? 0) === 0.0;

      return (
        edgeIsOnLand &&
        Math.random() < probabilityOfBranching(x1, z1, x2, z2) &&
        !isTerrainTooSteep(x1, z1, x2, z2)
      );
    };

    const connectIntersections = (
      x: number,
      z: number,
      targetX: number,
      targetZ: number,
    ): void => {
      if (
        targetX < MIN_X ||
        targetX > MAX_X ||
        targetZ < MIN_Z ||
        targetZ > MAX_Z
      ) {
        return;
      }

      if (shouldConnectIntersections(x, z, targetX, targetZ)) {
        const targetIntersectionExists = roadNetwork.hasIntersection(
          targetX,
          targetZ,
        );

        roadNetwork.addEdge(
          x,
          z,
          targetX,
          targetZ,
          0.0,
          1.0,
          RoadNetwork.SURFACE_GRADE,
        );
        if (!targetIntersectionExists) {
          branchFromIntersection(targetX, targetZ);
        }
      }
    };

    const branchFromIntersection = (x: number, z: number): void => {
      connectIntersections(x, z, x - 1, z);
      connectIntersections(x, z, x, z - 1);
      connectIntersections(x, z, x + 1, z);
      connectIntersections(x, z, x, z + 1);
    };

    branchFromIntersection(neighborhoodCenterX, neighborhoodCenterZ);
  }
}

export { CircleGrowthRoadGenerator, NeighborhoodConfig };

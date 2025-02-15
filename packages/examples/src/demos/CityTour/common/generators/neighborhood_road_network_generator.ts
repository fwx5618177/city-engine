import { CityTourMath } from '../math';
import { PathFinder } from '../path_finder';
import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';
import { TerrainCandidateRoadNetwork } from '../terrain_candidate_road_network';

import { BridgeGenerator } from './bridge_generator';
import { CircleGrowthRoadGenerator } from './circle_growth_road_generator';
import { Neighborhood } from './neighborhood_generator';

interface NeighborhoodRoadConfig {
  maxRoadAngle: number;
  neighborhoods: {
    columnCount: number;
    rowCount: number;
  };
  safeFromDecayBlocks: number;
}

class NeighborhoodRoadNetworkGenerator {
  private static buildRoadBetweenNeighborhoods(
    terrain: Terrain,
    roadNetwork: RoadNetwork,
    startX: number,
    startZ: number,
    path: { x: number; z: number }[],
  ): void {
    let previousIntersectionX = startX;
    let previousIntersectionZ = startZ;

    for (const point of path) {
      const nextIntersectionX = point.x;
      const nextIntersectionZ = point.z;

      // Assumption is that a distance larger than 1 means a bridge, since normal on-surface road paths will involve steps between adjacent
      // coordinates with length 1.
      const isBridge =
        CityTourMath.distanceBetweenPoints(
          previousIntersectionX,
          previousIntersectionZ,
          nextIntersectionX,
          nextIntersectionZ,
        ) > 1.0;

      if (isBridge) {
        const bridgeAttributes = BridgeGenerator.buildBridge(
          terrain,
          roadNetwork,
          previousIntersectionX,
          previousIntersectionZ,
          Math.sign(nextIntersectionX - previousIntersectionX),
          Math.sign(nextIntersectionZ - previousIntersectionZ),
        );

        if (bridgeAttributes !== undefined) {
          let bridgeIntersectionX = previousIntersectionX;
          let bridgeIntersectionZ = previousIntersectionZ;

          while (
            bridgeIntersectionX !== bridgeAttributes.endX ||
            bridgeIntersectionZ !== bridgeAttributes.endZ
          ) {
            roadNetwork.addEdge(
              bridgeIntersectionX,
              bridgeIntersectionZ,
              bridgeIntersectionX + bridgeAttributes.xDelta,
              bridgeIntersectionZ + bridgeAttributes.zDelta,
              bridgeAttributes.roadDeckHeight,
              1.0,
              RoadNetwork.BRIDGE_GRADE,
            );
            bridgeIntersectionX += bridgeAttributes.xDelta;
            bridgeIntersectionZ += bridgeAttributes.zDelta;
          }
        }
      } else {
        roadNetwork.addEdge(
          previousIntersectionX,
          previousIntersectionZ,
          nextIntersectionX,
          nextIntersectionZ,
          0.0,
          1.0,
          RoadNetwork.SURFACE_GRADE,
        );
      }

      previousIntersectionX = nextIntersectionX;
      previousIntersectionZ = nextIntersectionZ;
    }
  }

  public static generate(
    terrain: Terrain,
    neighborhoods: Neighborhood[],
    config: NeighborhoodRoadConfig,
  ): RoadNetwork {
    const roadNetwork = new RoadNetwork(terrain);
    const terrainCandidateRoadNetwork = new TerrainCandidateRoadNetwork(
      terrain,
      roadNetwork,
      config.maxRoadAngle,
    );
    const pathFinder = new PathFinder(
      terrainCandidateRoadNetwork as unknown as RoadNetwork,
    );

    const targetPredicate = (x: number, z: number): boolean =>
      roadNetwork.hasIntersection(x, z);

    CircleGrowthRoadGenerator.addNeighborhoodRoads(
      terrain,
      roadNetwork,
      neighborhoods[0].centerX,
      neighborhoods[0].centerZ,
      config,
    );

    for (let i = 1; i < neighborhoods.length; i++) {
      const shortestPathToRestOfCity = pathFinder.shortestPath(
        neighborhoods[i].centerX,
        neighborhoods[i].centerZ,
        neighborhoods[0].centerX,
        neighborhoods[0].centerZ,
        targetPredicate,
      );

      if (shortestPathToRestOfCity !== undefined) {
        NeighborhoodRoadNetworkGenerator.buildRoadBetweenNeighborhoods(
          terrain,
          roadNetwork,
          neighborhoods[i].centerX,
          neighborhoods[i].centerZ,
          shortestPathToRestOfCity,
        );

        CircleGrowthRoadGenerator.addNeighborhoodRoads(
          terrain,
          roadNetwork,
          neighborhoods[i].centerX,
          neighborhoods[i].centerZ,
          config,
        );
      }
    }

    return roadNetwork;
  }
}

export { NeighborhoodRoadNetworkGenerator, NeighborhoodRoadConfig };

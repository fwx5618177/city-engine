import { CityTourMath } from '../math';
import { Terrain } from '../terrain';

interface NeighborhoodCenter {
  x: number;
  z: number;
}

interface Neighborhood {
  centerX: number;
  centerZ: number;
}

interface ScoreComponents {
  flatness: number;
  centrality: number;
  closeNeighborhoodPenalty: number;
}

class NeighborhoodGenerator {
  private static readonly MIN_DISTANCE_BETWEEN_NEIGHBORHOODS = 10;

  // The size of the square that is used to calculate the terrain flatness
  // around a given point. Each value should be an odd number.
  private static readonly NEIGHBORHOOD_CENTER_WIDTH = 9;
  private static readonly NEIGHBORHOOD_CENTER_DEPTH = 9;
  private static readonly FLATNESS_WINDOW_WIDTH_MARGIN =
    (NeighborhoodGenerator.NEIGHBORHOOD_CENTER_WIDTH - 1) / 2;
  private static readonly FLATNESS_WINDOW_DEPTH_MARGIN =
    (NeighborhoodGenerator.NEIGHBORHOOD_CENTER_DEPTH - 1) / 2;
  private static readonly CENTRALITY_WEIGHT = 0.3;
  private static readonly FLATNESS_WEIGHT = 0.7;

  private static calculateScores(terrain: Terrain): ScoreComponents[][] {
    const scores: ScoreComponents[][] = [];

    const minX =
      terrain.minX() + NeighborhoodGenerator.FLATNESS_WINDOW_WIDTH_MARGIN;
    const maxX =
      terrain.maxX() - NeighborhoodGenerator.FLATNESS_WINDOW_WIDTH_MARGIN;
    const minZ =
      terrain.minZ() + NeighborhoodGenerator.FLATNESS_WINDOW_DEPTH_MARGIN;
    const maxZ =
      terrain.maxZ() - NeighborhoodGenerator.FLATNESS_WINDOW_DEPTH_MARGIN;

    // Manhattan distance from the center. Assumption is terrain has
    // center point of {0,0}, and roads only run fully north/south or
    // west/east.
    const maxNeighborhoodDistanceFromCenter = maxX + maxZ;

    for (let x = minX; x <= maxX; x++) {
      scores[x] = [];

      for (let z = minZ; z <= maxZ; z++) {
        const score: ScoreComponents = {
          flatness: Number.POSITIVE_INFINITY,
          centrality:
            ((Math.abs(x) + Math.abs(z)) / maxNeighborhoodDistanceFromCenter) *
            NeighborhoodGenerator.CENTRALITY_WEIGHT,
          closeNeighborhoodPenalty: 0,
        };

        if ((terrain.waterHeightAt(x, z) ?? 0) === 0.0) {
          const averageHeightDistance =
            NeighborhoodGenerator.averageHeightDifferenceAroundPoint(
              terrain,
              x,
              z,
            );

          if (averageHeightDistance === Number.POSITIVE_INFINITY) {
            score.flatness = Number.POSITIVE_INFINITY;
          } else {
            score.flatness =
              CityTourMath.clamp(averageHeightDistance, 0.0, 1.0) *
              NeighborhoodGenerator.FLATNESS_WEIGHT;
          }
        }

        scores[x][z] = score;
      }
    }

    return scores;
  }

  private static averageHeightDifferenceAroundPoint(
    terrain: Terrain,
    centerX: number,
    centerZ: number,
  ): number {
    const centerHeight = terrain.landHeightAt(centerX, centerZ) ?? 0;
    let landPointCount = 0;
    let waterPointCount = 0;
    let totalHeightDeltas = 0.0;

    const minX = Math.max(
      terrain.minX(),
      centerX - NeighborhoodGenerator.FLATNESS_WINDOW_WIDTH_MARGIN,
    );
    const maxX = Math.min(
      terrain.maxX(),
      centerX + NeighborhoodGenerator.FLATNESS_WINDOW_WIDTH_MARGIN,
    );
    const minZ = Math.max(
      terrain.minZ(),
      centerZ - NeighborhoodGenerator.FLATNESS_WINDOW_DEPTH_MARGIN,
    );
    const maxZ = Math.min(
      terrain.maxZ(),
      centerZ + NeighborhoodGenerator.FLATNESS_WINDOW_DEPTH_MARGIN,
    );

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        if ((terrain.waterHeightAt(x, z) ?? 0) > 0.0) {
          waterPointCount += 1;
        } else {
          totalHeightDeltas += Math.abs(
            centerHeight - (terrain.landHeightAt(x, z) ?? 0),
          );
          landPointCount += 1;
        }
      }
    }

    return waterPointCount >= landPointCount
      ? Number.POSITIVE_INFINITY
      : totalHeightDeltas / landPointCount;
  }

  private static setCloseNeighborhoodPenalties(
    neighborhoodCenterX: number,
    neighborhoodCenterZ: number,
    terrain: Terrain,
    scores: ScoreComponents[][],
  ): void {
    const minX = Math.max(
      terrain.minX() + NeighborhoodGenerator.FLATNESS_WINDOW_WIDTH_MARGIN,
      neighborhoodCenterX -
        NeighborhoodGenerator.MIN_DISTANCE_BETWEEN_NEIGHBORHOODS,
    );
    const maxX = Math.min(
      terrain.maxX() - NeighborhoodGenerator.FLATNESS_WINDOW_WIDTH_MARGIN,
      neighborhoodCenterX +
        NeighborhoodGenerator.MIN_DISTANCE_BETWEEN_NEIGHBORHOODS,
    );
    const minZ = Math.max(
      terrain.minZ() + NeighborhoodGenerator.FLATNESS_WINDOW_DEPTH_MARGIN,
      neighborhoodCenterZ -
        NeighborhoodGenerator.MIN_DISTANCE_BETWEEN_NEIGHBORHOODS,
    );
    const maxZ = Math.min(
      terrain.maxZ() - NeighborhoodGenerator.FLATNESS_WINDOW_DEPTH_MARGIN,
      neighborhoodCenterZ +
        NeighborhoodGenerator.MIN_DISTANCE_BETWEEN_NEIGHBORHOODS,
    );

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        const distanceToNeighborhoodCenter = CityTourMath.distanceBetweenPoints(
          x,
          z,
          neighborhoodCenterX,
          neighborhoodCenterZ,
        );
        if (
          distanceToNeighborhoodCenter <
          NeighborhoodGenerator.MIN_DISTANCE_BETWEEN_NEIGHBORHOODS
        ) {
          scores[x][z].closeNeighborhoodPenalty = Number.POSITIVE_INFINITY;
        }
      }
    }
  }

  private static bestNeighborhoodSite(
    terrain: Terrain,
    scores: ScoreComponents[][],
  ): NeighborhoodCenter | undefined {
    let bestSiteScore = Number.POSITIVE_INFINITY;
    let bestX: number | undefined;
    let bestZ: number | undefined;

    const minX =
      terrain.minX() + NeighborhoodGenerator.FLATNESS_WINDOW_WIDTH_MARGIN;
    const maxX =
      terrain.maxX() - NeighborhoodGenerator.FLATNESS_WINDOW_WIDTH_MARGIN;
    const minZ =
      terrain.minZ() + NeighborhoodGenerator.FLATNESS_WINDOW_DEPTH_MARGIN;
    const maxZ =
      terrain.maxZ() - NeighborhoodGenerator.FLATNESS_WINDOW_DEPTH_MARGIN;

    for (let x = minX; x < maxX; x++) {
      for (let z = minZ; z < maxZ; z++) {
        const scoreComponents = scores[x][z];
        const score =
          scoreComponents.centrality +
          scoreComponents.flatness +
          scoreComponents.closeNeighborhoodPenalty;

        if (score < bestSiteScore) {
          bestSiteScore = score;
          bestX = x;
          bestZ = z;
        }
      }
    }

    if (bestX === undefined || bestZ === undefined) {
      return undefined;
    }

    return { x: bestX, z: bestZ };
  }

  public static generate(terrain: Terrain, count: number): Neighborhood[] {
    const scores = NeighborhoodGenerator.calculateScores(terrain);
    const neighborhoods: Neighborhood[] = [];

    for (let i = 0; i < count; i++) {
      const neighborhoodCenter = NeighborhoodGenerator.bestNeighborhoodSite(
        terrain,
        scores,
      );
      if (neighborhoodCenter === undefined) {
        return neighborhoods;
      }

      neighborhoods.push({
        centerX: neighborhoodCenter.x,
        centerZ: neighborhoodCenter.z,
      });

      NeighborhoodGenerator.setCloseNeighborhoodPenalties(
        neighborhoodCenter.x,
        neighborhoodCenter.z,
        terrain,
        scores,
      );
    }

    return neighborhoods;
  }
}

export { NeighborhoodGenerator, Neighborhood, NeighborhoodCenter };

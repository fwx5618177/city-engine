import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

import { Neighborhood } from './neighborhood_generator';

interface BlockLayout {
  maxBlockSteepness: number;
  lots: Lot[];
}

interface Lot {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  depth: number;
  midpointX: number;
  midpointZ: number;
  maxStories: number;
}

interface TerrainAttributes {
  minimumHeight: number;
  maximumHeight: number;
  steepness: number;
}

interface ZonedBlockConfig {
  blockDistanceDecayBegins: number;
  maxBuildingStories: number;
}

interface ZonedBlock {
  x: number;
  z: number;
  probabilityOfBuilding: number;
  maxStories: number;
  minimumHeight: number;
  hasTopRoad: boolean;
  hasRightRoad: boolean;
  hasBottomRoad: boolean;
  hasLeftRoad: boolean;
  layout: {
    lots: Lot[];
  };
}

interface ZonedBlocks {
  blocks: ZonedBlock[];
  boundingBox: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

export class ZonedBlockGenerator {
  private static readonly HALF_BLOCK_COLUMNS = 32;
  private static readonly HALF_BLOCK_ROWS = 32;

  private static readonly BLOCK_LAYOUTS: BlockLayout[] = [
    {
      maxBlockSteepness: 0.083333333333333,
      lots: [
        {
          left: 0.0,
          right: 1.0,
          top: 0.0,
          bottom: 1.0,
          width: 1.0,
          depth: 1.0,
          midpointX: 0.5,
          midpointZ: 0.5,
          maxStories: Number.POSITIVE_INFINITY,
        },
      ],
    },
    {
      maxBlockSteepness: 0.083333333333333,
      lots: [
        {
          left: 0.0,
          right: 0.5,
          top: 0.0,
          bottom: 1.0,
          width: 0.5,
          depth: 1.0,
          midpointX: 0.25,
          midpointZ: 0.5,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 0.5,
          right: 1.0,
          top: 0.0,
          bottom: 1.0,
          width: 0.5,
          depth: 1.0,
          midpointX: 0.75,
          midpointZ: 0.5,
          maxStories: Number.POSITIVE_INFINITY,
        },
      ],
    },
    {
      maxBlockSteepness: 0.083333333333333,
      lots: [
        {
          left: 0.0,
          right: 1.0,
          top: 0.0,
          bottom: 0.5,
          width: 1.0,
          depth: 0.5,
          midpointX: 0.5,
          midpointZ: 0.25,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 0.0,
          right: 1.0,
          top: 0.5,
          bottom: 1.0,
          width: 1.0,
          depth: 0.5,
          midpointX: 0.5,
          midpointZ: 0.75,
          maxStories: Number.POSITIVE_INFINITY,
        },
      ],
    },
    {
      maxBlockSteepness: 0.083333333333333,
      lots: [
        {
          left: 0.0,
          right: 0.5,
          top: 0.0,
          bottom: 1.0,
          width: 0.5,
          depth: 1.0,
          midpointX: 0.25,
          midpointZ: 0.5,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 0.5,
          right: 1.0,
          top: 0.0,
          bottom: 0.5,
          width: 0.5,
          depth: 0.5,
          midpointX: 0.75,
          midpointZ: 0.25,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 0.5,
          right: 1.0,
          top: 0.5,
          bottom: 1.0,
          width: 0.5,
          depth: 0.5,
          midpointX: 0.75,
          midpointZ: 0.75,
          maxStories: Number.POSITIVE_INFINITY,
        },
      ],
    },
    {
      maxBlockSteepness: 0.083333333333333,
      lots: [
        {
          left: 0.0,
          right: 0.5,
          top: 0.0,
          bottom: 0.5,
          width: 0.5,
          depth: 0.5,
          midpointX: 0.25,
          midpointZ: 0.25,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 0.5,
          right: 1.0,
          top: 0.0,
          bottom: 0.5,
          width: 0.5,
          depth: 0.5,
          midpointX: 0.75,
          midpointZ: 0.25,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 0.0,
          right: 0.5,
          top: 0.5,
          bottom: 1.0,
          width: 0.5,
          depth: 0.5,
          midpointX: 0.25,
          midpointZ: 0.75,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 0.5,
          right: 1.0,
          top: 0.5,
          bottom: 1.0,
          width: 0.5,
          depth: 0.5,
          midpointX: 0.75,
          midpointZ: 0.75,
          maxStories: Number.POSITIVE_INFINITY,
        },
      ],
    },
    {
      maxBlockSteepness: 0.5,
      lots: [
        {
          left: 0.0,
          right: 1 / 3,
          top: 0.0,
          bottom: 0.5,
          width: 1 / 3,
          depth: 0.5,
          midpointX: 1 / 6,
          midpointZ: 0.25,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 1 / 3,
          right: 2 / 3,
          top: 0.0,
          bottom: 0.5,
          width: 1 / 3,
          depth: 0.5,
          midpointX: 0.5,
          midpointZ: 0.25,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 2 / 3,
          right: 1.0,
          top: 0.0,
          bottom: 0.5,
          width: 1 / 3,
          depth: 0.5,
          midpointX: 5 / 6,
          midpointZ: 0.25,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 0.0,
          right: 0.5,
          top: 0.5,
          bottom: 1.0,
          width: 0.5,
          depth: 0.5,
          midpointX: 0.25,
          midpointZ: 0.75,
          maxStories: Number.POSITIVE_INFINITY,
        },
        {
          left: 0.5,
          right: 1.0,
          top: 0.5,
          bottom: 1.0,
          width: 0.5,
          depth: 0.5,
          midpointX: 0.75,
          midpointZ: 0.75,
          maxStories: Number.POSITIVE_INFINITY,
        },
      ],
    },
    {
      maxBlockSteepness: Number.POSITIVE_INFINITY,
      lots: [
        {
          left: 0.0,
          right: 0.25,
          top: 0.0,
          bottom: 1 / 3,
          width: 0.25,
          depth: 1 / 3,
          midpointX: 0.125,
          midpointZ: 1 / 6,
          maxStories: 4,
        },
        {
          left: 0.75,
          right: 1.0,
          top: 0.0,
          bottom: 1 / 3,
          width: 0.25,
          depth: 1 / 3,
          midpointX: 0.875,
          midpointZ: 1 / 6,
          maxStories: 4,
        },
        {
          left: 0.0,
          right: 0.25,
          top: 2 / 3,
          bottom: 1.0,
          width: 0.25,
          depth: 1 / 3,
          midpointX: 0.125,
          midpointZ: 5 / 6,
          maxStories: 4,
        },
        {
          left: 0.75,
          right: 1.0,
          top: 2 / 3,
          bottom: 1.0,
          width: 0.25,
          depth: 1 / 3,
          midpointX: 0.875,
          midpointZ: 5 / 6,
          maxStories: 4,
        },
        {
          left: 0.0,
          right: 0.25,
          top: 1 / 3,
          bottom: 0.5,
          width: 0.25,
          depth: 1 / 6,
          midpointX: 0.125,
          midpointZ: 5 / 12,
          maxStories: 4,
        },
        {
          left: 0.0,
          right: 0.25,
          top: 0.5,
          bottom: 2 / 3,
          width: 0.25,
          depth: 1 / 6,
          midpointX: 0.125,
          midpointZ: 7 / 12,
          maxStories: 4,
        },
        {
          left: 0.75,
          right: 1.0,
          top: 1 / 3,
          bottom: 0.5,
          width: 0.25,
          depth: 1 / 6,
          midpointX: 0.875,
          midpointZ: 5 / 12,
          maxStories: 4,
        },
        {
          left: 0.75,
          right: 1.0,
          top: 0.5,
          bottom: 2 / 3,
          width: 0.25,
          depth: 1 / 6,
          midpointX: 0.875,
          midpointZ: 7 / 12,
          maxStories: 4,
        },
        {
          left: 0.25,
          right: 0.4167,
          top: 0.0,
          bottom: 0.5,
          width: 0.1667,
          depth: 0.5,
          midpointX: 0.33335,
          midpointZ: 0.25,
          maxStories: 4,
        },
        {
          left: 0.4167,
          right: 0.5834,
          top: 0.0,
          bottom: 0.5,
          width: 0.1667,
          depth: 0.5,
          midpointX: 0.50005,
          midpointZ: 0.25,
          maxStories: 4,
        },
        {
          left: 0.5834,
          right: 0.75,
          top: 0.0,
          bottom: 0.5,
          width: 0.1666,
          depth: 0.5,
          midpointX: 0.6667,
          midpointZ: 0.25,
          maxStories: 4,
        },
        {
          left: 0.25,
          right: 0.4167,
          top: 0.5,
          bottom: 1.0,
          width: 0.1667,
          depth: 0.5,
          midpointX: 0.33335,
          midpointZ: 0.75,
          maxStories: 4,
        },
        {
          left: 0.4167,
          right: 0.5834,
          top: 0.5,
          bottom: 1.0,
          width: 0.1667,
          depth: 0.5,
          midpointX: 0.50005,
          midpointZ: 0.75,
          maxStories: 4,
        },
        {
          left: 0.5834,
          right: 0.75,
          top: 0.5,
          bottom: 1.0,
          width: 0.1666,
          depth: 0.5,
          midpointX: 0.6667,
          midpointZ: 0.75,
          maxStories: 4,
        },
      ],
    },
  ];

  static {
    this.BLOCK_LAYOUTS.forEach((blockLayout) => {
      blockLayout.lots.forEach((lot) => {
        lot.width = lot.right - lot.left;
        lot.depth = lot.bottom - lot.top;
        lot.midpointX = lot.left + lot.width / 2;
        lot.midpointZ = lot.top + lot.depth / 2;

        if (lot.width < 0.25 || lot.depth < 0.25) {
          lot.maxStories = 4;
        } else if (lot.width < 0.5 || lot.depth < 0.5) {
          lot.maxStories = 10;
        } else {
          lot.maxStories = Number.POSITIVE_INFINITY;
        }
      });
    });
  }

  private static calculateBlockProbabilityOfBuilding(
    x: number,
    z: number,
    distanceToClosestNeighborhoodCenter: number,
    blockDistanceDecayBegins: number,
  ): number {
    if (distanceToClosestNeighborhoodCenter <= blockDistanceDecayBegins) {
      return 1.0;
    }

    const normalizedPercentageFromCenter =
      (distanceToClosestNeighborhoodCenter - blockDistanceDecayBegins) /
      (this.HALF_BLOCK_COLUMNS - blockDistanceDecayBegins);

    return (Math.pow(0.5, normalizedPercentageFromCenter) - 0.5) * 2;
  }

  private static calculateMaxStoriesForBlock(
    x: number,
    z: number,
    centerX: number,
    centerZ: number,
    maxBuildingStories: number,
  ): number {
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - centerX, 2) + Math.pow(z - centerZ, 2),
    );
    const normalizedPercentageFromCenter =
      distanceFromCenter / this.HALF_BLOCK_COLUMNS;

    return Math.round(
      maxBuildingStories * (1 - Math.pow(normalizedPercentageFromCenter, 2)),
    );
  }

  private static blockTerrainAttributes(
    terrain: Terrain,
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): TerrainAttributes {
    const topLeftHeight = terrain.heightAt(left, top) ?? 0;
    const topRightHeight = terrain.heightAt(right, top) ?? 0;
    const bottomLeftHeight = terrain.heightAt(left, bottom) ?? 0;
    const bottomRightHeight = terrain.heightAt(right, bottom) ?? 0;

    const minimumHeight = Math.min(
      topLeftHeight,
      topRightHeight,
      bottomLeftHeight,
      bottomRightHeight,
    );
    const maximumHeight = Math.max(
      topLeftHeight,
      topRightHeight,
      bottomLeftHeight,
      bottomRightHeight,
    );

    return {
      minimumHeight,
      maximumHeight,
      steepness: maximumHeight - minimumHeight,
    };
  }

  private static nearestNeighborhoodCenterDistance(
    neighborhoods: Neighborhood[],
    x: number,
    z: number,
  ): number {
    let minDistance = Number.POSITIVE_INFINITY;
    let distance: number;

    for (const neighborhood of neighborhoods) {
      distance = Math.sqrt(
        Math.pow(x - neighborhood.centerX, 2) +
          Math.pow(z - neighborhood.centerZ, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
  }

  public static generate(
    terrain: Terrain,
    neighborhoods: Neighborhood[],
    roadNetwork: RoadNetwork,
    config: ZonedBlockConfig,
  ): ZonedBlocks {
    const blocks: ZonedBlock[] = [];
    const boundingBox = {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minZ: Number.POSITIVE_INFINITY,
      maxZ: Number.NEGATIVE_INFINITY,
    };

    for (let x = terrain.minX(); x < terrain.maxX(); x++) {
      for (let z = terrain.minZ(); z < terrain.maxZ(); z++) {
        const hasTopRoad = roadNetwork.hasEdgeBetween(x, z, x + 1, z);
        const hasRightRoad = roadNetwork.hasEdgeBetween(x + 1, z, x + 1, z + 1);
        const hasBottomRoad = roadNetwork.hasEdgeBetween(
          x,
          z + 1,
          x + 1,
          z + 1,
        );
        const hasLeftRoad = roadNetwork.hasEdgeBetween(x, z, x, z + 1);

        if (hasTopRoad || hasRightRoad || hasBottomRoad || hasLeftRoad) {
          const blockTerrainAttributes = this.blockTerrainAttributes(
            terrain,
            x,
            z,
            x + 1,
            z + 1,
          );

          const distanceToClosestNeighborhoodCenter =
            this.nearestNeighborhoodCenterDistance(neighborhoods, x, z);

          const probabilityOfBuilding =
            this.calculateBlockProbabilityOfBuilding(
              x,
              z,
              distanceToClosestNeighborhoodCenter,
              config.blockDistanceDecayBegins,
            );

          const maxStories = this.calculateMaxStoriesForBlock(
            x,
            z,
            neighborhoods[0].centerX,
            neighborhoods[0].centerZ,
            config.maxBuildingStories,
          );

          const layout =
            this.BLOCK_LAYOUTS[
              Math.floor(Math.random() * this.BLOCK_LAYOUTS.length)
            ];

          if (layout.maxBlockSteepness >= blockTerrainAttributes.steepness) {
            boundingBox.minX = Math.min(boundingBox.minX, x);
            boundingBox.maxX = Math.max(boundingBox.maxX, x);
            boundingBox.minZ = Math.min(boundingBox.minZ, z);
            boundingBox.maxZ = Math.max(boundingBox.maxZ, z);

            blocks.push({
              x,
              z,
              probabilityOfBuilding,
              maxStories,
              minimumHeight: blockTerrainAttributes.minimumHeight,
              hasTopRoad,
              hasRightRoad,
              hasBottomRoad,
              hasLeftRoad,
              layout,
            });
          }
        }
      }
    }

    return { blocks, boundingBox };
  }
}

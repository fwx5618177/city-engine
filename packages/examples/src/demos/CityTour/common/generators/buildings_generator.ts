import { CityTourMath } from '../math';
import { Terrain } from '../terrain';

interface Lot {
  left: number;
  top: number;
  right: number;
  bottom: number;
  maxStories: number;
}

interface ZonedBlock {
  x: number;
  z: number;
  probabilityOfBuilding: number;
  maxStories: number;
  minimumHeight: number;
  hasLeftRoad: boolean;
  hasTopRoad: boolean;
  hasRightRoad: boolean;
  hasBottomRoad: boolean;
  layout: {
    lots: Lot[];
  };
}

interface ZonedBlocks {
  blocks: ZonedBlock[];
  boundingBox: BoundingBox;
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface TerrainAttributes {
  minimumHeight: number;
  maximumHeight: number;
  steepness: number;
}

interface Building {
  dimensions: Lot;
  roofStyle: string;
  yFloor: number;
  height: number;
}

interface BuildingData {
  buildingCount: number;
  antennaCount: number;
  blocks: Building[][][];
  boundingBox: BoundingBox;
}

interface Buildings {
  buildingCount: number;
  antennaCount: number;
  blockAtCoordinates: (x: number, z: number) => Building[];
  boundingBox: BoundingBox;
}

class BuildingsGenerator {
  private static readonly MIN_STORY_HEIGHT = 0.1;
  private static readonly MAX_STORY_HEIGHT = 0.125;
  private static readonly MIN_STORIES_FOR_ANTENNA = 25;
  private static readonly PROBABILITY_OF_TALL_BUILDING_ANTENNA = 0.3;
  private static readonly ROOF_STYLE_ANTENNA = 'antenna';
  private static readonly ROOF_STYLE_FLAT = 'flat';
  private static readonly EMPTY_ARRAY: Building[] = [];

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

  private static generateBuildingOnLot(
    lot: Lot,
    zonedBlock: ZonedBlock,
    terrain: Terrain,
  ): Building | undefined {
    const x = zonedBlock.x;
    const z = zonedBlock.z;

    if (Math.random() < zonedBlock.probabilityOfBuilding) {
      const hasAdjacentRoad =
        (lot.left === 0.0 && zonedBlock.hasLeftRoad) ||
        (lot.top === 0.0 && zonedBlock.hasTopRoad) ||
        (lot.right === 1.0 && zonedBlock.hasRightRoad) ||
        (lot.bottom === 1.0 && zonedBlock.hasBottomRoad);

      if (hasAdjacentRoad) {
        const lotTerrainAttributes = BuildingsGenerator.blockTerrainAttributes(
          terrain,
          x + lot.left,
          z + lot.top,
          x + lot.right,
          z + lot.bottom,
        );

        if (
          lotTerrainAttributes.steepness < BuildingsGenerator.MIN_STORY_HEIGHT
        ) {
          const maxStories = Math.min(zonedBlock.maxStories, lot.maxStories);
          const actualStories = CityTourMath.randomInteger(1, maxStories);
          const storyHeight = CityTourMath.randomInRange(
            BuildingsGenerator.MIN_STORY_HEIGHT,
            BuildingsGenerator.MAX_STORY_HEIGHT,
          );

          let roofStyle: string;
          if (
            actualStories > BuildingsGenerator.MIN_STORIES_FOR_ANTENNA &&
            Math.random() <
              BuildingsGenerator.PROBABILITY_OF_TALL_BUILDING_ANTENNA
          ) {
            roofStyle = BuildingsGenerator.ROOF_STYLE_ANTENNA;
          } else {
            roofStyle = BuildingsGenerator.ROOF_STYLE_FLAT;
          }

          return {
            dimensions: lot,
            roofStyle: roofStyle,
            yFloor: zonedBlock.minimumHeight,
            height:
              actualStories * storyHeight +
              (lotTerrainAttributes.maximumHeight - zonedBlock.minimumHeight),
          };
        }
      }
    }

    return undefined;
  }

  private static generateUnitBlocks(
    terrain: Terrain,
    zonedBlocks: ZonedBlocks,
  ): BuildingData {
    const blocks: Building[][][] = [];
    let buildingCount = 0;
    let antennaCount = 0;

    zonedBlocks.blocks.forEach((zonedBlock) => {
      const x = zonedBlock.x;
      const z = zonedBlock.z;
      const lots = zonedBlock.layout.lots;
      const block: Building[] = [];

      for (const lot of lots) {
        const building = BuildingsGenerator.generateBuildingOnLot(
          lot,
          zonedBlock,
          terrain,
        );
        if (building !== undefined) {
          block.push(building);
          buildingCount += 1;

          if (building.roofStyle === BuildingsGenerator.ROOF_STYLE_ANTENNA) {
            antennaCount += 1;
          }
        }
      }

      if (block.length > 0) {
        if (blocks[x] === undefined) {
          blocks[x] = [];
        }
        blocks[x][z] = block;
      }
    });

    return {
      buildingCount,
      antennaCount,
      blocks,
      boundingBox: zonedBlocks.boundingBox,
    };
  }

  public static generate(
    terrain: Terrain,
    zonedBlocks: ZonedBlocks,
  ): Buildings {
    const buildingData = BuildingsGenerator.generateUnitBlocks(
      terrain,
      zonedBlocks,
    );
    const blocks = buildingData.blocks;

    return {
      buildingCount: buildingData.buildingCount,
      antennaCount: buildingData.antennaCount,
      blockAtCoordinates: (x: number, z: number): Building[] =>
        blocks[x]?.[z] ?? BuildingsGenerator.EMPTY_ARRAY,
      boundingBox: buildingData.boundingBox,
    };
  }
}

export {
  BuildingsGenerator,
  Building,
  Buildings,
  ZonedBlock,
  ZonedBlocks,
  Lot,
  BoundingBox,
};

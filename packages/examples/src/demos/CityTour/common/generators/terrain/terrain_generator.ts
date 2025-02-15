import * as THREE from 'three';

import { CityTourMath } from '../../math';
import { Terrain } from '../../terrain';

import { BlurEroder } from './blur_eroder';
import { DiamondSquareGenerator } from './diamond_square_generator';
import { HydraulicErosionGenerator } from './hydraulic_erosion_generator';
import { RiverGenerator } from './river_generator';
import { TerrainShapeGenerator } from './terrain_shape_generator';

interface TerrainCoordinate {
  landHeight: number;
  waterHeight: number;
}

interface TerrainConfig {
  heightJitter: number;
  heightJitterDecay: number;
  hillCount: number;
  maxHillHeight: number;
  river: boolean;
}

export class TerrainGenerator {
  private static readonly SCALE = 1; // Should be a power of 0.5
  private static readonly MIN_INITIAL_TERRAIN_HEIGHT = -0.25;
  private static readonly MAX_INITIAL_TERRAIN_HEIGHT = 0.25;

  private static emptyTerrain(
    columnCount: number,
    rowCount: number,
  ): TerrainCoordinate[][] {
    const terrainCoordinates: TerrainCoordinate[][] = [];

    for (let x = 0; x < columnCount; x++) {
      terrainCoordinates[x] = [];

      for (let z = 0; z < rowCount; z++) {
        terrainCoordinates[x][z] = { landHeight: 0.0, waterHeight: 0.0 };
      }
    }

    return terrainCoordinates;
  }

  private static buildTerrainCoordinates(
    columns: number,
    rows: number,
    config: TerrainConfig,
  ): TerrainCoordinate[][] {
    const TOTAL_HYDRAULIC_EROSION_ITERATIONS = 10000;
    const columnsToGenerate =
      THREE.MathUtils.ceilPowerOfTwo(columns / this.SCALE) + 1;
    const rowsToGenerate =
      THREE.MathUtils.ceilPowerOfTwo(rows / this.SCALE) + 1;

    const terrainCoordinates = this.emptyTerrain(
      columnsToGenerate,
      rowsToGenerate,
    );

    // Initial randomization of corners
    terrainCoordinates[0][0].landHeight = CityTourMath.randomInteger(
      this.MIN_INITIAL_TERRAIN_HEIGHT,
      this.MAX_INITIAL_TERRAIN_HEIGHT,
    );
    terrainCoordinates[0][rowsToGenerate - 1].landHeight =
      CityTourMath.randomInteger(
        this.MIN_INITIAL_TERRAIN_HEIGHT,
        this.MAX_INITIAL_TERRAIN_HEIGHT,
      );
    terrainCoordinates[columnsToGenerate - 1][0].landHeight =
      CityTourMath.randomInteger(
        this.MIN_INITIAL_TERRAIN_HEIGHT,
        this.MAX_INITIAL_TERRAIN_HEIGHT,
      );
    terrainCoordinates[columnsToGenerate - 1][rowsToGenerate - 1].landHeight =
      CityTourMath.randomInteger(
        this.MIN_INITIAL_TERRAIN_HEIGHT,
        this.MAX_INITIAL_TERRAIN_HEIGHT,
      );

    // City must be (2^n + 1) blocks on both x and z dimensions for this to work
    DiamondSquareGenerator.generate(
      terrainCoordinates,
      config.heightJitter,
      config.heightJitterDecay,
      0,
      columnsToGenerate - 1,
      rowsToGenerate - 1,
      0,
    );

    this.addRandomPyramids(
      terrainCoordinates,
      Math.round(config.hillCount * 0.5),
      config.maxHillHeight,
      0,
      0,
      columnsToGenerate - 1,
      6,
    );
    this.addRandomPyramids(
      terrainCoordinates,
      Math.round(config.hillCount * 0.5),
      config.maxHillHeight,
      0,
      rowsToGenerate - 6 - 1,
      columnsToGenerate - 1,
      rowsToGenerate - 1,
    );

    // Hydraulic erosion
    HydraulicErosionGenerator.erode(
      terrainCoordinates,
      TOTAL_HYDRAULIC_EROSION_ITERATIONS,
    );

    // Blur erosion
    BlurEroder.erode(terrainCoordinates);

    if (config.river) {
      RiverGenerator.addRiver(
        terrainCoordinates,
        (rowsToGenerate - 1) * (68 / 128),
        columnsToGenerate - 1,
      );
    }

    this.normalizeTerrainHeights(terrainCoordinates);

    return terrainCoordinates;
  }

  private static addRandomPyramids(
    terrainCoordinates: TerrainCoordinate[][],
    pyramidCount: number,
    maxHillHeight: number,
    minX: number,
    minZ: number,
    maxX: number,
    maxZ: number,
  ): void {
    const MIN_BASE_LENGTH = 15;
    const MAX_BASE_LENGTH = 35;

    for (let i = 0; i < pyramidCount; i++) {
      const centerX = CityTourMath.randomInteger(minX, maxX);
      const centerZ = CityTourMath.randomInteger(minZ, maxZ);

      const baseLength =
        CityTourMath.randomInteger(MIN_BASE_LENGTH, MAX_BASE_LENGTH) * 2;
      const hillHeight = CityTourMath.randomInteger(0, maxHillHeight);

      TerrainShapeGenerator.addCone(
        terrainCoordinates,
        centerX,
        centerZ,
        baseLength,
        hillHeight,
      );
    }
  }

  private static floodTerrain(
    terrainCoordinates: TerrainCoordinate[][],
    floodWaterHeight: number,
  ): void {
    for (let x = 0; x < terrainCoordinates.length; x++) {
      for (let z = 0; z < terrainCoordinates[x].length; z++) {
        if (terrainCoordinates[x][z].landHeight < floodWaterHeight) {
          terrainCoordinates[x][z].waterHeight =
            floodWaterHeight - terrainCoordinates[x][z].landHeight;
        }
      }
    }
  }

  private static normalizeTerrainHeights(
    terrainCoordinates: TerrainCoordinate[][],
  ): void {
    let minimumHeightBeforeNormalization = Number.POSITIVE_INFINITY;
    let heightAtCoordinates: number;

    // Find lowest height in terrain
    for (let x = 0; x < terrainCoordinates.length; x++) {
      for (let z = 0; z < terrainCoordinates[x].length; z++) {
        heightAtCoordinates =
          terrainCoordinates[x][z].landHeight +
          terrainCoordinates[x][z].waterHeight;
        if (heightAtCoordinates < minimumHeightBeforeNormalization) {
          minimumHeightBeforeNormalization = heightAtCoordinates;
        }
      }
    }

    // Adjust terrain heights so the lowest point is set to 0.0,
    // and heights at other places are adjusted accordingly.
    for (let x = 0; x < terrainCoordinates.length; x++) {
      for (let z = 0; z < terrainCoordinates[x].length; z++) {
        terrainCoordinates[x][z].landHeight -= minimumHeightBeforeNormalization;
      }
    }
  }

  public static generate(
    columns: number,
    rows: number,
    config: TerrainConfig,
  ): Terrain {
    const terrainCoordinates = this.buildTerrainCoordinates(
      columns,
      rows,
      config,
    );
    return new Terrain(terrainCoordinates, this.SCALE);
  }
}

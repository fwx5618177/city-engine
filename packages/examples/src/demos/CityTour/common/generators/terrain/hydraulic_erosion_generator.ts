import { CityTourMath } from '../../math';

interface TerrainCoordinate {
  landHeight: number;
  waterHeight: number;
}

interface AdjacentTerrainInfo {
  minAdjacentLandHeight: number;
  minAdjacentX: number;
  minAdjacentZ: number;
}

export class HydraulicErosionGenerator {
  private static readonly STARTING_WATER_HEIGHT = 4.0;
  private static readonly MAX_DISSOLVED_SOIL_PERCENTAGE = 0.3;
  private static readonly WATER_EVAPORATION_RATE = 0.1;
  private static readonly MAX_EROSION_HEIGHT = 1.0;

  private static lowestAdjacentTerrain(
    terrainCoordinates: TerrainCoordinate[][],
    x: number,
    z: number,
  ): AdjacentTerrainInfo {
    let candidateLandHeight: number;
    let minAdjacentLandHeight = Number.POSITIVE_INFINITY;
    let minAdjacentX: number = x;
    let minAdjacentZ: number = z;

    // North
    if (z > 0) {
      candidateLandHeight = terrainCoordinates[x][z - 1].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x;
        minAdjacentZ = z - 1;
      }
    }

    // South
    if (z < terrainCoordinates[0].length - 1) {
      candidateLandHeight = terrainCoordinates[x][z + 1].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x;
        minAdjacentZ = z + 1;
      }
    }

    // West
    if (x > 0) {
      candidateLandHeight = terrainCoordinates[x - 1][z].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x - 1;
        minAdjacentZ = z;
      }
    }

    // East
    if (x < terrainCoordinates.length - 1) {
      candidateLandHeight = terrainCoordinates[x + 1][z].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x + 1;
        minAdjacentZ = z;
      }
    }

    // Southwest
    if (x > 0 && z < terrainCoordinates[0].length - 1) {
      candidateLandHeight = terrainCoordinates[x - 1][z + 1].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x - 1;
        minAdjacentZ = z + 1;
      }
    }

    // Northeast
    if (x < terrainCoordinates.length - 1 && z > 0) {
      candidateLandHeight = terrainCoordinates[x + 1][z - 1].landHeight;
      if (candidateLandHeight < minAdjacentLandHeight) {
        minAdjacentLandHeight = candidateLandHeight;
        minAdjacentX = x + 1;
        minAdjacentZ = z - 1;
      }
    }

    return {
      minAdjacentLandHeight,
      minAdjacentX,
      minAdjacentZ,
    };
  }

  // Adapted from http://ranmantaru.com/blog/2011/10/08/water-erosion-on-heightmap-terrain/
  public static erode(
    terrainCoordinates: TerrainCoordinate[][],
    iterationCount: number,
  ): void {
    const maxColumnIndex = terrainCoordinates.length - 1;
    const maxRowIndex = terrainCoordinates[0].length - 1;

    for (let i = 0; i < iterationCount; i++) {
      let x = CityTourMath.randomInteger(0, maxColumnIndex);
      let z = CityTourMath.randomInteger(0, maxRowIndex);

      let waterAmount = this.STARTING_WATER_HEIGHT;
      let dissolvedSoilAmount = 0.0;
      let lowestAdjacentTerrainAttributes = this.lowestAdjacentTerrain(
        terrainCoordinates,
        x,
        z,
      );
      let lowestAdjacentLandHeight =
        lowestAdjacentTerrainAttributes.minAdjacentLandHeight;

      do {
        lowestAdjacentTerrainAttributes = this.lowestAdjacentTerrain(
          terrainCoordinates,
          x,
          z,
        );
        lowestAdjacentLandHeight =
          lowestAdjacentTerrainAttributes.minAdjacentLandHeight;
        const lowestAdjacentX = lowestAdjacentTerrainAttributes.minAdjacentX;
        const lowestAdjacentZ = lowestAdjacentTerrainAttributes.minAdjacentZ;

        let soilDepositHeight = 0.0;
        let erosionHeight = 0.0;
        const maxDissolvedSoil =
          waterAmount * this.MAX_DISSOLVED_SOIL_PERCENTAGE;

        if (dissolvedSoilAmount > maxDissolvedSoil) {
          soilDepositHeight = dissolvedSoilAmount - maxDissolvedSoil;
          dissolvedSoilAmount -= soilDepositHeight;
        } else if (
          terrainCoordinates[x][z].landHeight >= lowestAdjacentLandHeight
        ) {
          erosionHeight = Math.min(
            this.MAX_EROSION_HEIGHT,
            maxDissolvedSoil - dissolvedSoilAmount,
            terrainCoordinates[x][z].landHeight - lowestAdjacentLandHeight,
          );
          dissolvedSoilAmount += erosionHeight;
        }

        terrainCoordinates[x][z].landHeight += soilDepositHeight;
        terrainCoordinates[x][z].landHeight -= erosionHeight;

        waterAmount -= this.WATER_EVAPORATION_RATE;

        x = lowestAdjacentX;
        z = lowestAdjacentZ;
      } while (
        waterAmount > 0.0 &&
        lowestAdjacentLandHeight <= terrainCoordinates[x][z].landHeight
      );

      // Deposit any soil remaining after all water has evaporated
      terrainCoordinates[x][z].landHeight += dissolvedSoilAmount;
    }
  }
}

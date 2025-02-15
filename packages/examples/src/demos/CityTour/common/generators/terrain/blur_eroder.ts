interface TerrainCoordinate {
  landHeight: number;
  waterHeight: number;
}

export class BlurEroder {
  private static readonly EROSION_PERCENTAGE_FROM_PREVIOUS = 0.5;
  private static readonly EROSION_PERCENTAGE_FOR_CURRENT =
    1 - BlurEroder.EROSION_PERCENTAGE_FROM_PREVIOUS;

  // Adapted from http://www.dreamincode.net/forums/blog/2250/entry-4550-terrain-erosion/
  public static erode(terrainCoordinates: TerrainCoordinate[][]): void {
    let previous: number;
    let current: number;

    for (let x = 0; x < terrainCoordinates.length; x++) {
      // Top -> Down
      previous = terrainCoordinates[x][0].landHeight;
      for (let z = 1; z < terrainCoordinates[0].length; z++) {
        current = terrainCoordinates[x][z].landHeight;

        if (terrainCoordinates[x][z].waterHeight <= 0.0) {
          terrainCoordinates[x][z].landHeight =
            BlurEroder.EROSION_PERCENTAGE_FROM_PREVIOUS * previous +
            BlurEroder.EROSION_PERCENTAGE_FOR_CURRENT * current;
        }
        previous = current;
      }

      // Down -> Up
      previous =
        terrainCoordinates[x][terrainCoordinates[0].length - 1].landHeight;
      for (let z = terrainCoordinates[0].length - 2; z >= 0; z--) {
        current = terrainCoordinates[x][z].landHeight;

        if (terrainCoordinates[x][z].waterHeight <= 0.0) {
          terrainCoordinates[x][z].landHeight =
            BlurEroder.EROSION_PERCENTAGE_FROM_PREVIOUS * previous +
            BlurEroder.EROSION_PERCENTAGE_FOR_CURRENT * current;
        }
        previous = current;
      }
    }

    for (let z = 0; z < terrainCoordinates[0].length; z++) {
      // Left -> Right
      previous = terrainCoordinates[0][z].landHeight;
      for (let x = 1; x < terrainCoordinates.length; x++) {
        current = terrainCoordinates[x][z].landHeight;

        if (terrainCoordinates[x][z].waterHeight <= 0.0) {
          terrainCoordinates[x][z].landHeight =
            BlurEroder.EROSION_PERCENTAGE_FROM_PREVIOUS * previous +
            BlurEroder.EROSION_PERCENTAGE_FOR_CURRENT * current;
        }
        previous = current;
      }

      // Right -> Left
      previous =
        terrainCoordinates[terrainCoordinates.length - 1][z].landHeight;
      for (let x = terrainCoordinates.length - 2; x >= 0; x--) {
        current = terrainCoordinates[x][z].landHeight;

        if (terrainCoordinates[x][z].waterHeight <= 0.0) {
          terrainCoordinates[x][z].landHeight =
            BlurEroder.EROSION_PERCENTAGE_FROM_PREVIOUS * previous +
            BlurEroder.EROSION_PERCENTAGE_FOR_CURRENT * current;
        }
        previous = current;
      }
    }
  }
}

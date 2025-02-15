interface TerrainCoordinate {
  landHeight: number;
  waterHeight: number;
}

export class DiamondSquareGenerator {
  // As described at https://en.wikipedia.org/wiki/Diamond-square_algorithm and http://stevelosh.com/blog/2016/06/diamond-square/
  public static generate(
    terrainCoordinates: TerrainCoordinate[][],
    jitterAmount: number,
    jitterDecay: number,
    top: number,
    right: number,
    bottom: number,
    left: number,
  ): void {
    let startX = 0;
    let jitter: number;
    let halfJitterAmount = jitterAmount / 2;
    let terms: number;

    let leftDiamondHeight: number;
    let topDiamondHeight: number;
    let rightDiamondHeight: number;
    let bottomDiamondHeight: number;

    let width = right - left;
    let height = bottom - top;
    let halfWidth = width / 2;
    let halfHeight = height / 2;

    while (width >= 2) {
      // Square step
      for (let x = left; x < right; x += width) {
        for (let y = top; y < bottom; y += height) {
          jitter = Math.random() * jitterAmount - halfJitterAmount;
          terrainCoordinates[x + halfWidth][y + halfHeight].landHeight =
            (terrainCoordinates[x][y].landHeight +
              terrainCoordinates[x + width][y].landHeight +
              terrainCoordinates[x][y + height].landHeight +
              terrainCoordinates[x + width][y + height].landHeight) /
              4 +
            jitter;
        }
      }

      startX = 0;

      // Diamond step
      for (let y = top; y <= bottom; y += halfHeight) {
        if (startX === 0) {
          startX = halfWidth;
        } else {
          startX = 0;
        }

        for (let x = startX; x <= right; x += width) {
          terms = 4;

          if (x === left) {
            leftDiamondHeight = 0;
            terms -= 1;
          } else {
            leftDiamondHeight = terrainCoordinates[x - halfWidth][y].landHeight;
          }

          if (y === top) {
            topDiamondHeight = 0;
            terms -= 1;
          } else {
            topDiamondHeight = terrainCoordinates[x][y - halfHeight].landHeight;
          }

          if (x === right) {
            rightDiamondHeight = 0;
            terms -= 1;
          } else {
            rightDiamondHeight =
              terrainCoordinates[x + halfWidth][y].landHeight;
          }

          if (y === bottom) {
            bottomDiamondHeight = 0;
            terms -= 1;
          } else {
            bottomDiamondHeight =
              terrainCoordinates[x][y + halfHeight].landHeight;
          }

          jitter = Math.random() * jitterAmount - halfJitterAmount;
          terrainCoordinates[x][y].landHeight =
            (leftDiamondHeight +
              topDiamondHeight +
              rightDiamondHeight +
              bottomDiamondHeight) /
              terms +
            jitter;
        }
      }

      width /= 2;
      halfWidth = width / 2;
      height /= 2;
      halfHeight = height / 2;
      jitterAmount *= jitterDecay;
      halfJitterAmount = jitterAmount / 2;
    }
  }
}

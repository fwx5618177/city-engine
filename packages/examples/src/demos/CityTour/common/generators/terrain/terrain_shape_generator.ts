import { CityTourMath } from '../../math';

interface TerrainCoordinate {
  landHeight: number;
  waterHeight: number;
}

export class TerrainShapeGenerator {
  public static addPlateau(
    terrainCoordinates: TerrainCoordinate[][],
    centerX: number,
    centerZ: number,
    width: number,
    height: number,
    depth: number,
  ): void {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const startX = Math.max(0, Math.floor(centerX - halfWidth));
    const endX = Math.min(
      terrainCoordinates.length - 1,
      Math.floor(centerX + halfWidth),
    );
    const startZ = Math.max(0, Math.floor(centerZ - halfDepth));
    const endZ = Math.min(
      terrainCoordinates[0].length - 1,
      Math.floor(centerZ + halfDepth),
    );

    for (let x = startX; x <= endX; x++) {
      for (let z = startZ; z <= endZ; z++) {
        terrainCoordinates[x][z].landHeight += height;
      }
    }
  }

  public static addPyramid(
    terrainCoordinates: TerrainCoordinate[][],
    centerX: number,
    centerZ: number,
    width: number,
    height: number,
    depth: number,
  ): void {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const startX = Math.max(0, Math.floor(centerX - halfWidth));
    const endX = Math.min(
      terrainCoordinates.length - 1,
      Math.floor(centerX + halfWidth),
    );
    const startZ = Math.max(0, Math.floor(centerZ - halfDepth));
    const endZ = Math.min(
      terrainCoordinates[0].length - 1,
      Math.floor(centerZ + halfDepth),
    );

    let xDistance, zDistance;
    let maxDistance;
    let pointHeight;

    for (let x = startX; x <= endX; x++) {
      for (let z = startZ; z <= endZ; z++) {
        xDistance = Math.abs(x - centerX) / halfWidth;
        zDistance = Math.abs(z - centerZ) / halfDepth;
        maxDistance = Math.max(xDistance, zDistance);

        if (maxDistance <= 1.0) {
          pointHeight = height * (1 - maxDistance);
          terrainCoordinates[x][z].landHeight += pointHeight;
        }
      }
    }
  }

  public static addCone(
    terrainCoordinates: TerrainCoordinate[][],
    centerX: number,
    centerZ: number,
    width: number,
    height: number,
    depth: number,
  ): void {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const startX = Math.max(0, Math.floor(centerX - halfWidth));
    const endX = Math.min(
      terrainCoordinates.length - 1,
      Math.floor(centerX + halfWidth),
    );
    const startZ = Math.max(0, Math.floor(centerZ - halfDepth));
    const endZ = Math.min(
      terrainCoordinates[0].length - 1,
      Math.floor(centerZ + halfDepth),
    );

    let xDistance, zDistance;
    let distance;
    let pointHeight;

    for (let x = startX; x <= endX; x++) {
      for (let z = startZ; z <= endZ; z++) {
        xDistance = Math.abs(x - centerX) / halfWidth;
        zDistance = Math.abs(z - centerZ) / halfDepth;
        distance = Math.sqrt(Math.pow(xDistance, 2) + Math.pow(zDistance, 2));

        if (distance <= 1.0) {
          pointHeight = height * (1 - distance);
          terrainCoordinates[x][z].landHeight += pointHeight;
        }
      }
    }
  }

  public static addLine(
    terrainCoordinates: TerrainCoordinate[][],
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    thickness: number,
    height: number,
  ): void {
    const halfThickness = thickness / 2;
    const boundingStartX = Math.max(0, Math.floor(startX - halfThickness));
    const boundingStartZ = Math.max(0, Math.floor(startZ - halfThickness));
    const boundingEndX = Math.min(
      terrainCoordinates.length - 1,
      Math.floor(endX + halfThickness),
    );
    const boundingEndZ = Math.min(
      terrainCoordinates[0].length - 1,
      Math.floor(endZ + halfThickness),
    );

    const denominator = CityTourMath.distanceBetweenPoints(
      startX,
      startZ,
      endX,
      endZ,
    );

    for (let x = boundingStartX; x <= boundingEndX; x++) {
      for (let z = boundingStartZ; z <= boundingEndZ; z++) {
        // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
        const numerator = Math.abs(
          (endZ - startZ) * x -
            (endX - startX) * z +
            endX * startZ -
            endZ * startX,
        );
        const distanceToLine = numerator / denominator;

        if (distanceToLine <= halfThickness) {
          const pointHeight = (1.0 - distanceToLine / halfThickness) * height;
          terrainCoordinates[x][z].landHeight += pointHeight;
        }
      }
    }
  }

  public static addRidge(
    terrainCoordinates: TerrainCoordinate[][],
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    thickness: number,
    height: number,
  ): void {
    const halfThickness = thickness / 2;
    const boundingStartX = Math.max(0, Math.floor(startX - halfThickness));
    const boundingStartZ = Math.max(0, Math.floor(startZ - halfThickness));
    const boundingEndX = Math.min(
      terrainCoordinates.length - 1,
      Math.floor(endX + halfThickness),
    );
    const boundingEndZ = Math.min(
      terrainCoordinates[0].length - 1,
      Math.floor(endZ + halfThickness),
    );

    const denominator = CityTourMath.distanceBetweenPoints(
      startX,
      startZ,
      endX,
      endZ,
    );

    for (let x = boundingStartX; x <= boundingEndX; x++) {
      for (let z = boundingStartZ; z <= boundingEndZ; z++) {
        // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
        const numerator = Math.abs(
          (endZ - startZ) * x -
            (endX - startX) * z +
            endX * startZ -
            endZ * startX,
        );
        const distanceToLine = numerator / denominator;

        if (distanceToLine <= halfThickness) {
          const pointHeight = (1.0 - distanceToLine / halfThickness) * height;
          terrainCoordinates[x][z].landHeight += pointHeight;
        }
      }
    }
  }
}

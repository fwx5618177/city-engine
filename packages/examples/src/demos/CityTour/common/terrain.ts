import { CityTourMath } from './math';

interface TerrainCoordinate {
  landHeight: number;
  waterHeight: number;
}

interface TerrainInterface {
  scale: () => number;
  minX: () => number;
  maxX: () => number;
  minZ: () => number;
  maxZ: () => number;
  landHeightAt: (mapX: number, mapZ: number) => number | undefined;
  waterHeightAt: (mapX: number, mapZ: number) => number | undefined;
  heightAt: (mapX: number, mapZ: number) => number | undefined;
  isPointInBounds: (mapX: number, mapZ: number) => boolean;
}

class Terrain implements TerrainInterface {
  private static readonly LAND_HEIGHT_COMPONENT = 'landHeight';
  private static readonly WATER_HEIGHT_COMPONENT = 'waterHeight';

  private readonly subDivisions: number;
  private readonly columnCount: number;
  private readonly rowCount: number;
  private readonly maxXIndex: number;
  private readonly maxZIndex: number;
  private readonly _maxX: number;
  private readonly _minX: number;
  private readonly _maxZ: number;
  private readonly _minZ: number;

  constructor(
    private coordinates: TerrainCoordinate[][],
    private terrainScale: number,
  ) {
    this.subDivisions = 1 / terrainScale;
    this.columnCount = coordinates.length;
    this.rowCount = coordinates[0].length;
    this.maxXIndex = this.columnCount - 1;
    this.maxZIndex = this.rowCount - 1;
    this._maxX = this.maxXIndex * 0.5 * terrainScale;
    this._minX = -this._maxX;
    this._maxZ = this.maxZIndex * 0.5 * terrainScale;
    this._minZ = -this._maxZ;
  }

  private mapXToNormalizedX(mapX: number): number {
    return (mapX + this._maxX) * this.subDivisions;
  }

  private mapZToNormalizedZ(mapZ: number): number {
    return (mapZ + this._maxZ) * this.subDivisions;
  }

  private interpolateHeight(
    point: number,
    floor: number,
    ceiling: number,
  ): number {
    return CityTourMath.lerp(floor, ceiling, point - Math.floor(point));
  }

  private componentHeightAt(
    x: number,
    z: number,
    component: keyof TerrainCoordinate,
  ): number | undefined {
    let leftHeight: number,
      rightHeight: number,
      topHeight: number,
      bottomHeight: number;
    let topRowInterpolatedHeight: number, bottomRowInterpolatedHeight: number;
    const xIsExact = Math.floor(x) === x;
    const zIsExact = Math.floor(z) === z;

    if (x < 0 || x > this.maxXIndex || z < 0 || z > this.maxZIndex) {
      return undefined;
    }

    if (xIsExact && zIsExact) {
      return this.coordinates[x][z][component];
    }

    if (!xIsExact && zIsExact) {
      leftHeight = this.coordinates[Math.floor(x)][z][component];
      rightHeight = this.coordinates[Math.ceil(x)][z][component];
      return this.interpolateHeight(x, leftHeight, rightHeight);
    } else if (xIsExact && !zIsExact) {
      topHeight = this.coordinates[x][Math.floor(z)][component];
      bottomHeight = this.coordinates[x][Math.ceil(z)][component];
      return this.interpolateHeight(z, topHeight, bottomHeight);
    } else {
      leftHeight = this.coordinates[Math.floor(x)][Math.floor(z)][component];
      rightHeight = this.coordinates[Math.ceil(x)][Math.floor(z)][component];
      topRowInterpolatedHeight = this.interpolateHeight(
        x,
        leftHeight,
        rightHeight,
      );

      leftHeight = this.coordinates[Math.floor(x)][Math.ceil(z)][component];
      rightHeight = this.coordinates[Math.ceil(x)][Math.ceil(z)][component];
      bottomRowInterpolatedHeight = this.interpolateHeight(
        x,
        leftHeight,
        rightHeight,
      );

      return this.interpolateHeight(
        z,
        topRowInterpolatedHeight,
        bottomRowInterpolatedHeight,
      );
    }
  }

  public scale(): number {
    return this.terrainScale;
  }

  public minX(): number {
    return this._minX;
  }

  public maxX(): number {
    return this._maxX;
  }

  public minZ(): number {
    return this._minZ;
  }

  public maxZ(): number {
    return this._maxZ;
  }

  public landHeightAt(mapX: number, mapZ: number): number | undefined {
    return this.componentHeightAt(
      this.mapXToNormalizedX(mapX),
      this.mapZToNormalizedZ(mapZ),
      Terrain.LAND_HEIGHT_COMPONENT as keyof TerrainCoordinate,
    );
  }

  public waterHeightAt(mapX: number, mapZ: number): number | undefined {
    return this.componentHeightAt(
      this.mapXToNormalizedX(mapX),
      this.mapZToNormalizedZ(mapZ),
      Terrain.WATER_HEIGHT_COMPONENT as keyof TerrainCoordinate,
    );
  }

  public heightAt(mapX: number, mapZ: number): number | undefined {
    const normalizedX = this.mapXToNormalizedX(mapX);
    const normalizedZ = this.mapZToNormalizedZ(mapZ);

    const landHeight = this.componentHeightAt(
      normalizedX,
      normalizedZ,
      Terrain.LAND_HEIGHT_COMPONENT as keyof TerrainCoordinate,
    );
    if (landHeight === undefined) {
      return undefined;
    }

    const waterHeight = this.componentHeightAt(
      normalizedX,
      normalizedZ,
      Terrain.WATER_HEIGHT_COMPONENT as keyof TerrainCoordinate,
    );

    return landHeight + (waterHeight ?? 0);
  }

  public isPointInBounds(mapX: number, mapZ: number): boolean {
    return (
      mapX >= this._minX &&
      mapX <= this._maxX &&
      mapZ >= this._minZ &&
      mapZ <= this._maxZ
    );
  }
}

export { Terrain, TerrainInterface, TerrainCoordinate };

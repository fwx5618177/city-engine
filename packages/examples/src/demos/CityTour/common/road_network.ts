import { Config } from './config';
import { CityTourMath } from './math';
import { Terrain } from './terrain';

interface Edge {
  distance: number;
  gradeType: string;
}

interface EdgeWithDestination {
  destinationX: number;
  destinationZ: number;
  edge: Edge;
}

interface IntersectionInterface {
  getHeight: () => number;
  getGradeType: () => string;
  addEdge: (destinationX: number, destinationZ: number, edge: Edge) => void;
  removeEdge: (destinationX: number, destinationZ: number) => void;
  hasEdgeTo: (
    destinationX: number,
    destinationZ: number,
    gradeType?: string,
  ) => boolean;
  getEdge: (destinationX: number, destinationZ: number) => Edge | undefined;
  edgesFrom: () => EdgeWithDestination[];
  edgeCount: () => number;
}

class RoadNetwork {
  public static readonly SURFACE_GRADE = 'surface';
  public static readonly BRIDGE_GRADE = 'bridge';

  private _minBoundingX: number = Number.POSITIVE_INFINITY;
  private _maxBoundingX: number = Number.NEGATIVE_INFINITY;
  private _minBoundingZ: number = Number.POSITIVE_INFINITY;
  private _maxBoundingZ: number = Number.NEGATIVE_INFINITY;

  private readonly minAllowedX: number;
  private readonly maxAllowedX: number;
  private readonly minAllowedZ: number;
  private readonly maxAllowedZ: number;

  private intersections: (IntersectionInterface | undefined)[][] = [];

  constructor(private terrain: Terrain) {
    this.minAllowedX = terrain.minX() + 1;
    this.maxAllowedX = terrain.maxX() - 1;
    this.minAllowedZ = terrain.minZ() + 1;
    this.maxAllowedZ = terrain.maxZ() - 1;

    for (
      let x = Math.ceil(terrain.minX());
      x <= Math.floor(terrain.maxX());
      x++
    ) {
      this.intersections[x] = [];
    }
  }

  private createIntersection(
    x: number,
    z: number,
    height: number,
    gradeType: string,
  ): IntersectionInterface {
    const edges: EdgeWithDestination[] = [];

    const addEdge = (
      destinationX: number,
      destinationZ: number,
      edge: Edge,
    ): void => {
      for (let i = 0; i < edges.length; i++) {
        if (
          edges[i].destinationX === destinationX &&
          edges[i].destinationZ === destinationZ
        ) {
          edges[i].edge = edge;
          return;
        }
      }

      edges.push({ destinationX, destinationZ, edge });
    };

    const removeEdge = (destinationX: number, destinationZ: number): void => {
      let indexToRemove: number | undefined;

      for (let i = 0; i < edges.length; i++) {
        if (
          edges[i].destinationX === destinationX &&
          edges[i].destinationZ === destinationZ
        ) {
          indexToRemove = i;
        }
      }

      if (indexToRemove !== undefined) {
        edges.splice(indexToRemove, 1);
      }
    };

    const hasEdgeTo = (
      destinationX: number,
      destinationZ: number,
      gradeType?: string,
    ): boolean => {
      for (let i = 0; i < edges.length; i++) {
        if (
          edges[i].destinationX === destinationX &&
          edges[i].destinationZ === destinationZ
        ) {
          if (gradeType) {
            return edges[i].edge.gradeType === gradeType;
          } else {
            return true;
          }
        }
      }

      return false;
    };

    const getEdge = (
      destinationX: number,
      destinationZ: number,
    ): Edge | undefined => {
      for (let i = 0; i < edges.length; i++) {
        if (
          edges[i].destinationX === destinationX &&
          edges[i].destinationZ === destinationZ
        ) {
          return edges[i].edge;
        }
      }

      return undefined;
    };

    return {
      getHeight: () => height,
      getGradeType: () => gradeType,
      addEdge,
      removeEdge,
      hasEdgeTo,
      getEdge,
      edgesFrom: () => edges,
      edgeCount: () => edges.length,
    };
  }

  public hasIntersection(x: number, z: number): boolean {
    return (
      this.intersections[x] !== undefined &&
      this.intersections[x][z] !== undefined
    );
  }

  public getIntersectionHeight(x: number, z: number): number | undefined {
    if (this.hasIntersection(x, z)) {
      return this.intersections[x][z]?.getHeight();
    }
    return undefined;
  }

  public getRoadHeight(x: number, z: number): number | undefined {
    const xIsExact = Math.floor(x) === x;
    const zIsExact = Math.floor(z) === z;
    let floor: number | undefined, ceil: number | undefined;
    let xEdge: number, zEdge: number;

    if (xIsExact && zIsExact) {
      return this.getIntersectionHeight(x, z);
    } else if (xIsExact) {
      ceil = this.getIntersectionHeight(x, Math.ceil(z));
      floor = this.getIntersectionHeight(x, Math.floor(z));

      if (ceil !== undefined && floor !== undefined) {
        zEdge = z - Math.floor(z);

        if (zEdge <= Config.HALF_STREET_DEPTH) {
          return floor;
        } else if (zEdge >= 1.0 - Config.HALF_STREET_DEPTH) {
          return ceil;
        }

        return CityTourMath.lerp(
          floor,
          ceil,
          (zEdge - Config.HALF_STREET_DEPTH) / (1.0 - Config.STREET_DEPTH),
        );
      }
    } else if (zIsExact) {
      ceil = this.getIntersectionHeight(Math.ceil(x), z);
      floor = this.getIntersectionHeight(Math.floor(x), z);

      if (ceil !== undefined && floor !== undefined) {
        xEdge = x - Math.floor(x);

        if (xEdge <= Config.HALF_STREET_WIDTH) {
          return floor;
        } else if (xEdge >= 1.0 - Config.HALF_STREET_WIDTH) {
          return ceil;
        }

        return CityTourMath.lerp(
          floor,
          ceil,
          (xEdge - Config.HALF_STREET_WIDTH) / (1.0 - Config.STREET_WIDTH),
        );
      }
    }

    return undefined;
  }

  public getIntersectionGradeType(x: number, z: number): string | undefined {
    if (this.hasIntersection(x, z)) {
      return this.intersections[x][z]?.getGradeType();
    }
    return undefined;
  }

  public addEdge(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    nonTerrainHeight: number,
    distance: number,
    gradeType: string,
  ): void {
    if (
      x1 < this.minAllowedX ||
      x1 > this.maxAllowedX ||
      z1 < this.minAllowedZ ||
      z1 > this.maxAllowedZ
    ) {
      throw new Error(
        `Road coordinates are out of allowed bounds: {${x1}, ${z1}}`,
      );
    }
    if (
      x2 < this.minAllowedX ||
      x2 > this.maxAllowedX ||
      z2 < this.minAllowedZ ||
      z2 > this.maxAllowedZ
    ) {
      throw new Error(
        `Road coordinates are out of allowed bounds: {${x2}, ${z2}}`,
      );
    }

    let intersection1 = this.intersections[x1][z1];
    let intersection2 = this.intersections[x2][z2];
    const edge: Edge = { distance, gradeType };

    if (intersection1 === undefined) {
      const waterHeight = this.terrain.waterHeightAt(x1, z1);
      const intersectionHeight =
        waterHeight === 0.0 ? this.terrain.heightAt(x1, z1) : nonTerrainHeight;
      const intersectionGradeType =
        waterHeight === 0.0
          ? RoadNetwork.SURFACE_GRADE
          : RoadNetwork.BRIDGE_GRADE;
      intersection1 = this.createIntersection(
        x1,
        z1,
        intersectionHeight ?? 0,
        intersectionGradeType,
      );
      this.intersections[x1][z1] = intersection1;
    }

    if (intersection2 === undefined) {
      const waterHeight = this.terrain.waterHeightAt(x2, z2);
      const intersectionHeight =
        waterHeight === 0.0 ? this.terrain.heightAt(x2, z2) : nonTerrainHeight;
      const intersectionGradeType =
        waterHeight === 0.0
          ? RoadNetwork.SURFACE_GRADE
          : RoadNetwork.BRIDGE_GRADE;
      intersection2 = this.createIntersection(
        x2,
        z2,
        intersectionHeight ?? 0,
        intersectionGradeType,
      );
      this.intersections[x2][z2] = intersection2;
    }

    intersection1.addEdge(x2, z2, edge);
    intersection2.addEdge(x1, z1, edge);

    this._minBoundingX = Math.min(this._minBoundingX, x1, x2);
    this._maxBoundingX = Math.max(this._maxBoundingX, x1, x2);
    this._minBoundingZ = Math.min(this._minBoundingZ, z1, z2);
    this._maxBoundingZ = Math.max(this._maxBoundingZ, z1, z2);
  }

  public removeEdge(x1: number, z1: number, x2: number, z2: number): void {
    const intersection1 = this.intersections[x1]?.[z1];
    const intersection2 = this.intersections[x2]?.[z2];

    if (intersection1 !== undefined) {
      intersection1.removeEdge(x2, z2);
      if (intersection1.edgeCount() === 0) {
        this.intersections[x1][z1] = undefined;
      }
    }
    if (intersection2 !== undefined) {
      intersection2.removeEdge(x1, z1);
      if (intersection2.edgeCount() === 0) {
        this.intersections[x2][z2] = undefined;
      }
    }
  }

  public hasEdgeBetween(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    gradeType?: string,
  ): boolean {
    const intersection1 = this.intersections[x1]?.[z1];
    const intersection2 = this.intersections[x2]?.[z2];

    return (
      intersection1 !== undefined &&
      intersection2 !== undefined &&
      intersection1.hasEdgeTo(x2, z2, gradeType) &&
      intersection2.hasEdgeTo(x1, z1, gradeType)
    );
  }

  public edgeBetween(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
  ): Edge | undefined {
    const intersection1 = this.intersections[x1]?.[z1];
    return intersection1?.getEdge(x2, z2);
  }

  public edgesFrom(x: number, z: number): EdgeWithDestination[] | undefined {
    const intersection = this.intersections[x]?.[z];
    return intersection?.edgesFrom();
  }

  public isPointInAllowedBounds(x: number, z: number): boolean {
    return (
      x >= this.minAllowedX &&
      x <= this.maxAllowedX &&
      z >= this.minAllowedZ &&
      z <= this.maxAllowedZ
    );
  }

  public minBoundingX(): number {
    return this._minBoundingX;
  }

  public maxBoundingX(): number {
    return this._maxBoundingX;
  }

  public minBoundingZ(): number {
    return this._minBoundingZ;
  }

  public maxBoundingZ(): number {
    return this._maxBoundingZ;
  }
}

export { RoadNetwork, Edge, EdgeWithDestination, IntersectionInterface };

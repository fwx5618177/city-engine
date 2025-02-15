import * as THREE from 'three';

import { Config } from '../config';
import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

const LAND_COLOR_R = 0.0;
const LAND_COLOR_G = 0.48;
const LAND_COLOR_B = 0.0;

const WATER_COLOR_R = 0.1;
const WATER_COLOR_G = 0.2;
const WATER_COLOR_B = 1.0;

enum TerrainType {
  LAND = 1,
  WATER = 2,
}

interface TerrainMeshBuilderInterface {
  build: (terrain: Terrain, roadNetwork: RoadNetwork) => THREE.Mesh[];
}

export class TerrainMeshBuilder implements TerrainMeshBuilderInterface {
  private readonly SIDE_BOTTOM_HEIGHT = Config.SIDEWALL_BOTTOM;
  private readonly MAX_WATER_HEIGHT = -this.SIDE_BOTTOM_HEIGHT;

  private positionAttributes: number[] = [];
  private normalAttributes: number[] = [];
  private colorAttributes: number[] = [];

  private reusableTriangleVertex1 = new THREE.Vector3();
  private reusableTriangleVertex2 = new THREE.Vector3();
  private reusableTriangleVertex3 = new THREE.Vector3();
  private reusableTriangle: THREE.Triangle;
  private reusableTriangleNormal = new THREE.Vector3();

  constructor() {
    this.reusableTriangle = new THREE.Triangle(
      this.reusableTriangleVertex1,
      this.reusableTriangleVertex2,
      this.reusableTriangleVertex3,
    );
  }

  public build(terrain: Terrain, roadNetwork: RoadNetwork): THREE.Mesh[] {
    const triangleWidth = terrain.scale();
    const triangleDepth = terrain.scale();

    const terrainGeometry = new THREE.BufferGeometry();
    const terrainMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true,
    });

    this.positionAttributes = [];
    this.normalAttributes = [];
    this.colorAttributes = [];

    // Vertical sides along the edges of the terrain
    this.addNorthVerticalFace(terrain, triangleWidth);
    this.addSouthVerticalFace(terrain, triangleWidth);
    this.addWestVerticalFace(terrain, triangleDepth);
    this.addEastVerticalFace(terrain, triangleDepth);

    // Main terrain
    this.addMainTerrain(terrain, roadNetwork, triangleWidth, triangleDepth);

    terrainGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(this.positionAttributes, 3).onUpload(
        this.disposeArray,
      ),
    );
    terrainGeometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(this.normalAttributes, 3).onUpload(
        this.disposeArray,
      ),
    );
    terrainGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(this.colorAttributes, 3).onUpload(
        this.disposeArray,
      ),
    );

    this.positionAttributes = [];
    this.normalAttributes = [];
    this.colorAttributes = [];

    return [new THREE.Mesh(terrainGeometry, terrainMaterial)];
  }

  private addTriangle(
    x1: number,
    y1: number,
    z1: number,
    material1: TerrainType,
    x2: number,
    y2: number,
    z2: number,
    material2: TerrainType,
    x3: number,
    y3: number,
    z3: number,
    material3: TerrainType,
  ): void {
    this.positionAttributes.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);

    this.reusableTriangleVertex1.set(x1, y1, z1);
    this.reusableTriangleVertex2.set(x2, y2, z2);
    this.reusableTriangleVertex3.set(x3, y3, z3);
    this.reusableTriangle.getNormal(this.reusableTriangleNormal);

    for (let i = 0; i < 3; i++) {
      this.normalAttributes.push(
        this.reusableTriangleNormal.x,
        this.reusableTriangleNormal.y,
        this.reusableTriangleNormal.z,
      );
    }

    const isWater =
      material1 === TerrainType.WATER &&
      material2 === TerrainType.WATER &&
      material3 === TerrainType.WATER;

    for (let i = 0; i < 3; i++) {
      if (isWater) {
        this.colorAttributes.push(WATER_COLOR_R, WATER_COLOR_G, WATER_COLOR_B);
      } else {
        this.colorAttributes.push(LAND_COLOR_R, LAND_COLOR_G, LAND_COLOR_B);
      }
    }
  }

  private addNorthVerticalFace(terrain: Terrain, triangleWidth: number): void {
    const z = terrain.maxZ();

    for (let x = terrain.minX(); x < terrain.maxX(); x += triangleWidth) {
      const leftX = x;
      const rightX = x + triangleWidth;

      const leftLandHeight = Math.max(
        this.SIDE_BOTTOM_HEIGHT,
        terrain.landHeightAt(leftX, z) || 0,
      );
      const leftWaterHeight = Math.min(
        this.MAX_WATER_HEIGHT,
        terrain.waterHeightAt(leftX, z) || 0,
      );
      const leftTotalHeight = leftLandHeight + leftWaterHeight;
      const rightLandHeight = Math.max(
        this.SIDE_BOTTOM_HEIGHT,
        terrain.landHeightAt(rightX, z) || 0,
      );
      const rightWaterHeight = Math.min(
        this.MAX_WATER_HEIGHT,
        terrain.waterHeightAt(rightX, z) || 0,
      );
      const rightTotalHeight = rightLandHeight + rightWaterHeight;
      const neighboringWaterHeight = terrain.waterHeightAt(rightX, z - 1) || 0;

      let finalLeftLandHeight = leftLandHeight;
      let finalRightLandHeight = rightLandHeight;

      if (
        leftWaterHeight === 0.0 ||
        rightWaterHeight === 0.0 ||
        neighboringWaterHeight === 0.0
      ) {
        finalLeftLandHeight = leftTotalHeight;
        finalRightLandHeight = rightTotalHeight;
      }

      if (
        leftWaterHeight !== this.MAX_WATER_HEIGHT ||
        rightWaterHeight !== this.MAX_WATER_HEIGHT
      ) {
        this.addTriangle(
          leftX,
          finalLeftLandHeight,
          z,
          TerrainType.LAND,
          leftX,
          this.SIDE_BOTTOM_HEIGHT,
          z,
          TerrainType.LAND,
          rightX,
          finalRightLandHeight,
          z,
          TerrainType.LAND,
        );

        this.addTriangle(
          leftX,
          this.SIDE_BOTTOM_HEIGHT,
          z,
          TerrainType.LAND,
          rightX,
          this.SIDE_BOTTOM_HEIGHT,
          z,
          TerrainType.LAND,
          rightX,
          finalRightLandHeight,
          z,
          TerrainType.LAND,
        );
      }

      if (
        leftWaterHeight > 0.0 &&
        rightWaterHeight > 0.0 &&
        neighboringWaterHeight > 0.0
      ) {
        this.addTriangle(
          leftX,
          leftTotalHeight,
          z,
          TerrainType.WATER,
          leftX,
          finalLeftLandHeight,
          z,
          TerrainType.WATER,
          rightX,
          rightTotalHeight,
          z,
          TerrainType.WATER,
        );

        this.addTriangle(
          leftX,
          finalLeftLandHeight,
          z,
          TerrainType.WATER,
          rightX,
          finalRightLandHeight,
          z,
          TerrainType.WATER,
          rightX,
          rightTotalHeight,
          z,
          TerrainType.WATER,
        );
      }
    }
  }

  private addSouthVerticalFace(terrain: Terrain, triangleWidth: number): void {
    const z = terrain.minZ();

    for (let x = terrain.minX(); x < terrain.maxX(); x += triangleWidth) {
      const leftX = x;
      const rightX = x + triangleWidth;

      const leftLandHeight = Math.max(
        this.SIDE_BOTTOM_HEIGHT,
        terrain.landHeightAt(leftX, z) || 0,
      );
      const leftWaterHeight = Math.min(
        this.MAX_WATER_HEIGHT,
        terrain.waterHeightAt(leftX, z) || 0,
      );
      const leftTotalHeight = leftLandHeight + leftWaterHeight;
      const rightLandHeight = Math.max(
        this.SIDE_BOTTOM_HEIGHT,
        terrain.landHeightAt(rightX, z) || 0,
      );
      const rightWaterHeight = Math.min(
        this.MAX_WATER_HEIGHT,
        terrain.waterHeightAt(rightX, z) || 0,
      );
      const rightTotalHeight = rightLandHeight + rightWaterHeight;
      const neighboringWaterHeight = terrain.waterHeightAt(leftX, z + 1) || 0;

      let finalLeftLandHeight = leftLandHeight;
      let finalRightLandHeight = rightLandHeight;

      if (
        leftWaterHeight === 0.0 ||
        rightWaterHeight === 0.0 ||
        neighboringWaterHeight === 0.0
      ) {
        finalLeftLandHeight = leftTotalHeight;
        finalRightLandHeight = rightTotalHeight;
      }

      if (
        leftWaterHeight !== this.MAX_WATER_HEIGHT ||
        rightWaterHeight !== this.MAX_WATER_HEIGHT
      ) {
        this.addTriangle(
          rightX,
          finalRightLandHeight,
          z,
          TerrainType.LAND,
          leftX,
          this.SIDE_BOTTOM_HEIGHT,
          z,
          TerrainType.LAND,
          leftX,
          finalLeftLandHeight,
          z,
          TerrainType.LAND,
        );

        this.addTriangle(
          leftX,
          this.SIDE_BOTTOM_HEIGHT,
          z,
          TerrainType.LAND,
          rightX,
          finalRightLandHeight,
          z,
          TerrainType.LAND,
          rightX,
          this.SIDE_BOTTOM_HEIGHT,
          z,
          TerrainType.LAND,
        );
      }

      if (
        leftWaterHeight > 0.0 &&
        rightWaterHeight > 0.0 &&
        neighboringWaterHeight > 0.0
      ) {
        this.addTriangle(
          rightX,
          rightTotalHeight,
          z,
          TerrainType.WATER,
          leftX,
          finalLeftLandHeight,
          z,
          TerrainType.WATER,
          leftX,
          leftTotalHeight,
          z,
          TerrainType.WATER,
        );

        this.addTriangle(
          leftX,
          finalLeftLandHeight,
          z,
          TerrainType.WATER,
          rightX,
          rightTotalHeight,
          z,
          TerrainType.WATER,
          rightX,
          finalRightLandHeight,
          z,
          TerrainType.WATER,
        );
      }
    }
  }

  private addWestVerticalFace(terrain: Terrain, triangleDepth: number): void {
    const x = terrain.minX();

    for (let z = terrain.minZ(); z < terrain.maxZ(); z += triangleDepth) {
      const topZ = z;
      const bottomZ = z + triangleDepth;

      const topLandHeight = Math.max(
        this.SIDE_BOTTOM_HEIGHT,
        terrain.landHeightAt(x, topZ) || 0,
      );
      const topWaterHeight = Math.min(
        this.MAX_WATER_HEIGHT,
        terrain.waterHeightAt(x, topZ) || 0,
      );
      const topTotalHeight = topLandHeight + topWaterHeight;
      const bottomLandHeight = Math.max(
        this.SIDE_BOTTOM_HEIGHT,
        terrain.landHeightAt(x, bottomZ) || 0,
      );
      const bottomWaterHeight = Math.min(
        this.MAX_WATER_HEIGHT,
        terrain.waterHeightAt(x, bottomZ) || 0,
      );
      const bottomTotalHeight = bottomLandHeight + bottomWaterHeight;
      const neighboringWaterHeight = terrain.waterHeightAt(x + 1, topZ) || 0;

      let finalTopLandHeight = topLandHeight;
      let finalBottomLandHeight = bottomLandHeight;

      if (
        topWaterHeight === 0.0 ||
        bottomWaterHeight === 0.0 ||
        neighboringWaterHeight === 0.0
      ) {
        finalTopLandHeight = topTotalHeight;
        finalBottomLandHeight = bottomTotalHeight;
      }

      if (
        topWaterHeight !== this.MAX_WATER_HEIGHT ||
        bottomWaterHeight !== this.MAX_WATER_HEIGHT
      ) {
        this.addTriangle(
          x,
          this.SIDE_BOTTOM_HEIGHT,
          topZ,
          TerrainType.LAND,
          x,
          finalBottomLandHeight,
          bottomZ,
          TerrainType.LAND,
          x,
          finalTopLandHeight,
          topZ,
          TerrainType.LAND,
        );

        this.addTriangle(
          x,
          this.SIDE_BOTTOM_HEIGHT,
          topZ,
          TerrainType.LAND,
          x,
          this.SIDE_BOTTOM_HEIGHT,
          bottomZ,
          TerrainType.LAND,
          x,
          finalBottomLandHeight,
          bottomZ,
          TerrainType.LAND,
        );
      }

      if (
        topWaterHeight > 0.0 &&
        bottomWaterHeight > 0.0 &&
        neighboringWaterHeight > 0.0
      ) {
        this.addTriangle(
          x,
          finalTopLandHeight,
          topZ,
          TerrainType.WATER,
          x,
          bottomTotalHeight,
          bottomZ,
          TerrainType.WATER,
          x,
          topTotalHeight,
          topZ,
          TerrainType.WATER,
        );

        this.addTriangle(
          x,
          finalTopLandHeight,
          topZ,
          TerrainType.WATER,
          x,
          finalBottomLandHeight,
          bottomZ,
          TerrainType.WATER,
          x,
          bottomTotalHeight,
          bottomZ,
          TerrainType.WATER,
        );
      }
    }
  }

  private addEastVerticalFace(terrain: Terrain, triangleDepth: number): void {
    const x = terrain.maxX();

    for (let z = terrain.minZ(); z < terrain.maxZ(); z += triangleDepth) {
      const topZ = z;
      const bottomZ = z + triangleDepth;

      const topLandHeight = Math.max(
        this.SIDE_BOTTOM_HEIGHT,
        terrain.landHeightAt(x, topZ) || 0,
      );
      const topWaterHeight = Math.min(
        this.MAX_WATER_HEIGHT,
        terrain.waterHeightAt(x, topZ) || 0,
      );
      const topTotalHeight = topLandHeight + topWaterHeight;
      const bottomLandHeight = Math.max(
        this.SIDE_BOTTOM_HEIGHT,
        terrain.landHeightAt(x, bottomZ) || 0,
      );
      const bottomWaterHeight = Math.min(
        this.MAX_WATER_HEIGHT,
        terrain.waterHeightAt(x, bottomZ) || 0,
      );
      const bottomTotalHeight = bottomLandHeight + bottomWaterHeight;
      const neighboringWaterHeight = terrain.waterHeightAt(x - 1, bottomZ) || 0;

      let finalTopLandHeight = topLandHeight;
      let finalBottomLandHeight = bottomLandHeight;

      if (
        topWaterHeight === 0.0 ||
        bottomWaterHeight === 0.0 ||
        neighboringWaterHeight === 0.0
      ) {
        finalTopLandHeight = topTotalHeight;
        finalBottomLandHeight = bottomTotalHeight;
      }

      if (
        topWaterHeight !== this.MAX_WATER_HEIGHT ||
        bottomWaterHeight !== this.MAX_WATER_HEIGHT
      ) {
        this.addTriangle(
          x,
          finalTopLandHeight,
          topZ,
          TerrainType.LAND,
          x,
          finalBottomLandHeight,
          bottomZ,
          TerrainType.LAND,
          x,
          this.SIDE_BOTTOM_HEIGHT,
          topZ,
          TerrainType.LAND,
        );

        this.addTriangle(
          x,
          finalBottomLandHeight,
          bottomZ,
          TerrainType.LAND,
          x,
          this.SIDE_BOTTOM_HEIGHT,
          bottomZ,
          TerrainType.LAND,
          x,
          this.SIDE_BOTTOM_HEIGHT,
          topZ,
          TerrainType.LAND,
        );
      }

      if (
        topWaterHeight > 0.0 &&
        bottomWaterHeight > 0.0 &&
        neighboringWaterHeight > 0.0
      ) {
        this.addTriangle(
          x,
          topTotalHeight,
          topZ,
          TerrainType.WATER,
          x,
          bottomTotalHeight,
          bottomZ,
          TerrainType.WATER,
          x,
          finalTopLandHeight,
          topZ,
          TerrainType.WATER,
        );

        this.addTriangle(
          x,
          bottomTotalHeight,
          bottomZ,
          TerrainType.WATER,
          x,
          finalBottomLandHeight,
          bottomZ,
          TerrainType.WATER,
          x,
          finalTopLandHeight,
          topZ,
          TerrainType.WATER,
        );
      }
    }
  }

  private addMainTerrain(
    terrain: Terrain,
    roadNetwork: RoadNetwork,
    triangleWidth: number,
    triangleDepth: number,
  ): void {
    for (let x = terrain.minX(); x < terrain.maxX(); x += triangleWidth) {
      for (let z = terrain.minZ(); z < terrain.maxZ(); z += triangleDepth) {
        const topLeftX = x;
        const topLeftZ = z;
        const topRightX = x + triangleWidth;
        const topRightZ = z;
        const bottomLeftX = x;
        const bottomLeftZ = z + triangleDepth;
        const bottomRightX = x + triangleWidth;
        const bottomRightZ = z + triangleDepth;

        const topLeftLandHeight = terrain.landHeightAt(topLeftX, topLeftZ) || 0;
        const topLeftWaterHeight =
          terrain.waterHeightAt(topLeftX, topLeftZ) || 0;
        const topLeftTotalHeight = topLeftLandHeight + topLeftWaterHeight;

        const topRightLandHeight =
          terrain.landHeightAt(topRightX, topRightZ) || 0;
        const topRightWaterHeight =
          terrain.waterHeightAt(topRightX, topRightZ) || 0;
        const topRightTotalHeight = topRightLandHeight + topRightWaterHeight;

        const bottomLeftLandHeight =
          terrain.landHeightAt(bottomLeftX, bottomLeftZ) || 0;
        const bottomLeftWaterHeight =
          terrain.waterHeightAt(bottomLeftX, bottomLeftZ) || 0;
        const bottomLeftTotalHeight =
          bottomLeftLandHeight + bottomLeftWaterHeight;

        const bottomRightLandHeight =
          terrain.landHeightAt(bottomRightX, bottomRightZ) || 0;
        const bottomRightWaterHeight =
          terrain.waterHeightAt(bottomRightX, bottomRightZ) || 0;
        const bottomRightTotalHeight =
          bottomRightLandHeight + bottomRightWaterHeight;

        // Land triangles
        this.addTriangle(
          topLeftX,
          topLeftLandHeight,
          topLeftZ,
          TerrainType.LAND,
          bottomLeftX,
          bottomLeftLandHeight,
          bottomLeftZ,
          TerrainType.LAND,
          topRightX,
          topRightLandHeight,
          topRightZ,
          TerrainType.LAND,
        );

        this.addTriangle(
          bottomLeftX,
          bottomLeftLandHeight,
          bottomLeftZ,
          TerrainType.LAND,
          bottomRightX,
          bottomRightLandHeight,
          bottomRightZ,
          TerrainType.LAND,
          topRightX,
          topRightLandHeight,
          topRightZ,
          TerrainType.LAND,
        );

        // Water triangles (if any water exists)
        if (
          topLeftWaterHeight > 0.0 ||
          topRightWaterHeight > 0.0 ||
          bottomLeftWaterHeight > 0.0 ||
          bottomRightWaterHeight > 0.0
        ) {
          this.addTriangle(
            topLeftX,
            topLeftTotalHeight,
            topLeftZ,
            TerrainType.WATER,
            bottomLeftX,
            bottomLeftTotalHeight,
            bottomLeftZ,
            TerrainType.WATER,
            topRightX,
            topRightTotalHeight,
            topRightZ,
            TerrainType.WATER,
          );

          this.addTriangle(
            bottomLeftX,
            bottomLeftTotalHeight,
            bottomLeftZ,
            TerrainType.WATER,
            bottomRightX,
            bottomRightTotalHeight,
            bottomRightZ,
            TerrainType.WATER,
            topRightX,
            topRightTotalHeight,
            topRightZ,
            TerrainType.WATER,
          );
        }
      }
    }
  }

  private disposeArray(this: { array: Float32Array | null }): void {
    this.array = null;
  }
}

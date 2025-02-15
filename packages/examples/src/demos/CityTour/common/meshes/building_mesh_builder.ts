import * as THREE from 'three';

import { Config } from '../config';
import { Building, Buildings } from '../generators/buildings_generator';

interface Dimensions {
  width: number;
  depth: number;
  midpointX: number;
  midpointZ: number;
}

interface Lot extends Building {
  dimensions: Dimensions;
  height: number;
  yFloor: number;
  roofStyle: string;
}

const ANTENNA_WIDTH = 0.023570226039552;
const ANTENNA_DEPTH = 0.023570226039552;
const ANTENNA_HEIGHT = 0.833333333333333;
const ANTENNA_Y_CENTER_OFFSET = 0.416666666666667;

interface BuildingMeshBuilderInterface {
  build: (buildings: Buildings) => THREE.Mesh[];
}

export class BuildingMeshBuilder implements BuildingMeshBuilderInterface {
  public build(buildings: Buildings): THREE.Mesh[] {
    const INSTANCE_COUNT = buildings.buildingCount + buildings.antennaCount;

    const buildingsGeometry = this.buildBuildingsBufferGeometry();
    const buildingsMaterial = new THREE.MeshLambertMaterial({
      vertexColors: true,
    });
    const buildingsMesh = new THREE.InstancedMesh(
      buildingsGeometry,
      buildingsMaterial,
      INSTANCE_COUNT,
    );
    const buildingPrototype = new THREE.Object3D();
    const colorAttributes = new Float32Array(INSTANCE_COUNT * 3);
    const color = new THREE.Color();

    const minX = buildings.boundingBox.minX;
    const maxX = buildings.boundingBox.maxX;
    const minZ = buildings.boundingBox.minZ;
    const maxZ = buildings.boundingBox.maxZ;

    let instanceIndex = 0;
    let gray: number;

    for (let x = minX; x <= maxX; x++) {
      const leftX = x + Config.HALF_STREET_WIDTH;

      for (let z = minZ; z <= maxZ; z++) {
        const topZ = z + Config.HALF_STREET_DEPTH;

        const block = buildings.blockAtCoordinates(x, z);
        for (let l = 0; l < block.length; l++) {
          const lot = block[l] as unknown as Lot;

          buildingPrototype.position.x =
            leftX + Config.BLOCK_WIDTH * lot.dimensions.midpointX;
          buildingPrototype.position.y = lot.height / 2 + lot.yFloor;
          buildingPrototype.position.z =
            topZ + Config.BLOCK_DEPTH * lot.dimensions.midpointZ;

          buildingPrototype.scale.x = lot.dimensions.width * Config.BLOCK_WIDTH;
          buildingPrototype.scale.y = lot.height;
          buildingPrototype.scale.z = lot.dimensions.depth * Config.BLOCK_DEPTH;

          buildingPrototype.updateMatrix();
          buildingsMesh.setMatrixAt(instanceIndex, buildingPrototype.matrix);

          gray = Math.random();
          color.setRGB(gray, gray, gray);
          color.toArray(colorAttributes, instanceIndex * 3);

          instanceIndex += 1;

          if (lot.roofStyle === 'antenna') {
            buildingPrototype.position.y =
              lot.yFloor + lot.height + ANTENNA_Y_CENTER_OFFSET;

            buildingPrototype.scale.x = ANTENNA_WIDTH;
            buildingPrototype.scale.y = ANTENNA_HEIGHT;
            buildingPrototype.scale.z = ANTENNA_DEPTH;

            buildingPrototype.updateMatrix();
            buildingsMesh.setMatrixAt(instanceIndex, buildingPrototype.matrix);

            color.toArray(colorAttributes, instanceIndex * 3);

            instanceIndex += 1;
          }
        }
      }
    }

    if (instanceIndex !== INSTANCE_COUNT) {
      throw new Error(
        `Expected ${INSTANCE_COUNT} building instances to be created, but ${instanceIndex} were.`,
      );
    }

    buildingsGeometry.setAttribute(
      'color',
      new THREE.InstancedBufferAttribute(colorAttributes, 3).onUpload(
        this.disposeArray,
      ),
    );

    return [buildingsMesh];
  }

  private buildBuildingsBufferGeometry(): THREE.BufferGeometry {
    const buildingsGeometry = new THREE.BufferGeometry();

    // Purposely does not include triangles for the floor,
    // since floors should never be visible.
    const vertices = new Float32Array([
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5,

      0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5,

      0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5,

      -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5,

      -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,

      -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5,

      0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5,

      0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,

      0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5,

      0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    ]);

    const normals = new Float32Array([
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,

      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    ]);

    buildingsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(vertices, 3).onUpload(this.disposeArray),
    );
    buildingsGeometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(normals, 3).onUpload(this.disposeArray),
    );

    return buildingsGeometry;
  }

  private disposeArray(this: { array: Float32Array | null }): void {
    this.array = null;
  }
}

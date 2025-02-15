import * as THREE from 'three';

import { Config } from '../config';
import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

const SIDEWALK_WIDTH = Config.STREET_WIDTH * 0.24;
const SIDEWALK_DEPTH = Config.STREET_DEPTH * 0.24;

const HALF_ROADBED_WIDTH = Config.HALF_STREET_WIDTH - SIDEWALK_WIDTH;
const HALF_ROADBED_DEPTH = Config.HALF_STREET_DEPTH - SIDEWALK_DEPTH;

const HALF_BRIDGE_SUPPORT_COLUMN_WIDTH = 0.0375;
const HALF_BRIDGE_SUPPORT_COLUMN_DEPTH = 0.0375;
const BRIDGE_SUPPORT_COLUMN_BOTTOM_Y = 0.0;

const HALF_GUARDRAIL_HEIGHT = 0.025;

interface RoadMeshBuilderInterface {
  build: (terrain: Terrain, roadNetwork: RoadNetwork) => THREE.Mesh[];
}

export class RoadMeshBuilder implements RoadMeshBuilderInterface {
  public build(terrain: Terrain, roadNetwork: RoadNetwork): THREE.Mesh[] {
    const roadGeometry = new THREE.BufferGeometry();
    const roadPositionAttributes: number[] = [];
    const roadMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa,
      side: THREE.DoubleSide,
    });

    const sidewalkGeometry = new THREE.BufferGeometry();
    const sidewalkPositionAttributes: number[] = [];
    const sidewalkMaterial = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      side: THREE.DoubleSide,
    });

    const guardrailGeometry = new THREE.BufferGeometry();
    const guardrailPositionAttributes: number[] = [];
    const guardrailMaterial = new THREE.MeshBasicMaterial({
      color: 0xbbbbbb,
      side: THREE.DoubleSide,
    });

    let positionAttributes: number[];

    let northRoad: boolean,
      eastRoad: boolean,
      southRoad: boolean,
      westRoad: boolean;
    let selfSurfaceHeight: number | undefined,
      southSurfaceHeight: number | undefined,
      eastSurfaceHeight: number | undefined;

    const minX = roadNetwork.minBoundingX();
    const maxX = roadNetwork.maxBoundingX();
    const minZ = roadNetwork.minBoundingZ();
    const maxZ = roadNetwork.maxBoundingZ();

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (roadNetwork.hasIntersection(x, z)) {
          selfSurfaceHeight = roadNetwork.getRoadHeight(x, z);

          if (selfSurfaceHeight === undefined) continue;

          northRoad = roadNetwork.hasEdgeBetween(x, z, x, z - 1);
          eastRoad = roadNetwork.hasEdgeBetween(x, z, x + 1, z);
          southRoad = roadNetwork.hasEdgeBetween(x, z, x, z + 1);
          westRoad = roadNetwork.hasEdgeBetween(x, z, x - 1, z);

          // Road intersection
          this.addQuad(
            roadPositionAttributes,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
          );

          // Northwest sidewalk corner
          this.addQuad(
            sidewalkPositionAttributes,
            x - Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z - Config.HALF_STREET_DEPTH,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - Config.HALF_STREET_DEPTH,
            x - Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
          );

          // Northeast sidewalk corner
          this.addQuad(
            sidewalkPositionAttributes,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - Config.HALF_STREET_DEPTH,
            x + Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z - Config.HALF_STREET_DEPTH,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
            x + Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
          );

          // Southwest sidewalk corner
          this.addQuad(
            sidewalkPositionAttributes,
            x - Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
            x - Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z + Config.HALF_STREET_DEPTH,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + Config.HALF_STREET_DEPTH,
          );

          // Southeast sidewalk corner
          this.addQuad(
            sidewalkPositionAttributes,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
            x + Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + Config.HALF_STREET_DEPTH,
            x + Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z + Config.HALF_STREET_DEPTH,
          );

          if (
            roadNetwork.getIntersectionGradeType(x, z) ===
            RoadNetwork.BRIDGE_GRADE
          ) {
            // North bridge support column wall
            this.addQuad(
              sidewalkPositionAttributes,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              selfSurfaceHeight,
              z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              selfSurfaceHeight,
              z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              BRIDGE_SUPPORT_COLUMN_BOTTOM_Y,
              z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              BRIDGE_SUPPORT_COLUMN_BOTTOM_Y,
              z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
            );

            // South bridge support column wall
            this.addQuad(
              sidewalkPositionAttributes,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              selfSurfaceHeight,
              z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              selfSurfaceHeight,
              z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              BRIDGE_SUPPORT_COLUMN_BOTTOM_Y,
              z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              BRIDGE_SUPPORT_COLUMN_BOTTOM_Y,
              z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
            );

            // West bridge support column wall
            this.addQuad(
              sidewalkPositionAttributes,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              selfSurfaceHeight,
              z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              selfSurfaceHeight,
              z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              BRIDGE_SUPPORT_COLUMN_BOTTOM_Y,
              z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x - HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              BRIDGE_SUPPORT_COLUMN_BOTTOM_Y,
              z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
            );

            // East bridge support column wall
            this.addQuad(
              sidewalkPositionAttributes,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              selfSurfaceHeight,
              z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              selfSurfaceHeight,
              z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              BRIDGE_SUPPORT_COLUMN_BOTTOM_Y,
              z - HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
              x + HALF_BRIDGE_SUPPORT_COLUMN_WIDTH,
              BRIDGE_SUPPORT_COLUMN_BOTTOM_Y,
              z + HALF_BRIDGE_SUPPORT_COLUMN_DEPTH,
            );

            // Guardrail
            if (northRoad === true && southRoad === true) {
              // West guardrail
              this.addQuad(
                guardrailPositionAttributes,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
              );

              // East guardrail
              this.addQuad(
                guardrailPositionAttributes,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
              );
            } else if (eastRoad === true && westRoad === true) {
              // North guardrail
              this.addQuad(
                guardrailPositionAttributes,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
              );

              // South guardrail
              this.addQuad(
                guardrailPositionAttributes,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
              );
            }
          }

          // North sidewalk "filler"
          positionAttributes =
            northRoad === true
              ? roadPositionAttributes
              : sidewalkPositionAttributes;
          this.addQuad(
            positionAttributes,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - Config.HALF_STREET_DEPTH,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - Config.HALF_STREET_DEPTH,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
          );

          // South sidewalk "filler"
          positionAttributes =
            southRoad === true
              ? roadPositionAttributes
              : sidewalkPositionAttributes;
          this.addQuad(
            positionAttributes,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + Config.HALF_STREET_DEPTH,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + Config.HALF_STREET_DEPTH,
          );

          // West sidewalk "filler"
          positionAttributes =
            westRoad === true
              ? roadPositionAttributes
              : sidewalkPositionAttributes;
          this.addQuad(
            positionAttributes,
            x - Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
            x - Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
            x - HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
          );

          // East sidewalk "filler"
          positionAttributes =
            eastRoad === true
              ? roadPositionAttributes
              : sidewalkPositionAttributes;
          this.addQuad(
            positionAttributes,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
            x + Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z - HALF_ROADBED_DEPTH,
            x + HALF_ROADBED_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
            x + Config.HALF_STREET_WIDTH,
            selfSurfaceHeight,
            z + HALF_ROADBED_DEPTH,
          );

          // Road segment going south from the intersection
          if (southRoad === true) {
            southSurfaceHeight = roadNetwork.getRoadHeight(x, z + 1);

            if (southSurfaceHeight === undefined) continue;

            // Main road surface
            this.addQuad(
              roadPositionAttributes,
              x - HALF_ROADBED_WIDTH,
              selfSurfaceHeight,
              z + Config.HALF_STREET_DEPTH,
              x + HALF_ROADBED_WIDTH,
              selfSurfaceHeight,
              z + Config.HALF_STREET_DEPTH,
              x - HALF_ROADBED_WIDTH,
              southSurfaceHeight,
              z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              x + HALF_ROADBED_WIDTH,
              southSurfaceHeight,
              z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
            );

            // West sidewalk
            this.addQuad(
              sidewalkPositionAttributes,
              x - Config.HALF_STREET_WIDTH,
              selfSurfaceHeight,
              z + Config.HALF_STREET_DEPTH,
              x - HALF_ROADBED_WIDTH,
              selfSurfaceHeight,
              z + Config.HALF_STREET_DEPTH,
              x - Config.HALF_STREET_WIDTH,
              southSurfaceHeight,
              z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              x - HALF_ROADBED_WIDTH,
              southSurfaceHeight,
              z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
            );

            // East sidewalk
            this.addQuad(
              sidewalkPositionAttributes,
              x + HALF_ROADBED_WIDTH,
              selfSurfaceHeight,
              z + Config.HALF_STREET_DEPTH,
              x + Config.HALF_STREET_WIDTH,
              selfSurfaceHeight,
              z + Config.HALF_STREET_DEPTH,
              x + HALF_ROADBED_WIDTH,
              southSurfaceHeight,
              z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              x + Config.HALF_STREET_WIDTH,
              southSurfaceHeight,
              z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
            );

            if (
              roadNetwork.edgeBetween(x, z, x, z + 1)?.gradeType ===
              RoadNetwork.BRIDGE_GRADE
            ) {
              // West guardrail
              this.addQuad(
                guardrailPositionAttributes,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH,
                southSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
                x - Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x - Config.HALF_STREET_WIDTH,
                southSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              );

              // East guardrail
              this.addQuad(
                guardrailPositionAttributes,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                southSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                southSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH + Config.BLOCK_DEPTH,
              );
            }
          }

          // Road segment going east from the intersection
          if (eastRoad === true) {
            eastSurfaceHeight = roadNetwork.getRoadHeight(x + 1, z);

            if (eastSurfaceHeight === undefined) continue;

            // Main road surface
            this.addQuad(
              roadPositionAttributes,
              x + Config.HALF_STREET_WIDTH,
              selfSurfaceHeight,
              z - HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
              eastSurfaceHeight,
              z - HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH,
              selfSurfaceHeight,
              z + HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
              eastSurfaceHeight,
              z + HALF_ROADBED_DEPTH,
            );

            // North sidewalk
            this.addQuad(
              sidewalkPositionAttributes,
              x + Config.HALF_STREET_WIDTH,
              selfSurfaceHeight,
              z - Config.HALF_STREET_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
              eastSurfaceHeight,
              z - Config.HALF_STREET_DEPTH,
              x + Config.HALF_STREET_WIDTH,
              selfSurfaceHeight,
              z - HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
              eastSurfaceHeight,
              z - HALF_ROADBED_DEPTH,
            );

            // South sidewalk
            this.addQuad(
              sidewalkPositionAttributes,
              x + Config.HALF_STREET_WIDTH,
              selfSurfaceHeight,
              z + HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
              eastSurfaceHeight,
              z + HALF_ROADBED_DEPTH,
              x + Config.HALF_STREET_WIDTH,
              selfSurfaceHeight,
              z + Config.HALF_STREET_DEPTH,
              x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
              eastSurfaceHeight,
              z + Config.HALF_STREET_DEPTH,
            );

            if (
              roadNetwork.edgeBetween(x, z, x + 1, z)?.gradeType ===
              RoadNetwork.BRIDGE_GRADE
            ) {
              // North guardrail
              this.addQuad(
                guardrailPositionAttributes,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
                eastSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
                eastSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z - Config.HALF_STREET_DEPTH,
              );

              // South guardrail
              this.addQuad(
                guardrailPositionAttributes,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
                eastSurfaceHeight + HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH,
                selfSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
                x + Config.HALF_STREET_WIDTH + Config.BLOCK_WIDTH,
                eastSurfaceHeight - HALF_GUARDRAIL_HEIGHT,
                z + Config.HALF_STREET_DEPTH,
              );
            }
          }
        }
      }
    }

    roadGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(roadPositionAttributes, 3).onUpload(
        this.disposeArray,
      ),
    );
    sidewalkGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(sidewalkPositionAttributes, 3).onUpload(
        this.disposeArray,
      ),
    );
    guardrailGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(guardrailPositionAttributes, 3).onUpload(
        this.disposeArray,
      ),
    );

    return [
      new THREE.Mesh(roadGeometry, roadMaterial),
      new THREE.Mesh(sidewalkGeometry, sidewalkMaterial),
      new THREE.Mesh(guardrailGeometry, guardrailMaterial),
    ];
  }

  private addQuad(
    positionAttributes: number[],
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    x3: number,
    y3: number,
    z3: number,
    x4: number,
    y4: number,
    z4: number,
  ): void {
    positionAttributes.push(
      x1,
      y1,
      z1,
      x2,
      y2,
      z2,
      x3,
      y3,
      z3,
      x2,
      y2,
      z2,
      x4,
      y4,
      z4,
      x3,
      y3,
      z3,
    );
  }

  private disposeArray(this: { array: Float32Array | null }): void {
    this.array = null;
  }
}

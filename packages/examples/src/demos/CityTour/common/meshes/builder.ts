import * as THREE from 'three';

import { Config } from '../config';
import { Buildings } from '../generators/buildings_generator';
import { Neighborhood } from '../generators/neighborhood_generator';
import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

import { BuildingMeshBuilder } from './building_mesh_builder';
import { RoadMeshBuilder } from './road_mesh_builder';
import { TerrainMeshBuilder } from './terrain_mesh_builder';

const CITY_CENTER_NEIGHBORHOOD_MARKER_COLOR = Object.freeze([1.0, 1.0, 0.0]);
const GENERIC_NEIGHBORHOOD_MARKER_COLOR = Object.freeze([1.0, 0.0, 1.0]);

interface BuilderInterface {
  buildEmptyScene: () => THREE.Scene;
  buildGridPlaneMeshes: () => THREE.Mesh[];
  buildTerrainMeshes: (
    terrain: Terrain,
    roadNetwork: RoadNetwork,
  ) => THREE.Mesh[];
  buildRoadNetworkMeshes: (
    terrain: Terrain,
    roadNetwork: RoadNetwork,
  ) => THREE.Mesh[];
  buildBuildingMeshes: (buildings: Buildings) => THREE.Mesh[];
  buildNeighborhoodCentersMeshes: (
    terrain: Terrain,
    neighborhoods: Neighborhood[],
  ) => THREE.Mesh[];
  buildRouteCurveMeshes: (
    routeCurves: THREE.Curve<THREE.Vector3>[],
  ) => THREE.Mesh[];
}

export class Builder implements BuilderInterface {
  constructor(private gridTexture: THREE.Texture) {}

  private disposeArray(this: { array: Float32Array | null }): void {
    this.array = null;
  }

  public buildEmptyScene(): THREE.Scene {
    const scene = new THREE.Scene();

    const light = new THREE.HemisphereLight(0xffffff, 0xffffff, Math.PI);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
    directionalLight.position.set(-1, 0.9, 0.9);
    scene.add(directionalLight);

    return scene;
  }

  public buildGridPlaneMeshes(): THREE.Mesh[] {
    const gridPlaneGeometry = new THREE.PlaneGeometry(320, 320, 1, 1);
    const gridPlaneMaterial = new THREE.MeshBasicMaterial({
      map: this.gridTexture,
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    const gridPlaneMesh = new THREE.Mesh(gridPlaneGeometry, gridPlaneMaterial);

    gridPlaneMesh.position.y = Config.SIDEWALL_BOTTOM;
    gridPlaneMesh.rotation.x = -Math.PI / 2;

    return [gridPlaneMesh];
  }

  public buildTerrainMeshes(
    terrain: Terrain,
    roadNetwork: RoadNetwork,
  ): THREE.Mesh[] {
    return new TerrainMeshBuilder().build(terrain, roadNetwork);
  }

  public buildRoadNetworkMeshes(
    terrain: Terrain,
    roadNetwork: RoadNetwork,
  ): THREE.Mesh[] {
    return new RoadMeshBuilder().build(terrain, roadNetwork);
  }

  public buildBuildingMeshes(buildings: Buildings): THREE.Mesh[] {
    return new BuildingMeshBuilder().build(buildings);
  }

  public buildNeighborhoodCentersMeshes(
    terrain: Terrain,
    neighborhoods: Neighborhood[],
  ): THREE.Mesh[] {
    const neighborhoodCentersGeometry = new THREE.BoxGeometry(0.5, 15, 0.5);
    const neighborhoodCentersMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
    });
    const neighborhoodCentersMesh = new THREE.InstancedMesh(
      neighborhoodCentersGeometry,
      neighborhoodCentersMaterial,
      neighborhoods.length,
    );
    const neighborhoodCenterPrototype = new THREE.Object3D();
    const colorAttributes = new Float32Array(neighborhoods.length * 3);

    for (let i = 0; i < neighborhoods.length; i++) {
      neighborhoodCenterPrototype.position.x = neighborhoods[i].centerX;
      neighborhoodCenterPrototype.position.y =
        terrain.landHeightAt(
          neighborhoods[i].centerX,
          neighborhoods[i].centerZ,
        ) ?? 0;
      neighborhoodCenterPrototype.position.z = neighborhoods[i].centerZ;

      neighborhoodCenterPrototype.updateMatrix();
      neighborhoodCentersMesh.setMatrixAt(
        i,
        neighborhoodCenterPrototype.matrix,
      );
    }

    if (neighborhoods.length > 0) {
      colorAttributes.set(CITY_CENTER_NEIGHBORHOOD_MARKER_COLOR, 0);

      for (let i = 3; i < colorAttributes.length; i += 3) {
        colorAttributes.set(GENERIC_NEIGHBORHOOD_MARKER_COLOR, i);
      }
    }

    neighborhoodCentersGeometry.setAttribute(
      'color',
      new THREE.InstancedBufferAttribute(colorAttributes, 3).onUpload(
        this.disposeArray,
      ),
    );

    return [neighborhoodCentersMesh];
  }

  public buildRouteCurveMeshes(
    routeCurves: THREE.Curve<THREE.Vector3>[],
  ): THREE.Mesh[] {
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const meshes: THREE.Mesh[] = [];

    for (const routeCurve of routeCurves) {
      const tubeGeometry = new THREE.TubeGeometry(
        routeCurve,
        Math.ceil(routeCurve.getLength()) * 10,
        0.05,
        4,
        false,
      );
      meshes.push(new THREE.Mesh(tubeGeometry, tubeMaterial));
    }

    return meshes;
  }
}

import * as THREE from 'three';

import { Buildings } from '../generators/buildings_generator';
import { Neighborhood } from '../generators/neighborhood_generator';
import { Builder } from '../meshes/builder';
import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

import { RenderView } from './render_view';

interface WorldData {
  terrain: Terrain;
  roadNetwork: RoadNetwork;
  buildings: Buildings;
  neighborhoods: Neighborhood[];
}

interface SceneViewInterface {
  reset: (newWorldData: WorldData) => void;
  resize: () => void;
  render: () => void;
  camera: () => THREE.Camera;
  domElement: () => HTMLElement;
  scene: () => THREE.Scene;
  centerOfActionMarkerMesh: () => THREE.Mesh;
  touchPoint1MarkerMesh: () => THREE.Mesh;
  touchPoint2MarkerMesh: () => THREE.Mesh;
  setRouteCurves: (newRouteCurves: THREE.Curve<THREE.Vector3>[]) => void;
  isGestureMarkersVisible: () => boolean;
  setIsGestureMarkersVisible: (newIsGestureMarkersVisible: boolean) => void;
  isNeighborhoodCentersVisible: () => boolean;
  setIsNeighborhoodCentersVisible: (
    newIsNeighborhoodCentersVisible: boolean,
  ) => void;
  isRouteCurvesVisible: () => boolean;
  setIsRouteCurvesVisible: (newIsRouteCurvesVisible: boolean) => void;
}

class SceneView implements SceneViewInterface {
  private static readonly GRID_PLANE_MESH_GROUP_NAME = 'gridPlaneMeshes';
  private static readonly TERRAIN_MESH_GROUP_NAME = 'terrainMeshes';
  private static readonly ROAD_NETWORK_MESH_GROUP_NAME = 'roadNetworkMeshes';
  private static readonly BUILDINGS_MESH_GROUP_NAME = 'buildingMeshes';
  private static readonly GESTURE_MARKERS_MESH_GROUP_NAME =
    'gestureMarkerMeshes';
  private static readonly NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME =
    'neighborhoodCentersMeshes';
  private static readonly ROUTE_CURVES_MESH_GROUP_NAME = 'routeCurveMeshes';

  private readonly sceneBuilder: Builder;
  private readonly _scene: THREE.Scene;
  private readonly renderView: RenderView;
  private readonly _camera: THREE.Camera;

  private _centerOfActionMarkerMesh!: THREE.Mesh;
  private _touchPoint1MarkerMesh!: THREE.Mesh;
  private _touchPoint2MarkerMesh!: THREE.Mesh;

  private routeCurves: THREE.Curve<THREE.Vector3>[] = [];
  private _isGestureMarkersVisible = false;
  private _isNeighborhoodCentersVisible = false;
  private _isRouteCurvesVisible = false;

  constructor(containerEl: HTMLElement, gridTexture: THREE.Texture) {
    this.sceneBuilder = new Builder(gridTexture);
    this._scene = this.sceneBuilder.buildEmptyScene();
    this.renderView = new RenderView(containerEl, this._scene);
    this._camera = this.renderView.camera();

    gridTexture.anisotropy = Math.min(
      16,
      this.renderView.renderer().capabilities.getMaxAnisotropy(),
    );
    gridTexture.repeat = new THREE.Vector2(40, 40);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;

    window.addEventListener('resize', this.renderView.resize, false);

    this.buildGestureMarkerMeshes();
    this._scene.add(this.sceneBuilder.buildGridPlaneMeshes()[0]);
  }

  private buildGestureMarkerMeshes(): void {
    const GESTURE_MARKER_WIDTH = 0.2;
    const GESTURE_MARKER_DEPTH = 0.2;
    const GESTURE_MARKER_HEIGHT = 16;

    const gestureMarkersStartTime = new Date();

    const group = new THREE.Group();
    group.name = SceneView.GESTURE_MARKERS_MESH_GROUP_NAME;
    group.visible = this._isGestureMarkersVisible;

    this._centerOfActionMarkerMesh = new THREE.Mesh(
      new THREE.SphereGeometry(GESTURE_MARKER_WIDTH, 25, 25),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    );
    group.add(this._centerOfActionMarkerMesh);

    this._touchPoint1MarkerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        GESTURE_MARKER_WIDTH,
        GESTURE_MARKER_HEIGHT,
        GESTURE_MARKER_DEPTH,
      ),
      new THREE.MeshBasicMaterial({ color: 0xff0055 }),
    );
    group.add(this._touchPoint1MarkerMesh);

    this._touchPoint2MarkerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        GESTURE_MARKER_WIDTH,
        GESTURE_MARKER_HEIGHT,
        GESTURE_MARKER_DEPTH,
      ),
      new THREE.MeshBasicMaterial({ color: 0x0000ff }),
    );
    group.add(this._touchPoint2MarkerMesh);

    this._scene.add(group);

    const gestureMarkersEndTime = new Date();
    console.log(
      'Time to generate touch debug markers:   ' +
        (gestureMarkersEndTime.getTime() - gestureMarkersStartTime.getTime()) +
        'ms',
    );
  }

  private buildMeshGroup(groupName: string, meshes: THREE.Mesh[]): THREE.Group {
    const group = new THREE.Group();
    group.name = groupName;

    for (const mesh of meshes) {
      group.add(mesh);
    }

    return group;
  }

  private removeChildFromScene(obj: THREE.Object3D): void {
    for (let i = obj.children.length - 1; i >= 0; i--) {
      this.removeChildFromScene(obj.children[i]);
    }

    this._scene.remove(obj);
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      obj.geometry = null!;
      obj.material.dispose();
      obj.material = null!;
    }
  }

  private destroyPreviousMeshes(): void {
    const meshGroupNames = [
      SceneView.TERRAIN_MESH_GROUP_NAME,
      SceneView.ROAD_NETWORK_MESH_GROUP_NAME,
      SceneView.BUILDINGS_MESH_GROUP_NAME,
      SceneView.NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME,
      SceneView.ROUTE_CURVES_MESH_GROUP_NAME,
    ];

    for (const meshGroupName of meshGroupNames) {
      const meshGroup = this._scene.getObjectByName(meshGroupName);
      if (meshGroup !== undefined) {
        this.removeChildFromScene(meshGroup);
      }
    }
  }

  private syncRouteCurves(): void {
    const previousMeshGroup = this._scene.getObjectByName(
      SceneView.ROUTE_CURVES_MESH_GROUP_NAME,
    );

    if (previousMeshGroup !== undefined) {
      this.removeChildFromScene(previousMeshGroup);
    }

    if (this._isRouteCurvesVisible === true && this.routeCurves.length > 0) {
      const newRouteCurveMeshes = this.sceneBuilder.buildRouteCurveMeshes(
        this.routeCurves,
      );
      this._scene.add(
        this.buildMeshGroup(
          SceneView.ROUTE_CURVES_MESH_GROUP_NAME,
          newRouteCurveMeshes,
        ),
      );
    }
  }

  public reset(newWorldData: WorldData): void {
    const masterStartTime = new Date();
    let meshes: THREE.Mesh[];

    this.destroyPreviousMeshes();
    this.routeCurves = [];

    const terrainStartTime = new Date();
    meshes = this.sceneBuilder.buildTerrainMeshes(
      newWorldData.terrain,
      newWorldData.roadNetwork,
    );
    this._scene.add(
      this.buildMeshGroup(SceneView.TERRAIN_MESH_GROUP_NAME, meshes),
    );
    const terrainEndTime = new Date();

    const roadStartTime = new Date();
    meshes = this.sceneBuilder.buildRoadNetworkMeshes(
      newWorldData.terrain,
      newWorldData.roadNetwork,
    );
    this._scene.add(
      this.buildMeshGroup(SceneView.ROAD_NETWORK_MESH_GROUP_NAME, meshes),
    );
    const roadEndTime = new Date();

    const buildingsStartTime = new Date();
    meshes = this.sceneBuilder.buildBuildingMeshes(newWorldData.buildings);
    this._scene.add(
      this.buildMeshGroup(SceneView.BUILDINGS_MESH_GROUP_NAME, meshes),
    );
    const buildingsEndTime = new Date();

    meshes = this.sceneBuilder.buildNeighborhoodCentersMeshes(
      newWorldData.terrain,
      newWorldData.neighborhoods,
    );
    const neighborhoodCentersGroup = this.buildMeshGroup(
      SceneView.NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME,
      meshes,
    );
    neighborhoodCentersGroup.visible = this._isNeighborhoodCentersVisible;
    this._scene.add(neighborhoodCentersGroup);

    const masterEndTime = new Date();

    console.log(
      'Time to generate scene geometry: ' +
        (masterEndTime.getTime() - masterStartTime.getTime()) +
        'ms',
    );
    console.log(
      '  Terrain:   ' +
        (terrainEndTime.getTime() - terrainStartTime.getTime()) +
        'ms',
    );
    console.log(
      '  Roads:     ' +
        (roadEndTime.getTime() - roadStartTime.getTime()) +
        'ms',
    );
    console.log(
      '  Buildings: ' +
        (buildingsEndTime.getTime() - buildingsStartTime.getTime()) +
        'ms',
    );
  }

  public resize(): void {
    this.renderView.resize();
  }

  public render(): void {
    this.renderView.render();
  }

  public camera(): THREE.Camera {
    return this._camera;
  }

  public domElement(): HTMLElement {
    return this.renderView.domElement();
  }

  public scene(): THREE.Scene {
    return this._scene;
  }

  public centerOfActionMarkerMesh(): THREE.Mesh {
    return this._centerOfActionMarkerMesh;
  }

  public touchPoint1MarkerMesh(): THREE.Mesh {
    return this._touchPoint1MarkerMesh;
  }

  public touchPoint2MarkerMesh(): THREE.Mesh {
    return this._touchPoint2MarkerMesh;
  }

  public setRouteCurves(newRouteCurves: THREE.Curve<THREE.Vector3>[]): void {
    this.routeCurves = newRouteCurves;
    this.syncRouteCurves();
  }

  public isGestureMarkersVisible(): boolean {
    return this._isGestureMarkersVisible;
  }

  public setIsGestureMarkersVisible(newIsGestureMarkersVisible: boolean): void {
    this._isGestureMarkersVisible = newIsGestureMarkersVisible;

    const group = this._scene.getObjectByName(
      SceneView.GESTURE_MARKERS_MESH_GROUP_NAME,
    );
    if (group) {
      group.visible = newIsGestureMarkersVisible;
    }
    this.renderView.makeDirty();
  }

  public isNeighborhoodCentersVisible(): boolean {
    return this._isNeighborhoodCentersVisible;
  }

  public setIsNeighborhoodCentersVisible(
    newIsNeighborhoodCentersVisible: boolean,
  ): void {
    this._isNeighborhoodCentersVisible = newIsNeighborhoodCentersVisible;

    const group = this._scene.getObjectByName(
      SceneView.NEIGHBORHOOD_CENTERS_MESH_GROUP_NAME,
    );
    if (group) {
      group.visible = newIsNeighborhoodCentersVisible;
    }
    this.renderView.makeDirty();
  }

  public isRouteCurvesVisible(): boolean {
    return this._isRouteCurvesVisible;
  }

  public setIsRouteCurvesVisible(newIsRouteCurvesVisible: boolean): void {
    this._isRouteCurvesVisible = newIsRouteCurvesVisible;

    this.syncRouteCurves();
    this.renderView.makeDirty();
  }
}

export { SceneView, SceneViewInterface, WorldData };

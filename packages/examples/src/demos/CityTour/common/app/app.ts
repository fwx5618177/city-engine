// src/common/app.ts
import * as THREE from 'three';

import { Building, Buildings } from '../generators/buildings_generator';
import { Neighborhood } from '../generators/neighborhood_generator';
import { WorldConfig, WorldGenerator } from '../generators/world_generator';
import { MessageBroker } from '../message_broker';
import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

import { CityConfigService } from './city_config_service';
import { MapCamera } from './map_camera';
import { MenusController } from './menus_controller';
import { NavigationController } from './navigation_controller';
import { NavigationTouchController } from './navigation_touch_controller';
import { SceneView } from './scene_view';
import { TimerLoop } from './timer_loop';
import { WorldTouch, WorldTouchInterface } from './world_touch';

THREE.ColorManagement.enabled = false;

interface BuildingData extends Buildings {
  buildingCount: number;
  antennaCount: number;
  blockAtCoordinates: (x: number, z: number) => Building[];
  boundingBox: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

interface WorldData {
  terrain: Terrain;
  roadNetwork: RoadNetwork;
  buildings: BuildingData;
  neighborhoods: Neighborhood[];
}

export interface AppInterface {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  sceneView(): SceneView;
  mapCamera(): MapCamera;
  worldTouch(): WorldTouchInterface;
}

/**
 * App class encapsulates the entire city tour initialization and event handling logic.
 */
export class App implements AppInterface {
  private static readonly EMPTY_TERRAIN = new Terrain([[]], 1);
  private static readonly EMPTY_WORLD_DATA: WorldData = {
    terrain: App.EMPTY_TERRAIN,
    roadNetwork: new RoadNetwork(App.EMPTY_TERRAIN),
    buildings: {
      buildingCount: 0,
      antennaCount: 0,
      blockAtCoordinates: () => [],
      boundingBox: {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minZ: Number.POSITIVE_INFINITY,
        maxZ: Number.NEGATIVE_INFINITY,
      },
    },
    neighborhoods: [],
  };

  private readonly _sceneView: SceneView;
  private readonly _mapCamera: MapCamera;
  private readonly _worldTouch: WorldTouchInterface;
  private readonly navigationController: NavigationController;
  private readonly navigationTouchController: NavigationTouchController;
  private readonly timerLoop: TimerLoop;
  private readonly messageBroker: MessageBroker;
  private readonly cityConfigService: CityConfigService;
  private readonly menusController: MenusController;
  private currentWorldData: WorldData;

  private static detectWebGL(): boolean {
    if (!window.WebGLRenderingContext) {
      return false;
    }

    // Adapted from https://github.com/Modernizr/Modernizr/blob/master/feature-detects/webgl-extensions.js
    const canvas = document.createElement('canvas');
    const webgl_context =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return webgl_context !== null;
  }

  private static showLoadFailureMessage(): void {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
      loadingMessage.innerText =
        'This site is not compatible with your browser, because it requires WebGL.';
      loadingMessage.classList.add('flex');
      loadingMessage.classList.remove('display-none');
    }
  }

  /**
   * Constructor
   * @param containerEl - Container DOM element
   * @param gridTexture - Grid texture (usually loaded via TextureLoader)
   */
  constructor(containerEl: HTMLElement, gridTexture: THREE.Texture) {
    if (!App.detectWebGL()) {
      App.showLoadFailureMessage();
      throw new Error('WebGL not supported');
    }

    if (!containerEl) {
      throw new Error('Container element is required');
    }

    this.currentWorldData = App.EMPTY_WORLD_DATA;
    this.messageBroker = new MessageBroker();
    this.cityConfigService = new CityConfigService();

    // Initialize scene view
    this._sceneView = new SceneView(containerEl, gridTexture);

    // Initialize map camera
    this._mapCamera = new MapCamera(
      this._sceneView,
      this.currentWorldData.terrain,
      this.messageBroker,
    );

    // Initialize world touch
    this._worldTouch = WorldTouch(
      this._sceneView.camera(),
      new THREE.Vector3(0, 0, 0),
      this.currentWorldData.terrain,
    );

    // Initialize timer loop
    this.timerLoop = new TimerLoop(
      this.currentWorldData,
      this._sceneView,
      this._mapCamera,
      this.messageBroker,
    );

    // Initialize controllers
    this.menusController = new MenusController(
      this._sceneView,
      this.messageBroker,
    );

    this.navigationController = new NavigationController(
      this._sceneView,
      this._mapCamera,
      this.currentWorldData.terrain,
      this.timerLoop,
      this.messageBroker,
    );

    this.navigationTouchController = new NavigationTouchController(
      this._sceneView.camera(),
      this.currentWorldData.terrain,
      this.messageBroker,
    );

    this.setupEventListeners(containerEl);
    this.setupMessageBroker();
    this.resetCity();
  }

  private setupMessageBroker(): void {
    this.messageBroker.addSubscriber('generation.started', () =>
      this.resetCity(),
    );
  }

  private setWorldData(newWorldData: WorldData): void {
    this.currentWorldData = newWorldData;
    this.timerLoop.reset(newWorldData);
    this._sceneView.reset(newWorldData);
    this._mapCamera.setTerrain(newWorldData.terrain);
    this.navigationController.setTerrain(newWorldData.terrain);
    this.navigationTouchController.setTerrain(newWorldData.terrain);
  }

  private resetCity(): void {
    console.log('Starting city generation');
    const startTime = new Date();

    this._mapCamera.reset();

    // Replace old scene with mostly empty scene, to reclaim memory
    this.setWorldData(App.EMPTY_WORLD_DATA);

    // Now that old city's memory has been reclaimed, add new city
    const config: WorldConfig = {
      terrain: {
        columnCount: 128,
        rowCount: 128,
        heightJitter: 20,
        heightJitterDecay: 0.7,
        hillCount: 40,
        maxHillHeight: 50,
        probabilityOfRiver: 0.35,
      },
      roadNetwork: {
        isPresent: true,
        maxRoadAngle: Math.PI / 6,
        safeFromDecayBlocks: 6,
      },
      neighborhoods: {
        count: 3,
        columnCount: 128,
        rowCount: 128,
      },
      zonedBlocks: {
        isPresent: true,
        blockDistanceDecayBegins: 4,
        maxBuildingStories: 40,
      },
    };
    const newWorldData = WorldGenerator.generate(config);
    this.setWorldData(newWorldData);

    // Force the new scene to be rendered
    const renderStartTime = new Date();
    this._sceneView.resize();
    const renderEndTime = new Date();
    console.log(
      'Time to perform initial render: ' +
        (renderEndTime.getTime() - renderStartTime.getTime()) +
        'ms',
    );

    const endTime = new Date();
    console.log(
      'City generation complete, total time: ' +
        (endTime.getTime() - startTime.getTime()) +
        'ms',
    );

    this.messageBroker.publish('generation.complete', {});
  }

  public start(): void {
    this.timerLoop.start();
  }

  public stop(): void {
    this.timerLoop.stop();
  }

  public isRunning(): boolean {
    return this.timerLoop.isRunning();
  }

  public sceneView(): SceneView {
    return this._sceneView;
  }

  public mapCamera(): MapCamera {
    return this._mapCamera;
  }

  public worldTouch(): WorldTouchInterface {
    return this._worldTouch;
  }

  private setupEventListeners(containerEl: HTMLElement): void {
    // Mouse events
    containerEl.addEventListener(
      'mousedown',
      this.navigationController.onMouseDown.bind(this.navigationController),
    );
    containerEl.addEventListener(
      'mousemove',
      this.navigationController.onMouseMove.bind(this.navigationController),
    );
    containerEl.addEventListener(
      'mouseup',
      this.navigationController.onMouseUp.bind(this.navigationController),
    );
    containerEl.addEventListener(
      'mouseleave',
      this.navigationController.onMouseLeave.bind(this.navigationController),
    );
    containerEl.addEventListener(
      'wheel',
      this.navigationController.onMouseWheel.bind(this.navigationController),
    );

    // Touch events
    containerEl.addEventListener('touchstart', (e: TouchEvent) => {
      const touchPoints = Array.from(e.touches).map((touch) => ({
        x: touch.clientX,
        y: touch.clientY,
      }));
      this.navigationTouchController.onTouchStart(touchPoints);
    });

    containerEl.addEventListener('touchmove', (e: TouchEvent) => {
      const touchPoints = Array.from(e.touches).map((touch) => ({
        x: touch.clientX,
        y: touch.clientY,
      }));
      this.navigationTouchController.onTouchMove(touchPoints);
    });

    containerEl.addEventListener('touchend', () => {
      this.navigationTouchController.onTouchEnd();
    });

    containerEl.addEventListener('touchcancel', () => {
      this.navigationTouchController.onTouchEnd();
    });
  }
}

// Initialize app when grid texture is loaded
new THREE.TextureLoader().load(
  'textures/grid.png',
  (gridTexture: THREE.Texture) => {
    const container = document.getElementById('container');
    if (container) {
      const app = new App(container, gridTexture);
      app.start();
    }
  },
);

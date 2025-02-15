import * as THREE from 'three';

import { CityTourMath } from '../math';
import { MessageBroker } from '../message_broker';
import { Terrain } from '../terrain';

import { MapCamera } from './map_camera';
import { SceneView } from './scene_view';
import { TimerLoop } from './timer_loop';
import { WorldTouch } from './world_touch';

type WorldTouchInstance = ReturnType<typeof WorldTouch>;

interface NavigationControllerInterface {
  setTerrain: (newTerrain: Terrain) => void;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
  onMouseLeave: (e: MouseEvent) => void;
  onMouseWheel: (e: WheelEvent) => void;
  isGestureInProgress: () => boolean;
  initialize: () => void;
}

class NavigationController implements NavigationControllerInterface {
  private static readonly DOWN_ARROW = '&#9660;';
  private static readonly UP_ARROW = '&#9650;';
  private static readonly START_TOUR_MESSAGE = 'Take a Tour';
  private static readonly STOP_TOUR_MESSAGE = 'Stop Tour';
  private static readonly ZOOM_DELTA_PERCENTAGE = 0.01;
  private static readonly WINDOW_CENTER = new THREE.Vector3(0.0, 0.0, 0.0);
  private static readonly MOUSE_SENSITIVITY = 0.4;
  private static readonly ZOOM_SENSITIVITY = 0.001;

  private containerToggle: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private azimuthAngleControl: HTMLInputElement | null = null;
  private tiltAngleControl: HTMLInputElement | null = null;
  private zoomInButton: HTMLElement | null = null;
  private zoomOutButton: HTMLElement | null = null;
  private flythroughToggle: HTMLElement | null = null;

  private isNavigationControlsVisible = false;
  private terrain: Terrain;
  private _isGestureInProgress = false;
  private previousMousePosition = new THREE.Vector2();
  private previousCenterOfAction = new THREE.Vector3();
  private readonly worldTouch: WorldTouchInstance;
  private isInitialized = false;
  private initializeRetryCount = 0;
  private static readonly MAX_RETRY_COUNT = 10;

  constructor(
    private readonly sceneView: SceneView,
    private readonly mapCamera: MapCamera,
    terrain: Terrain,
    private readonly timerLoop: TimerLoop,
    private readonly messageBroker: MessageBroker,
  ) {
    this.terrain = terrain;
    this.worldTouch = WorldTouch(
      this.sceneView.camera(),
      NavigationController.WINDOW_CENTER,
      this.terrain,
    );
  }

  public initialize(): void {
    // Start initialization process
    this.startInitialization();
  }

  private startInitialization(): void {
    console.log('Starting navigation controls initialization process');
    // Initial delay before first attempt
    setTimeout(() => {
      // Ensure DOM is ready by waiting for next frame
      requestAnimationFrame(() => {
        this.initializeControls();
      });
    }, 200);
  }

  private initializeControls(): void {
    if (this.isInitialized) {
      console.log('Navigation controls already initialized');
      return;
    }

    if (this.initializeRetryCount >= NavigationController.MAX_RETRY_COUNT) {
      console.error(
        'Failed to initialize navigation controls after maximum retries',
      );
      return;
    }

    // Get all required elements
    const elements = {
      containerToggle: document.getElementById('navigation-controls-toggle'),
      container: document.getElementById('navigation-controls-inner-container'),
      azimuthAngleControl: document.getElementById(
        'azimuth-angle',
      ) as HTMLInputElement | null,
      tiltAngleControl: document.getElementById(
        'tilt-angle-percentage',
      ) as HTMLInputElement | null,
      zoomInButton: document.getElementById('zoom-in'),
      zoomOutButton: document.getElementById('zoom-out'),
      flythroughToggle: document.getElementById('flythrough-toggle'),
    };

    // Log which elements are missing for debugging
    const missingElements = Object.entries(elements)
      .filter(([, el]) => el === null)
      .map(([name]) => name);

    if (missingElements.length > 0) {
      console.log(
        `Navigation controls initialization attempt ${
          this.initializeRetryCount + 1
        }/${NavigationController.MAX_RETRY_COUNT}`,
      );
      console.log('Waiting for DOM elements:', missingElements.join(', '));

      this.initializeRetryCount++;
      // Use requestAnimationFrame for next retry to ensure DOM updates
      requestAnimationFrame(() => {
        setTimeout(() => this.initializeControls(), 300);
      });
      return;
    }

    // Assign elements to class properties
    this.containerToggle = elements.containerToggle!;
    this.container = elements.container!;
    this.azimuthAngleControl = elements.azimuthAngleControl!;
    this.tiltAngleControl = elements.tiltAngleControl!;
    this.zoomInButton = elements.zoomInButton!;
    this.zoomOutButton = elements.zoomOutButton!;
    this.flythroughToggle = elements.flythroughToggle!;

    try {
      // Add event listeners
      this.setupEventListeners();
      this.isInitialized = true;
      console.log('Navigation controls initialized successfully');
      // Initial render after successful initialization
      this.render();
    } catch (error) {
      console.error('Error during navigation controls initialization:', error);
      this.initializeRetryCount++;
      requestAnimationFrame(() => {
        setTimeout(() => this.initializeControls(), 300);
      });
    }
  }

  private setupEventListeners(): void {
    // We know these elements exist because we checked in initializeControls
    const {
      containerToggle,
      azimuthAngleControl,
      tiltAngleControl,
      zoomInButton,
      zoomOutButton,
      flythroughToggle,
    } = this;

    if (
      !containerToggle ||
      !azimuthAngleControl ||
      !tiltAngleControl ||
      !zoomInButton ||
      !zoomOutButton ||
      !flythroughToggle
    ) {
      console.error(
        'Event listeners setup called before elements were initialized',
      );
      return;
    }

    containerToggle.addEventListener(
      'click',
      this.toggleNavigationControls,
      false,
    );

    azimuthAngleControl.addEventListener(
      'mousedown',
      this.setTargetOfAction,
      false,
    );
    azimuthAngleControl.addEventListener(
      'touchstart',
      this.setTargetOfAction,
      false,
    );
    azimuthAngleControl.addEventListener('input', this.setAzimuthAngle, false);

    tiltAngleControl.addEventListener('mousedown', this.setCenterOfTilt, false);
    tiltAngleControl.addEventListener(
      'touchstart',
      this.setCenterOfTilt,
      false,
    );
    tiltAngleControl.addEventListener('input', this.setTiltAngle, false);

    zoomInButton.addEventListener('mousedown', this.startZoomIn, false);
    zoomInButton.addEventListener('touchstart', this.startZoomInTouch, false);
    zoomInButton.addEventListener('mouseup', this.stopZoom, false);
    zoomInButton.addEventListener('mouseleave', this.stopZoom, false);
    zoomInButton.addEventListener('touchend', this.stopZoom, false);

    zoomOutButton.addEventListener('mousedown', this.startZoomOut, false);
    zoomOutButton.addEventListener('touchstart', this.startZoomOutTouch, false);
    zoomOutButton.addEventListener('mouseup', this.stopZoom, false);
    zoomOutButton.addEventListener('mouseleave', this.stopZoom, false);
    zoomOutButton.addEventListener('touchend', this.stopZoom, false);

    flythroughToggle.addEventListener('click', this.toggleFlythrough, false);

    this.messageBroker.addSubscriber(
      'flythrough.started',
      this.onFlythroughStarted,
    );
    this.messageBroker.addSubscriber(
      'flythrough.stopped',
      this.onFlythroughStopped,
    );
  }

  private isTouchDevice(): boolean {
    // https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
    return (
      'ontouchstart' in window || // works on most browsers
      navigator.maxTouchPoints > 0 // works on IE10/11 and Surface
    );
  }

  private render(): void {
    if (!this.isInitialized) return;

    this.azimuthAngleControl!.value = String(
      this.mapCamera.azimuthAngle() * (180 / Math.PI),
    );
    this.tiltAngleControl!.value = String(
      (this.mapCamera.tiltAngle() - this.mapCamera.maxTiltAngle()) /
        (this.mapCamera.minTiltAngle() - this.mapCamera.maxTiltAngle()),
    );

    if (this.isNavigationControlsVisible === true) {
      this.containerToggle!.innerHTML = NavigationController.DOWN_ARROW;
      this.container!.classList.remove('display-none');
    } else {
      this.containerToggle!.innerHTML = NavigationController.UP_ARROW;
      this.container!.classList.add('display-none');
    }
  }

  private setTargetOfAction = (): void => {
    const centerOfScreenWorldTouch = WorldTouch(
      this.sceneView.camera(),
      NavigationController.WINDOW_CENTER,
      this.terrain,
    );

    this.mapCamera.setCenterOfAction(centerOfScreenWorldTouch.worldPosition());
  };

  private setCenterOfTilt = (): void => {
    const centerOfScreenWorldTouch = WorldTouch(
      this.sceneView.camera(),
      NavigationController.WINDOW_CENTER,
      this.terrain,
    );

    this.mapCamera.setCenterOfTilt(centerOfScreenWorldTouch.worldPosition());
  };

  private setAzimuthAngle = (): void => {
    if (!this.isInitialized || !this.azimuthAngleControl) return;

    // The slider uses degrees instead of radians to avoid Firefox thinking that float values are invalid,
    // seemingly due to precision issues.
    const newAzimuthAngleInDegrees = parseInt(
      this.azimuthAngleControl.value,
      10,
    );
    const newAzimuthAngleInRadians = newAzimuthAngleInDegrees * (Math.PI / 180);

    this.mapCamera.rotateAzimuthAroundCenterOfAction(
      newAzimuthAngleInRadians - this.mapCamera.azimuthAngle(),
    );
    this.mapCamera.setIsVelocityEnabled(false);
  };

  private setTiltAngle = (): void => {
    if (!this.isInitialized || !this.tiltAngleControl) return;

    const tiltPercentage = parseFloat(this.tiltAngleControl.value);
    const newTiltAngle = CityTourMath.lerp(
      this.mapCamera.minTiltAngle(),
      this.mapCamera.maxTiltAngle(),
      1.0 - tiltPercentage,
    );

    this.mapCamera.tiltCamera(newTiltAngle - this.mapCamera.tiltAngle());
    this.mapCamera.setIsVelocityEnabled(false);
  };

  private startZoomIn = (): void => {
    this.setTargetOfAction();
    this.timerLoop.setZoomAmount(NavigationController.ZOOM_DELTA_PERCENTAGE);
    this.mapCamera.setIsVelocityEnabled(false);
  };

  private startZoomInTouch = (e: TouchEvent): void => {
    this.startZoomIn();
    // Prevent text in adjacent elements from being selected
    // due to a long press gesture.
    e.preventDefault();
  };

  private startZoomOut = (): void => {
    this.setTargetOfAction();
    this.timerLoop.setZoomAmount(-NavigationController.ZOOM_DELTA_PERCENTAGE);
    this.mapCamera.setIsVelocityEnabled(false);
  };

  private startZoomOutTouch = (e: TouchEvent): void => {
    this.startZoomOut();
    // Prevent text in adjacent elements from being selected
    // due to a long press gesture.
    e.preventDefault();
  };

  private stopZoom = (): void => {
    this.timerLoop.setZoomAmount(0.0);
    this.mapCamera.setIsVelocityEnabled(false);
  };

  private toggleFlythrough = (): void => {
    this.timerLoop.toggleFlythrough();
  };

  private onFlythroughStarted = (): void => {
    if (
      !this.isInitialized ||
      !this.containerToggle ||
      !this.container ||
      !this.flythroughToggle
    )
      return;

    this.containerToggle.classList.add('display-none');
    this.container.classList.add('display-none');
    this.flythroughToggle.innerText = NavigationController.STOP_TOUR_MESSAGE;
  };

  private onFlythroughStopped = (): void => {
    if (!this.isInitialized || !this.containerToggle || !this.flythroughToggle)
      return;

    this.containerToggle.classList.remove('display-none');
    this.flythroughToggle.innerText = NavigationController.START_TOUR_MESSAGE;
    this.render();
  };

  private toggleNavigationControls = (): void => {
    if (!this.isInitialized || !this.container || !this.containerToggle) {
      console.warn('Navigation controls not initialized');
      return;
    }

    this.isNavigationControlsVisible = !this.isNavigationControlsVisible;
    if (this.isNavigationControlsVisible) {
      this.container.classList.remove('display-none');
      this.containerToggle.innerHTML = NavigationController.DOWN_ARROW;
    } else {
      this.container.classList.add('display-none');
      this.containerToggle.innerHTML = NavigationController.UP_ARROW;
    }
  };

  public setTerrain(newTerrain: Terrain): void {
    this.terrain = newTerrain;
  }

  public onMouseDown(e: MouseEvent): void {
    e.preventDefault();

    this._isGestureInProgress = true;
    this.previousMousePosition.set(e.clientX, e.clientY);

    const normalizedScreenPoint = this.normalizedMousePoint(e);
    this.previousCenterOfAction =
      this.worldTouch.normalizedScreenPointToWorldPoint(
        normalizedScreenPoint.x,
        normalizedScreenPoint.y,
      );
  }

  public onMouseMove(e: MouseEvent): void {
    e.preventDefault();

    if (this._isGestureInProgress) {
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.mapCamera.rotateXZ(
        -deltaX * NavigationController.MOUSE_SENSITIVITY,
        -deltaY * NavigationController.MOUSE_SENSITIVITY,
      );

      this.previousMousePosition.set(e.clientX, e.clientY);
    }
  }

  public onMouseUp(e: MouseEvent): void {
    e.preventDefault();
    this._isGestureInProgress = false;
  }

  public onMouseLeave(e: MouseEvent): void {
    e.preventDefault();
    this._isGestureInProgress = false;
  }

  public onMouseWheel(e: WheelEvent): void {
    e.preventDefault();

    const normalizedScreenPoint = this.normalizedMousePoint(e);
    const centerOfAction = this.worldTouch.normalizedScreenPointToWorldPoint(
      normalizedScreenPoint.x,
      normalizedScreenPoint.y,
    );

    this.mapCamera.zoomToPoint(
      centerOfAction,
      e.deltaY * NavigationController.ZOOM_SENSITIVITY,
    );

    this.previousCenterOfAction.copy(centerOfAction);
  }

  public isGestureInProgress(): boolean {
    return this._isGestureInProgress;
  }

  private normalizedMousePoint(e: MouseEvent): THREE.Vector2 {
    const containerEl = this.sceneView.domElement();
    const rect = containerEl.getBoundingClientRect();

    return new THREE.Vector2(
      ((e.clientX - rect.left) / containerEl.clientWidth) * 2 - 1,
      -((e.clientY - rect.top) / containerEl.clientHeight) * 2 + 1,
    );
  }
}

export { NavigationController, NavigationControllerInterface };

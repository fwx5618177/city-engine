import * as THREE from 'three';

import { CityTourMath } from '../math';
import { MessageBroker } from '../message_broker';
import { Terrain } from '../terrain';

import { MapCamera } from './map_camera';
import { SceneView } from './scene_view';
import { TimerLoop } from './timer_loop';
import { WorldTouch } from './world_touch';

interface NavigationControllerInterface {
  setTerrain: (newTerrain: Terrain) => void;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
  onMouseLeave: (e: MouseEvent) => void;
  onMouseWheel: (e: WheelEvent) => void;
  isGestureInProgress: () => boolean;
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

  private readonly containerToggle: HTMLElement;
  private readonly container: HTMLElement;
  private readonly azimuthAngleControl: HTMLInputElement;
  private readonly tiltAngleControl: HTMLInputElement;
  private readonly zoomInButton: HTMLElement;
  private readonly zoomOutButton: HTMLElement;
  private readonly flythroughToggle: HTMLElement;

  private isNavigationControlsVisible: boolean;
  private terrain: Terrain;
  private _isGestureInProgress = false;
  private previousMousePosition = new THREE.Vector2();
  private previousCenterOfAction = new THREE.Vector3();

  constructor(
    private readonly sceneView: SceneView,
    private readonly mapCamera: MapCamera,
    terrain: Terrain,
    private readonly timerLoop: TimerLoop,
    private readonly messageBroker: MessageBroker,
  ) {
    this.terrain = terrain;

    this.containerToggle = document.getElementById(
      'navigation-controls-toggle',
    )!;
    this.container = document.getElementById(
      'navigation-controls-inner-container',
    )!;
    this.azimuthAngleControl = document.getElementById(
      'azimuth-angle',
    ) as HTMLInputElement;
    this.tiltAngleControl = document.getElementById(
      'tilt-angle-percentage',
    ) as HTMLInputElement;
    this.zoomInButton = document.getElementById('zoom-in')!;
    this.zoomOutButton = document.getElementById('zoom-out')!;
    this.flythroughToggle = document.getElementById('flythrough-toggle')!;

    this.containerToggle.addEventListener(
      'click',
      this.toggleNavigationControls,
      false,
    );
    this.azimuthAngleControl.addEventListener(
      'mousedown',
      this.setTargetOfAction,
      false,
    );
    this.azimuthAngleControl.addEventListener(
      'touchstart',
      this.setTargetOfAction,
      false,
    );
    this.azimuthAngleControl.addEventListener(
      'input',
      this.setAzimuthAngle,
      false,
    );
    this.tiltAngleControl.addEventListener(
      'mousedown',
      this.setCenterOfTilt,
      false,
    );
    this.tiltAngleControl.addEventListener(
      'touchstart',
      this.setCenterOfTilt,
      false,
    );
    this.tiltAngleControl.addEventListener('input', this.setTiltAngle, false);
    this.zoomInButton.addEventListener('mousedown', this.startZoomIn, false);
    this.zoomInButton.addEventListener('mouseup', this.stopZoom, false);
    this.zoomInButton.addEventListener('mouseout', this.stopZoom, false);
    this.zoomInButton.addEventListener(
      'touchstart',
      this.startZoomInTouch,
      false,
    );
    this.zoomInButton.addEventListener('touchend', this.stopZoom, false);
    this.zoomOutButton.addEventListener('mousedown', this.startZoomOut, false);
    this.zoomOutButton.addEventListener('mouseup', this.stopZoom, false);
    this.zoomOutButton.addEventListener('mouseout', this.stopZoom, false);
    this.zoomOutButton.addEventListener(
      'touchstart',
      this.startZoomOutTouch,
      false,
    );
    this.zoomOutButton.addEventListener('touchend', this.stopZoom, false);
    this.flythroughToggle.addEventListener(
      'click',
      this.toggleFlythrough,
      false,
    );

    this.isNavigationControlsVisible = !this.isTouchDevice();
    this.render();

    messageBroker.addSubscriber('camera.updated', this.render);
    messageBroker.addSubscriber('flythrough.started', this.onFlythroughStarted);
    messageBroker.addSubscriber('flythrough.stopped', this.onFlythroughStopped);

    // Bind event handlers to maintain correct 'this' context
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
  }

  private isTouchDevice(): boolean {
    // https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
    return (
      'ontouchstart' in window || // works on most browsers
      navigator.maxTouchPoints > 0 // works on IE10/11 and Surface
    );
  }

  private render = (): void => {
    this.azimuthAngleControl.value = String(
      this.mapCamera.azimuthAngle() * (180 / Math.PI),
    );
    this.tiltAngleControl.value = String(
      (this.mapCamera.tiltAngle() - this.mapCamera.maxTiltAngle()) /
        (this.mapCamera.minTiltAngle() - this.mapCamera.maxTiltAngle()),
    );

    if (this.isNavigationControlsVisible === true) {
      this.containerToggle.innerHTML = NavigationController.DOWN_ARROW;
      this.container.classList.remove('display-none');
    } else {
      this.containerToggle.innerHTML = NavigationController.UP_ARROW;
      this.container.classList.add('display-none');
    }
  };

  private setTargetOfAction = (e: Event): void => {
    const centerOfScreenWorldTouch = WorldTouch(
      this.sceneView.camera(),
      NavigationController.WINDOW_CENTER,
      this.terrain,
    );

    this.mapCamera.setCenterOfAction(centerOfScreenWorldTouch.worldPosition());
  };

  private setCenterOfTilt = (e: Event): void => {
    const centerOfScreenWorldTouch = WorldTouch(
      this.sceneView.camera(),
      NavigationController.WINDOW_CENTER,
      this.terrain,
    );

    this.mapCamera.setCenterOfTilt(centerOfScreenWorldTouch.worldPosition());
  };

  private setAzimuthAngle = (e: Event): void => {
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

  private setTiltAngle = (e: Event): void => {
    const tiltPercentage = parseFloat(this.tiltAngleControl.value);
    const newTiltAngle = CityTourMath.lerp(
      this.mapCamera.minTiltAngle(),
      this.mapCamera.maxTiltAngle(),
      1.0 - tiltPercentage,
    );

    this.mapCamera.tiltCamera(newTiltAngle - this.mapCamera.tiltAngle());
    this.mapCamera.setIsVelocityEnabled(false);
  };

  private startZoomIn = (e: Event): void => {
    this.setTargetOfAction(e);
    this.timerLoop.setZoomAmount(NavigationController.ZOOM_DELTA_PERCENTAGE);
    this.mapCamera.setIsVelocityEnabled(false);
  };

  private startZoomInTouch = (e: TouchEvent): void => {
    this.startZoomIn(e);

    // Prevent text in adjacent elements from being selected
    // due to a long press gesture.
    e.preventDefault();
  };

  private startZoomOut = (e: Event): void => {
    this.setTargetOfAction(e);
    this.timerLoop.setZoomAmount(-NavigationController.ZOOM_DELTA_PERCENTAGE);
    this.mapCamera.setIsVelocityEnabled(false);
  };

  private startZoomOutTouch = (e: TouchEvent): void => {
    this.startZoomOut(e);

    // Prevent text in adjacent elements from being selected
    // due to a long press gesture.
    e.preventDefault();
  };

  private stopZoom = (e: Event): void => {
    this.timerLoop.setZoomAmount(0.0);
    this.mapCamera.setIsVelocityEnabled(false);
  };

  private toggleFlythrough = (e: Event): void => {
    this.timerLoop.toggleFlythrough();
  };

  private onFlythroughStarted = (e: Event): void => {
    this.containerToggle.classList.add('display-none');
    this.container.classList.add('display-none');
    this.flythroughToggle.innerText = NavigationController.STOP_TOUR_MESSAGE;
  };

  private onFlythroughStopped = (e: Event): void => {
    this.containerToggle.classList.remove('display-none');
    this.flythroughToggle.innerText = NavigationController.START_TOUR_MESSAGE;
    this.render();
  };

  private toggleNavigationControls = (e: Event): void => {
    this.isNavigationControlsVisible = !this.isNavigationControlsVisible;
    this.render();
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

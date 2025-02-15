import { MessageBroker } from '../message_broker';

import { SceneView } from './scene_view';


interface MenusControllerInterface {
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
  onMouseLeave: (e: MouseEvent) => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
  onTouchCancel: (e: TouchEvent) => void;
  isGestureInProgress: () => boolean;
}

class MenusController implements MenusControllerInterface {
  private static readonly DOWN_ARROW = '&#9660;';
  private static readonly UP_ARROW = '&#9650;';
  private static readonly START_TOUR_MESSAGE = 'Take a Tour';
  private static readonly STOP_TOUR_MESSAGE = 'Stop Tour';

  private readonly containerToggle: HTMLElement;
  private readonly container: HTMLElement;
  private readonly flythroughToggle: HTMLElement;
  private readonly debugToggle: HTMLElement;
  private readonly debugContainer: HTMLElement;
  private readonly neighborhoodCentersToggle: HTMLElement;
  private readonly routeCurvesToggle: HTMLElement;

  private isNavigationControlsVisible = false;
  private isDebugControlsVisible = false;
  private _isGestureInProgress = false;

  constructor(
    private readonly sceneView: SceneView,
    private readonly messageBroker: MessageBroker,
  ) {
    this.containerToggle = document.createElement('div');
    this.containerToggle.id = 'navigation-controls-toggle';
    this.containerToggle.innerHTML = `${MenusController.DOWN_ARROW} Navigation`;
    this.containerToggle.addEventListener(
      'click',
      this.toggleNavigationControls,
    );

    this.container = document.createElement('div');
    this.container.id = 'navigation-controls';
    this.container.style.display = 'none';

    this.flythroughToggle = document.createElement('div');
    this.flythroughToggle.id = 'flythrough-toggle';
    this.flythroughToggle.innerHTML = MenusController.START_TOUR_MESSAGE;
    this.flythroughToggle.addEventListener('click', this.toggleFlythrough);

    this.debugToggle = document.createElement('div');
    this.debugToggle.id = 'debug-controls-toggle';
    this.debugToggle.innerHTML = `${MenusController.DOWN_ARROW} Debug`;
    this.debugToggle.addEventListener('click', this.toggleDebugControls);

    this.debugContainer = document.createElement('div');
    this.debugContainer.id = 'debug-controls';
    this.debugContainer.style.display = 'none';

    this.neighborhoodCentersToggle = document.createElement('div');
    this.neighborhoodCentersToggle.id = 'neighborhood-centers-toggle';
    this.neighborhoodCentersToggle.innerHTML = 'Show Neighborhood Centers';
    this.neighborhoodCentersToggle.addEventListener(
      'click',
      this.toggleNeighborhoodCenters,
    );

    this.routeCurvesToggle = document.createElement('div');
    this.routeCurvesToggle.id = 'route-curves-toggle';
    this.routeCurvesToggle.innerHTML = 'Show Route Curves';
    this.routeCurvesToggle.addEventListener('click', this.toggleRouteCurves);

    this.debugContainer.appendChild(this.neighborhoodCentersToggle);
    this.debugContainer.appendChild(this.routeCurvesToggle);

    this.container.appendChild(this.flythroughToggle);
    this.container.appendChild(this.debugToggle);
    this.container.appendChild(this.debugContainer);

    document.body.appendChild(this.containerToggle);
    document.body.appendChild(this.container);

    this.messageBroker.addSubscriber(
      'flythrough.started',
      this.onFlythroughStarted,
    );
    this.messageBroker.addSubscriber(
      'flythrough.stopped',
      this.onFlythroughStopped,
    );
  }

  public onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this._isGestureInProgress = true;
  }

  public onMouseMove(e: MouseEvent): void {
    e.preventDefault();
  }

  public onMouseUp(e: MouseEvent): void {
    e.preventDefault();
    this._isGestureInProgress = false;
  }

  public onMouseLeave(e: MouseEvent): void {
    e.preventDefault();
    this._isGestureInProgress = false;
  }

  public onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this._isGestureInProgress = true;
  }

  public onTouchMove(e: TouchEvent): void {
    e.preventDefault();
  }

  public onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this._isGestureInProgress = false;
  }

  public onTouchCancel(e: TouchEvent): void {
    e.preventDefault();
    this._isGestureInProgress = false;
  }

  public isGestureInProgress(): boolean {
    return this._isGestureInProgress;
  }

  private toggleNavigationControls = (e: Event): void => {
    e.preventDefault();

    this.isNavigationControlsVisible = !this.isNavigationControlsVisible;
    this.container.style.display = this.isNavigationControlsVisible
      ? 'block'
      : 'none';
    this.containerToggle.innerHTML = this.isNavigationControlsVisible
      ? `${MenusController.UP_ARROW} Navigation`
      : `${MenusController.DOWN_ARROW} Navigation`;
  };

  private toggleDebugControls = (e: Event): void => {
    e.preventDefault();

    this.isDebugControlsVisible = !this.isDebugControlsVisible;
    this.debugContainer.style.display = this.isDebugControlsVisible
      ? 'block'
      : 'none';
    this.debugToggle.innerHTML = this.isDebugControlsVisible
      ? `${MenusController.UP_ARROW} Debug`
      : `${MenusController.DOWN_ARROW} Debug`;
  };

  private toggleFlythrough = (e: Event): void => {
    e.preventDefault();
    this.messageBroker.publish('flythrough.toggle', {});
  };

  private onFlythroughStarted = (): void => {
    this.flythroughToggle.innerHTML = MenusController.STOP_TOUR_MESSAGE;
  };

  private onFlythroughStopped = (): void => {
    this.flythroughToggle.innerHTML = MenusController.START_TOUR_MESSAGE;
  };

  private toggleNeighborhoodCenters = (e: Event): void => {
    e.preventDefault();

    const isVisible = this.sceneView.isNeighborhoodCentersVisible();
    this.sceneView.setIsNeighborhoodCentersVisible(!isVisible);
    this.neighborhoodCentersToggle.innerHTML = !isVisible
      ? 'Hide Neighborhood Centers'
      : 'Show Neighborhood Centers';
  };

  private toggleRouteCurves = (e: Event): void => {
    e.preventDefault();

    const isVisible = this.sceneView.isRouteCurvesVisible();
    this.sceneView.setIsRouteCurvesVisible(!isVisible);
    this.routeCurvesToggle.innerHTML = !isVisible
      ? 'Hide Route Curves'
      : 'Show Route Curves';
  };
}

export { MenusController, MenusControllerInterface };

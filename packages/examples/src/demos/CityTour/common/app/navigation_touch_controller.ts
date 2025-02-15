import { MessageBroker } from '../message_broker';
import { Terrain } from '../terrain';

import { GestureProcessor, GestureType } from './gesture_processor';
import { MapCamera } from './map_camera';
import { SceneView } from './scene_view';
import { WorldTouchCollection } from './world_touch_collection';

export interface NavigationTouchControllerInterface {
  setTerrain(terrain: Terrain): void;
  onTouchStart(touchPoints: { x: number; y: number }[]): void;
  onTouchMove(touchPoints: { x: number; y: number }[]): void;
  onTouchEnd(): void;
}

export class NavigationTouchController
  implements NavigationTouchControllerInterface
{
  private gestureProcessor: GestureProcessor;
  private touchCollection: WorldTouchCollection | undefined;
  private isGestureInProgress: boolean;
  private terrain: Terrain;

  constructor(
    private readonly sceneView: SceneView,
    private readonly mapCamera: MapCamera,
    terrain: Terrain,
    private readonly messageBroker: MessageBroker,
  ) {
    this.terrain = terrain;
    this.gestureProcessor = new GestureProcessor(sceneView, mapCamera, terrain);
    this.isGestureInProgress = false;
  }

  public setTerrain(newTerrain: Terrain): void {
    this.terrain = newTerrain;
    this.gestureProcessor.setTerrain(newTerrain);
  }

  public onTouchStart(touchPoints: { x: number; y: number }[]): void {
    this.touchCollection = new WorldTouchCollection(
      this.sceneView.camera(),
      this.terrain,
      touchPoints,
    );
    this.isGestureInProgress = false;
  }

  public onTouchMove(touchPoints: { x: number; y: number }[]): void {
    if (!this.touchCollection) {
      return;
    }

    const newTouchCollection = new WorldTouchCollection(
      this.sceneView.camera(),
      this.terrain,
      touchPoints,
    );
    const gestureType =
      this.gestureProcessor.processGesture(newTouchCollection);

    if (gestureType !== undefined) {
      this.isGestureInProgress = true;
      this.handleGesture(gestureType, newTouchCollection);
    }

    this.touchCollection = newTouchCollection;
  }

  public onTouchEnd(): void {
    this.touchCollection = undefined;
    this.isGestureInProgress = false;
  }

  private handleGesture(
    gestureType: GestureType,
    touchCollection: WorldTouchCollection,
  ): void {
    switch (gestureType) {
      case GestureType.PAN:
        this.messageBroker.publish('navigation.pan', {
          deltaX:
            touchCollection.normalizedScreenX(0) -
            this.touchCollection!.normalizedScreenX(0),
          deltaY:
            touchCollection.normalizedScreenY(0) -
            this.touchCollection!.normalizedScreenY(0),
        });
        break;
      case GestureType.TILT:
        this.messageBroker.publish('navigation.tilt', {
          deltaX:
            touchCollection.normalizedScreenX(0) -
            this.touchCollection!.normalizedScreenX(0),
          deltaY:
            touchCollection.normalizedScreenY(0) -
            this.touchCollection!.normalizedScreenY(0),
        });
        break;
      case GestureType.ROTATE:
        this.messageBroker.publish('navigation.rotate', {
          deltaX:
            touchCollection.normalizedScreenX(0) -
            this.touchCollection!.normalizedScreenX(0),
          deltaY:
            touchCollection.normalizedScreenY(0) -
            this.touchCollection!.normalizedScreenY(0),
        });
        break;
      case GestureType.PINCH_ZOOM:
        this.messageBroker.publish('navigation.zoom', {
          zoomDelta:
            touchCollection.distance() - this.touchCollection!.distance(),
        });
        break;
    }
  }
}

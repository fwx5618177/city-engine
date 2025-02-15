import { VehicleController } from '../flythrough/vehicle_controller';
import { VehicleView } from '../flythrough/vehicle_view';
import { MessageBroker } from '../message_broker';

interface FlythroughGestureProcessorInterface {
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
  onMouseLeave: (e: MouseEvent) => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
  onTouchCancel: (e: TouchEvent) => void;
}

class FlythroughGestureProcessor
  implements FlythroughGestureProcessorInterface
{
  private static readonly MOUSE_SENSITIVITY = 0.4;
  private static readonly TOUCH_SENSITIVITY = 0.4;

  private readonly messageBroker: MessageBroker;
  private readonly vehicleController: VehicleController;
  private readonly vehicleView: VehicleView;

  private isGestureInProgress = false;
  private previousTouchPoints: { x: number; y: number }[] = [];

  constructor(
    messageBroker: MessageBroker,
    vehicleController: VehicleController,
    vehicleView: VehicleView,
  ) {
    this.messageBroker = messageBroker;
    this.vehicleController = vehicleController;
    this.vehicleView = vehicleView;
  }

  public onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.isGestureInProgress = true;
    this.vehicleView.lockAngles();
  }

  public onMouseMove(e: MouseEvent): void {
    e.preventDefault();

    if (this.isGestureInProgress) {
      this.vehicleView.setLockedRotationOffsetX(
        this.vehicleView.lockedRotationOffsetX() -
          e.movementY * FlythroughGestureProcessor.MOUSE_SENSITIVITY,
      );
      this.vehicleView.setLockedRotationOffsetY(
        this.vehicleView.lockedRotationOffsetY() -
          e.movementX * FlythroughGestureProcessor.MOUSE_SENSITIVITY,
      );
    }
  }

  public onMouseUp(e: MouseEvent): void {
    e.preventDefault();
    this.isGestureInProgress = false;
    this.vehicleView.enableResetToCenterAnimation();
  }

  public onMouseLeave(e: MouseEvent): void {
    e.preventDefault();
    this.isGestureInProgress = false;
    this.vehicleView.enableResetToCenterAnimation();
  }

  public onTouchStart(e: TouchEvent): void {
    e.preventDefault();

    this.isGestureInProgress = true;
    this.previousTouchPoints = [];
    this.vehicleView.lockAngles();

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.previousTouchPoints.push({
        x: touch.clientX,
        y: touch.clientY,
      });
    }
  }

  public onTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const previousTouch = this.previousTouchPoints[0];

      const deltaX = touch.clientX - previousTouch.x;
      const deltaY = touch.clientY - previousTouch.y;

      this.vehicleView.setLockedRotationOffsetX(
        this.vehicleView.lockedRotationOffsetX() -
          deltaY * FlythroughGestureProcessor.TOUCH_SENSITIVITY,
      );
      this.vehicleView.setLockedRotationOffsetY(
        this.vehicleView.lockedRotationOffsetY() -
          deltaX * FlythroughGestureProcessor.TOUCH_SENSITIVITY,
      );

      this.previousTouchPoints[0] = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }
  }

  public onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.isGestureInProgress = false;
    this.vehicleView.enableResetToCenterAnimation();
  }

  public onTouchCancel(e: TouchEvent): void {
    e.preventDefault();
    this.isGestureInProgress = false;
    this.vehicleView.enableResetToCenterAnimation();
  }
}

export { FlythroughGestureProcessor, FlythroughGestureProcessorInterface };

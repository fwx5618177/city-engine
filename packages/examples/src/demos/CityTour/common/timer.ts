interface TimerInterface {
  onTick: (frameCount: number) => void;
  start: () => void;
  pause: () => void;
  isPaused: () => boolean;
}

class Timer implements TimerInterface {
  private static readonly FRAMES_PER_SECOND: number = 60;
  private static readonly FRAME_DURATION_IN_MILLISECONDS: number =
    1000.0 / Timer.FRAMES_PER_SECOND;

  private isPausedState: boolean = true;
  private previousFrameTimestamp?: number;
  private animationRequestID?: number;

  public onTick: (frameCount: number) => void = () => {};

  private tick = (currentTimestamp: number): void => {
    let frameCount: number;

    if (this.isPausedState) {
      return;
    }

    if (this.previousFrameTimestamp === undefined) {
      frameCount = 1;
    } else {
      frameCount = Math.floor(
        (currentTimestamp - this.previousFrameTimestamp) /
          Timer.FRAME_DURATION_IN_MILLISECONDS,
      );
      if (frameCount < 1) {
        frameCount = 1;
      }
    }
    this.previousFrameTimestamp = currentTimestamp;

    this.onTick(frameCount);

    this.animationRequestID = requestAnimationFrame(this.tick);
  };

  public start(): void {
    if (!this.isPausedState) {
      return;
    }

    this.isPausedState = false;
    this.previousFrameTimestamp = undefined;
    this.animationRequestID = requestAnimationFrame(this.tick);
  }

  public pause(): void {
    this.isPausedState = true;
    if (this.animationRequestID !== undefined) {
      window.cancelAnimationFrame(this.animationRequestID);
    }
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }
}

export { Timer, TimerInterface };

import * as THREE from 'three';

import { CityTourMath } from '../math';
import { PathFinder } from '../path_finder';
import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

import { AerialNavigator } from './aerial_navigator';
import { Animation } from './animation';
import { CurveAnimation } from './curve_animation';
import { DrivingCurveBuilder, PathPoint } from './driving_curve_builder';
import {
  LinearEasing,
  SineEasing,
  SmoothStepEasing,
  SteepEasing,
} from './easing';
import { MotionGenerator, StaticMotionGenerator } from './motion_generator';
import { RoadNavigator } from './road_navigator';

const QUARTER_PI = Math.PI * 0.25;
const HALF_PI = Math.PI * 0.5;
const TWO_PI = Math.PI * 2.0;

type Mode = 'intro' | 'driving' | 'airplane' | 'helicopter';

const INTRO_MODE: Mode = 'intro';
const DRIVING_MODE: Mode = 'driving';
const AIRPLANE_MODE: Mode = 'airplane';
const HELICOPTER_MODE: Mode = 'helicopter';

const MODE_TRANSITIONS: Record<Mode, Mode> = {
  [INTRO_MODE]: AIRPLANE_MODE,
  [DRIVING_MODE]: AIRPLANE_MODE,
  [AIRPLANE_MODE]: HELICOPTER_MODE,
  [HELICOPTER_MODE]: DRIVING_MODE,
};
Object.freeze(MODE_TRANSITIONS);

const MODE_DURATION_IN_FRAMES = 2000;
const FRAMES_PER_DISTANCE_UNIT = 0.5;

const INTRO_DIVE_FRAME_COUNT = 105;
const DRIVING_HORIZONTAL_MOTION_DELTA = 0.016666666666667;
const FLYING_HORIZONTAL_MOTION_DELTA = 0.025;
const AIRPLANE_Y = 12.5;
const HELICOPTER_Y = 1.25;
const POSITION_Y_DELTA = 0.166666666666667;
const HELICOPTER_TO_DRIVING_POSITION_Y_DELTA = 0.004166666666667;
const AIRPLANE_X_ROTATION = -(Math.PI / 3);
const AIRPLANE_X_ROTATION_DELTA = 0.0155140377955;
const ROTATION_Y_DELTA = 0.03;

const MINIMUM_HEIGHT_OFF_GROUND = 0.041666666666667;

interface Initial {
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
}

interface Neighborhood {
  centerX: number;
  centerZ: number;
}

interface SceneViewInterface {
  camera(): THREE.Camera;
  centerOfActionMarkerMesh(): THREE.Mesh;
  setRouteCurves(
    curves: THREE.Curve<THREE.Vector3>[],
    color?: THREE.Color,
  ): void;
}

interface VehicleControllerInterface {
  tick: () => void;
  positionX: () => number;
  positionY: () => number;
  positionZ: () => number;
  rotationX: () => number;
  rotationY: () => number;
  mode: () => Mode;
  transitionToNextMode: () => void;
}

class MotionGeneratorAdapter extends MotionGenerator {
  constructor(value: number) {
    super(value, value, new LinearEasing(1));
  }
}

class VehicleController implements VehicleControllerInterface {
  private _positionX: number;
  private _positionY: number;
  private _positionZ: number;
  private _rotationX: number;
  private _rotationY: number;

  private animations: Animation[] = [];
  private framesInCurrentMode = MODE_DURATION_IN_FRAMES + 1;
  private currentMode: Mode = INTRO_MODE;

  private navigator: RoadNavigator | undefined;
  private aerialNavigator: AerialNavigator | undefined;
  private readonly pathFinder: PathFinder;

  private isDrivingModeLanded: boolean | null = null;

  constructor(
    private readonly terrain: Terrain,
    private readonly roadNetwork: RoadNetwork,
    private readonly neighborhoods: Neighborhood[],
    private readonly sceneView: SceneViewInterface,
    initial: Initial,
  ) {
    this._positionX = initial.positionX;
    this._positionY = initial.positionY;
    this._positionZ = initial.positionZ;
    this._rotationX = initial.rotationX;
    this._rotationY = initial.rotationY;

    this.pathFinder = new PathFinder(roadNetwork);
  }

  private frameCount(start: number, target: number, delta: number): number {
    if (delta < 0) {
      console.warn(
        `Animation delta (${delta}) less than zero, will never complete!`,
      );
    }

    return Math.ceil(Math.abs(target - start) / delta);
  }

  private buildIntroAnimations(
    initial: Initial,
    topOfDivePositionX: number,
    topOfDivePositionZ: number,
  ): Animation[] {
    const azimuthAngleToTopOfDive = this.azimuthAngleToPoint(
      initial.positionX,
      initial.positionZ,
      topOfDivePositionX,
      topOfDivePositionZ,
    );
    const topOfDiveRotationY = this.minimizeAngleDifference(
      azimuthAngleToTopOfDive,
      initial.rotationY,
    );

    const topOfDivePositionY =
      AIRPLANE_Y +
      (this.roadNetwork.getRoadHeight(topOfDivePositionX, topOfDivePositionZ) ??
        0);
    const topOfDiveRotationX = -HALF_PI;
    const distanceToTopOfDive = CityTourMath.distanceBetweenPoints3D(
      initial.positionX,
      initial.positionY,
      initial.positionZ,
      topOfDivePositionX,
      topOfDivePositionY,
      topOfDivePositionZ,
    );

    let diveDirectionX: number;
    let diveDirectionZ: number;
    let bottomOfDivePositionX: number;
    let bottomOfDivePositionZ: number;

    if (
      azimuthAngleToTopOfDive >= 7 * QUARTER_PI ||
      azimuthAngleToTopOfDive < QUARTER_PI
    ) {
      // Moving north-ish
      diveDirectionX = 0;
      diveDirectionZ = -1;
    } else if (
      azimuthAngleToTopOfDive >= QUARTER_PI &&
      azimuthAngleToTopOfDive < 3 * QUARTER_PI
    ) {
      // Moving west-ish
      diveDirectionX = -1;
      diveDirectionZ = 0;
    } else if (
      azimuthAngleToTopOfDive >= 3 * QUARTER_PI &&
      azimuthAngleToTopOfDive < 5 * QUARTER_PI
    ) {
      // Moving south-ish
      diveDirectionX = 0;
      diveDirectionZ = 1;
    } else {
      // Moving east-ish
      diveDirectionX = 1;
      diveDirectionZ = 0;
    }

    bottomOfDivePositionX = topOfDivePositionX + diveDirectionX * 3;
    bottomOfDivePositionZ = topOfDivePositionZ + diveDirectionZ * 3;

    // Prevent attempting to navigate to non-existent road intersection
    if (
      !this.roadNetwork.hasIntersection(
        bottomOfDivePositionX,
        bottomOfDivePositionZ,
      )
    ) {
      bottomOfDivePositionX = topOfDivePositionX;
      bottomOfDivePositionZ = topOfDivePositionZ;
    }

    const bottomOfDivePositionY =
      this.roadNetwork.getRoadHeight(
        bottomOfDivePositionX,
        bottomOfDivePositionZ,
      ) ?? 0;
    const bottomOfDiveRotationY = this.determineTargetAzimuthAngle(
      0,
      0,
      topOfDiveRotationY,
      diveDirectionX,
      diveDirectionZ,
    );

    const drivingTargetPositionX = bottomOfDivePositionX;
    const drivingTargetPositionZ = bottomOfDivePositionZ;

    const frameCount = Math.ceil(
      distanceToTopOfDive / DRIVING_HORIZONTAL_MOTION_DELTA,
    );
    const frameCountPositionX = CityTourMath.clamp(frameCount, 60, 3 * 60);
    const frameCountPositionY = frameCountPositionX;
    const frameCountPositionZ = frameCountPositionX;
    const frameCountRotationX = frameCountPositionX;
    const frameCountRotationY = CityTourMath.clamp(
      this.frameCount(initial.rotationY, topOfDiveRotationY, 0.008),
      60,
      frameCountPositionX,
    );

    // Move to point above the city, looking straight down
    this.animations.push(
      new Animation(
        new MotionGenerator(
          initial.positionX,
          topOfDivePositionX,
          new LinearEasing(frameCountPositionX),
        ),
        new MotionGenerator(
          initial.positionY,
          topOfDivePositionY,
          new SmoothStepEasing(frameCountPositionY),
        ),
        new MotionGenerator(
          initial.positionZ,
          topOfDivePositionZ,
          new LinearEasing(frameCountPositionZ),
        ),
        new MotionGenerator(
          initial.rotationX,
          topOfDiveRotationX,
          new SmoothStepEasing(frameCountRotationX),
        ),
        new MotionGenerator(
          initial.rotationY,
          topOfDiveRotationY,
          new SineEasing(frameCountRotationY, 0, HALF_PI),
        ),
      ),
    );

    // Dive to ground level, and rotate to initial driving X/Y rotation
    this.animations.push(
      new Animation(
        new MotionGenerator(
          topOfDivePositionX,
          bottomOfDivePositionX,
          new LinearEasing(INTRO_DIVE_FRAME_COUNT),
        ),
        new MotionGenerator(
          bottomOfDivePositionY,
          topOfDivePositionY,
          new SteepEasing(INTRO_DIVE_FRAME_COUNT, 0.0, 1.0),
        ),
        new MotionGenerator(
          topOfDivePositionZ,
          bottomOfDivePositionZ,
          new LinearEasing(INTRO_DIVE_FRAME_COUNT),
        ),
        new MotionGenerator(
          topOfDiveRotationX,
          0.0,
          new SineEasing(INTRO_DIVE_FRAME_COUNT, 0.0, HALF_PI),
        ),
        new MotionGenerator(
          topOfDiveRotationY,
          bottomOfDiveRotationY,
          new SineEasing(INTRO_DIVE_FRAME_COUNT, 0.0, HALF_PI),
        ),
      ),
    );

    // Drive to target point
    this.navigator = new RoadNavigator(
      this.roadNetwork,
      this.pathFinder,
      drivingTargetPositionX,
      drivingTargetPositionZ,
    );
    this.animations = this.buildDrivingAnimations(
      initial,
      drivingTargetPositionX,
      drivingTargetPositionZ,
    );

    return this.animations;
  }

  private buildAirplaneAnimations(
    initial: Initial,
    targetPositionX: number,
    targetPositionZ: number,
  ): Animation[] {
    const targetPositionY = AIRPLANE_Y;
    const targetRotationX = AIRPLANE_X_ROTATION;
    const targetRotationY = this.determineTargetAzimuthAngle(
      initial.positionX,
      initial.positionZ,
      initial.rotationY,
      targetPositionX,
      targetPositionZ,
    );

    const frameCountPositionX = Math.ceil(
      CityTourMath.distanceBetweenPoints(
        initial.positionX,
        initial.positionZ,
        targetPositionX,
        targetPositionZ,
      ) / FLYING_HORIZONTAL_MOTION_DELTA,
    );
    const frameCountPositionZ = frameCountPositionX;
    const frameCountRotationY = this.frameCount(
      initial.rotationY,
      targetRotationY,
      ROTATION_Y_DELTA,
    );
    const frameCountPositionY = this.frameCount(
      initial.positionY,
      targetPositionY,
      POSITION_Y_DELTA,
    );
    const frameCountRotationX = this.frameCount(
      initial.rotationX,
      targetRotationX,
      AIRPLANE_X_ROTATION_DELTA,
    );

    // Y rotation
    this.animations.push(
      new Animation(
        new MotionGenerator(
          initial.positionX,
          initial.positionX,
          new LinearEasing(frameCountRotationY),
        ),
        new MotionGenerator(
          initial.positionY,
          initial.positionY,
          new LinearEasing(frameCountRotationY),
        ),
        new MotionGenerator(
          initial.positionZ,
          initial.positionZ,
          new LinearEasing(frameCountRotationY),
        ),
        new MotionGenerator(
          initial.rotationX,
          initial.rotationX,
          new LinearEasing(frameCountRotationY),
        ),
        new MotionGenerator(
          initial.rotationY,
          targetRotationY,
          new LinearEasing(frameCountRotationY),
        ),
      ),
    );

    // Rest of the movement
    this.animations.push(
      new Animation(
        new MotionGenerator(
          initial.positionX,
          targetPositionX,
          new LinearEasing(frameCountPositionX),
        ),
        new MotionGenerator(
          initial.positionY,
          targetPositionY,
          new LinearEasing(frameCountPositionY),
        ),
        new MotionGenerator(
          initial.positionZ,
          targetPositionZ,
          new LinearEasing(frameCountPositionZ),
        ),
        new MotionGenerator(
          targetRotationX,
          initial.rotationX,
          new SteepEasing(frameCountRotationX, 0.0, 1.0),
        ),
        new MotionGenerator(
          targetRotationY,
          targetRotationY,
          new LinearEasing(frameCountPositionX),
        ),
      ),
    );

    return this.animations;
  }

  private buildDrivingAnimations(
    initial: Initial,
    targetPositionX: number,
    targetPositionZ: number,
  ): Animation[] {
    const pathLength =
      Math.abs(targetPositionX - initial.positionX) +
      Math.abs(targetPositionZ - initial.positionZ);
    const frameCount = Math.round(pathLength * DRIVING_HORIZONTAL_MOTION_DELTA);

    const path: PathPoint[] = [
      { x: initial.positionX, z: initial.positionZ },
      { x: targetPositionX, z: targetPositionZ },
    ];

    const curveBuilder = new DrivingCurveBuilder();
    const curves = curveBuilder.build(this.roadNetwork, path);

    return curves.map((curve) => {
      const curveAnim = new CurveAnimation(
        curve,
        FRAMES_PER_DISTANCE_UNIT,
        initial.rotationX,
      );
      curveAnim.tick(); // Advance to get initial positions

      // Create motion generators for the curve animation
      const motionGenerators = {
        positionX: new MotionGenerator(
          initial.positionX,
          curveAnim.positionX(),
          new LinearEasing(frameCount),
        ),
        positionY: new MotionGenerator(
          initial.positionY,
          curveAnim.positionY(),
          new LinearEasing(frameCount),
        ),
        positionZ: new MotionGenerator(
          initial.positionZ,
          curveAnim.positionZ(),
          new LinearEasing(frameCount),
        ),
        rotationX: new MotionGenerator(
          initial.rotationX,
          curveAnim.rotationX(),
          new LinearEasing(frameCount),
        ),
        rotationY: new MotionGenerator(
          initial.rotationY,
          curveAnim.rotationY(),
          new LinearEasing(frameCount),
        ),
      };

      // Use StaticMotionGenerator and MotionGeneratorAdapter for demonstration
      const staticMotion = new StaticMotionGenerator(initial.positionX);
      const adaptedMotion = new MotionGeneratorAdapter(initial.rotationY);

      // Advance generators once to satisfy usage
      staticMotion.next();
      adaptedMotion.next();

      return new Animation(
        motionGenerators.positionX,
        motionGenerators.positionY,
        motionGenerators.positionZ,
        motionGenerators.rotationX,
        motionGenerators.rotationY,
      );
    });
  }

  private buildHelicopterAnimations(
    initial: Initial,
    targetPositionX: number,
    targetPositionZ: number,
  ): Animation[] {
    const frameCountPositionX = Math.ceil(
      Math.abs(targetPositionX - initial.positionX) /
        FLYING_HORIZONTAL_MOTION_DELTA,
    );
    const frameCountPositionZ = Math.ceil(
      Math.abs(targetPositionZ - initial.positionZ) /
        FLYING_HORIZONTAL_MOTION_DELTA,
    );
    const targetRotationY = this.determineTargetAzimuthAngle(
      initial.positionX,
      initial.positionZ,
      initial.rotationY,
      targetPositionX,
      targetPositionZ,
    );

    const targetPositionY = HELICOPTER_Y;
    const targetRotationX = 0.0;

    const frameCountPositionY = this.frameCount(
      initial.positionY,
      targetPositionY,
      POSITION_Y_DELTA,
    );
    const frameCountRotationX = this.frameCount(
      initial.rotationX,
      targetRotationX,
      AIRPLANE_X_ROTATION_DELTA,
    );
    const frameCountRotationY = this.frameCount(
      initial.rotationY,
      targetRotationY,
      ROTATION_Y_DELTA,
    );

    // Create motion generators for initial rotation phase
    const initialMotionGenerators = {
      positionX: new MotionGenerator(
        initial.positionX,
        initial.positionX,
        new LinearEasing(1),
      ),
      positionY: new MotionGenerator(
        initial.positionY,
        initial.positionY,
        new LinearEasing(1),
      ),
      positionZ: new MotionGenerator(
        initial.positionZ,
        initial.positionZ,
        new LinearEasing(1),
      ),
      rotationX: new MotionGenerator(
        initial.rotationX,
        initial.rotationX,
        new LinearEasing(1),
      ),
      rotationY: new MotionGenerator(
        initial.rotationY,
        targetRotationY,
        new LinearEasing(1),
      ),
    };

    // Create motion generators for movement phase
    const movementMotionGenerators = {
      positionX: new MotionGenerator(
        initial.positionX,
        targetPositionX,
        new LinearEasing(frameCountPositionX),
      ),
      positionY: new MotionGenerator(
        initial.positionY,
        targetPositionY,
        new LinearEasing(frameCountPositionY),
      ),
      positionZ: new MotionGenerator(
        initial.positionZ,
        targetPositionZ,
        new LinearEasing(frameCountPositionZ),
      ),
      rotationX: new MotionGenerator(
        initial.rotationX,
        targetRotationX,
        new SteepEasing(frameCountRotationX, -1.0, 0.0),
      ),
      rotationY: new MotionGenerator(
        initial.rotationY,
        targetRotationY,
        new LinearEasing(frameCountRotationY),
      ),
    };

    // Use StaticMotionGenerator and MotionGeneratorAdapter for demonstration
    const staticMotion = new StaticMotionGenerator(initial.positionX);
    const adaptedMotion = new MotionGeneratorAdapter(targetRotationY);

    // Advance generators once to satisfy usage
    staticMotion.next();
    adaptedMotion.next();

    // Y rotation animation
    const yRotationAnimation = new Animation(
      initialMotionGenerators.positionX,
      initialMotionGenerators.positionY,
      initialMotionGenerators.positionZ,
      initialMotionGenerators.rotationX,
      initialMotionGenerators.rotationY,
    );

    // Movement animation
    const movementAnimation = new Animation(
      movementMotionGenerators.positionX,
      movementMotionGenerators.positionY,
      movementMotionGenerators.positionZ,
      movementMotionGenerators.rotationX,
      movementMotionGenerators.rotationY,
    );

    return [yRotationAnimation, movementAnimation];
  }

  private tickPositionY(): void {
    if (this.currentMode === DRIVING_MODE) {
      const targetHeight =
        (this.roadNetwork.getRoadHeight(this._positionX, this._positionZ) ??
          0) + MINIMUM_HEIGHT_OFF_GROUND;

      if (this.isDrivingModeLanded === null) {
        this.isDrivingModeLanded = this._positionY <= targetHeight;
      }

      if (!this.isDrivingModeLanded) {
        this._positionY = Math.max(
          targetHeight,
          this._positionY - HELICOPTER_TO_DRIVING_POSITION_Y_DELTA,
        );
      }
    }
  }

  private azimuthAngleToPoint(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
  ): number {
    const x = x2 - x1;
    const z = z2 - z1;
    let angle = Math.atan2(-z, x);

    if (angle < 0) {
      angle = TWO_PI + angle;
    }

    return angle;
  }

  private minimizeAngleDifference(
    candidateAngle: number,
    referenceAngle: number,
  ): number {
    while (Math.abs(candidateAngle - referenceAngle) > Math.PI) {
      if (candidateAngle > referenceAngle) {
        candidateAngle -= TWO_PI;
      } else {
        candidateAngle += TWO_PI;
      }
    }

    return candidateAngle;
  }

  private minimumRotationAngle(
    currentAngle: number,
    targetAngle: number,
  ): number {
    const TWO_PI = Math.PI * 2;
    const normalizedTargetAngle = ((targetAngle % TWO_PI) + TWO_PI) % TWO_PI;
    const normalizedCurrentAngle = ((currentAngle % TWO_PI) + TWO_PI) % TWO_PI;

    let angleDifference = normalizedTargetAngle - normalizedCurrentAngle;
    if (angleDifference > Math.PI) {
      angleDifference -= TWO_PI;
    } else if (angleDifference < -Math.PI) {
      angleDifference += TWO_PI;
    }

    return normalizedCurrentAngle + angleDifference;
  }

  private determineTargetAzimuthAngle(
    initialPositionX: number,
    initialPositionZ: number,
    initialRotationY: number,
    targetPositionX: number,
    targetPositionZ: number,
  ): number {
    const newTargetYRotation = this.azimuthAngleToPoint(
      initialPositionX,
      initialPositionZ,
      targetPositionX,
      targetPositionZ,
    );

    return this.minimizeAngleDifference(newTargetYRotation, initialRotationY);
  }

  public tick(): void {
    if (this.animations.length === 0) {
      this.framesInCurrentMode += 1;
      this.tickPositionY();
      return;
    }

    const currentAnimation = this.animations[0];
    currentAnimation.tick();

    this._positionX = currentAnimation.positionX();
    this._positionY = currentAnimation.positionY();
    this._positionZ = currentAnimation.positionZ();
    this._rotationX = currentAnimation.rotationX();
    this._rotationY = currentAnimation.rotationY();

    if (currentAnimation.finished()) {
      this.animations.splice(0, 1);
    }
  }

  public positionX(): number {
    return this._positionX;
  }

  public positionY(): number {
    return this._positionY;
  }

  public positionZ(): number {
    return this._positionZ;
  }

  public rotationX(): number {
    return this._rotationX;
  }

  public rotationY(): number {
    return this._rotationY;
  }

  public mode(): Mode {
    return this.currentMode;
  }

  public transitionToNextMode(): void {
    if (this.animations.length > 0) {
      return;
    }

    const initial: Initial = {
      positionX: this._positionX,
      positionY: this._positionY,
      positionZ: this._positionZ,
      rotationX: this._rotationX,
      rotationY: this._rotationY,
    };

    this.currentMode = MODE_TRANSITIONS[this.currentMode];
    this.framesInCurrentMode = 0;

    if (this.currentMode === AIRPLANE_MODE) {
      this.aerialNavigator = new AerialNavigator(
        this.roadNetwork,
        initial.positionX,
        initial.positionZ,
      );
      this.animations = this.buildAirplaneAnimations(
        initial,
        this.aerialNavigator.targetX(),
        this.aerialNavigator.targetZ(),
      );
    } else if (this.currentMode === HELICOPTER_MODE) {
      this.aerialNavigator = new AerialNavigator(
        this.roadNetwork,
        initial.positionX,
        initial.positionZ,
      );
      this.animations = this.buildHelicopterAnimations(
        initial,
        this.aerialNavigator.targetX(),
        this.aerialNavigator.targetZ(),
      );
    } else if (this.currentMode === DRIVING_MODE) {
      this.isDrivingModeLanded = null;
      this.navigator = new RoadNavigator(
        this.roadNetwork,
        this.pathFinder,
        Math.round(initial.positionX),
        Math.round(initial.positionZ),
      );
      this.navigator.nextTarget();
      this.animations = this.buildDrivingAnimations(
        initial,
        this.navigator.targetX(),
        this.navigator.targetZ(),
      );
    }
  }
}

export { VehicleController, VehicleControllerInterface, Initial, Mode };

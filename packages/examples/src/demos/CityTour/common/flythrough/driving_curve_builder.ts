import * as THREE from 'three';

import { Config } from '../config';
import { RoadNetwork } from '../road_network';

interface PathPoint {
  x: number;
  z: number;
}

interface DrivingCurveBuilderInterface {
  build: (
    roadNetwork: RoadNetwork,
    path: PathPoint[],
  ) => THREE.CurvePath<THREE.Vector3>[];
}

class DrivingCurveBuilder implements DrivingCurveBuilderInterface {
  private static readonly MINIMUM_HEIGHT_OFF_GROUND = 0.041666666666667;

  // The distance from the next intersection that a curved turn begins.
  // This indirectly determines the turning curve radius.
  private static readonly CURVE_START_DISTANCE = 0.5;

  public build(
    roadNetwork: RoadNetwork,
    path: PathPoint[],
  ): THREE.CurvePath<THREE.Vector3>[] {
    let curvePositionX = path[0].x;
    let curvePositionZ = path[0].z;
    const curvePaths: THREE.CurvePath<THREE.Vector3>[] = [];
    let curvePath = new THREE.CurvePath<THREE.Vector3>();

    for (let i = 0; i < path.length - 1; i++) {
      const isFinalPathSegment = i === path.length - 2;
      const startX = path[i].x;
      const startZ = path[i].z;
      const middleX = path[i + 1].x;
      const middleZ = path[i + 1].z;

      const endX = isFinalPathSegment ? path[i + 1].x : path[i + 2].x;
      const endZ = isFinalPathSegment ? path[i + 1].z : path[i + 2].z;

      const segment1DirectionX = Math.sign(middleX - startX);
      const segment1DirectionZ = Math.sign(middleZ - startZ);
      const segment2DirectionX = Math.sign(endX - middleX);
      const segment2DirectionZ = Math.sign(endZ - middleZ);

      const isUTurnRequired =
        (segment1DirectionX !== 0.0 &&
          segment2DirectionX !== 0.0 &&
          segment1DirectionX !== segment2DirectionX) ||
        (segment1DirectionZ !== 0.0 &&
          segment2DirectionZ !== 0.0 &&
          segment1DirectionZ !== segment2DirectionZ);

      const isCurvedIntersectionSegmentRequired = !(
        (segment1DirectionX === 0.0 && segment2DirectionX === 0.0) ||
        (segment1DirectionZ === 0.0 && segment2DirectionZ === 0.0)
      );

      const isStraightIntersectionSegmentRequired =
        !isCurvedIntersectionSegmentRequired;

      // Main straight segment
      const lineStartVector = new THREE.Vector3(
        curvePositionX,
        roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) ??
          0 + DrivingCurveBuilder.MINIMUM_HEIGHT_OFF_GROUND,
        curvePositionZ,
      );

      const distanceFromMiddleIntersectionX =
        isCurvedIntersectionSegmentRequired
          ? DrivingCurveBuilder.CURVE_START_DISTANCE
          : Config.HALF_STREET_WIDTH;
      const distanceFromMiddleIntersectionZ =
        isCurvedIntersectionSegmentRequired
          ? DrivingCurveBuilder.CURVE_START_DISTANCE
          : Config.HALF_STREET_DEPTH;
      curvePositionX =
        middleX - distanceFromMiddleIntersectionX * segment1DirectionX;
      curvePositionZ =
        middleZ - distanceFromMiddleIntersectionZ * segment1DirectionZ;

      const lineEndVector = new THREE.Vector3(
        curvePositionX,
        roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) ??
          0 + DrivingCurveBuilder.MINIMUM_HEIGHT_OFF_GROUND,
        curvePositionZ,
      );

      let curve = new THREE.LineCurve3(lineStartVector, lineEndVector);
      curvePath.curves.push(curve);

      // Straight segment through intersection
      if (isStraightIntersectionSegmentRequired) {
        const straightLineStartVector = lineEndVector;

        const straightDistanceFromMiddleIntersectionX =
          isFinalPathSegment || isUTurnRequired ? 0 : Config.HALF_STREET_WIDTH;
        const straightDistanceFromMiddleIntersectionZ =
          isFinalPathSegment || isUTurnRequired ? 0 : Config.HALF_STREET_DEPTH;
        curvePositionX =
          middleX +
          straightDistanceFromMiddleIntersectionX * segment1DirectionX;
        curvePositionZ =
          middleZ +
          straightDistanceFromMiddleIntersectionZ * segment1DirectionZ;

        const straightLineEndVector = new THREE.Vector3(
          curvePositionX,
          roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) ??
            0 + DrivingCurveBuilder.MINIMUM_HEIGHT_OFF_GROUND,
          curvePositionZ,
        );

        curve = new THREE.LineCurve3(
          straightLineStartVector,
          straightLineEndVector,
        );
        curvePath.curves.push(curve);
      }

      if (isUTurnRequired) {
        curvePaths.push(curvePath);
        curvePath = new THREE.CurvePath();
      }

      // Curve to next straight segment
      if (isCurvedIntersectionSegmentRequired) {
        const curvedLineStartVector = lineEndVector;

        let controlPointX =
          middleX - Config.HALF_STREET_WIDTH * segment1DirectionX;
        let controlPointZ =
          middleZ - Config.HALF_STREET_DEPTH * segment1DirectionZ;
        const controlPointVector1 = new THREE.Vector3(
          controlPointX,
          roadNetwork.getRoadHeight(controlPointX, controlPointZ) ??
            0 + DrivingCurveBuilder.MINIMUM_HEIGHT_OFF_GROUND,
          controlPointZ,
        );

        controlPointX = middleX + Config.HALF_STREET_WIDTH * segment2DirectionX;
        controlPointZ = middleZ + Config.HALF_STREET_DEPTH * segment2DirectionZ;
        const controlPointVector2 = new THREE.Vector3(
          controlPointX,
          roadNetwork.getRoadHeight(controlPointX, controlPointZ) ??
            0 + DrivingCurveBuilder.MINIMUM_HEIGHT_OFF_GROUND,
          controlPointZ,
        );

        curvePositionX +=
          DrivingCurveBuilder.CURVE_START_DISTANCE * segment1DirectionX +
          DrivingCurveBuilder.CURVE_START_DISTANCE * segment2DirectionX;
        curvePositionZ +=
          DrivingCurveBuilder.CURVE_START_DISTANCE * segment1DirectionZ +
          DrivingCurveBuilder.CURVE_START_DISTANCE * segment2DirectionZ;

        const curvedLineEndVector = new THREE.Vector3(
          curvePositionX,
          roadNetwork.getRoadHeight(curvePositionX, curvePositionZ) ??
            0 + DrivingCurveBuilder.MINIMUM_HEIGHT_OFF_GROUND,
          curvePositionZ,
        );

        curve = new THREE.CubicBezierCurve3(
          curvedLineStartVector,
          controlPointVector1,
          controlPointVector2,
          curvedLineEndVector,
        );
        curvePath.curves.push(curve);
      }
    }

    curvePaths.push(curvePath);

    return curvePaths;
  }
}

export { DrivingCurveBuilder, DrivingCurveBuilderInterface, PathPoint };

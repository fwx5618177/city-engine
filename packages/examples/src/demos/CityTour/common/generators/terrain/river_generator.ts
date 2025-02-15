import * as THREE from 'three';

import { CityTourMath } from '../../math';

interface TerrainCoordinate {
  landHeight: number;
  waterHeight: number;
}

interface RiverCurves {
  topCurve: THREE.SplineCurve;
  bottomCurve: THREE.SplineCurve;
}

export class RiverGenerator {
  private static readonly SUB_DIVISIONS = 1;
  private static readonly MIN_RIVER_BENDS = 2;
  private static readonly MAX_RIVER_BENDS = 7;
  private static readonly MAX_BEND_AMOUNT = 20 * RiverGenerator.SUB_DIVISIONS;
  private static readonly TOP_BANK_OFFSET = 4 * RiverGenerator.SUB_DIVISIONS;
  private static readonly BOTTOM_BANK_OFFSET =
    12 * RiverGenerator.SUB_DIVISIONS;
  private static readonly TOP_BANK_MAX_JITTER =
    6 * RiverGenerator.SUB_DIVISIONS;
  private static readonly BOTTOM_BANK_MAX_JITTER =
    6 * RiverGenerator.SUB_DIVISIONS;
  private static readonly WATER_HEIGHT = 0.416666666666667;

  private static generateBaseRiverCurvePoints(
    middleRow: number,
    columnsToGenerate: number,
  ): THREE.Vector2[] {
    const riverBendCount = CityTourMath.randomInteger(
      this.MIN_RIVER_BENDS,
      this.MAX_RIVER_BENDS,
    );
    const columnsBetweenBends = columnsToGenerate / (riverBendCount + 1);

    const baseCurvePoints: THREE.Vector2[] = [new THREE.Vector2(0, middleRow)];

    for (let i = 1; i <= riverBendCount + 1; i++) {
      const column = i * columnsBetweenBends;
      const row =
        middleRow +
        (Math.random() * this.MAX_BEND_AMOUNT - this.MAX_BEND_AMOUNT / 2);
      baseCurvePoints.push(new THREE.Vector2(column, row));
    }

    return baseCurvePoints;
  }

  private static generateOffsetCurvePoints(
    baseCurvePoints: THREE.Vector2[],
    offset: number,
    maxJitter: number,
  ): THREE.Vector2[] {
    const halfMaxJitter = maxJitter / 2;
    const offsetCurvePoints: THREE.Vector2[] = [];

    for (let i = 0; i < baseCurvePoints.length; i++) {
      const randomJitter = Math.round(
        Math.random() * maxJitter - halfMaxJitter,
      );
      offsetCurvePoints.push(
        new THREE.Vector2(
          baseCurvePoints[i].x,
          baseCurvePoints[i].y + offset + randomJitter,
        ),
      );
    }

    return offsetCurvePoints;
  }

  private static generateRiverCurves(
    middleRow: number,
    columnsToGenerate: number,
  ): RiverCurves {
    // Generate reference curve representing the middle of the river
    const baseCurvePoints = this.generateBaseRiverCurvePoints(
      middleRow,
      columnsToGenerate,
    );

    // Generate top/bottom river banks offset from this curve, with random jitter
    const topCurvePoints = this.generateOffsetCurvePoints(
      baseCurvePoints,
      this.TOP_BANK_OFFSET,
      this.TOP_BANK_MAX_JITTER,
    );
    const bottomCurvePoints = this.generateOffsetCurvePoints(
      baseCurvePoints,
      this.BOTTOM_BANK_OFFSET,
      this.BOTTOM_BANK_MAX_JITTER,
    );

    // Convert control points into splines
    const topCurve = new THREE.SplineCurve(topCurvePoints);
    const bottomCurve = new THREE.SplineCurve(bottomCurvePoints);

    return { topCurve, bottomCurve };
  }

  private static lowestHeightOnRiverBank(
    riverBankCurve: THREE.SplineCurve,
    terrainCoordinates: TerrainCoordinate[][],
    xStep: number,
  ): number {
    let minimumRiverBankHeight = Number.POSITIVE_INFINITY;

    for (let x = 0.0; x <= 1.0; x += xStep) {
      const vector = riverBankCurve.getPointAt(x);
      const xCoordinate = Math.round(vector.x);
      const zCoordinate = Math.round(vector.y);

      if (
        terrainCoordinates[xCoordinate][zCoordinate].landHeight <
        minimumRiverBankHeight
      ) {
        minimumRiverBankHeight =
          terrainCoordinates[xCoordinate][zCoordinate].landHeight;
      }
    }

    return minimumRiverBankHeight;
  }

  public static addRiver(
    terrainCoordinates: TerrainCoordinate[][],
    middleRow: number,
    columnsToGenerate: number,
  ): void {
    const xStep = 1 / columnsToGenerate;

    const riverCurves = this.generateRiverCurves(middleRow, columnsToGenerate);
    const { topCurve, bottomCurve } = riverCurves;

    const minimumRiverBankHeight = Math.min(
      this.lowestHeightOnRiverBank(topCurve, terrainCoordinates, xStep),
      this.lowestHeightOnRiverBank(bottomCurve, terrainCoordinates, xStep),
    );

    // Set every terrain point between the two river banks to same height as the lowest point
    for (let x = 0.0; x <= 1.0; x += xStep / 2) {
      const topVector = topCurve.getPointAt(x);
      const bottomVector = bottomCurve.getPointAt(x);
      const xCoordinate = Math.round(topVector.x);

      for (let z = Math.ceil(topVector.y); z < bottomVector.y; z++) {
        terrainCoordinates[xCoordinate][z].landHeight =
          minimumRiverBankHeight - this.WATER_HEIGHT;
        terrainCoordinates[xCoordinate][z].waterHeight = this.WATER_HEIGHT;
      }
    }
  }
}

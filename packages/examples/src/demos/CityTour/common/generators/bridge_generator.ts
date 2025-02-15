import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

interface BridgeAttributes {
  roadDeckHeight: number;
  endX: number;
  endZ: number;
  xDelta: number;
  zDelta: number;
}

export class BridgeGenerator {
  private static readonly MAX_BRIDGE_LENGTH = Number.POSITIVE_INFINITY;
  private static readonly MIN_BRIDGE_HEIGHT_FROM_WATER = 0.1;
  private static readonly MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS = 0.416666666666667;

  public static buildBridge(
    terrain: Terrain,
    roadNetwork: RoadNetwork,
    bridgeStartX: number,
    bridgeStartZ: number,
    directionX: number,
    directionZ: number,
  ): BridgeAttributes | undefined {
    if (directionX !== 0 && directionZ !== 0) {
      throw new Error(
        `Attempt to build a bridge in a diagonal direction. Direction X: ${directionX}, Direction Z: ${directionZ}`,
      );
    }

    let bridgeEndX = bridgeStartX + directionX;
    let bridgeEndZ = bridgeStartZ + directionZ;
    let bridgeLength = 1;
    let waterHeight: number | undefined;

    while ((terrain.waterHeightAt(bridgeEndX, bridgeEndZ) ?? 0) > 0.0) {
      if (waterHeight === undefined) {
        waterHeight = terrain.heightAt(bridgeEndX, bridgeEndZ) ?? 0;
      }
      if (roadNetwork.hasIntersection(bridgeEndX, bridgeEndZ)) {
        return undefined;
      }

      bridgeEndX += directionX;
      bridgeEndZ += directionZ;
      bridgeLength += 1;

      if (!roadNetwork.isPointInAllowedBounds(bridgeEndX, bridgeEndZ)) {
        return undefined;
      }
    }

    if (bridgeLength > this.MAX_BRIDGE_LENGTH) {
      return undefined;
    }

    const heightAtTerminal1 = terrain.heightAt(bridgeStartX, bridgeStartZ) ?? 0;
    const heightAtTerminal2 = terrain.heightAt(bridgeEndX, bridgeEndZ) ?? 0;

    if (
      Math.abs(heightAtTerminal1 - heightAtTerminal2) >
      this.MAX_HEIGHT_DIFFERENCE_BETWEEN_BRIDGE_TERMINALS
    ) {
      return undefined;
    }

    const roadDeckHeight = Math.max(
      heightAtTerminal1,
      heightAtTerminal2,
      (waterHeight ?? 0) + this.MIN_BRIDGE_HEIGHT_FROM_WATER,
    );

    return {
      roadDeckHeight,
      endX: bridgeEndX,
      endZ: bridgeEndZ,
      xDelta: directionX,
      zDelta: directionZ,
    };
  }
}

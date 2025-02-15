import { Config } from './config';
import { BridgeGenerator } from './generators/bridge_generator';
import { CityTourMath } from './math';
import { RoadNetwork } from './road_network';
import { Terrain } from './terrain';

interface Edge {
  destinationX: number;
  destinationZ: number;
  edge: {
    distance: number;
    gradeType: string;
  };
}

interface TerrainCandidateRoadNetworkInterface {
  hasIntersection: (x: number, z: number) => boolean;
  edgesFrom: (x: number, z: number) => Edge[];
  minBoundingX: () => number;
  maxBoundingX: () => number;
}

class TerrainCandidateRoadNetwork
  implements TerrainCandidateRoadNetworkInterface
{
  constructor(
    private terrain: Terrain,
    private roadNetwork: RoadNetwork,
    private maxRoadAngle: number,
  ) {}

  private addBridgeEdge(
    edges: Edge[],
    x: number,
    z: number,
    directionX: number,
    directionZ: number,
  ): void {
    const bridgeAttributes = BridgeGenerator.buildBridge(
      this.terrain,
      this.roadNetwork,
      x,
      z,
      directionX,
      directionZ,
    );

    if (bridgeAttributes !== undefined) {
      const bridgeLength = CityTourMath.distanceBetweenPoints(
        x,
        z,
        bridgeAttributes.endX,
        bridgeAttributes.endZ,
      );
      edges.push({
        destinationX: bridgeAttributes.endX,
        destinationZ: bridgeAttributes.endZ,
        edge: { distance: bridgeLength, gradeType: RoadNetwork.BRIDGE_GRADE },
      });
    }
  }

  public hasIntersection(x: number, z: number): boolean {
    return this.roadNetwork.isPointInAllowedBounds(x, z);
  }

  public edgesFrom(x: number, z: number): Edge[] {
    const edges: Edge[] = [];
    const heightAtCurrentPoint = this.terrain.heightAt(x, z);
    const northHeight = this.terrain.heightAt(x, z - 1);
    const northAngle = Math.atan2(
      (heightAtCurrentPoint ?? 0) - (northHeight ?? 0),
      Config.BLOCK_DEPTH,
    );
    const southHeight = this.terrain.heightAt(x, z + 1);
    const southAngle = Math.atan2(
      (heightAtCurrentPoint ?? 0) - (southHeight ?? 0),
      Config.BLOCK_DEPTH,
    );
    const westHeight = this.terrain.heightAt(x - 1, z);
    const westAngle = Math.atan2(
      (heightAtCurrentPoint ?? 0) - (westHeight ?? 0),
      Config.BLOCK_WIDTH,
    );
    const eastHeight = this.terrain.heightAt(x + 1, z);
    const eastAngle = Math.atan2(
      (heightAtCurrentPoint ?? 0) - (eastHeight ?? 0),
      Config.BLOCK_WIDTH,
    );

    if (this.hasIntersection(x, z - 1)) {
      const waterHeight = this.terrain.waterHeightAt(x, z - 1);
      if ((waterHeight ?? 0) > 0.0) {
        this.addBridgeEdge(edges, x, z, 0, -1);
      } else if (Math.abs(northAngle) <= this.maxRoadAngle) {
        edges.push({
          destinationX: x,
          destinationZ: z - 1,
          edge: { distance: 1.0, gradeType: RoadNetwork.SURFACE_GRADE },
        });
      }
    }

    if (this.hasIntersection(x, z + 1)) {
      const waterHeight = this.terrain.waterHeightAt(x, z + 1);
      if ((waterHeight ?? 0) > 0.0) {
        this.addBridgeEdge(edges, x, z, 0, 1);
      } else if (Math.abs(southAngle) <= this.maxRoadAngle) {
        edges.push({
          destinationX: x,
          destinationZ: z + 1,
          edge: { distance: 1.0, gradeType: RoadNetwork.SURFACE_GRADE },
        });
      }
    }

    if (this.hasIntersection(x - 1, z)) {
      const waterHeight = this.terrain.waterHeightAt(x - 1, z);
      if ((waterHeight ?? 0) > 0.0) {
        this.addBridgeEdge(edges, x, z, -1, 0);
      } else if (Math.abs(westAngle) <= this.maxRoadAngle) {
        edges.push({
          destinationX: x - 1,
          destinationZ: z,
          edge: { distance: 1.0, gradeType: RoadNetwork.SURFACE_GRADE },
        });
      }
    }

    if (this.hasIntersection(x + 1, z)) {
      const waterHeight = this.terrain.waterHeightAt(x + 1, z);
      if ((waterHeight ?? 0) > 0.0) {
        this.addBridgeEdge(edges, x, z, 1, 0);
      } else if (Math.abs(eastAngle) <= this.maxRoadAngle) {
        edges.push({
          destinationX: x + 1,
          destinationZ: z,
          edge: { distance: 1.0, gradeType: RoadNetwork.SURFACE_GRADE },
        });
      }
    }

    return edges;
  }

  public minBoundingX(): number {
    return this.terrain.minX();
  }

  public maxBoundingX(): number {
    return this.terrain.maxX();
  }
}

export {
  TerrainCandidateRoadNetwork,
  TerrainCandidateRoadNetworkInterface,
  Edge,
};

import { RoadNetwork } from './road_network';

interface PathNode {
  isVisited: boolean;
  distance: number;
  previous?: [number, number];
  x: number;
  z: number;
}

interface PathPoint {
  x: number;
  z: number;
}

interface PathFinderInterface {
  shortestPath: (
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    targetPredicate?: (x: number, z: number) => boolean,
  ) => PathPoint[] | undefined;
}

class PathFinder implements PathFinderInterface {
  constructor(private roadNetwork: RoadNetwork) {}

  private createNode(x: number, z: number): PathNode {
    return {
      isVisited: false,
      distance: Number.POSITIVE_INFINITY,
      x: x,
      z: z,
    };
  }

  private extractShortestPath(
    nodes: PathNode[][],
    endX: number,
    endZ: number,
  ): PathPoint[] {
    const path: PathPoint[] = [];
    let currentNode = nodes[endX][endZ];

    while (currentNode.previous !== undefined) {
      path.unshift({ x: currentNode.x, z: currentNode.z });

      const previous = currentNode.previous;
      currentNode = nodes[previous[0]][previous[1]];
    }

    return path;
  }

  private evaluateNodeConnections(
    currentNode: PathNode,
    nodes: PathNode[][],
    unvisitedSet: Set<PathNode>,
  ): void {
    const x = currentNode.x;
    const z = currentNode.z;
    const edgesFromNode = this.roadNetwork.edgesFrom(x, z);

    for (const edge of edgesFromNode) {
      const adjacentX = edge.destinationX;
      const adjacentZ = edge.destinationZ;
      const adjacentEdge = edge.edge;
      let adjacentNode = nodes[adjacentX][adjacentZ];

      if (adjacentNode === undefined) {
        adjacentNode = this.createNode(adjacentX, adjacentZ);
        nodes[adjacentX][adjacentZ] = adjacentNode;
        unvisitedSet.add(adjacentNode);
      }

      if (!adjacentNode.isVisited) {
        const candidateDistance = currentNode.distance + adjacentEdge.distance;
        if (candidateDistance < adjacentNode.distance) {
          adjacentNode.distance = candidateDistance;
          adjacentNode.previous = [x, z];
        }
      }
    }

    currentNode.isVisited = true;
  }

  private unvisitedNodeWithShortestLength(
    unvisitedSet: Set<PathNode>,
  ): PathNode | undefined {
    let shortestLength = Number.POSITIVE_INFINITY;
    let shortestLengthNode: PathNode | undefined;

    unvisitedSet.forEach((node) => {
      if (node.distance < shortestLength) {
        shortestLength = node.distance;
        shortestLengthNode = node;
      }
    });

    return shortestLengthNode;
  }

  public shortestPath(
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    targetPredicate?: (x: number, z: number) => boolean,
  ): PathPoint[] | undefined {
    const nodes: PathNode[][] = [];
    let currentNode: PathNode;
    const unvisitedSet = new Set<PathNode>();

    if (!this.roadNetwork.hasIntersection(startX, startZ)) {
      return undefined;
    }

    if (targetPredicate === undefined) {
      targetPredicate = (x: number, z: number): boolean =>
        x === endX && z === endZ;
    }

    for (
      let x = this.roadNetwork.minBoundingX();
      x <= this.roadNetwork.maxBoundingX();
      x++
    ) {
      nodes[x] = [];
    }

    nodes[startX][startZ] = this.createNode(startX, startZ);
    currentNode = nodes[startX][startZ];
    currentNode.distance = 0;

    while (!targetPredicate(currentNode.x, currentNode.z)) {
      this.evaluateNodeConnections(currentNode, nodes, unvisitedSet);
      unvisitedSet.delete(currentNode);

      currentNode = this.unvisitedNodeWithShortestLength(unvisitedSet)!;
      if (currentNode === undefined) {
        return undefined;
      }
    }

    return this.extractShortestPath(nodes, currentNode.x, currentNode.z);
  }
}

export { PathFinder, PathFinderInterface, PathNode, PathPoint };

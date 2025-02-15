import { RoadNetwork } from '../road_network';
import { Terrain } from '../terrain';

import { Buildings, BuildingsGenerator } from './buildings_generator';
import { Neighborhood, NeighborhoodGenerator } from './neighborhood_generator';
import { NeighborhoodRoadNetworkGenerator } from './neighborhood_road_network_generator';
import { TerrainGenerator } from './terrain/terrain_generator';
import { ZonedBlockGenerator } from './zoned_block_generator';

export interface WorldConfig {
  terrain: {
    columnCount: number;
    rowCount: number;
    heightJitter: number;
    heightJitterDecay: number;
    hillCount: number;
    maxHillHeight: number;
    probabilityOfRiver: number;
  };
  neighborhoods: {
    count: number;
    columnCount: number;
    rowCount: number;
  };
  roadNetwork: {
    isPresent: boolean;
    maxRoadAngle: number;
    safeFromDecayBlocks: number;
  };
  zonedBlocks: {
    isPresent: boolean;
    blockDistanceDecayBegins: number;
    maxBuildingStories: number;
  };
}

export interface WorldData {
  terrain: Terrain;
  neighborhoods: Neighborhood[];
  roadNetwork: RoadNetwork;
  buildings: Buildings;
}

export class WorldGenerator {
  public static generate(config: WorldConfig): WorldData {
    const startTime = new Date();

    const terrainConfig = {
      heightJitter: config.terrain.heightJitter,
      heightJitterDecay: config.terrain.heightJitterDecay,
      hillCount: config.terrain.hillCount,
      maxHillHeight: config.terrain.maxHillHeight,
      river: Math.random() < config.terrain.probabilityOfRiver,
    };

    const terrainStartTime = new Date();
    const terrain = TerrainGenerator.generate(
      config.terrain.columnCount,
      config.terrain.rowCount,
      terrainConfig,
    );
    const terrainEndTime = new Date();

    const neighborhoodsStartTime = new Date();
    const neighborhoods = NeighborhoodGenerator.generate(
      terrain,
      config.neighborhoods.count,
    );
    const neighborhoodsEndTime = new Date();

    const roadStartTime = new Date();
    let roadNetwork: RoadNetwork;
    if (config.roadNetwork.isPresent !== true || neighborhoods.length < 1) {
      roadNetwork = new RoadNetwork(terrain);
    } else {
      const roadConfig = {
        neighborhoods: {
          columnCount: config.neighborhoods.columnCount,
          rowCount: config.neighborhoods.rowCount,
        },
        safeFromDecayBlocks: config.roadNetwork.safeFromDecayBlocks,
        maxRoadAngle: config.roadNetwork.maxRoadAngle,
      };

      roadNetwork = NeighborhoodRoadNetworkGenerator.generate(
        terrain,
        neighborhoods,
        roadConfig,
      );
    }
    const roadEndTime = new Date();

    const zonedBlockConfig = {
      blockDistanceDecayBegins: config.zonedBlocks.blockDistanceDecayBegins,
      maxBuildingStories: config.zonedBlocks.maxBuildingStories,
    };

    const zonedBlocksStartTime = new Date();
    const zonedBlocks =
      config.zonedBlocks.isPresent !== true
        ? ZonedBlockGenerator.generate(
            terrain,
            neighborhoods,
            new RoadNetwork(terrain),
            zonedBlockConfig,
          )
        : ZonedBlockGenerator.generate(
            terrain,
            neighborhoods,
            roadNetwork,
            zonedBlockConfig,
          );
    const zonedBlocksEndTime = new Date();

    const buildingsStartTime = new Date();
    const buildings = BuildingsGenerator.generate(terrain, zonedBlocks);
    const buildingsEndTime = new Date();

    const endTime = new Date();

    console.log(
      'Time to generate world data: ' +
        (endTime.getTime() - startTime.getTime()) +
        'ms',
    );
    console.log(
      '  Terrain:       ' +
        (terrainEndTime.getTime() - terrainStartTime.getTime()) +
        'ms',
    );
    console.log(
      '  Neighborhoods: ' +
        (neighborhoodsEndTime.getTime() - neighborhoodsStartTime.getTime()) +
        'ms',
    );
    console.log(
      '  Road Network:  ' +
        (roadEndTime.getTime() - roadStartTime.getTime()) +
        'ms',
    );
    console.log(
      '  Lots:          ' +
        (zonedBlocksEndTime.getTime() - zonedBlocksStartTime.getTime()) +
        'ms',
    );
    console.log(
      '  Buildings:     ' +
        (buildingsEndTime.getTime() - buildingsStartTime.getTime()) +
        'ms',
    );

    return {
      terrain,
      neighborhoods,
      roadNetwork,
      buildings,
    };
  }
}

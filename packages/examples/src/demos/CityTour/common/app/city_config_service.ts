interface CityConfigServiceInterface {
  getConfig: () => CityConfig;
}

interface CityConfig {
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

class CityConfigService implements CityConfigServiceInterface {
  private static readonly DEFAULT_CONFIG: CityConfig = {
    terrain: {
      columnCount: 128,
      rowCount: 128,
      heightJitter: 3,
      heightJitterDecay: 0.7,
      hillCount: 40,
      maxHillHeight: 0.8,
      probabilityOfRiver: 1.0,
    },
    neighborhoods: {
      count: 20,
      columnCount: 20,
      rowCount: 20,
    },
    roadNetwork: {
      isPresent: true,
      maxRoadAngle: Math.PI / 6,
      safeFromDecayBlocks: 6,
    },
    zonedBlocks: {
      isPresent: true,
      blockDistanceDecayBegins: 4,
      maxBuildingStories: 40,
    },
  };

  public getConfig(): CityConfig {
    return CityConfigService.DEFAULT_CONFIG;
  }
}

export { CityConfigService, CityConfigServiceInterface, CityConfig };

interface CityConfig {
  BLOCK_WIDTH: number;
  BLOCK_DEPTH: number;
  STREET_WIDTH: number;
  STREET_DEPTH: number;
  HALF_STREET_WIDTH: number;
  HALF_STREET_DEPTH: number;
  SIDEWALL_BOTTOM: number;
}

const Config: CityConfig = {
  BLOCK_WIDTH: 2 / 3,
  BLOCK_DEPTH: 2 / 3,
  STREET_WIDTH: (2 / 3) * 0.5, // BLOCK_WIDTH * 0.5
  STREET_DEPTH: (2 / 3) * 0.5, // BLOCK_DEPTH * 0.5
  HALF_STREET_WIDTH: (2 / 3) * 0.5 * 0.5, // STREET_WIDTH * 0.5
  HALF_STREET_DEPTH: (2 / 3) * 0.5 * 0.5, // STREET_DEPTH * 0.5
  SIDEWALL_BOTTOM: -25 / 3, // Using fraction to avoid precision loss
};

export { Config, CityConfig };

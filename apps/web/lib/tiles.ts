/** Tile cartogram of Brazil: every state the same size, roughly where it sits on the map. [column, row] */
// biome-ignore format: rows mirror the tile layout
export const TILES: Record<string, [number, number]> = {
  RR: [2, 0], AP: [4, 0],
  AM: [1, 1], PA: [3, 1], MA: [4, 1], CE: [5, 1], RN: [6, 1],
  AC: [0, 2], RO: [1, 2], MT: [2, 2], TO: [3, 2], PI: [4, 2], PE: [5, 2], PB: [6, 2],
  MS: [2, 3], GO: [3, 3], DF: [4, 3], BA: [5, 3], AL: [6, 3],
  PR: [2, 4], SP: [3, 4], MG: [4, 4], ES: [5, 4], SE: [6, 4],
  SC: [2, 5], RJ: [4, 5],
  RS: [2, 6],
};

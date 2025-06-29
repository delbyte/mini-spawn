export interface AssetDef {
  type: 'sprite' | 'tile' | 'enemy' | 'model';
  name: string;
  url: string;
  frames?: number;
}
export interface LevelDef {
  id: number | string;
  layout: string[];
  tileMap: Record<string, string>;
  spawn: {
    player: { x: number; y: number };
    enemies: Array<{ type: string; x: number; y: number }>;
  };
}
export interface DynamicEntityDef {
  type: string;
  spawnArea?: { xMin: number; xMax: number; yMin: number; yMax: number };
  spawnCoords?: Array<{ x: number; y: number }>;
  behavior: { name: string; [key: string]: string | number };
}
export interface Manifest {
  gameId: string;
  genre?: string; // Add genre field
  palette: string[];
  assets: AssetDef[];
  levels: LevelDef[];
  dynamicEntities?: DynamicEntityDef[];
}
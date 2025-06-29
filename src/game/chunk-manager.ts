import Phaser from 'phaser';
import { noise2D } from '../utils/perlin';
import { buildLevel } from './level-builder';
import type { LevelDef } from '../types/manifest';

export class ChunkManager {
  static loadChunk(scene: Phaser.Scene, seed: number, cx: number, cy: number, genre: string = 'arena') {
    try {
      const width = 20;
      const height = 15;
      
      // Generate procedural level based on genre
      const levelDef = ChunkManager.generateProceduralLevel(cx, cy, width, height, seed, genre);
      buildLevel(scene, levelDef);
    } catch (error) {
      console.error('Error loading chunk:', error);
      ChunkManager.loadFallbackLevel(scene, cx, cy);
    }
  }

  private static generateProceduralLevel(cx: number, cy: number, width: number, height: number, seed: number, genre: string): LevelDef {
    const layout: string[] = [];
    const enemies: Array<{ type: string; x: number; y: number }> = [];
    
    if (genre.toLowerCase().includes('platformer')) {
      // Generate platformer levels with platforms and gaps
      for (let y = 0; y < height; y++) {
        let row = '';
        for (let x = 0; x < width; x++) {
          if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
            row += 'W'; // Border walls
          } else if (y > height - 3) {
            row += 'W'; // Ground
          } else {
            const platformNoise = noise2D((cx * width + x) / 8, (cy * height + y) / 6, seed);
            const platformChance = y < height / 2 ? 0.3 : 0.1;
            row += platformNoise > (0.5 - platformChance) ? 'W' : '.';
          }
        }
        layout.push(row);
      }
      
      // Add enemies on platforms
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * (width - 4)) + 2;
        const y = Math.floor(Math.random() * (height - 4)) + 2;
        if (layout[y] && layout[y][x] === '.' && layout[y + 1] && layout[y + 1][x] === 'W') {
          enemies.push({ type: 'enemy', x, y });
        }
      }
      
    } else if (genre.toLowerCase().includes('maze')) {
      // Generate maze-like structures
      // Start with all walls
      for (let y = 0; y < height; y++) {
        layout.push('W'.repeat(width));
      }
      
      // Carve passages using noise
      for (let y = 1; y < height - 1; y++) {
        let row = 'W';
        for (let x = 1; x < width - 1; x++) {
          const passageNoise = noise2D((cx * width + x) / 4, (cy * height + y) / 4, seed);
          const corridorNoise = noise2D((cx * width + x) / 12, (cy * height + y) / 12, seed + 100);
          
          if (passageNoise > 0.2 || corridorNoise > 0.6) {
            row += '.';
          } else {
            row += 'W';
          }
        }
        row += 'W';
        layout[y] = row;
      }
      
      // Ensure connectivity by adding some guaranteed passages
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * (width - 4)) + 2;
        const y = Math.floor(Math.random() * (height - 4)) + 2;
        layout[y] = layout[y].substring(0, x) + '.' + layout[y].substring(x + 1);
      }
      
    } else {
      // Arena/top-down style
      for (let y = 0; y < height; y++) {
        let row = '';
        for (let x = 0; x < width; x++) {
          if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
            row += 'W'; // Border walls
          } else {
            const obstacleNoise = noise2D((cx * width + x) / 6, (cy * height + y) / 6, seed);
            const clusterNoise = noise2D((cx * width + x) / 15, (cy * height + y) / 15, seed + 50);
            
            // Create clustered obstacles
            if (obstacleNoise > 0.4 && clusterNoise > 0.3) {
              row += 'W';
            } else {
              row += '.';
            }
          }
        }
        layout.push(row);
      }
    }
    
    // Find safe spawn positions
    const safeSpawnPositions: Array<{ x: number; y: number }> = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (layout[y][x] === '.') {
          safeSpawnPositions.push({ x, y });
        }
      }
    }
    
    // Place player at a safe position
    const playerSpawn = safeSpawnPositions[0] || { x: 1, y: 1 };
    
    // Add random enemies at safe positions
    if (enemies.length === 0) { // Only if not already added
      const enemyCount = Math.min(4, Math.floor(safeSpawnPositions.length / 10));
      for (let i = 0; i < enemyCount; i++) {
        const randomIndex = Math.floor(Math.random() * safeSpawnPositions.length);
        const pos = safeSpawnPositions[randomIndex];
        if (pos && (pos.x !== playerSpawn.x || pos.y !== playerSpawn.y)) {
          enemies.push({ type: 'enemy', x: pos.x, y: pos.y });
        }
      }
    }
    
    return {
      id: `${genre}_${cx}_${cy}`,
      layout,
      tileMap: { '.': 'floor', 'W': 'wall' },
      spawn: {
        player: playerSpawn,
        enemies
      }
    };
  }

  private static loadFallbackLevel(scene: Phaser.Scene, cx: number, cy: number) {
    const fallbackLevel: LevelDef = {
      id: `fallback_${cx}_${cy}`,
      layout: [
        'WWWWWWWWWWWWWWWWWWWW',
        'W..................W',
        'W..................W',
        'W....WWW...........W',
        'W..................W',
        'W..................W',
        'W.........WWW......W',
        'W..................W',
        'W..................W',
        'WWWWWWWWWWWWWWWWWWWW'
      ],
      tileMap: { '.': 'floor', 'W': 'wall' },
      spawn: {
        player: { x: 2, y: 2 },
        enemies: [{ type: 'enemy', x: 15, y: 7 }]
      }
    };
    buildLevel(scene, fallbackLevel);
  }
}
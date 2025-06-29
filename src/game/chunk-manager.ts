import Phaser from 'phaser';
import { noise2D } from '../utils/perlin';
import { buildLevel } from './level-builder';
import type { LevelDef } from '../types/manifest';

export class ChunkManager {
  static loadChunk(scene: Phaser.Scene, seed: number, cx: number, cy: number, genre: string = 'arena') {
    try {
      const width = 20;
      const height = 15;
      
      // Generate completely random procedural level based on genre and seed
      const levelDef = ChunkManager.generateRandomLevel(cx, cy, width, height, seed, genre);
      buildLevel(scene, levelDef);
    } catch (error) {
      console.error('Error loading chunk:', error);
      ChunkManager.loadFallbackLevel(scene, cx, cy);
    }
  }

  // Seeded random for consistent but varied generation
  static seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  static generateRandomLevel(cx: number, cy: number, width: number, height: number, seed: number, genre: string): LevelDef {
    const layout: string[] = [];
    const tileMap: { [key: string]: string } = {
      'W': 'wall',
      'F': 'floor',
      '.': 'floor'
    };

    // Create random but playable layouts based on genre
    for (let y = 0; y < height; y++) {
      let row = '';
      for (let x = 0; x < width; x++) {
        const noiseValue = noise2D(x * 0.1 + seed * 0.001, y * 0.1 + seed * 0.001);
        const randomVal = this.seededRandom(seed + x * 100 + y * 1000);
        
        if (genre === 'platformer') {
          // Create platforms and gaps
          if (y === height - 1 || (y > height - 3 && randomVal < 0.8)) {
            row += 'W'; // Ground level
          } else if (y < height - 1 && randomVal < 0.2 + noiseValue * 0.3) {
            row += 'W'; // Floating platforms
          } else {
            row += '.'; // Air/empty space
          }
        } else if (genre === 'maze') {
          // Create maze-like structures
          if ((x === 0 || x === width - 1 || y === 0 || y === height - 1)) {
            row += 'W'; // Outer walls
          } else if ((x % 3 === 0 || y % 3 === 0) && randomVal < 0.6) {
            row += 'W'; // Maze walls
          } else {
            row += '.'; // Paths
          }
        } else {
          // Arena/top-down - scattered obstacles
          if ((x === 0 || x === width - 1 || y === 0 || y === height - 1)) {
            row += 'W'; // Boundary walls
          } else if (randomVal < 0.15 + noiseValue * 0.2) {
            row += 'W'; // Random obstacles
          } else {
            row += '.'; // Open floor
          }
        }
      }
      layout.push(row);
    }

    // Ensure spawn points are clear
    const playerSpawn = this.findSafeSpawn(layout, width, height, seed);
    const enemySpawns = this.generateEnemySpawns(layout, width, height, seed, genre);

    return {
      id: `proc_${seed}_${genre}`,
      layout,
      tileMap,
      spawn: {
        player: playerSpawn,
        enemies: enemySpawns
      }
    };
  }

  static findSafeSpawn(layout: string[], width: number, height: number, seed: number) {
    // Find a safe floor tile for player spawn
    for (let attempts = 0; attempts < 50; attempts++) {
      const x = Math.floor(this.seededRandom(seed + attempts * 123) * (width - 2)) + 1;
      const y = Math.floor(this.seededRandom(seed + attempts * 456) * (height - 2)) + 1;
      
      if (layout[y] && layout[y][x] === '.') {
        return { x, y };
      }
    }
    // Fallback to center
    return { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  }

  static generateEnemySpawns(layout: string[], width: number, height: number, seed: number, genre: string) {
    const enemies = [];
    const enemyCount = genre === 'arena' ? 8 : genre === 'maze' ? 5 : 3;
    
    for (let i = 0; i < enemyCount; i++) {
      for (let attempts = 0; attempts < 30; attempts++) {
        const x = Math.floor(this.seededRandom(seed + i * 789 + attempts * 234) * (width - 2)) + 1;
        const y = Math.floor(this.seededRandom(seed + i * 567 + attempts * 890) * (height - 2)) + 1;
        
        if (layout[y] && layout[y][x] === '.') {
          enemies.push({
            x, y,
            type: 'enemy',
            behavior: {
              name: ['patrol', 'wander', 'chase'][Math.floor(this.seededRandom(seed + i * 999) * 3)],
              speed: 30 + this.seededRandom(seed + i * 111) * 40 // Random speed 30-70
            }
          });
          break;
        }
      }
    }
    return enemies;
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
      // Generate more interesting maze-like structures
      for (let y = 0; y < height; y++) {
        let row = '';
        for (let x = 0; x < width; x++) {
          if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
            row += 'W'; // Border walls
          } else {
            const passageNoise = noise2D((cx * width + x) / 3, (cy * height + y) / 3, seed);
            const corridorNoise = noise2D((cx * width + x) / 8, (cy * height + y) / 8, seed + 100);
            const randomFactor = Math.random() * 0.4;
            
            // Create more complex maze patterns
            if (passageNoise + randomFactor > 0.4 || corridorNoise > 0.6) {
              row += '.';
            } else {
              row += 'W';
            }
          }
        }
        layout.push(row);
      }
      
      // Add guaranteed corridors for connectivity
      for (let i = 2; i < height - 2; i += 3 + Math.floor(Math.random() * 2)) {
        for (let j = 1; j < width - 1; j++) {
          if (Math.random() > 0.4) {
            layout[i] = layout[i].substring(0, j) + '.' + layout[i].substring(j + 1);
          }
        }
      }
      
      // Add vertical corridors too
      for (let j = 2; j < width - 2; j += 4 + Math.floor(Math.random() * 2)) {
        for (let i = 1; i < height - 1; i++) {
          if (Math.random() > 0.5) {
            layout[i] = layout[i].substring(0, j) + '.' + layout[i].substring(j + 1);
          }
        }
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
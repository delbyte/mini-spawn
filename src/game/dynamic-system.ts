import Phaser from 'phaser';
import { rand } from '../utils/math';
import type { DynamicEntityDef } from '../types/manifest';

interface GameScene extends Phaser.Scene {
  gamePlayer?: Phaser.Physics.Arcade.Sprite;
  gameWalls?: Phaser.Physics.Arcade.StaticGroup;
  gameEnemies?: Phaser.Physics.Arcade.Sprite[];
}

interface EntityAI {
  state: 'patrol' | 'wander' | 'chase';
  targetX?: number;
  targetY?: number;
  speed: number;
  detectionRange: number;
  lastUpdate: number;
}

export class DynamicSystem {
  private static entities: Array<{ sprite: Phaser.Physics.Arcade.Sprite; def: DynamicEntityDef; ai: EntityAI }> = [];
  private static player: Phaser.Physics.Arcade.Sprite | null = null;

  static init(scene: Phaser.Scene, defs: DynamicEntityDef[]) {
    try {
      this.entities = [];
      this.player = (scene as GameScene).gamePlayer || null;
      
      defs.forEach(def => {
        try {
          // Determine spawn position
          let spawn: { x: number; y: number };
          
          if (def.spawnCoords && def.spawnCoords.length > 0) {
            // Use predefined coordinates
            spawn = def.spawnCoords[0];
          } else if (def.spawnArea) {
            // Generate random position in area
            spawn = {
              x: rand(def.spawnArea.xMin, def.spawnArea.xMax),
              y: rand(def.spawnArea.yMin, def.spawnArea.yMax)
            };
          } else {
            // Default spawn position
            spawn = { x: 5, y: 5 };
          }

          // Create sprite
          const tileSize = 64;
          const sprite = scene.physics.add.sprite(
            spawn.x * tileSize + tileSize/2, 
            spawn.y * tileSize + tileSize/2, 
            def.type
          );
          
          if (sprite) {
            sprite.setCollideWorldBounds(true);
            sprite.setBounce(0.2);
            sprite.setDisplaySize(tileSize, tileSize);
            
            // Add collision with walls
            const walls = (scene as GameScene).gameWalls;
            if (walls) {
              scene.physics.add.collider(sprite, walls);
            }
            
            // Initialize AI state
            const ai: EntityAI = {
              state: (def.behavior.name as 'patrol' | 'wander' | 'chase') || 'wander',
              speed: (typeof def.behavior.speed === 'number' ? def.behavior.speed : 50),
              detectionRange: 150,
              lastUpdate: 0
            };
            
            // Store entity reference
            this.entities.push({ sprite, def, ai });
          }
        } catch (error) {
          console.error('Error creating dynamic entity:', def.type, error);
        }
      });

      // Set up update loop
      scene.events.on('update', (time: number, delta: number) => {
        this.update(time, delta);
      });
    } catch (error) {
      console.error('Error initializing dynamic system:', error);
    }
  }

  private static update(time: number, delta: number) {
    this.entities.forEach(({ sprite, def, ai }) => {
      try {
        if (ai.state === 'patrol') {
          this.updatePatrolBehavior(sprite, def, ai, time, delta);
        } else if (ai.state === 'wander') {
          this.updateWanderBehavior(sprite, def, ai, time, delta);
        } else if (ai.state === 'chase') {
          this.updateChaseBehavior(sprite, def, ai, time, delta);
        }
      } catch (error) {
        console.warn('Error updating dynamic entity:', error);
      }
    });
  }

  private static updatePatrolBehavior(sprite: Phaser.Physics.Arcade.Sprite, def: DynamicEntityDef, ai: EntityAI, time: number, delta: number) {
    const speed = ai.speed;
    const moveDistance = speed * (delta / 1000);
    
    // Initialize target if not set
    if (!ai.targetX) {
      ai.targetX = sprite.x + (Math.random() > 0.5 ? 100 : -100);
    }
    
    // Move towards target
    const direction = ai.targetX > sprite.x ? 1 : -1;
    sprite.x += moveDistance * direction;
    
    // Reverse direction when target is reached
    if (Math.abs(sprite.x - ai.targetX) < 10) {
      ai.targetX = ai.targetX + (direction * -200);
    }

    // Check for player proximity and switch to chase if close
    if (this.player) {
      const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      if (distance < ai.detectionRange) {
        ai.state = 'chase';
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static updateWanderBehavior(sprite: Phaser.Physics.Arcade.Sprite, def: DynamicEntityDef, ai: EntityAI, time: number, _delta: number) {
    // Change direction occasionally with more interesting patterns
    if (time - ai.lastUpdate > 1500 + Math.random() * 2000) {
      // Sometimes move towards player area, sometimes random
      let angle = Math.random() * Math.PI * 2;
      
      if (this.player && Math.random() > 0.6) {
        // 40% chance to move generally towards player (but not directly)
        const playerAngle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
        const variation = (Math.random() - 0.5) * Math.PI; // Add some randomness
        angle = playerAngle + variation;
      }
      
      const speed = ai.speed * (0.7 + Math.random() * 0.6); // Vary speed
      sprite.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      ai.lastUpdate = time;
    }

    // Check for player proximity and react more quickly
    if (this.player) {
      const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      if (distance < ai.detectionRange) {
        ai.state = 'chase';
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static updateChaseBehavior(sprite: Phaser.Physics.Arcade.Sprite, def: DynamicEntityDef, ai: EntityAI, _time: number, _delta: number) {
    if (!this.player) {
      // No player to chase, switch back to original behavior
      ai.state = 'wander';
      return;
    }

    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
    
    // If player is too far, stop chasing
    if (distance > ai.detectionRange * 2) {
      ai.state = 'patrol';
      sprite.setVelocity(0);
      return;
    }

    // Chase the player with some intelligence
    const speed = ai.speed * 1.2; // Slightly faster when chasing
    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
    
    // Simple obstacle avoidance by trying alternate angles if direct path seems blocked
    const alternatives = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];
    let bestAngle = angle;
    
    for (const altAngle of alternatives) {
      const testAngle = angle + altAngle;
      const testX = sprite.x + Math.cos(testAngle) * speed * 0.5;
      const testY = sprite.y + Math.sin(testAngle) * speed * 0.5;
      
      // If this direction is clear (simplified check), use it
      if (testX > 0 && testY > 0 && testX < 2000 && testY < 2000) {
        bestAngle = testAngle;
        break;
      }
    }
    
    sprite.setVelocity(
      Math.cos(bestAngle) * speed,
      Math.sin(bestAngle) * speed
    );
  }
}
import Phaser from 'phaser';
import type { LevelDef } from '../types/manifest';

interface GameScene extends Phaser.Scene {
  gamePlayer?: Phaser.Physics.Arcade.Sprite;
  gameWalls?: Phaser.Physics.Arcade.StaticGroup;
  gameEnemies?: Phaser.Physics.Arcade.Sprite[];
  gameCoins?: Phaser.Physics.Arcade.Group;
}

export function buildLevel(scene: Phaser.Scene, levelDef: LevelDef) {
  try {
    const tileSize = 64;
    const walls: Phaser.Physics.Arcade.StaticGroup = scene.physics.add.staticGroup();
    const floors: Phaser.GameObjects.Group = scene.add.group();
    const coins: Phaser.Physics.Arcade.Group = scene.physics.add.group();
    
    // Build the level layout with collision
    if (levelDef.layout && levelDef.layout.length > 0) {
      levelDef.layout.forEach((row, y) => {
        if (row) {
          row.split('').forEach((cell, x) => {
            const tileName = levelDef.tileMap[cell];
            if (tileName) {
              try {
                const tile = scene.add.image(x * tileSize + tileSize/2, y * tileSize + tileSize/2, tileName);
                tile.setDisplaySize(tileSize, tileSize);
                
                // Add collision for walls
                if (cell === 'W' || tileName === 'wall') {
                  // Convert to physics object and add to walls group
                  scene.physics.add.existing(tile, true); // true = static body
                  walls.add(tile);
                  tile.setPipeline('Light2D'); // Apply Light2D pipeline for illumination
                } else {
                  // Add floors to a separate group
                  floors.add(tile);
                }
              } catch (error) {
                console.warn(`Could not create tile ${tileName} at ${x},${y}:`, error);
              }
            }
          });
        }
      });
    }

    // Create player if spawn point exists
    let player: Phaser.Physics.Arcade.Sprite | null = null;
    if (levelDef.spawn && levelDef.spawn.player) {
      const { x: px, y: py } = levelDef.spawn.player;
      try {
        player = scene.physics.add.sprite(px * tileSize + tileSize/2, py * tileSize + tileSize/2, 'asset0');
        player.setCollideWorldBounds(true);
        player.setBounce(0.2);
        player.setDisplaySize(tileSize, tileSize);
        player.setTint(0x00aaff); // Ensure player sprite is visible and emissive
        player.setPipeline('Light2D');
        player.setDepth(1);
        player.setBlendMode(Phaser.BlendModes.ADD); // Additive blend for emissive effect
        // Add a much brighter dynamic light that follows the player
        const playerLight = scene.lights.addLight(player.x, player.y, tileSize * 5, 0x00aaff, 12.0); // Quadruple intensity
        // Make ambient light much darker
        scene.lights.setAmbientColor(0x070a12);
        scene.events.on('update', () => {
          if (player) {
            playerLight.x = player.x;
            playerLight.y = player.y;
          }
        });
        // Add collision between player and walls
        scene.physics.add.collider(player, walls);
      } catch (error) {
        console.error('Could not create player:', error);
      }
    }

    // Create enemies if they exist
    const enemies: Phaser.Physics.Arcade.Sprite[] = [];
    if (levelDef.spawn && levelDef.spawn.enemies) {
      levelDef.spawn.enemies.forEach(enemy => {
        try {
          const sprite = scene.physics.add.sprite(
            enemy.x * tileSize + tileSize/2, 
            enemy.y * tileSize + tileSize/2, 
            enemy.type
          );
          sprite.setCollideWorldBounds(true);
          sprite.setBounce(0.2);
          sprite.setDisplaySize(tileSize, tileSize);
          sprite.setTint(0xff0000); // Make enemies red
          sprite.setPipeline('Light2D');
          sprite.setDepth(1);
          
          // No size pulsation or alpha animation for enemies
          
          // Add collision between enemies and walls
          scene.physics.add.collider(sprite, walls);

          // Add a dynamic light that follows the enemy
          const enemyLight = scene.lights.addLight(sprite.x, sprite.y, tileSize * 5, 0xff0000, 8.0); // Bright red light
          scene.events.on('update', () => {
            if (sprite) {
              enemyLight.x = sprite.x;
              enemyLight.y = sprite.y;
            }
          });
          
          // Illuminate walls near enemies
          scene.events.on('update', () => {
            walls.getChildren().forEach((wall) => {
              if (wall instanceof Phaser.GameObjects.Sprite) {
                const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, wall.x, wall.y);
                if (distance <= tileSize * 5) {
                  wall.setPipeline('Light2D');
                  wall.setTint(0xffffff); // Brighten walls near enemies
                } else {
                  wall.resetPipeline();
                  wall.setTint(0x222222); // Darken walls when far
                }
              }
            });
          });
          
          // Add collision between player and enemies
          if (player) {
            scene.physics.add.collider(player, sprite);
          }
          
          enemies.push(sprite);
        } catch (error) {
          console.warn(`Could not create enemy ${enemy.type}:`, error);
        }
      });
    }

    // Fix UI text styles and missing variables
    const playerHealth = 100; // Temporary placeholder for player health
    const playerScore = 0; // Temporary placeholder for player score
    scene.children.bringToTop(scene.add.text(10, 10, `Health: ${playerHealth}`, { font: '16px Arial', color: '#ffffff' }));
    scene.children.bringToTop(scene.add.text(10, 30, `Score: ${playerScore}`, { font: '16px Arial', color: '#ffffff' }));
    scene.children.bringToTop(scene.add.text(10, 50, `Arrow Keys: Move | Collect Gold Coins | Avoid Red Enemies`, { font: '12px Arial', color: '#ffffff' }));

    // Fix patrolEnemies type and existence
    if (levelDef.spawn && Array.isArray(levelDef.spawn.patrolEnemies)) {
      levelDef.spawn.patrolEnemies.forEach((enemy: { type: string; x: number; y: number }) => {
        try {
          const sprite = scene.physics.add.sprite(
            enemy.x * tileSize + tileSize / 2,
            enemy.y * tileSize + tileSize / 2,
            enemy.type
          );
          sprite.setCollideWorldBounds(true);
          sprite.setBounce(0.2);
          sprite.setDisplaySize(tileSize, tileSize);
          sprite.setTint(0xff0000); // Make patrolling enemies red
          sprite.setPipeline('Light2D');
          sprite.setDepth(1);

          // Add dynamic light to patrolling enemies
          const enemyLight = scene.lights.addLight(sprite.x, sprite.y, tileSize * 5, 0xff0000, 8.0);
          scene.events.on('update', () => {
            if (sprite) {
              enemyLight.x = sprite.x;
              enemyLight.y = sprite.y;
            }
          });

          // Add collision between patrolling enemies and walls
          scene.physics.add.collider(sprite, walls);

          enemies.push(sprite);
        } catch (error) {
          console.warn(`Could not create patrolling enemy ${enemy.type}:`, error);
        }
      });
    }

    // Add some collectible coins randomly throughout the level
    if (levelDef.layout && levelDef.layout.length > 0) {
      const coinPositions: {x: number, y: number}[] = [];
      
      // Find empty floor positions for coins
      levelDef.layout.forEach((row, y) => {
        if (row) {
          row.split('').forEach((cell, x) => {
            if (cell === 'F' || cell === '.' || levelDef.tileMap[cell] === 'floor') {
              // 30% chance to place a coin on empty floor
              if (Math.random() < 0.3) {
                coinPositions.push({x, y});
              }
            }
          });
        }
      });
      
      // Create coin sprites with more variation
      coinPositions.forEach(pos => {
        try {
          const coinSprite = scene.physics.add.sprite(
            pos.x * tileSize + tileSize/2, 
            pos.y * tileSize + tileSize/2, 
            'floor' // Use floor as placeholder for coins
          );
          
          // Vary coin sizes and values
          const coinType = Math.random();
          if (coinType > 0.8) {
            // Large coin worth more
            coinSprite.setDisplaySize(tileSize * 0.7, tileSize * 0.7);
            coinSprite.setTint(0xff6600); // Orange color for valuable coins
            coinSprite.setData('value', 25);
          } else {
            // Regular coin
            coinSprite.setDisplaySize(tileSize * 0.5, tileSize * 0.5);
            coinSprite.setTint(0xffd700); // Gold color
            coinSprite.setData('value', 10);
          }
          
          coinSprite.setPipeline('Light2D');
          coinSprite.setDepth(1);
          
          // No animation for coins
          
          coins.add(coinSprite);
        } catch (error) {
          console.warn('Could not create coin:', error);
        }
      });
      
      // Add some special power-up items
      const powerUpPositions = coinPositions.filter(() => Math.random() > 0.85).slice(0, 2);
      powerUpPositions.forEach(pos => {
        try {
          const powerUp = scene.physics.add.sprite(
            pos.x * tileSize + tileSize/2, 
            pos.y * tileSize + tileSize/2, 
            'floor'
          );
          powerUp.setDisplaySize(tileSize * 0.6, tileSize * 0.6);
          powerUp.setTint(0x00ff00); // Green for health
          powerUp.setData('type', 'health');
          powerUp.setData('value', 25);
          
          // No animation for power-ups
          
          coins.add(powerUp); // Add to same group for collision detection
        } catch (error) {
          console.warn('Could not create power-up:', error);
        }
      });
    }

    // Update walls to darken when far from the player
    walls.getChildren().forEach((wall) => {
      if (player && wall instanceof Phaser.GameObjects.Sprite) {
        const distance = Phaser.Math.Distance.Between(player.x, player.y, wall.x, wall.y);
        if (distance > tileSize * 3) {
          wall.setTint(0x222222); // Dark tint
        } else {
          wall.setTint(0xffffff); // Restore original tint
        }
      }
    });

    // Make the background a much darker grid
    const levelWidth = (levelDef.layout[0]?.length || 0) * tileSize;
    const levelHeight = levelDef.layout.length * tileSize;
    scene.add.grid(
      levelWidth / 2,
      levelHeight / 2,
      levelWidth,
      levelHeight,
      tileSize,
      tileSize,
      0x000000, // Darker grid color
      1,
      0x000000, // Border color
      0.8 // Higher opacity for grid lines
    ).setDepth(-1); // Ensure background is behind everything

    // Store references for the engine to use
    const gameScene = scene as GameScene;
    gameScene.gameWalls = walls;
    gameScene.gamePlayer = player || undefined;
    gameScene.gameEnemies = enemies;
    gameScene.gameCoins = coins;
    
  } catch (error) {
    console.error('Error building level:', error);
  }
}
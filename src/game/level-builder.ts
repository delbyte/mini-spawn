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
        player.setTint(0x00aaff); // Make player blue
        player.setPipeline('Light2D');
        player.setDepth(1);
        
        // Add glowing effect to player
        scene.tweens.add({
          targets: player,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
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
          
          // Add menacing glow to enemies
          scene.tweens.add({
            targets: sprite,
            alpha: 0.7,
            duration: 800 + Math.random() * 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          
          // Add collision between enemies and walls
          scene.physics.add.collider(sprite, walls);
          
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
          
          // Add subtle animation
          scene.tweens.add({
            targets: coinSprite,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          
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
          
          // Pulsing animation for power-ups
          scene.tweens.add({
            targets: powerUp,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
          });
          
          coins.add(powerUp); // Add to same group for collision detection
        } catch (error) {
          console.warn('Could not create power-up:', error);
        }
      });
    }

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
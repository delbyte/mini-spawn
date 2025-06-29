import Phaser from 'phaser';
import { loadAssets } from './loader';
import { buildLevel } from './level-builder';
import { DynamicSystem } from './dynamic-system';
import { ChunkManager } from './chunk-manager';
import { OutlinePipeline } from './shaders';
import type { Manifest } from '../types/manifest';

export class GameScene extends Phaser.Scene {
  manifest!: Manifest;
  gamePlayer?: Phaser.Physics.Arcade.Sprite;
  gameWalls?: Phaser.Physics.Arcade.StaticGroup;
  gameEnemies?: Phaser.Physics.Arcade.Sprite[];
  gameCoins?: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player?: Phaser.Physics.Arcade.Sprite;
  private genre: string = 'arena';
  private playerHealth: number = 100;
  private score: number = 0;
  private healthText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private lastDamageTime: number = 0;

  constructor() { 
    super({ key: 'GameScene' }); 
  }

  async init(data: { manifest: Manifest }) {
    this.manifest = data.manifest;
    // Use genre from manifest or infer from gameId
    this.genre = data.manifest.genre || this.inferGenre(data.manifest);
  }

  private inferGenre(manifest: Manifest): string {
    // Check if we can infer genre from the gameId or other manifest data
    const id = manifest.gameId.toLowerCase();
    if (id.includes('platformer') || id.includes('platform')) return 'platformer';
    if (id.includes('maze') || id.includes('dungeon')) return 'maze';
    if (id.includes('shooter') || id.includes('top-down')) return 'top-down shooter';
    return 'arena'; // default
  }

  preload() { 
    return loadAssets(this, this.manifest); 
  }

  create() {
    try {
      // Initialize physics world with proper bounds
      this.physics.world.setBounds(0, 0, 1280, 960); // Larger world bounds
      
      // Add outline pipeline if renderer is WebGL
      if (this.renderer.type === Phaser.WEBGL) {
        try {
          OutlinePipeline.addToRenderer();
        } catch (error) {
          console.warn('Could not add outline pipeline:', error);
        }
      }

      // Build level or load chunks
      if (this.manifest.levels && this.manifest.levels.length > 0) {
        buildLevel(this, this.manifest.levels[0]);
      } else {
        ChunkManager.loadChunk(this, Date.now(), 0, 0, this.genre);
      }

      // Initialize dynamic entities
      if (this.manifest.dynamicEntities) {
        DynamicSystem.init(this, this.manifest.dynamicEntities);
      }

      // Create cursor keys once
      this.cursors = this.input.keyboard!.createCursorKeys();

      // Find and cache the player object
      this.findPlayer();

      // Create UI elements
      this.healthText = this.add.text(16, 16, `Health: ${this.playerHealth}`, {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      }).setScrollFactor(0);
      
      this.scoreText = this.add.text(16, 50, `Score: ${this.score}`, {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      }).setScrollFactor(0);

      // Add instructions
      this.add.text(16, 84, 'Arrow Keys: Move | Collect Gold Coins | Avoid Red Enemies', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 6, y: 3 }
      }).setScrollFactor(0);

      // Set up camera to follow player
      if (this.player) {
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(0.1, 0.1);
        
        // Add collision between player and enemies
        if (this.gameEnemies) {
          this.gameEnemies.forEach(enemy => {
            this.physics.add.overlap(this.player!, enemy, () => {
              // Add damage cooldown to prevent instant death
              const currentTime = this.time.now;
              if (currentTime - this.lastDamageTime > 1000) { // 1 second cooldown
                this.takeDamage(10);
                this.lastDamageTime = currentTime;
              }
            });
          });
        }
        
        // Add collision between player and coins
        if (this.gameCoins) {
          this.physics.add.overlap(this.player, this.gameCoins, (player, coin) => {
            const coinSprite = coin as Phaser.Physics.Arcade.Sprite;
            // Add particle effect when collecting coin
            this.createCoinEffect(coinSprite.x, coinSprite.y);
            coinSprite.destroy();
            this.addScore(10);
          });
        }
      }
    } catch (error) {
      console.error('Error in create method:', error);
    }
  }

  private findPlayer() {
    // Use the stored player reference from level builder
    this.player = this.gamePlayer;
  }

  update() {
    try {
      // Ensure we have a player and cursors
      if (!this.player || !this.cursors) {
        this.findPlayer();
        return;
      }

      // Handle genre-specific movement
      this.handleMovement();
    } catch (error) {
      console.error('Error in update method:', error);
    }
  }

  private handleMovement() {
    if (!this.player || !this.cursors) return;

    const speed = 150;

    if (this.genre.includes('platformer')) {
      // Platformer movement - left/right movement and jumping
      if (this.cursors.left?.isDown) {
        this.player.setVelocityX(-speed);
      } else if (this.cursors.right?.isDown) {
        this.player.setVelocityX(speed);
      } else {
        this.player.setVelocityX(0);
      }

      // Jumping (only if on ground)
      if (this.cursors.up?.isDown && this.player.body?.touching.down) {
        this.player.setVelocityY(-300);
      }
    } else {
      // Top-down movement
      this.player.setVelocity(0);

      if (this.cursors.left?.isDown) this.player.setVelocityX(-speed);
      if (this.cursors.right?.isDown) this.player.setVelocityX(speed);
      if (this.cursors.up?.isDown) this.player.setVelocityY(-speed);
      if (this.cursors.down?.isDown) this.player.setVelocityY(speed);
    }
  }

  private takeDamage(amount: number) {
    this.playerHealth -= amount;
    if (this.healthText) {
      this.healthText.setText(`Health: ${this.playerHealth}`);
    }
    
    // Flash the player red when taking damage, but preserve the blue tint
    if (this.player) {
      this.player.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        if (this.player) {
          this.player.setTint(0x00aaff); // Restore blue color
        }
      });
    }
    
    // Game over if health reaches 0
    if (this.playerHealth <= 0) {
      this.gameOver();
    }
  }

  private addScore(points: number) {
    this.score += points;
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.score}`);
    }
  }

  private createCoinEffect(x: number, y: number) {
    // Create simple particle effect with text
    const effectText = this.add.text(x, y, '+10', {
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Animate the effect
    this.tweens.add({
      targets: effectText,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        effectText.destroy();
      }
    });
  }

  private gameOver() {
    // Stop all movement
    if (this.player) {
      this.player.setVelocity(0);
    }
    
    // Show game over screen
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'GAME OVER!', {
      fontSize: '48px',
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0);
    
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 60, `Final Score: ${this.score}`, {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0);
    
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'Press R to Restart', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0);
    
    // Add restart functionality
    this.input.keyboard!.on('keydown-R', () => {
      this.scene.restart();
    });
  }
}
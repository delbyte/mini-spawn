import Phaser from 'phaser';
import { loadAssets } from './loader';
import { DynamicSystem } from './dynamic-system';
import { ChunkManager } from './chunk-manager';
import { OutlinePipeline } from './shaders';
// @ts-ignore
import { BloomPipeline } from './bloom-pipeline';
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
      // Initialize physics world with proper bounds for the level
      const levelWidth = 20 * 64; // 20 tiles wide
      const levelHeight = 15 * 64; // 15 tiles tall
      this.physics.world.setBounds(0, 0, levelWidth, levelHeight);
      
      // Enable lighting system
      this.lights.enable().setAmbientColor(0x222244);

      // Set camera bounds to match level
      this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);
      this.cameras.main.setZoom(1); // Ensure proper zoom level
      
      // Add outline pipeline if renderer is WebGL
      if (this.renderer.type === Phaser.WEBGL) {
        try {
          OutlinePipeline.addToRenderer();
          OutlinePipeline.applyToScene(this); // Apply beautiful visuals

          // Add a custom bloom pipeline (if available)
          if ((this.renderer as any).pipelines && (this.renderer as any).pipelines.add) {
            if (!(this.renderer as any).pipelines.get('BloomPipeline')) {
              (this.renderer as any).pipelines.add('BloomPipeline', new BloomPipeline(this.game));
            }
            this.cameras.main.setPostPipeline('BloomPipeline');
          }
        } catch (error) {
          console.warn('Could not add outline pipeline:', error);
        }
      }

      // Add dramatic dynamic lights
      // Animate dynamic lights for dramatic effect
      const lights = [
        this.lights.addLight(levelWidth / 2, levelHeight / 2, 400, 0xffffff, 1.0),
        this.lights.addLight(200, 200, 250, 0xffcc88, 0.7),
        this.lights.addLight(levelWidth - 200, levelHeight - 200, 300, 0x88aaff, 0.5)
      ];
      // Animate light color and intensity for drama
      this.time.addEvent({
        delay: 30,
        loop: true,
        callback: () => {
          const t = this.time.now * 0.001;
          // Animate center light color between white and blue
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0xffffff),
            Phaser.Display.Color.ValueToColor(0x50a0ff),
            1,
            (Math.sin(t) + 1) / 2
          );
          lights[0].setColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
          lights[0].intensity = 0.8 + 0.2 * Math.sin(t * 2);
          // Animate left light color between orange and yellow
          const c2 = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0xffcc88),
            Phaser.Display.Color.ValueToColor(0xffff78),
            1,
            (Math.cos(t * 1.5) + 1) / 2
          );
          lights[1].setColor(Phaser.Display.Color.GetColor(c2.r, c2.g, c2.b));
          lights[1].intensity = 0.6 + 0.2 * Math.cos(t * 1.5);
          // Animate right light color between blue and purple
          const c3 = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0x88aaff),
            Phaser.Display.Color.ValueToColor(0xb478ff),
            1,
            (Math.sin(t * 1.2 + 1) + 1) / 2
          );
          lights[2].setColor(Phaser.Display.Color.GetColor(c3.r, c3.g, c3.b));
          lights[2].intensity = 0.4 + 0.2 * Math.sin(t * 1.2);
        }
      });

      // Always use procedural generation for variety - ignore static levels
      const randomSeed = Date.now() + Math.random() * 1000;
      ChunkManager.loadChunk(this, randomSeed, 0, 0, this.genre);

      // Initialize dynamic entities
      if (this.manifest.dynamicEntities) {
        DynamicSystem.init(this, this.manifest.dynamicEntities);
      }

      // Create cursor keys once
      this.cursors = this.input.keyboard!.createCursorKeys();
      
      // Add spacebar for jumping in platformer games
      if (this.cursors && this.input.keyboard) {
        this.cursors.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      }

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

      // Jumping (only if on ground) - check if player is touching ground
      if (this.cursors.up?.isDown || this.cursors.space?.isDown) {
        if (this.player.body && (this.player.body as Phaser.Physics.Arcade.Body).touching.down) {
          this.player.setVelocityY(-400); // Strong jump
        }
      }
      
      // Apply gravity for platformer
      if (this.player.body) {
        (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(800);
      }
    } else if (this.genre.includes('top-down') || this.genre.includes('maze')) {
      // Top-down movement - no gravity
      if (this.player.body) {
        (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(0);
      }
      this.player.setVelocity(0);

      if (this.cursors.left?.isDown) this.player.setVelocityX(-speed);
      if (this.cursors.right?.isDown) this.player.setVelocityX(speed);
      if (this.cursors.up?.isDown) this.player.setVelocityY(-speed);
      if (this.cursors.down?.isDown) this.player.setVelocityY(speed);
    } else {
      // Arena movement - bounded but no gravity
      if (this.player.body) {
        (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(0);
      }
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
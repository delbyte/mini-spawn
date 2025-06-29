import type { Manifest } from '../types/manifest';
import Phaser from 'phaser';

export async function loadAssets(scene: Phaser.Scene, manifest: Manifest): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (!manifest.assets || manifest.assets.length === 0) {
        console.warn('No assets to load');
        resolve();
        return;
      }

      // Set up error handling
      scene.load.on('loaderror', (file: { key: string; src: string }) => {
        console.error('Failed to load asset:', file.key, file.src);
      });

      // Load each asset
      manifest.assets.forEach(asset => {
        try {
          if (asset.type === 'sprite') {
            scene.load.spritesheet(asset.name, asset.url, { 
              frameWidth: 64, 
              frameHeight: 64 
            });
          } else if (asset.type === 'tile') {
            scene.load.image(asset.name, asset.url);
          } else if (asset.type === 'enemy') {
            scene.load.spritesheet(asset.name, asset.url, { 
              frameWidth: 64, 
              frameHeight: 64 
            });
          } else if (asset.type === 'model') {
            scene.load.image(asset.name, asset.url);
          }
        } catch (error) {
          console.error('Error setting up asset load:', asset.name, error);
        }
      });

      // Handle completion
      scene.load.once('complete', () => {
        console.log('All assets loaded successfully');
        resolve();
      });

      // Start loading
      scene.load.start();
    } catch (error) {
      console.error('Error in loadAssets:', error);
      reject(error);
    }
  });
}
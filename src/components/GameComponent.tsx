import { useEffect, useRef } from 'react';
import { GameScene } from '../game/engine';
import Phaser from 'phaser';
import type { Manifest } from '../types/manifest';

interface GameComponentProps {
  manifest: Manifest;
  gameId: string;
}

export default function GameComponent({ manifest }: GameComponentProps) {
  const gameContainer = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameContainer.current && !gameRef.current) {
      // Get genre from manifest to set appropriate physics
      const getPhysicsConfig = (manifest: Manifest) => {
        const genre = manifest.gameId.toLowerCase(); // Use gameId as genre indicator for now
        if (genre.includes('platformer')) {
          return { gravity: { x: 0, y: 400 }, debug: false };
        } else if (genre.includes('top-down') || genre.includes('maze') || genre.includes('shooter')) {
          return { gravity: { x: 0, y: 0 }, debug: false };
        } else {
          return { gravity: { x: 0, y: 0 }, debug: false };
        }
      };

      // Initialize Phaser game
      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: gameContainer.current,
        width: 800,
        height: 600,
        backgroundColor: '#2c3e50',
        scene: GameScene,
        physics: { 
          default: 'arcade', 
          arcade: getPhysicsConfig(manifest)
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        }
      });

      // Start the game scene with manifest data
      gameRef.current.scene.start('GameScene', { manifest });
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [manifest]);

  const handleRestart = () => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('GameScene');
      if (scene) {
        scene.scene.restart();
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleRestart}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
      >
        🔄 Restart Game
      </button>
      
      <div 
        ref={gameContainer} 
        className="bg-black rounded-lg shadow-xl phaser-game"
        style={{ maxWidth: '800px', maxHeight: '600px' }}
      />
    </div>
  );
}

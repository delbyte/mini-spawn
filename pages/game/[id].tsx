import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import type { Manifest } from '../../src/types/manifest';

// Dynamic import to avoid SSR issues
const GameComponent = dynamic(() => import('../../src/components/GameComponent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white text-xl">Loading game engine...</p>
      </div>
    </div>
  )
});

export default function GamePage() {
  const router = useRouter();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.query.id) return;

    const loadManifest = async () => {
      try {
        // Try to get manifest from localStorage first
        let gameManifest: Manifest | null = null;
        const storedManifest = localStorage.getItem('gameManifest');
        
        if (storedManifest) {
          gameManifest = JSON.parse(storedManifest);
        } else {
          // If no stored manifest, generate a new one
          const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: `Game ${router.query.id}`, 
              genre: 'arcade game' 
            })
          });

          if (!response.ok) {
            throw new Error('Failed to load game data');
          }

          gameManifest = await response.json();
        }

        if (!gameManifest) {
          throw new Error('No game manifest available');
        }

        setManifest(gameManifest);
        setIsLoading(false);
      } catch (err) {
        console.error('Game initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load game');
        setIsLoading(false);
      }
    };

    loadManifest();
  }, [router.query.id]);

  const handleHome = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Game Error - Mini Spawn</title>
        </Head>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-white text-2xl mb-4">Game Load Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={handleHome}
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Game {router.query.id} - Mini Spawn</title>
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="mb-4 flex space-x-4">
          <button
            onClick={handleHome}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
          >
            🏠 Home
          </button>
        </div>
        
        {manifest && <GameComponent manifest={manifest} gameId={router.query.id as string} />}
        
        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>Use arrow keys to move • Game ID: {router.query.id}</p>
        </div>
      </div>
    </>
  );
}

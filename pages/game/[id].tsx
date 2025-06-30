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
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-black flex items-center justify-center">
        <div className="text-center bg-black/60 rounded-2xl shadow-2xl p-10 border border-blue-900">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-6"></div>
          <p className="text-white text-2xl font-semibold">Loading your game...</p>
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
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-black flex items-center justify-center">
          <div className="text-center bg-black/60 rounded-2xl shadow-2xl p-10 border border-blue-900">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-white text-2xl mb-4">Game Load Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={handleHome}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md"
            >
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-black text-white">
      <Head>
        <title>Game Screen</title>
      </Head>
      <div className="w-full max-w-5xl bg-black/60 rounded-2xl shadow-2xl p-8 flex flex-col items-center border border-blue-900">
        {manifest && <GameComponent manifest={manifest} gameId={router.query.id as string} />}
      </div>
      <footer className="mt-10 text-gray-400 text-xs opacity-70">Press <b>R</b> to restart • <b>Esc</b> to quit</footer>
    </div>
  );
}

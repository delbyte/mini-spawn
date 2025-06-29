import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('platformer');
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a game description');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, genre })
      });

      if (!response.ok) {
        throw new Error('Failed to generate game');
      }

      const manifest = await response.json();
      
      // Store manifest in localStorage for the game page
      localStorage.setItem('gameManifest', JSON.stringify(manifest));
      
      // Navigate to game page
      router.push(`/game/${manifest.gameId}`);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate game. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mini Spawn - AI Game Generator</title>
        <meta name="description" content="Generate games using AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            🎮 Mini Spawn
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Describe your game and let AI create it for you!
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Game Description
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A space adventure with aliens and lasers"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                Game Genre
              </label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isGenerating}
              >
                <option value="platformer">Platformer</option>
                <option value="top-down shooter">Top-down Shooter</option>
                <option value="maze game">Maze Game</option>
                <option value="dungeon crawler">Dungeon Crawler</option>
                <option value="arcade game">Arcade Game</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isGenerating ? '🎲 Generating...' : '🚀 Generate Game'}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Powered by AI • Built in 24 hours</p>
          </div>
        </div>
      </div>
    </>
  );
}

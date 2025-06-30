import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from "next/dynamic";

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-black text-white px-4">
      <Head>
        <title>Mini Spawn</title>
      </Head>
      <div className="w-full max-w-lg bg-black/60 rounded-2xl shadow-2xl p-8 flex flex-col items-center border border-blue-900">
        <h1 className="text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 drop-shadow-lg">Mini Spawn</h1>
        <textarea
          className="w-full p-4 mb-6 bg-gray-800 border border-gray-700 rounded-lg text-white shadow-lg focus:ring-2 focus:ring-blue-500 resize-none min-h-[120px]"
          placeholder="Describe your game..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <select
          className="w-full p-4 mb-6 bg-gray-800 border border-gray-700 rounded-lg text-white shadow-lg focus:ring-2 focus:ring-blue-500"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="platformer">Platformer</option>
          <option value="maze">Maze</option>
        </select>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              Generating...
            </span>
          ) : (
            "Generate Game"
          )}
        </button>
      </div>
      <footer className="mt-10 text-gray-400 text-xs opacity-70">Made with ❤️ for the 24h game jam</footer>
    </div>
  );
}

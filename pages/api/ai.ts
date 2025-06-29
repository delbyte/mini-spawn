import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Manifest } from '../../src/types/manifest';

// Dynamic imports to avoid build issues
const generateAssets = async (prompt: string, palette: string[]) => {
  const { generateAssets: gen } = await import('../../src/ai/generateAssets');
  return gen(prompt, palette);
};

const generateLayout = async (genre: string) => {
  const { generateLayout: gen } = await import('../../src/ai/generateLayout');
  return gen(genre);
};

const generateDynamics = async (genre: string) => {
  const { generateDynamics: gen } = await import('../../src/ai/generateDynamics');
  return gen(genre);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Manifest | { error: string }>) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, genre } = req.body;
    
    if (!prompt || !genre) {
      return res.status(400).json({ error: 'Missing prompt or genre' });
    }

    // Load palette with fallback
    let palette: string[] = [];
    try {
      const palettePath = path.join(process.cwd(), 'palette.json');
      if (fs.existsSync(palettePath)) {
        palette = JSON.parse(fs.readFileSync(palettePath, 'utf-8'));
      } else {
        // Default palette
        palette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
      }
    } catch (error) {
      console.warn('Could not load palette, using default:', error);
      palette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    }

    // Generate game components
    const assets = await generateAssets(prompt, palette);
    const levels = await generateLayout(genre);
    const dynamicEntities = await generateDynamics(genre);

    const manifest: Manifest = {
      gameId: Date.now().toString(),
      genre: genre, // Include the genre
      palette,
      assets,
      levels,
      dynamicEntities
    };

    res.status(200).json(manifest);
  } catch (error) {
    console.error('AI API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

import type { LevelDef } from '../types/manifest';

export async function generateLayout(genre: string): Promise<LevelDef[]> {
  try {
    // Create fallback levels based on genre
    const fallbackLevels: LevelDef[] = createFallbackLevels(genre);

    // Optional AI generation (disabled for MVP to avoid import issues)
    if (process.env.OPENAI_API_KEY && false) {
      try {
        // Dynamic import to avoid build issues
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ 
          apiKey: process.env.OPENAI_API_KEY 
        });

        const systemPrompt = `Generate a JSON array of 2-3 LevelDef objects for a ${genre} game. Each level should have:
- id: unique identifier
- layout: array of strings representing the level layout (use '.' for floor, 'W' for walls)
- tileMap: object mapping characters to tile names
- spawn: object with player spawn position and enemy positions

Make levels progressively more challenging. Return valid JSON only.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create ${genre} game levels` }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });

        const content = response.choices[0]?.message?.content;
        if (content && typeof content === 'string') {
          const aiLevels = JSON.parse(content as string) as LevelDef[];
          if (Array.isArray(aiLevels) && aiLevels.length > 0) {
            return aiLevels;
          }
        }
      } catch (aiError) {
        console.warn('AI level generation failed, using fallback:', aiError);
      }
    }

    return fallbackLevels;
  } catch (error) {
    console.error('Error in generateLayout:', error);
    return createFallbackLevels(genre);
  }
}

function createFallbackLevels(genre: string): LevelDef[] {
  const commonTileMap = {
    '.': 'floor',
    'W': 'wall'
  };

  if (genre.toLowerCase().includes('platformer')) {
    return [
      {
        id: 'level1',
        layout: [
          'WWWWWWWWWWWWWWWWWWWW',
          'W..................W',
          'W..................W',
          'W....WWW...........W',
          'W..................W',
          'W..................W',
          'W.........WWW......W',
          'W..................W',
          'W..................W',
          'WWWWWWWWWWWWWWWWWWWW'
        ],
        tileMap: commonTileMap,
        spawn: {
          player: { x: 2, y: 8 },
          enemies: [
            { type: 'enemy', x: 10, y: 8 },
            { type: 'enemy', x: 15, y: 6 }
          ]
        }
      }
    ];
  } else if (genre.toLowerCase().includes('maze') || genre.toLowerCase().includes('dungeon')) {
    return [
      {
        id: 'level1',
        layout: [
          'WWWWWWWWWWWWWWWWWWWW',
          'W..................W',
          'W.WWW.WWWWWW.WWW...W',
          'W.....W....W.......W',
          'W.WWW.W.WW.W.WWWWW.W',
          'W.....W....W.......W',
          'W.WWWWWWWW.WWWWWW..W',
          'W..................W',
          'W..................W',
          'WWWWWWWWWWWWWWWWWWWW'
        ],
        tileMap: commonTileMap,
        spawn: {
          player: { x: 1, y: 1 },
          enemies: [
            { type: 'enemy', x: 18, y: 8 },
            { type: 'enemy', x: 10, y: 5 }
          ]
        }
      }
    ];
  } else {
    // Default arena-style level
    return [
      {
        id: 'level1',
        layout: [
          'WWWWWWWWWWWWWWWWWWWW',
          'W..................W',
          'W..................W',
          'W..................W',
          'W......WWWW........W',
          'W......W..W........W',
          'W......WWWW........W',
          'W..................W',
          'W..................W',
          'WWWWWWWWWWWWWWWWWWWW'
        ],
        tileMap: commonTileMap,
        spawn: {
          player: { x: 2, y: 2 },
          enemies: [
            { type: 'enemy', x: 17, y: 7 },
            { type: 'enemy', x: 10, y: 4 },
            { type: 'enemy', x: 5, y: 7 }
          ]
        }
      }
    ];
  }
}
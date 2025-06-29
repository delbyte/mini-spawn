import type { DynamicEntityDef } from '../types/manifest';

export async function generateDynamics(genre: string): Promise<DynamicEntityDef[]> {
  try {
    // Create fallback dynamics based on genre
    const fallbackDynamics = createFallbackDynamics(genre);

    // Optional AI generation (disabled for MVP to avoid import issues)
    if (process.env.OPENAI_API_KEY && false) {
      try {
        // Dynamic import to avoid build issues
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ 
          apiKey: process.env.OPENAI_API_KEY 
        });

        const systemPrompt = `Generate a JSON array of 2-4 DynamicEntityDef objects for a ${genre} game. Each entity should have:
- type: string (e.g., 'enemy', 'powerup', 'hazard')
- spawnArea OR spawnCoords for positioning
- behavior: object with name and parameters (e.g., 'patrol', 'wander', 'chase')

Make the dynamics interesting and genre-appropriate. Return valid JSON only.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create dynamic entities for ${genre} game` }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        const content = response.choices[0]?.message?.content;
        if (content && typeof content === 'string') {
          const aiDynamics = JSON.parse(content as string) as DynamicEntityDef[];
          if (Array.isArray(aiDynamics) && aiDynamics.length > 0) {
            return aiDynamics;
          }
        }
      } catch (aiError) {
        console.warn('AI dynamics generation failed, using fallback:', aiError);
      }
    }

    return fallbackDynamics;
  } catch (error) {
    console.error('Error in generateDynamics:', error);
    return createFallbackDynamics(genre);
  }
}

function createFallbackDynamics(genre: string): DynamicEntityDef[] {
  if (genre.toLowerCase().includes('platformer')) {
    return [
      {
        type: 'enemy',
        spawnArea: { xMin: 3, xMax: 10, yMin: 7, yMax: 8 },
        behavior: { name: 'patrol', speed: 50, direction: 1 }
      },
      {
        type: 'enemy',
        spawnArea: { xMin: 12, xMax: 17, yMin: 5, yMax: 6 },
        behavior: { name: 'patrol', speed: 30, direction: -1 }
      }
    ];
  } else if (genre.toLowerCase().includes('maze') || genre.toLowerCase().includes('dungeon')) {
    return [
      {
        type: 'enemy',
        spawnCoords: [{ x: 15, y: 7 }],
        behavior: { name: 'wander', speed: 40 }
      },
      {
        type: 'enemy',
        spawnCoords: [{ x: 8, y: 4 }],
        behavior: { name: 'patrol', speed: 35, direction: 1 }
      }
    ];
  } else {
    // Default arena dynamics
    return [
      {
        type: 'enemy',
        spawnArea: { xMin: 10, xMax: 15, yMin: 3, yMax: 6 },
        behavior: { name: 'wander', speed: 45 }
      },
      {
        type: 'enemy',
        spawnArea: { xMin: 5, xMax: 8, yMin: 6, yMax: 8 },
        behavior: { name: 'patrol', speed: 40, direction: 1 }
      }
    ];
  }
}
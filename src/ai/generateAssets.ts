import type { AssetDef } from '../types/manifest';

export async function generateAssets(prompt: string, palette: string[]): Promise<AssetDef[]> {
  try {
    // For MVP, we'll create placeholder assets
    const assets: AssetDef[] = [
      {
        type: 'sprite',
        name: 'asset0',
        url: '/thumbnails/player.svg',
        frames: 1
      },
      {
        type: 'tile',
        name: 'floor',
        url: '/thumbnails/floor.svg',
        frames: 1
      },
      {
        type: 'tile',
        name: 'wall',
        url: '/thumbnails/wall.svg',
        frames: 1
      },
      {
        type: 'enemy',
        name: 'enemy',
        url: '/thumbnails/enemy.svg',
        frames: 1
      }
    ];

    // Optional AI generation (disabled for MVP to avoid import issues)
    if (process.env.REPLICATE_API_TOKEN && false) {
      try {
        // Dynamic import to avoid build issues
        const { default: Replicate } = await import('replicate');
        const replicate = new Replicate({
          auth: process.env.REPLICATE_API_TOKEN || ''
        });

        const input = {
          prompt: `pixel art game sprites for ${prompt}, 64x64 pixels, ${palette.join(', ')} color palette`,
          width: 512,
          height: 512,
        };

        console.log('Generating assets with AI...');
        const output = await replicate.run(
          "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
          { input }
        ) as string[];

        if (Array.isArray(output) && output.length > 0) {
          output.forEach((url: string, i: number) => {
            if (i < assets.length) {
              assets[i].url = url;
            }
          });
        }
      } catch (aiError) {
        console.warn('AI generation failed, using placeholders:', aiError);
      }
    }

    return assets;
  } catch (error) {
    console.error('Error in generateAssets:', error);
    // Return fallback assets
    return [
      { type: 'sprite', name: 'asset0', url: '/thumbnails/placeholder.svg', frames: 1 },
      { type: 'tile', name: 'floor', url: '/thumbnails/placeholder.svg', frames: 1 },
      { type: 'tile', name: 'wall', url: '/thumbnails/placeholder.svg', frames: 1 },
      { type: 'enemy', name: 'enemy', url: '/thumbnails/placeholder.svg', frames: 1 }
    ];
  }
}
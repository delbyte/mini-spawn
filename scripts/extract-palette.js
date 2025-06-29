const fs = require('fs');
const Vibrant = require('node-vibrant');

async function extractPalette(inputPath, outputPath = 'palette.json') {
  try {
    const paletteSwatches = await Vibrant.from(inputPath).getPalette();
    const colors = Object.values(paletteSwatches)
      .filter(swatch => swatch)
      .map(swatch => swatch.getHex());
    fs.writeFileSync(outputPath, JSON.stringify(colors, null, 2));
    console.log('Palette extracted to', outputPath, colors);
  } catch (err) {
    console.error('Error extracting palette:', err);
    process.exit(1);
  }
}

const [,, input] = process.argv;
if (!input) {
  console.error('Usage: node extract-palette.js <image-path>');
  process.exit(1);
}
extractPalette(input);
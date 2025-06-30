const fs = require('fs');
const path = require('path');

// Create simple SVG placeholders
const createSVG = (color, width = 64, height = 64, content = '') => `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}"/>
  ${content}
</svg>`;

const placeholders = {
  'player.svg': createSVG('#4ECDC4', 64, 64, '<circle cx="32" cy="32" r="20" fill="#2C3E50"/>'),
  'floor.svg': createSVG('#2C3E50', 64, 64, '<rect x="0" y="0" width="64" height="64" fill="#1A252F" stroke="#0F1419" stroke-width="1"/>'),
  'wall.svg': createSVG('#1A252F', 64, 64, '<rect x="4" y="4" width="56" height="56" fill="#0F1419"/>'),
  'enemy.svg': createSVG('#E74C3C', 64, 64, '<polygon points="32,10 50,45 14,45" fill="#C0392B" filter="url(#glow)"/><defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'),
  'placeholder.svg': createSVG('#95A5A6', 64, 64, '<text x="32" y="36" font-family="Arial" font-size="10" text-anchor="middle" fill="white">?</text>')
};

const outputDir = path.join(__dirname, '..', 'public', 'thumbnails');

Object.entries(placeholders).forEach(([filename, svg]) => {
  fs.writeFileSync(path.join(outputDir, filename), svg.trim());
  console.log(`Created ${filename}`);
});

console.log('All placeholder assets created!');

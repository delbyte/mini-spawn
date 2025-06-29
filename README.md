# Mini Spawn - AI-Powered 2D Game Generator

A bug-free, MVP-quality AI-driven 2D game generator built with Next.js, Phaser 3, and TypeScript. Generate games of different genres with AI-powered procedural levels, meaningful physics, dynamic entities, and engaging gameplay mechanics.

## ✨ Features

### Core Game Engine
- **Phaser 3** integration with WebGL/Canvas support
- **Genre-specific physics**: Platformer (gravity/jump), Top-down (no gravity), Arena (bounded movement)
- **Procedural level generation** using perlin noise and chunk management
- **Dynamic camera** that follows the player with smooth lerping
- **Collision detection** between player, enemies, walls, and collectibles

### AI-Powered Generation
- **OpenAI/Replicate Integration** for generating game content (with fallback placeholders)
- **Asset generation** with dynamic imports to avoid build issues
- **Level layout generation** based on genre and player preferences
- **Dynamic entity generation** with behavior patterns (patrol, wander, chase)

### Game Mechanics
- **Player Health System** with damage cooldown and visual feedback
- **Scoring System** with collectible coins and visual effects
- **Enemy AI** with proximity detection, chase behavior, and basic pathfinding
- **Visual Polish** with color-coded entities (blue player, red enemies, gold coins)
- **Game Over/Restart** functionality with scoring display

### Technical Excellence
- **TypeScript** throughout with proper type definitions
- **ESLint/Prettier** configuration for code quality
- **Error Handling** with fallback systems for robustness
- **Modular Architecture** with separation of concerns
- **Build Optimization** with Next.js static generation

## 🎮 Game Genres Supported

1. **Platformer**: Gravity-based movement with jumping mechanics
2. **Top-down**: Free directional movement without gravity
3. **Arena**: Bounded combat arena with enemy spawning
4. **Maze**: Procedural maze generation with navigation challenges

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:3000` and click "Generate Game" to create a new AI-powered game!

## 🎯 Game Controls

- **Arrow Keys**: Move player character
- **Objective**: Collect gold coins while avoiding red enemies
- **Health**: You have 100 health points, lose 10 per enemy contact (1-second cooldown)
- **Scoring**: +10 points per coin collected
- **Game Over**: Press 'R' to restart when health reaches 0

## 🏗️ Architecture

### Frontend (`/pages`)
- `index.tsx`: Main game generation interface
- `game/[id].tsx`: Individual game instances
- `_app.tsx`: Global app configuration

### Game Engine (`/src/game`)
- `engine.ts`: Core Phaser scene with player mechanics
- `level-builder.ts`: Static level construction with collision
- `chunk-manager.ts`: Procedural level generation
- `dynamic-system.ts`: Enemy AI and behavior management
- `loader.ts`: Asset loading and management
- `shaders.ts`: Visual effects and rendering

### AI Generation (`/src/ai`)
- `generateAssets.ts`: AI-powered sprite generation
- `generateLayout.ts`: Procedural level layout creation
- `generateDynamics.ts`: Dynamic entity behavior generation

### API (`/pages/api`)
- `ai.ts`: Game generation endpoint with fallback logic

## 🎨 Visual Assets

Placeholder SVG assets are automatically generated for:
- Player character (blue square)
- Enemies (red squares) 
- Walls (gray squares)
- Floors (light gray squares)
- Coins (gold circles)

## 🧠 AI Integration

The system supports both OpenAI GPT and Replicate Stable Diffusion for content generation:

```typescript
// Environment variables (optional)
OPENAI_API_KEY=your_openai_key
REPLICATE_API_TOKEN=your_replicate_token
```

If AI services are unavailable, the system gracefully falls back to procedural generation with placeholder assets.

## 🔧 Development

### Project Structure
```
mini-spawn/
├── pages/           # Next.js pages
├── public/          # Static assets
├── src/
│   ├── game/        # Phaser game engine
│   ├── ai/          # AI generation modules
│   ├── types/       # TypeScript definitions
│   └── utils/       # Utility functions
├── styles/          # Global CSS
└── scripts/         # Build utilities
```

### Key Technologies
- **Next.js 15**: React framework with Pages Router
- **Phaser 3**: 2D game engine
- **TypeScript**: Type-safe development
- **OpenAI**: GPT-4 for content generation
- **Replicate**: AI model hosting

## 🎯 Game Design Philosophy

1. **Accessibility**: Simple controls, clear visual feedback
2. **Replayability**: Procedural generation ensures unique experiences
3. **Polish**: Smooth animations, particle effects, responsive UI
4. **Performance**: Optimized rendering and collision detection
5. **Extensibility**: Modular architecture for easy feature additions

## 🐛 Bug Fixes & Improvements

### Completed
- ✅ Fixed npm dependency conflicts (perlin-noise replacement)
- ✅ Resolved TypeScript compilation errors
- ✅ Fixed ESLint violations and code quality issues
- ✅ Implemented proper error handling throughout
- ✅ Added collision detection for all game objects
- ✅ Enhanced AI behavior with proximity detection
- ✅ Added visual feedback and particle effects
- ✅ Implemented health/scoring systems
- ✅ Fixed camera follow and scaling issues
- ✅ Added genre-specific physics behaviors

### Architecture Improvements
- ✅ Modular game engine with separation of concerns
- ✅ Type-safe interfaces throughout the codebase
- ✅ Proper asset loading and management
- ✅ Graceful fallback for AI service failures
- ✅ Performance optimizations for rendering

## 🏆 MVP Success Criteria

✅ **Bug-free compilation and runtime**  
✅ **Multiple game genres with appropriate physics**  
✅ **Procedural level generation**  
✅ **Meaningful collision detection**  
✅ **Dynamic entities with AI behavior**  
✅ **Engaging gameplay mechanics**  
✅ **Visual polish and user feedback**  
✅ **Production-ready build process**  

## 📝 License

MIT License - see LICENSE file for details.

---

**Built in 24 hours** as a demonstration of rapid game development with AI assistance and modern web technologies.

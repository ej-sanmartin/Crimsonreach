# Vibe Coding Game Template 🎮

A modular, optimization-minded template for creating ThreeJS games with a focus on performance and maintainability.

## Features

- 🕹 ThreeJS-based game engine
- 📱 Mobile-first design with touch controls
- 🎨 Custom shaders for procedural effects
- 🌐 WebSocket-based multiplayer support
- 🚀 Optimized asset loading and caching
- 📦 Vite-based build system
- ✅ Jest testing setup
- 🔍 ESLint and Prettier for code quality

## Project Structure

```
vibe-coded-game/
├── .github/                           # CI/CD configuration
├── assets/                            # Static assets (models, textures, sounds)
├── public/                            # Public assets served directly
├── src/                               # Source code
│   ├── components/                    # Reusable ThreeJS components
│   ├── shaders/                       # Custom shaders
│   ├── utils/                         # Helper functions
│   ├── scenes/                        # Game scenes
│   └── multiplayer/                   # Multiplayer logic
├── tests/                             # Unit tests
└── config files                       # Various configuration files
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Asset Optimization

- Models: Use gltfpack to compress GLTF models
- Textures: Convert to Basis/KTX2 format
- Audio: Use MP3/OGG at 128kbps

## Performance Tips

- Use compressed textures (Basis/KTX2)
- Implement LOD (Level of Detail) for models
- Use procedural generation where possible
- Implement object pooling
- Use WebGL 2.0 features when available

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this template for your projects! 
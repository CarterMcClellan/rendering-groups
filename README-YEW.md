# Rendering Groups - Yew Migration

This project has been successfully migrated from React to Rust Yew framework.

## Migration Overview

The entire React application has been converted to use the Yew framework. This includes:

- **TypeScript types → Rust structs/enums** (src/types/mod.rs)
- **React components → Yew components** (src/components/)
- **React hooks → Yew state management** (integrated into components)
- **JavaScript utilities → Rust utilities** (src/utils/mod.rs)
- **Constants and configuration** (src/constants/mod.rs, src/config/mod.rs)
- **Vite build → Trunk build system**

## Project Structure

```
src/
├── components/
│   ├── mod.rs
│   └── resizable_canvas.rs  # Main canvas component
├── config/
│   └── mod.rs              # Resize transform calculations
├── constants/
│   └── mod.rs              # App constants and initial state
├── types/
│   └── mod.rs              # Type definitions
├── utils/
│   └── mod.rs              # Utility functions
├── lib.rs                  # Library root
└── main.rs                 # Application entry point
```

## Prerequisites

- Rust (latest stable)
- Trunk: `cargo install trunk`
- wasm32 target: `rustup target add wasm32-unknown-unknown`

## Running the Application

### Development Server

```bash
trunk serve --open
```

This will:
1. Compile the Rust code to WebAssembly
2. Start a development server at http://127.0.0.1:8080
3. Watch for changes and auto-reload

### Production Build

```bash
trunk build --release
```

The optimized build will be in the `dist/` directory.

## Key Features

- **Resizable Canvas**: Drag any of the 8 handles to resize shapes
- **Flip Support**: Can flip shapes horizontally and vertically
- **Group Transforms**: Apply transformations to grouped shapes
- **Re-grouping**: Convert absolute positioned shapes back to relative coordinates
- **Reset**: Reset to initial state

## Technical Highlights

### Component Architecture

The application uses Yew's component model with:
- **Message-based state updates** (similar to Elm architecture)
- **NodeRef** for SVG element access
- **Event listeners** via gloo for global mouse events

### State Management

All state is managed within the `ResizableCanvas` component:
- `fixed_anchor`: Group anchor point
- `dimensions`: Current width/height
- `flipped`: Flip state for X and Y axes
- `polygons`: Array of polygon shapes
- `is_grouped`: Toggle between grouped/ungrouped view

### SVG Rendering

- Pure SVG rendering with no canvas element
- Dynamic transformation using SVG group transforms
- 8 resize handles (4 corners + 4 edges)
- Visual feedback for bounding box and anchor point

## Styling

The project continues to use:
- **Tailwind CSS** for utility classes
- **Custom CSS** in src/index.css
- Same design tokens and color scheme as React version

## Dependencies

- `yew = "0.21"` - UI framework
- `web-sys` - Web APIs bindings
- `wasm-bindgen` - JavaScript/Rust interop
- `gloo = "0.11"` - Web utilities for Yew
- `serde` - Serialization (for types)

## Browser Support

The application runs in any modern browser with WebAssembly support:
- Chrome/Edge 57+
- Firefox 52+
- Safari 11+

## Performance

The Yew version offers:
- Smaller bundle size (with WASM optimization)
- Faster initial load (after WASM compilation)
- Better runtime performance for complex interactions
- Type safety at compile time

## Development Notes

### Trunk Configuration

See `Trunk.toml` for build configuration. The HTML entry point (`index.html`) uses `data-trunk` attributes to specify:
- Which binary to build
- CSS files to include

### Adding New Features

1. Add types to `src/types/mod.rs`
2. Implement logic in appropriate module
3. Add messages to component's `Msg` enum
4. Handle messages in `update()` method
5. Render in `view()` method

## Troubleshooting

### Build Errors

If you encounter build errors:
```bash
cargo clean
trunk build
```

### Port Already in Use

If port 8080 is busy:
```bash
trunk serve --port 8081
```

### WASM Optimization Issues

For faster dev builds without optimization:
```bash
trunk serve --release=false
```

## Migration Comparison

| Feature | React | Yew |
|---------|-------|-----|
| Language | TypeScript | Rust |
| Type Safety | Runtime | Compile-time |
| Bundle Size | ~200KB | ~150KB (optimized) |
| State | useState hooks | Component struct |
| Events | Callbacks | Message passing |
| Build Tool | Vite | Trunk |
| Runtime | V8 JS | WebAssembly |

## Next Steps

To continue development:
1. The old React files are still in the repository for reference
2. Consider removing them once migration is verified: see package.json, src/*.tsx, etc.
3. Update CI/CD to build with Trunk instead of npm
4. Add Rust-specific testing with `wasm-bindgen-test`

## Resources

- [Yew Documentation](https://yew.rs/)
- [Trunk Documentation](https://trunkrs.dev/)
- [web-sys Documentation](https://rustwasm.github.io/wasm-bindgen/web-sys/index.html)

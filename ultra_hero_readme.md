# Ultra Hero Animation - "Digital Dominance"

This component implements a high-fidelity, high-performance 3D visualization for the AIDevelo Webdesign hero section. It replaces the previous "Digital Genesis" concept with a more refined, "Ultra" aesthetic focusing on transformation and dominance.

## Components

### 1. `HeroUltraAnimation.tsx`
- **Role**: Main container and orchestrator.
- **Responsibility**:
    -   Manages WebGL context availability.
    -   Handles `prefers-reduced-motion`.
    -   Orchestrates the lazy loading of the 3D scene.
    -   Renders the Framer Motion UI overlays (Title, Buttons, Specs).

### 2. `UltraScene.tsx`
- **Role**: The 3D World (React Three Fiber).
- **Core Elements**:
    -   **DigitalCore**: A rotating, pulsating Icosahedron wrapped in a TorusKnot, simulating a stabilized AI core. Uses custom emissive materials for a "neon" look.
    -   **Environment**: A high-density starfield (`Stars`) and floating energy particles (`Sparkles`) to create depth.
    -   **DataStreams**: (Currently placeholder) Intended for visualizing data ingestion.
- **Performance**:
    -   Uses `InstancedMesh` logic via Drei helpers where possible.
    -   Avoids heavy post-processing by using baked-in emissive colors and additive blending simulation.

### 3. `HeroUltraFallback.tsx`
- **Role**: Accessibility and Performance Fallback.
- **Trigger**: Activates if WebGL is missing OR user prefers reduced motion.
- **Design**:
    -   Uses pure CSS animations (`animate-pulse`, `animate-spin-slow`) to mimic the 3D core's behavior.
    -   Maintains the same visual hierarchy and branding colors (Emerald/Cyan).

## Configuration

To tweak the animation, modify `src/components/webdesign/hero/UltraScene.tsx`:

| Parameter | Component | Effect |
| :--- | :--- | :--- |
| `speed` | `<Float>` | Changes the hovering speed of the core. |
| `emissiveIntensity` | `<meshStandardMaterial>` | Controls the glow brightness. |
| `count` | `<Stars>` | Adjusts the density of the background starfield. |

## Assets
- No external textures are currently used; all effects are procedural.

## Troubleshooting
- **Black Screen?**: Check `src/utils/webgl.ts` logic. The fallback should trigger automatically.
- **High CPU Usage?**: Reduce the `count` prop in `Stars` and `Sparkles` in `UltraScene.tsx`.

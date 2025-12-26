# Digital Genesis Header Animation

The "Digital Genesis" animation is a high-performance generative 3D header
built with **React Three Fiber** and **Framer Motion**. It represents the
artistic intersection of technology and creativity, aligning with AIDevelo's
brand vision.

## Structure
- **Component**: `src/components/webdesign/DigitalGenesisAnimation.tsx`
- **Logic**:
  - `ParticleSystem`: Vertex-based point cloud (Digital Seeds).
  - `GenesisLines`: Dynamic geometric connections (Plexus Effect).
  - `GenesisCore`: Central pulse node with emissive lighting.
- **UI Overlay**: Responsive glassmorphism layer with localized content and
  interactive system specs.

## Performance Optimization
- **Vertex Buffer Objects (VBOs)**: Using `Float32Array` for particle positions
  to minimize CPU-GPU overhead.
- **Additive Blending**: Optimized shader blending for glowing effects
  without heavy lighting calculations.
- **Lazy Loading**: The component is intended to be lazy-loaded in
  `WebdesignPage.tsx` to prevent Three.js from blocking the main thread
  during initial page render.

## Customization
You can adjust the artistic feeling by modifying constants in
`DigitalGenesisAnimation.tsx`:

| Parameter | Location | Description |
| :--- | :--- | :--- |
| `count` | `ParticleSystem` | Total number of digital seeds (2000). |
| `color` | `PointMaterial` | Hex color of seeds (#da291c). |
| `floatIntensity` | `GenesisLines` | Speed of connection line movement. |
| `emissiveIntensity` | `GenesisCore` | Bloom/Glow strength of center core. |

## Accessibility
- **Reduced Motion**: Automatically detects `prefers-reduced-motion`.
  If enabled, the 3D Canvas is discarded and replaced with a
  high-performance CSS gradient background.
- **ARIA Labels**: Interactive buttons and sections are fully tagged
  for screen readers.

## Maintenance
To update the 3D scene:
1. Modify the `useFrame` hooks inside sub-components for motion changes.
2. Use `@react-three/drei` helpers (like `Float`, `Environment`) for common tasks.
3. Ensure all new assets (textures/models) are placed in `public/animations/`.

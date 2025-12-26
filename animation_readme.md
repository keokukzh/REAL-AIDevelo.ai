# Digital Genesis Header Animation (HeroFuturistic)

The "Digital Genesis" animation is a high-performance generative 3D header
built with **React Three Fiber** and **Framer Motion**. It represents the
artistic intersection of technology and creativity ("Digital Big Bang"), aligning with AIDevelo's
brand vision.

## Structure
- **Main Component**: `src/components/webdesign/hero/HeroFuturistic.tsx`
- **3D Scene**: `src/components/webdesign/hero/Scene.tsx`
- **Fallback**: `src/components/webdesign/hero/HeroStaticFallback.tsx`

## Concepts
- **Digital Big Bang**: A central "Core" that explodes into particles and data lines, symbolizing the birth of a new digital project.
- **ParticleExplosion**: InstancedMesh-based rendering for high performance (150+ dynamic objects).
- **Fallback Mode**: If WebGL is unavailable or `prefers-reduced-motion` is active, a CSS/SVG-based static version is shown.

## Performance Optimization
- **InstancedMesh**: Used for the particle explosion to reduce draw calls.
- **Lazy Loading**: The entire 3D ecosystem is lazy-loaded via `Suspense`.
- **WebGL Detection**: Using `utils/webgl.ts` to prevent crashes on unsupported devices.

## Customization
Adjust visual parameters in `Scene.tsx`:

| Parameter | Location | Description |
| :--- | :--- | :--- |
| `count` | `ParticleExplosion` | Number of exploding fragments. |
| `emissiveIntensity` | `GenesisCore` | Bloom/Glow strength of center core. |
| `Stars count` | `Scene` | Density of background star field. |

## Accessibility
- **Reduced Motion**: Automatically detects `prefers-reduced-motion` and switches to `HeroStaticFallback`.
- **WebGL Support**: Automatically detects lack of WebGL context and switches to `HeroStaticFallback`.
- **ARIA Labels**: Interactive buttons and sections are fully tagged.

## Maintenance
To update the 3D scene:
1. Modify `Scene.tsx`.
2. Ensure `HeroStaticFallback.tsx` is kept visually consistent (text, layout) with the 3D version.

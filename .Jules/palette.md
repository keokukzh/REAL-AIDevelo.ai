## 2026-02-03 - Avoid Full-Page Loaders in Buttons
**Learning:** Using full-page or large block components (like the premium `LoadingSpinner` with 80px+ height) inside interactive elements like buttons breaks the layout and UX. The button size expands drastically, shifting content and looking broken.
**Action:** Always check the dimensions and intended use case of a loading component before using it inline. For buttons, use a small (e.g., `w-5 h-5`) spinner like `Loader2` or a dedicated `ButtonLoader` component that fits within the button's line height.

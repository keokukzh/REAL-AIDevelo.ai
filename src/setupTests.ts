import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Smoothly mock scrollTo to avoid JSDOM errors in scroll-based components
Object.defineProperty(global, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock framer-motion scroll hooks to prevent warnings in jsdom
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<any>('framer-motion');
  return {
    ...actual,
    useScroll: () => ({
      scrollY: {
        getPrevious: () => 0,
        on: () => () => {},
        get: () => 0,
        set: () => {},
      },
    }),
    useMotionValueEvent: () => {},
  };
});

// Provide matchMedia for components using it
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}


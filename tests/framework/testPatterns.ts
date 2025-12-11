import { Page } from '@playwright/test';
import { vi } from 'vitest';

export const TestPatterns = {
  createPageObject(page: Page, selectors: Record<string, string>) {
    const pageObject: Record<
      string,
      {
        element: () => ReturnType<Page['locator']>;
        click: () => Promise<void>;
        fill: (text: string) => Promise<void>;
        getText: () => Promise<string | null>;
        isVisible: () => Promise<boolean>;
      }
    > = {};

    Object.entries(selectors).forEach(([name, selector]) => {
      pageObject[name] = {
        element: () => page.locator(selector),
        click: () => page.click(selector),
        fill: (text: string) => page.fill(selector, text),
        getText: () => page.textContent(selector),
        isVisible: () => page.isVisible(selector),
      };
    });

    return pageObject;
  },

  createTestDataFactory<T extends Record<string, any>>(schema: T) {
    return {
      build(overrides: Partial<T> = {}): T {
        return { ...schema, ...overrides };
      },
      buildList(count: number, overrides: Partial<T> = {}): T[] {
        return Array.from({ length: count }, (_, idx) =>
          ({ ...schema, id: idx + 1, ...overrides } as T)
        );
      },
    };
  },

  createMockService(methods: string[]) {
    const mock: Record<string, ReturnType<typeof vi.fn>> = {};
    methods.forEach((m) => (mock[m] = vi.fn()));
    return {
      ...mock,
      reset: () => methods.forEach((m) => mock[m].mockReset()),
    };
  },
};


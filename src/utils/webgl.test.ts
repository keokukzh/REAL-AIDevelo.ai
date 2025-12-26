import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isWebGLAvailable, isWebGL2Available } from './webgl';

describe('WebGL Utilities', () => {
  let mockCreateElement: any;

  beforeEach(() => {
    mockCreateElement = vi.spyOn(document, 'createElement');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isWebGLAvailable', () => {
    it('should return true when webgl context is supported', () => {
      // Mock window.WebGLRenderingContext
      window.WebGLRenderingContext = true as any;

      // Mock canvas.getContext
      const mockGetContext = vi.fn().mockReturnValue({});
      mockCreateElement.mockReturnValue({
        getContext: mockGetContext,
      } as any);

      expect(isWebGLAvailable()).toBe(true);
      expect(mockGetContext).toHaveBeenCalledWith('webgl');
    });

    it('should return true when experimental-webgl context is supported', () => {
      window.WebGLRenderingContext = true as any;

      const mockGetContext = vi.fn().mockImplementation((contextId) => {
        return contextId === 'experimental-webgl' ? {} : null;
      });
      mockCreateElement.mockReturnValue({
        getContext: mockGetContext,
      } as any);

      expect(isWebGLAvailable()).toBe(true);
    });

    it('should return false when WebGLRenderingContext is undefined', () => {
      // @ts-ignore
      delete window.WebGLRenderingContext;
      expect(isWebGLAvailable()).toBe(false);
    });

    it('should return false when getContext returns null', () => {
      window.WebGLRenderingContext = true as any;
      const mockGetContext = vi.fn().mockReturnValue(null);
      mockCreateElement.mockReturnValue({
        getContext: mockGetContext,
      } as any);

      expect(isWebGLAvailable()).toBe(false);
    });
  });

  describe('isWebGL2Available', () => {
    it('should return true when webgl2 context is supported', () => {
      window.WebGL2RenderingContext = true as any;
      const mockGetContext = vi.fn().mockReturnValue({});
      mockCreateElement.mockReturnValue({
        getContext: mockGetContext,
      } as any);

      expect(isWebGL2Available()).toBe(true);
      expect(mockGetContext).toHaveBeenCalledWith('webgl2');
    });

    it('should return false when WebGL2RenderingContext is undefined', () => {
      // @ts-ignore
      delete window.WebGL2RenderingContext;
      expect(isWebGL2Available()).toBe(false);
    });
  });
});

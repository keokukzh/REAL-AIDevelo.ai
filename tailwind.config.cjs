/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        background: '#0E0E0E',
        foreground: '#FFFFFF',
        surface: '#111827',
        primary: '#1A73E8',
        accent: '#00E0FF',
        'swiss-red': '#DA291C',
        // AIDevelo Ultra Theme
        obsidian: '#05060A',
        panel: '#0B0F19',
        'ultra-border': '#1A2340',
        violet: '#7C3AED',
        cyan: '#22D3EE',
        'electric-blue': '#3B82F6',
        // Semantic colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#00E0FF',
        // Gray scale (full range)
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
        },
      },
      // Gradient utilities
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1A73E8 0%, #00E0FF 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00E0FF 0%, #38BDF8 100%)',
        'gradient-surface':
          'linear-gradient(180deg, rgba(17,24,39,0.8) 0%, rgba(15,23,42,0.9) 100%)',
        'gradient-hero':
          'linear-gradient(135deg, rgba(26,115,232,0.1) 0%, rgba(0,224,255,0.1) 100%)',
        // AIDevelo Ultra Gradients
        'gradient-ultra': 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 50%, #3B82F6 100%)',
        'gradient-aurora':
          'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(34,211,238,0.2) 50%, rgba(59,130,246,0.3) 100%)',
        'gradient-glow-violet':
          'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
        'gradient-glow-cyan':
          'radial-gradient(ellipse at center, rgba(34,211,238,0.15) 0%, transparent 70%)',
        'gradient-mesh':
          'radial-gradient(at 40% 20%, rgba(124,58,237,0.3) 0, transparent 50%), radial-gradient(at 80% 0%, rgba(34,211,238,0.2) 0, transparent 50%), radial-gradient(at 0% 50%, rgba(59,130,246,0.2) 0, transparent 50%), radial-gradient(at 80% 50%, rgba(124,58,237,0.15) 0, transparent 50%), radial-gradient(at 0% 100%, rgba(34,211,238,0.2) 0, transparent 50%)',
      },
      // Spacing scale (4px base unit)
      spacing: {
        xs: '0.25rem', // 4px
        sm: '0.5rem', // 8px
        md: '1rem', // 16px
        lg: '1.5rem', // 24px
        xl: '2rem', // 32px
        '2xl': '3rem', // 48px
        '3xl': '4rem', // 64px
        '4xl': '6rem', // 96px
        '5xl': '8rem', // 128px
      },
      // Typography scale
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }], // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }], // 14px
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }], // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }], // 36px
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em' }], // 48px
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }], // 60px
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }], // 72px
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      // Border radius scale
      borderRadius: {
        none: '0',
        sm: '0.25rem', // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.75rem', // 12px
        lg: '1rem', // 16px
        xl: '1.5rem', // 24px
        '2xl': '2rem', // 32px
        full: '9999px',
      },
      // Shadow scale (elevation system)
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        // Dark theme specific shadows
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        // Glow effects
        'glow-accent': '0 0 20px rgba(0, 224, 255, 0.3)',
        'glow-primary': '0 0 20px rgba(26, 115, 232, 0.3)',
        'glow-red': '0 0 20px rgba(218, 41, 28, 0.3)',
        // AIDevelo Ultra Glows
        'glow-violet': '0 0 30px rgba(124, 58, 237, 0.4)',
        'glow-cyan': '0 0 30px rgba(34, 211, 238, 0.4)',
        'glow-ultra': '0 0 40px rgba(124, 58, 237, 0.3), 0 0 80px rgba(34, 211, 238, 0.2)',
        'ultra-card': '0 4px 30px rgba(0, 0, 0, 0.5), 0 0 1px rgba(124, 58, 237, 0.3)',
      },
      // Animation durations and easing
      transitionDuration: {
        DEFAULT: '200ms',
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        slower: '500ms',
        slowest: '800ms',
      },
      transitionTimingFunction: {
        'ease-in-out-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'ease-out-cubic': 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
      animation: {
        blob: 'blob 7s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 200ms ease-in',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        skeleton: 'skeleton 1.5s ease-in-out infinite',
        // AIDevelo Ultra Animations
        aurora: 'aurora 15s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'slide-in-left': 'slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        waveform: 'waveform 1.2s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
        'shimmer-fast': 'shimmer 2s linear infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        // AIDevelo Ultra Keyframes
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
      },
      // Breakpoints (already defined by Tailwind, documenting for reference)
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};

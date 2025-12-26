export const theme = {
  colors: {
    brand: {
      primary: '#DA291C', // swiss-red
      primaryName: 'swiss-red',
    },
    slate950: '#020617',
    emerald500: '#10B981',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

export type Theme = typeof theme;

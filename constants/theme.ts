// Powered by OnSpace.AI
export const Colors = {
  // Brand
  primary: '#7C5CFC',
  primaryLight: '#A98BFD',
  primaryDark: '#5A3FD0',

  // Accents
  coral: '#FF6B6B',
  teal: '#00CEC9',
  gold: '#FDCB6E',
  mint: '#55EFC4',

  // Group palette (cycle through for groups)
  groupPalette: ['#7C5CFC', '#FF6B6B', '#00CEC9', '#FDCB6E', '#E17055', '#74B9FF', '#A29BFE', '#55EFC4'],

  // Surface
  background: '#0F0E17',
  surface: '#1A1929',
  surfaceCard: '#231F35',
  surfaceMid: '#2D2845',
  border: '#3A3558',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A89EC9',
  textMuted: '#6B6390',
  textInverse: '#0F0E17',

  // Semantic
  success: '#55EFC4',
  error: '#FF6B6B',
  warning: '#FDCB6E',

  // Overlay
  overlay: 'rgba(15,14,23,0.7)',
  overlayLight: 'rgba(15,14,23,0.4)',
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
};

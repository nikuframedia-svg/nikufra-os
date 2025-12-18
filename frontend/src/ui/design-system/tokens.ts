/**
 * DESIGN SYSTEM TOKENS - ProdPlan 4.0 OS
 * Industrial, sério, densidade alta, radius <= 4px
 * FONTE ÚNICA - não duplicar valores
 */

export const tokens = {
  // ============================================
  // CORES - Paleta industrial escura
  // ============================================
  colors: {
    // Backgrounds
    background: '#0A0A0A',
    surface: {
      primary: '#111111',
      secondary: '#161616',
      tertiary: '#1A1A1A',
      hover: '#1E1E1E',
      active: '#222222',
    },
    
    // Borders
    border: {
      default: '#2A2A2A',
      subtle: '#1F1F1F',
      strong: '#3A3A3A',
      focus: '#00E676',
    },
    
    // Text hierarchy
    text: {
      primary: '#FAFAFA',
      secondary: '#B0B0B0',
      tertiary: '#707070',
      muted: '#505050',
      inverse: '#0A0A0A',
    },
    
    // Accent - Verde industrial
    accent: {
      primary: '#00E676',
      primaryHover: '#00C853',
      primaryMuted: 'rgba(0, 230, 118, 0.15)',
      secondary: '#00BCD4',
      secondaryMuted: 'rgba(0, 188, 212, 0.15)',
    },
    
    // Status - Semânticos
    status: {
      success: '#00E676',
      successMuted: 'rgba(0, 230, 118, 0.15)',
      warning: '#FFB300',
      warningMuted: 'rgba(255, 179, 0, 0.15)',
      error: '#FF5252',
      errorMuted: 'rgba(255, 82, 82, 0.15)',
      info: '#29B6F6',
      infoMuted: 'rgba(41, 182, 246, 0.15)',
    },
    
    // Heatmap gradient
    heatmap: {
      cold: '#1565C0',
      neutral: '#4CAF50',
      warm: '#FF9800',
      hot: '#F44336',
    },
  },
  
  // ============================================
  // SPACING - Escala 4px base
  // ============================================
  spacing: {
    '0': '0',
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
  },
  
  // ============================================
  // TYPOGRAPHY - Hierarquia clara
  // ============================================
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    fontSize: {
      '2xs': '10px',
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '28px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
      uppercase: '0.05em',
    },
  },
  
  // ============================================
  // RADIUS - INDUSTRIAL (max 4px)
  // ============================================
  radius: {
    none: '0',
    sm: '2px',
    md: '3px',
    lg: '4px',
    full: '9999px', // apenas para badges circulares
  },
  
  // ============================================
  // SHADOWS - Mínimas (industrial)
  // ============================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 2px 4px rgba(0, 0, 0, 0.4)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.5)',
    focus: '0 0 0 2px rgba(0, 230, 118, 0.3)',
  },
  
  // ============================================
  // TRANSITIONS
  // ============================================
  transitions: {
    fast: '100ms ease',
    normal: '150ms ease',
    slow: '250ms ease',
  },
  
  // ============================================
  // Z-INDEX
  // ============================================
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    toast: 400,
  },
  
  // ============================================
  // BREAKPOINTS
  // ============================================
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // ============================================
  // COMPONENT SIZES
  // ============================================
  sizes: {
    sideNav: '64px',
    topBar: '48px',
    pageHeader: '56px',
    tableRow: '36px',
    input: '32px',
    button: {
      sm: '28px',
      md: '32px',
      lg: '40px',
    },
  },
} as const;

// Type exports
export type Tokens = typeof tokens;
export type ColorKey = keyof typeof tokens.colors;
export type SpacingKey = keyof typeof tokens.spacing;


/**
 * Design Tokens - PRODPLAN 4.0 OS
 * Fonte única de verdade para cores, spacing, typography, etc.
 * Nenhum componente deve usar valores hardcoded - sempre usar tokens.
 */

export const tokens = {
  colors: {
    // Backgrounds - Design sóbrio e profissional
    background: '#0B0B0B', // Preto profundo
    card: {
      default: '#121212', // Cinza escuro para cards
      elevated: '#161616', // Cinza médio para cards elevados
      hover: '#1A1A1A', // Hover state
      semiTransparent: 'rgba(255, 255, 255, 0.05)', // Transparência sutil
      listItem: 'rgba(255, 255, 255, 0.03)', // Itens de lista
    },
    // Primary - Verde sóbrio e profissional
    primary: {
      default: '#00E676', // Verde principal
      hover: '#00C767', // Hover mais escuro
      accent: '#00A85C', // Acento mais escuro
      action: '#00E676', // Ações (consistente)
      light: 'rgba(0, 230, 118, 0.1)', // Background claro
    },
    // Text - Hierarquia clara
    text: {
      title: '#EAEAEA', // Branco suave para títulos
      body: '#CFCFCF', // Cinza claro para corpo
      secondary: '#9A9A9A', // Cinza médio para secundário
      muted: '#6B6B6B', // Cinza escuro para muted
      onAction: '#0B0B0B', // Texto escuro sobre botão claro
    },
    // Status - Cores profissionais
    status: {
      success: '#00E676', // Verde para sucesso
      error: '#EF4444', // Vermelho para erro
      warning: '#F59E0B', // Laranja para aviso
      info: '#3B82F6', // Azul para info
      available: '#00E676', // Disponível
      unavailable: '#EF4444', // Indisponível
    },
    // Activity - Cores específicas (mantidas do design original)
    activity: {
      executive: '#D98425',
      association: '#D9CF25',
      motor: '#3BACD9',
      speech: '#CA50D9',
      vision: '#82D930',
      other: '#9379FF',
    },
    // Semantic
    danger: '#EF4444',
    warning: '#F59E0B',
    border: '#262626', // Bordas sutis
    divider: '#1F1F1F', // Divisores
  },
  spacing: {
    xs: '4px', // Mínimo
    sm: '8px', // Pequeno
    md: '12px', // Médio
    lg: '16px', // Grande
    xl: '24px', // Extra grande
    '2xl': '32px', // Duplo extra grande
  },
  borderRadius: {
    card: '4px', // Cards principais (industrial)
    input: '4px', // Inputs e selects (industrial)
    button: '4px', // Botões (industrial)
    badge: '4px', // Badges e pills (industrial)
    highlight: '6px', // Elementos destacados (máximo permitido)
    circle: '50%', // Círculos completos
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: {
      title: {
        xl: '28px', // Títulos principais
        lg: '24px', // Títulos de seção
        md: '20px', // Subtítulos
      },
      body: {
        md: '16px', // Corpo padrão
        sm: '14px', // Corpo pequeno
        xs: '13px', // Corpo extra pequeno
      },
      label: '12px', // Labels e captions
    },
    fontWeight: {
      bold: 700,
      semibold: 600,
      medium: 500,
      regular: 400,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.05em',
      uppercase: '0.1em',
    },
  },
  grid: {
    columns: 12,
    gutter: '16px', // Gutter mais compacto (industrial)
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1200px',
    desktop: '1440px',
  },
  transitions: {
    default: '150ms ease-in-out',
    fast: '100ms ease-in-out',
    slow: '200ms ease-in-out',
  },
  shadows: {
    // Sombras sutis (industrial)
    card: '0 1px 2px rgba(0, 0, 0, 0.2)',
    cardHover: '0 2px 4px rgba(0, 0, 0, 0.3)',
    highlight: 'none', // Sem glow
    focus: '0 0 0 2px rgba(0, 230, 118, 0.3)', // Focus ring sutil
    elevation: {
      sm: '0 1px 1px rgba(0, 0, 0, 0.1)',
      md: '0 1px 2px rgba(0, 0, 0, 0.2)',
      lg: '0 2px 4px rgba(0, 0, 0, 0.3)',
    },
  },
} as const;

export type Tokens = typeof tokens;


// Enhanced Theme System with Multiple Variants
// Professional color palettes and design tokens

export type ThemeVariant = 'light' | 'dark' | 'corporate' | 'modern' | 'vibrant' | 'minimal';

// Design Tokens
export const designTokens = {
  // Spacing Scale (rem units)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
    '5xl': '6rem',    // 96px
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      display: ['Poppins', 'Inter', 'sans-serif']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    }
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },

  // Animation Durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '750ms'
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};

// Theme Color Palettes
export const themeColors = {
  light: {
    // Primary Colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)'
    },
    // Text Colors
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
      disabled: '#94a3b8'
    },
    // Border Colors
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#3b82f6',
      error: '#ef4444',
      success: '#10b981'
    },
    // Status Colors
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },

  dark: {
    // Primary Colors
    primary: {
      50: '#1e3a8a',
      100: '#1e40af',
      200: '#1d4ed8',
      300: '#2563eb',
      400: '#3b82f6',
      500: '#60a5fa',
      600: '#93c5fd',
      700: '#bfdbfe',
      800: '#dbeafe',
      900: '#eff6ff',
      950: '#f0f9ff'
    },
    // Background Colors
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      elevated: '#1e293b',
      overlay: 'rgba(0, 0, 0, 0.8)'
    },
    // Text Colors
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      inverse: '#0f172a',
      disabled: '#64748b'
    },
    // Border Colors
    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: '#60a5fa',
      error: '#f87171',
      success: '#34d399'
    },
    // Status Colors
    status: {
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa'
    }
  },

  corporate: {
    // Primary Colors (Professional Blue-Gray)
    primary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },
    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#ffffff',
      overlay: 'rgba(15, 23, 42, 0.6)'
    },
    // Text Colors
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      tertiary: '#64748b',
      inverse: '#ffffff',
      disabled: '#94a3b8'
    },
    // Border Colors
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#475569',
      error: '#dc2626',
      success: '#059669'
    },
    // Status Colors
    status: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    }
  },

  modern: {
    // Primary Colors (Vibrant Purple-Blue)
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764'
    },
    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#fafafa',
      tertiary: '#f4f4f5',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.4)'
    },
    // Text Colors
    text: {
      primary: '#18181b',
      secondary: '#3f3f46',
      tertiary: '#71717a',
      inverse: '#ffffff',
      disabled: '#a1a1aa'
    },
    // Border Colors
    border: {
      primary: '#e4e4e7',
      secondary: '#d4d4d8',
      focus: '#a855f7',
      error: '#ef4444',
      success: '#22c55e'
    },
    // Status Colors
    status: {
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#06b6d4'
    }
  },

  vibrant: {
    // Primary Colors (Energetic Orange-Red)
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407'
    },
    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#fffbeb',
      tertiary: '#fef3c7',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)'
    },
    // Text Colors
    text: {
      primary: '#1f2937',
      secondary: '#374151',
      tertiary: '#6b7280',
      inverse: '#ffffff',
      disabled: '#9ca3af'
    },
    // Border Colors
    border: {
      primary: '#fde68a',
      secondary: '#f3e8ff',
      focus: '#f97316',
      error: '#dc2626',
      success: '#16a34a'
    },
    // Status Colors
    status: {
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#dc2626',
      info: '#0ea5e9'
    }
  },

  minimal: {
    // Primary Colors (Subtle Gray)
    primary: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b'
    },
    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#fafafa',
      tertiary: '#f4f4f5',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.3)'
    },
    // Text Colors
    text: {
      primary: '#18181b',
      secondary: '#3f3f46',
      tertiary: '#71717a',
      inverse: '#ffffff',
      disabled: '#a1a1aa'
    },
    // Border Colors
    border: {
      primary: '#e4e4e7',
      secondary: '#d4d4d8',
      focus: '#71717a',
      error: '#dc2626',
      success: '#16a34a'
    },
    // Status Colors
    status: {
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#dc2626',
      info: '#0284c7'
    }
  }
};

// Theme Configuration
export interface ThemeConfig {
  variant: ThemeVariant;
  colors: typeof themeColors.light;
  tokens: typeof designTokens;
  customColors?: Partial<typeof themeColors.light>;
}

// Get theme configuration by variant
export const getThemeConfig = (variant: ThemeVariant, customColors?: Partial<typeof themeColors.light>): ThemeConfig => {
  const baseColors = themeColors[variant] || themeColors.light;
  
  return {
    variant,
    colors: customColors ? { ...baseColors, ...customColors } : baseColors,
    tokens: designTokens,
    customColors
  };
};

// CSS Custom Properties Generator
export const generateCSSVariables = (config: ThemeConfig): string => {
  const { colors, tokens } = config;
  
  const cssVars: string[] = [];
  
  // Color variables
  Object.entries(colors).forEach(([category, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        if (typeof value === 'string') {
          cssVars.push(`--color-${category}-${key}: ${value};`);
        } else if (typeof value === 'object') {
          Object.entries(value).forEach(([shade, color]) => {
            cssVars.push(`--color-${category}-${key}-${shade}: ${color};`);
          });
        }
      });
    }
  });
  
  // Spacing variables
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars.push(`--spacing-${key}: ${value};`);
  });
  
  // Typography variables
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    const [size, props] = Array.isArray(value) ? value : [value, {}];
    cssVars.push(`--font-size-${key}: ${size};`);
    if (props.lineHeight) {
      cssVars.push(`--line-height-${key}: ${props.lineHeight};`);
    }
  });
  
  // Border radius variables
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    cssVars.push(`--border-radius-${key}: ${value};`);
  });
  
  // Shadow variables
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });
  
  return `:root {\n  ${cssVars.join('\n  ')}\n}`;
};

// Default theme configurations
export const defaultThemes: Record<ThemeVariant, ThemeConfig> = {
  light: getThemeConfig('light'),
  dark: getThemeConfig('dark'),
  corporate: getThemeConfig('corporate'),
  modern: getThemeConfig('modern'),
  vibrant: getThemeConfig('vibrant'),
  minimal: getThemeConfig('minimal')
};
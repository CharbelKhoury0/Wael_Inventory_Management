import { designTokens, ThemeConfig } from '../themes/themeConfig';
import { useEnhancedTheme } from '../contexts/ThemeContext';

// Design Token Utility Functions
export class DesignTokens {
  private config: ThemeConfig;
  
  constructor(config: ThemeConfig) {
    this.config = config;
  }
  
  // Spacing utilities
  spacing = {
    get: (size: keyof typeof designTokens.spacing) => designTokens.spacing[size],
    
    // Responsive spacing
    responsive: (base: keyof typeof designTokens.spacing, scale: number = 1.5) => ({
      base: designTokens.spacing[base],
      md: `calc(${designTokens.spacing[base]} * ${scale})`,
      lg: `calc(${designTokens.spacing[base]} * ${scale * 1.2})`
    }),
    
    // Component-specific spacing
    component: {
      button: {
        xs: designTokens.spacing.sm,
        sm: designTokens.spacing.md,
        md: designTokens.spacing.lg,
        lg: designTokens.spacing.xl,
        xl: designTokens.spacing['2xl']
      },
      card: {
        sm: designTokens.spacing.md,
        md: designTokens.spacing.lg,
        lg: designTokens.spacing.xl,
        xl: designTokens.spacing['2xl']
      },
      modal: {
        padding: designTokens.spacing.xl,
        gap: designTokens.spacing.lg
      }
    }
  };
  
  // Typography utilities
  typography = {
    get: (size: keyof typeof designTokens.typography.fontSize) => {
      const [fontSize, props] = designTokens.typography.fontSize[size];
      return {
        fontSize,
        lineHeight: props?.lineHeight || '1.5'
      };
    },
    
    // Font family utilities
    fontFamily: {
      sans: designTokens.typography.fontFamily.sans.join(', '),
      mono: designTokens.typography.fontFamily.mono.join(', '),
      display: designTokens.typography.fontFamily.display.join(', ')
    },
    
    // Font weight utilities
    fontWeight: designTokens.typography.fontWeight,
    
    // Text styles for common components
    styles: {
      heading: {
        h1: { ...this.typography.get('4xl'), fontWeight: designTokens.typography.fontWeight.bold },
        h2: { ...this.typography.get('3xl'), fontWeight: designTokens.typography.fontWeight.bold },
        h3: { ...this.typography.get('2xl'), fontWeight: designTokens.typography.fontWeight.semibold },
        h4: { ...this.typography.get('xl'), fontWeight: designTokens.typography.fontWeight.semibold },
        h5: { ...this.typography.get('lg'), fontWeight: designTokens.typography.fontWeight.medium },
        h6: { ...this.typography.get('base'), fontWeight: designTokens.typography.fontWeight.medium }
      },
      body: {
        large: this.typography.get('lg'),
        base: this.typography.get('base'),
        small: this.typography.get('sm'),
        xs: this.typography.get('xs')
      },
      label: {
        large: { ...this.typography.get('sm'), fontWeight: designTokens.typography.fontWeight.medium },
        base: { ...this.typography.get('xs'), fontWeight: designTokens.typography.fontWeight.medium }
      }
    }
  };
  
  // Color utilities
  colors = {
    get: (category: keyof typeof this.config.colors, key?: string, shade?: string) => {
      const colorCategory = this.config.colors[category];
      if (!key) return colorCategory;
      
      const colorValue = colorCategory[key as keyof typeof colorCategory];
      if (typeof colorValue === 'string') return colorValue;
      if (typeof colorValue === 'object' && shade) {
        return colorValue[shade as keyof typeof colorValue];
      }
      return colorValue;
    },
    
    // Semantic color utilities
    semantic: {
      primary: (shade: string = '600') => this.colors.get('primary', shade),
      success: () => this.colors.get('status', 'success'),
      warning: () => this.colors.get('status', 'warning'),
      error: () => this.colors.get('status', 'error'),
      info: () => this.colors.get('status', 'info')
    },
    
    // Alpha utilities
    alpha: (color: string, alpha: number) => {
      // Convert hex to rgba
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  };
  
  // Border radius utilities
  borderRadius = {
    get: (size: keyof typeof designTokens.borderRadius) => designTokens.borderRadius[size],
    
    // Component-specific border radius
    component: {
      button: designTokens.borderRadius.md,
      card: designTokens.borderRadius.lg,
      modal: designTokens.borderRadius.xl,
      input: designTokens.borderRadius.md,
      badge: designTokens.borderRadius.full
    }
  };
  
  // Shadow utilities
  shadows = {
    get: (size: keyof typeof designTokens.shadows) => designTokens.shadows[size],
    
    // Component-specific shadows
    component: {
      card: designTokens.shadows.md,
      modal: designTokens.shadows['2xl'],
      dropdown: designTokens.shadows.lg,
      button: designTokens.shadows.sm,
      tooltip: designTokens.shadows.lg
    },
    
    // Colored shadows
    colored: (color: string, size: keyof typeof designTokens.shadows = 'md') => {
      const shadow = designTokens.shadows[size];
      return shadow.replace('rgb(0 0 0', `rgb(${this.hexToRgb(color)}`);
    }
  };
  
  // Animation utilities
  animation = {
    duration: designTokens.animation,
    
    // Easing functions
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    
    // Common transitions
    transition: {
      fast: `all ${designTokens.animation.fast} cubic-bezier(0.4, 0, 0.2, 1)`,
      normal: `all ${designTokens.animation.normal} cubic-bezier(0.4, 0, 0.2, 1)`,
      slow: `all ${designTokens.animation.slow} cubic-bezier(0.4, 0, 0.2, 1)`,
      colors: `background-color ${designTokens.animation.normal} cubic-bezier(0.4, 0, 0.2, 1), border-color ${designTokens.animation.normal} cubic-bezier(0.4, 0, 0.2, 1), color ${designTokens.animation.normal} cubic-bezier(0.4, 0, 0.2, 1)`,
      transform: `transform ${designTokens.animation.normal} cubic-bezier(0.4, 0, 0.2, 1)`,
      opacity: `opacity ${designTokens.animation.fast} cubic-bezier(0.4, 0, 0.2, 1)`
    }
  };
  
  // Z-index utilities
  zIndex = {
    get: (level: keyof typeof designTokens.zIndex) => designTokens.zIndex[level],
    
    // Component-specific z-index
    component: {
      header: designTokens.zIndex.sticky,
      sidebar: designTokens.zIndex.docked,
      dropdown: designTokens.zIndex.dropdown,
      modal: designTokens.zIndex.modal,
      toast: designTokens.zIndex.toast,
      tooltip: designTokens.zIndex.tooltip
    }
  };
  
  // Utility functions
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      : '0 0 0';
  }
  
  // Generate CSS custom properties
  generateCSSProperties(): Record<string, string> {
    const properties: Record<string, string> = {};
    
    // Spacing properties
    Object.entries(designTokens.spacing).forEach(([key, value]) => {
      properties[`--spacing-${key}`] = value;
    });
    
    // Typography properties
    Object.entries(designTokens.typography.fontSize).forEach(([key, value]) => {
      const [size, props] = Array.isArray(value) ? value : [value, {}];
      properties[`--font-size-${key}`] = size;
      if (props.lineHeight) {
        properties[`--line-height-${key}`] = props.lineHeight;
      }
    });
    
    // Color properties
    Object.entries(this.config.colors).forEach(([category, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          if (typeof value === 'string') {
            properties[`--color-${category}-${key}`] = value;
          } else if (typeof value === 'object') {
            Object.entries(value).forEach(([shade, color]) => {
              properties[`--color-${category}-${key}-${shade}`] = color;
            });
          }
        });
      }
    });
    
    // Border radius properties
    Object.entries(designTokens.borderRadius).forEach(([key, value]) => {
      properties[`--border-radius-${key}`] = value;
    });
    
    // Shadow properties
    Object.entries(designTokens.shadows).forEach(([key, value]) => {
      properties[`--shadow-${key}`] = value;
    });
    
    // Animation properties
    Object.entries(designTokens.animation).forEach(([key, value]) => {
      properties[`--duration-${key}`] = value;
    });
    
    return properties;
  }
}

// React hook to use design tokens
export const useDesignTokens = () => {
  const { themeConfig } = useEnhancedTheme();
  return new DesignTokens(themeConfig);
};

// CSS-in-JS utilities
export const createStyleObject = (tokens: DesignTokens) => ({
  // Spacing utilities
  p: (size: keyof typeof designTokens.spacing) => ({ padding: tokens.spacing.get(size) }),
  px: (size: keyof typeof designTokens.spacing) => ({ paddingLeft: tokens.spacing.get(size), paddingRight: tokens.spacing.get(size) }),
  py: (size: keyof typeof designTokens.spacing) => ({ paddingTop: tokens.spacing.get(size), paddingBottom: tokens.spacing.get(size) }),
  m: (size: keyof typeof designTokens.spacing) => ({ margin: tokens.spacing.get(size) }),
  mx: (size: keyof typeof designTokens.spacing) => ({ marginLeft: tokens.spacing.get(size), marginRight: tokens.spacing.get(size) }),
  my: (size: keyof typeof designTokens.spacing) => ({ marginTop: tokens.spacing.get(size), marginBottom: tokens.spacing.get(size) }),
  
  // Typography utilities
  text: (size: keyof typeof designTokens.typography.fontSize) => tokens.typography.get(size),
  font: (weight: keyof typeof designTokens.typography.fontWeight) => ({ fontWeight: tokens.typography.fontWeight[weight] }),
  
  // Color utilities
  bg: (category: string, key?: string, shade?: string) => ({ backgroundColor: tokens.colors.get(category as keyof typeof tokens.config.colors, key, shade) }),
  color: (category: string, key?: string, shade?: string) => ({ color: tokens.colors.get(category as keyof typeof tokens.config.colors, key, shade) }),
  
  // Border utilities
  rounded: (size: keyof typeof designTokens.borderRadius) => ({ borderRadius: tokens.borderRadius.get(size) }),
  
  // Shadow utilities
  shadow: (size: keyof typeof designTokens.shadows) => ({ boxShadow: tokens.shadows.get(size) }),
  
  // Animation utilities
  transition: (property: string = 'all', duration: keyof typeof designTokens.animation = 'normal') => ({
    transition: `${property} ${tokens.animation.duration[duration]} cubic-bezier(0.4, 0, 0.2, 1)`
  })
});

// Tailwind CSS class generators
export const generateTailwindClasses = (tokens: DesignTokens) => ({
  // Spacing classes
  spacing: {
    p: (size: keyof typeof designTokens.spacing) => `p-[${tokens.spacing.get(size)}]`,
    px: (size: keyof typeof designTokens.spacing) => `px-[${tokens.spacing.get(size)}]`,
    py: (size: keyof typeof designTokens.spacing) => `py-[${tokens.spacing.get(size)}]`,
    m: (size: keyof typeof designTokens.spacing) => `m-[${tokens.spacing.get(size)}]`,
    mx: (size: keyof typeof designTokens.spacing) => `mx-[${tokens.spacing.get(size)}]`,
    my: (size: keyof typeof designTokens.spacing) => `my-[${tokens.spacing.get(size)}]`
  },
  
  // Typography classes
  text: {
    size: (size: keyof typeof designTokens.typography.fontSize) => {
      const { fontSize } = tokens.typography.get(size);
      return `text-[${fontSize}]`;
    },
    weight: (weight: keyof typeof designTokens.typography.fontWeight) => {
      const weightMap = {
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
        extrabold: 'font-extrabold'
      };
      return weightMap[weight];
    }
  },
  
  // Color classes
  bg: (category: string, key?: string, shade?: string) => {
    const color = tokens.colors.get(category as keyof typeof tokens.config.colors, key, shade);
    return `bg-[${color}]`;
  },
  
  text: (category: string, key?: string, shade?: string) => {
    const color = tokens.colors.get(category as keyof typeof tokens.config.colors, key, shade);
    return `text-[${color}]`;
  },
  
  // Border classes
  rounded: (size: keyof typeof designTokens.borderRadius) => {
    const radiusMap = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
      full: 'rounded-full'
    };
    return radiusMap[size] || `rounded-[${tokens.borderRadius.get(size)}]`;
  },
  
  // Shadow classes
  shadow: (size: keyof typeof designTokens.shadows) => {
    const shadowMap = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      '2xl': 'shadow-2xl',
      inner: 'shadow-inner'
    };
    return shadowMap[size as keyof typeof shadowMap] || `shadow-[${tokens.shadows.get(size)}]`;
  }
});

export default DesignTokens;
import React from 'react';
import { useEnhancedTheme } from '../../contexts/ThemeContext';
import { ChevronRight, Home } from 'lucide-react';
import { HoverScale } from './AnimationSystem';

// Breadcrumb item interface
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

// Breadcrumb props
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  homeLabel?: string;
  onHomeClick?: () => void;
  maxItems?: number;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

// Enhanced Breadcrumb Component
const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator,
  showHome = true,
  homeLabel = 'Home',
  onHomeClick,
  maxItems,
  className = '',
  variant = 'default'
}) => {
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();
  
  // Default separator
  const defaultSeparator = <ChevronRight className="h-4 w-4" />;
  const separatorElement = separator || defaultSeparator;
  
  // Process items with home
  const allItems = showHome 
    ? [
        {
          label: homeLabel,
          icon: <Home className="h-4 w-4" />,
          onClick: onHomeClick
        },
        ...items
      ]
    : items;
  
  // Handle max items with ellipsis
  const processedItems = maxItems && allItems.length > maxItems
    ? [
        ...allItems.slice(0, 1), // First item
        { label: '...', disabled: true }, // Ellipsis
        ...allItems.slice(-(maxItems - 2)) // Last items
      ]
    : allItems;
  
  // Variant styles
  const getItemStyles = (isLast: boolean, isDisabled: boolean) => {
    const baseStyles = 'inline-flex items-center space-x-1 transition-all duration-200';
    
    if (isDisabled) {
      return `${baseStyles} ${themeClasses.text.disabled} cursor-default`;
    }
    
    if (isLast) {
      switch (variant) {
        case 'pills':
          return `${baseStyles} ${themeClasses.text.primary} px-3 py-1 rounded-full bg-[${themeClasses.background.secondary}] font-medium`;
        case 'underline':
          return `${baseStyles} ${themeClasses.text.primary} border-b-2 border-current font-medium pb-1`;
        default:
          return `${baseStyles} ${themeClasses.text.primary} font-medium`;
      }
    }
    
    switch (variant) {
      case 'pills':
        return `${baseStyles} ${themeClasses.text.secondary} hover:${themeClasses.text.primary} px-3 py-1 rounded-full hover:bg-[${themeClasses.background.secondary}] cursor-pointer`;
      case 'underline':
        return `${baseStyles} ${themeClasses.text.secondary} hover:${themeClasses.text.primary} hover:border-b-2 hover:border-current cursor-pointer pb-1`;
      default:
        return `${baseStyles} ${themeClasses.text.secondary} hover:${themeClasses.text.primary} cursor-pointer`;
    }
  };
  
  const getSeparatorStyles = () => {
    return `mx-2 ${themeClasses.text.tertiary} flex-shrink-0`;
  };
  
  return (
    <nav className={`flex items-center space-x-1 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {processedItems.map((item, index) => {
          const isLast = index === processedItems.length - 1;
          const isDisabled = item.disabled;
          const isEllipsis = item.label === '...';
          
          return (
            <li key={index} className="flex items-center">
              {/* Breadcrumb Item */}
              {isEllipsis ? (
                <span className={themeClasses.text.disabled}>
                  {item.label}
                </span>
              ) : (
                <HoverScale scale={1.05} duration="fast">
                  {item.onClick && !isDisabled ? (
                    <button
                      onClick={item.onClick}
                      className={getItemStyles(isLast, isDisabled)}
                      disabled={isDisabled}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.icon && (
                        <span className="flex-shrink-0">
                          {item.icon}
                        </span>
                      )}
                      <span className="text-sm">
                        {item.label}
                      </span>
                    </button>
                  ) : (
                    <span
                      className={getItemStyles(isLast, isDisabled)}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.icon && (
                        <span className="flex-shrink-0">
                          {item.icon}
                        </span>
                      )}
                      <span className="text-sm">
                        {item.label}
                      </span>
                    </span>
                  )}
                </HoverScale>
              )}
              
              {/* Separator */}
              {!isLast && (
                <span className={getSeparatorStyles()}>
                  {separatorElement}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Auto Breadcrumb Component (generates breadcrumbs from current path)
interface AutoBreadcrumbProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export const AutoBreadcrumb: React.FC<AutoBreadcrumbProps> = ({
  currentPage,
  onPageChange,
  className = '',
  variant = 'default'
}) => {
  // Page hierarchy mapping
  const pageHierarchy: Record<string, { label: string; parent?: string; icon?: React.ReactNode }> = {
    dashboard: {
      label: 'Dashboard',
      icon: <Home className="h-4 w-4" />
    },
    items: {
      label: 'Inventory',
      parent: 'dashboard'
    },
    transactions: {
      label: 'Transactions',
      parent: 'dashboard'
    },
    receipts: {
      label: 'Receipts',
      parent: 'transactions'
    },
    movements: {
      label: 'Movements',
      parent: 'dashboard'
    },
    analytics: {
      label: 'Analytics',
      parent: 'dashboard'
    },
    settings: {
      label: 'Settings',
      parent: 'dashboard'
    }
  };
  
  // Build breadcrumb trail
  const buildBreadcrumbTrail = (page: string): BreadcrumbItem[] => {
    const trail: BreadcrumbItem[] = [];
    let currentPageInfo = pageHierarchy[page];
    let currentPageKey = page;
    
    // Build trail from current page back to root
    while (currentPageInfo) {
      trail.unshift({
        label: currentPageInfo.label,
        icon: currentPageInfo.icon,
        onClick: currentPageKey === page ? undefined : () => onPageChange(currentPageKey)
      });
      
      if (currentPageInfo.parent) {
        currentPageKey = currentPageInfo.parent;
        currentPageInfo = pageHierarchy[currentPageInfo.parent];
      } else {
        break;
      }
    }
    
    return trail;
  };
  
  const breadcrumbItems = buildBreadcrumbTrail(currentPage);
  
  return (
    <Breadcrumb
      items={breadcrumbItems}
      showHome={false} // Already included in hierarchy
      className={className}
      variant={variant}
    />
  );
};

// Breadcrumb with dropdown for overflow
interface DropdownBreadcrumbProps extends BreadcrumbProps {
  dropdownMaxItems?: number;
}

export const DropdownBreadcrumb: React.FC<DropdownBreadcrumbProps> = ({
  items,
  dropdownMaxItems = 3,
  ...props
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();
  
  if (items.length <= dropdownMaxItems) {
    return <Breadcrumb items={items} {...props} />;
  }
  
  const visibleItems = [
    items[0], // First item
    ...items.slice(-(dropdownMaxItems - 1)) // Last items
  ];
  
  const hiddenItems = items.slice(1, -(dropdownMaxItems - 1));
  
  return (
    <div className="relative">
      <Breadcrumb
        items={[
          visibleItems[0],
          {
            label: '...',
            onClick: () => setIsDropdownOpen(!isDropdownOpen)
          },
          ...visibleItems.slice(1)
        ]}
        {...props}
      />
      
      {/* Dropdown */}
      {isDropdownOpen && (
        <div className={`absolute top-full left-0 mt-2 py-2 ${themeClasses.background.elevated} border ${themeClasses.border.primary} rounded-lg shadow-lg z-50 min-w-48`}>
          {hiddenItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (item.onClick) item.onClick();
                setIsDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm ${themeClasses.text.secondary} hover:${themeClasses.background.secondary} hover:${themeClasses.text.primary} transition-colors`}
            >
              <div className="flex items-center space-x-2">
                {item.icon && (
                  <span className="flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Backdrop */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default Breadcrumb;
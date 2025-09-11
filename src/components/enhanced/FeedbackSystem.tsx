import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEnhancedTheme } from '../../contexts/ThemeContext';
import { CheckCircle, AlertCircle, Info, X, Star, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
import { FadeIn, SlideIn } from './AnimationSystem';

// Feedback types
export type FeedbackType = 'success' | 'error' | 'warning' | 'info';
export type FeedbackVariant = 'toast' | 'banner' | 'modal' | 'inline';

// Feedback item interface
interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

// User feedback interface
interface UserFeedback {
  id: string;
  rating: number;
  comment: string;
  category: string;
  timestamp: Date;
  resolved?: boolean;
}

// Feedback system props
interface FeedbackSystemProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxItems?: number;
  defaultDuration?: number;
}

// Feedback context
interface FeedbackContextType {
  showFeedback: (feedback: Omit<FeedbackItem, 'id'>) => string;
  hideFeedback: (id: string) => void;
  clearAll: () => void;
  items: FeedbackItem[];
}

const FeedbackContext = React.createContext<FeedbackContextType | undefined>(undefined);

// Feedback hook
export const useFeedback = () => {
  const context = React.useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// Feedback provider
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const showFeedback = useCallback((feedback: Omit<FeedbackItem, 'id'>) => {
    const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem: FeedbackItem = {
      ...feedback,
      id,
      duration: feedback.duration ?? 5000
    };

    setItems(prev => [...prev, newItem]);

    // Auto-hide after duration (unless persistent)
    if (!feedback.persistent && newItem.duration > 0) {
      timeoutsRef.current[id] = setTimeout(() => {
        hideFeedback(id);
      }, newItem.duration);
    }

    return id;
  }, []);

  const hideFeedback = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = {};
  }, []);

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const value: FeedbackContextType = {
    showFeedback,
    hideFeedback,
    clearAll,
    items
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

// Feedback toast component
interface FeedbackToastProps {
  item: FeedbackItem;
  onClose: (id: string) => void;
}

const FeedbackToast: React.FC<FeedbackToastProps> = ({ item, onClose }) => {
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();

  const getIcon = () => {
    switch (item.type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getBorderColor = () => {
    switch (item.type) {
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'warning': return 'border-l-yellow-500';
      case 'info': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <SlideIn direction="right" duration="fast">
      <div className={`
        ${themeClasses.background.elevated} 
        ${themeClasses.border.primary} 
        border-l-4 ${getBorderColor()} 
        rounded-lg shadow-lg p-4 mb-3 max-w-sm
      `}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium ${themeClasses.text.primary}`}>
              {item.title}
            </h4>
            
            <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>
              {item.message}
            </p>
            
            {item.actions && item.actions.length > 0 && (
              <div className="flex space-x-2 mt-3">
                {item.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`
                      px-3 py-1 text-xs rounded transition-colors
                      ${action.variant === 'primary' 
                        ? themeClasses.button.primary 
                        : themeClasses.button.secondary
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => onClose(item.id)}
            className={`flex-shrink-0 ${themeClasses.text.tertiary} hover:${themeClasses.text.primary} transition-colors`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </SlideIn>
  );
};

// Main feedback system component
const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  className = '',
  position = 'top-right',
  maxItems = 5,
  defaultDuration = 5000
}) => {
  const { items, hideFeedback } = useFeedback();

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right': return 'top-4 right-4';
      case 'top-left': return 'top-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'top-center': return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center': return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default: return 'top-4 right-4';
    }
  };

  const visibleItems = items.slice(-maxItems);

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      {visibleItems.map(item => (
        <FeedbackToast
          key={item.id}
          item={item}
          onClose={hideFeedback}
        />
      ))}
    </div>
  );
};

// User feedback collection component
interface UserFeedbackFormProps {
  onSubmit: (feedback: Omit<UserFeedback, 'id' | 'timestamp'>) => void;
  onCancel?: () => void;
  categories?: string[];
  className?: string;
}

export const UserFeedbackForm: React.FC<UserFeedbackFormProps> = ({
  onSubmit,
  onCancel,
  categories = ['General', 'Bug Report', 'Feature Request', 'Performance', 'UI/UX'],
  className = ''
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const { getThemeClasses } = useEnhancedTheme();
  const themeClasses = getThemeClasses();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && comment.trim()) {
      onSubmit({
        rating,
        comment: comment.trim(),
        category
      });
      
      // Reset form
      setRating(0);
      setComment('');
      setCategory(categories[0]);
    }
  };

  return (
    <FadeIn>
      <div className={`${themeClasses.background.elevated} rounded-lg p-6 shadow-lg ${className}`}>
        <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4`}>
          Share Your Feedback
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}>
              How would you rate your experience?
            </label>
            
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`h-6 w-6 ${
                      value <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Category */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}>
              Category
            </label>
            
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-lg transition-colors
                ${themeClasses.input.base} ${themeClasses.border.primary}
                focus:${themeClasses.input.focus}
              `}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          {/* Comment */}
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}>
              Your feedback
            </label>
            
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
              className={`
                w-full px-3 py-2 border rounded-lg transition-colors resize-none
                ${themeClasses.input.base} ${themeClasses.border.primary}
                focus:${themeClasses.input.focus}
              `}
              required
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={`px-4 py-2 rounded-lg transition-colors ${themeClasses.button.secondary}`}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={rating === 0 || !comment.trim()}
              className={`
                px-4 py-2 rounded-lg transition-colors flex items-center space-x-2
                ${themeClasses.button.primary}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <Send className="h-4 w-4" />
              <span>Submit Feedback</span>
            </button>
          </div>
        </form>
      </div>
    </FadeIn>
  );
};

export default FeedbackSystem;
export { FeedbackSystem, FeedbackProvider, FeedbackToast };
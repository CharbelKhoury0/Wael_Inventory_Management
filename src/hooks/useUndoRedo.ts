import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface Action {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  data: any;
  undoData?: any;
}

interface UndoRedoState<T> {
  present: T;
  past: Action[];
  future: Action[];
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
  enableToasts?: boolean;
  enableKeyboardShortcuts?: boolean;
  debounceMs?: number;
}

interface UseUndoRedoReturn<T> {
  state: T;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  executeAction: (action: Omit<Action, 'id' | 'timestamp'>, newState: T) => void;
  clearHistory: () => void;
  getHistory: () => Action[];
  jumpToAction: (actionId: string) => void;
}

export const useUndoRedo = <T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
): UseUndoRedoReturn<T> => {
  const {
    maxHistorySize = 50,
    enableToasts = true,
    enableKeyboardShortcuts = true,
    debounceMs = 300
  } = options;
  
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState<T>>({
    present: initialState,
    past: [],
    future: []
  });
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActionRef = useRef<string | null>(null);
  
  // Execute an action with undo/redo support
  const executeAction = useCallback((action: Omit<Action, 'id' | 'timestamp'>, newState: T) => {
    const fullAction: Action = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    // Clear any pending debounced actions
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce similar actions
    if (debounceMs > 0 && lastActionRef.current === action.type) {
      debounceTimeoutRef.current = setTimeout(() => {
        setUndoRedoState(prev => {
          const newPast = [...prev.past, { ...fullAction, undoData: prev.present }];
          
          // Limit history size
          if (newPast.length > maxHistorySize) {
            newPast.shift();
          }
          
          return {
            present: newState,
            past: newPast,
            future: [] // Clear future when new action is executed
          };
        });
        
        if (enableToasts) {
          toast.success(fullAction.description, {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      }, debounceMs);
    } else {
      setUndoRedoState(prev => {
        const newPast = [...prev.past, { ...fullAction, undoData: prev.present }];
        
        // Limit history size
        if (newPast.length > maxHistorySize) {
          newPast.shift();
        }
        
        return {
          present: newState,
          past: newPast,
          future: [] // Clear future when new action is executed
        };
      });
      
      if (enableToasts) {
        toast.success(fullAction.description, {
          duration: 2000,
          position: 'bottom-right'
        });
      }
    }
    
    lastActionRef.current = action.type;
  }, [maxHistorySize, enableToasts, debounceMs]);
  
  // Undo the last action
  const undo = useCallback(() => {
    setUndoRedoState(prev => {
      if (prev.past.length === 0) return prev;
      
      const lastAction = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      const newFuture = [{ ...lastAction, undoData: prev.present }, ...prev.future];
      
      if (enableToasts) {
        toast.info(`Undid: ${lastAction.description}`, {
          duration: 2000,
          position: 'bottom-right',
          action: {
            label: 'Redo',
            onClick: redo
          }
        });
      }
      
      return {
        present: lastAction.undoData,
        past: newPast,
        future: newFuture
      };
    });
  }, [enableToasts]);
  
  // Redo the next action
  const redo = useCallback(() => {
    setUndoRedoState(prev => {
      if (prev.future.length === 0) return prev;
      
      const nextAction = prev.future[0];
      const newFuture = prev.future.slice(1);
      const newPast = [...prev.past, { ...nextAction, undoData: prev.present }];
      
      if (enableToasts) {
        toast.info(`Redid: ${nextAction.description}`, {
          duration: 2000,
          position: 'bottom-right',
          action: {
            label: 'Undo',
            onClick: undo
          }
        });
      }
      
      return {
        present: nextAction.undoData,
        past: newPast,
        future: newFuture
      };
    });
  }, [enableToasts]);
  
  // Clear all history
  const clearHistory = useCallback(() => {
    setUndoRedoState(prev => ({
      present: prev.present,
      past: [],
      future: []
    }));
    
    if (enableToasts) {
      toast.info('History cleared', {
        duration: 2000,
        position: 'bottom-right'
      });
    }
  }, [enableToasts]);
  
  // Get full history
  const getHistory = useCallback((): Action[] => {
    return [...undoRedoState.past, ...undoRedoState.future];
  }, [undoRedoState]);
  
  // Jump to a specific action in history
  const jumpToAction = useCallback((actionId: string) => {
    const allActions = [...undoRedoState.past, ...undoRedoState.future];
    const actionIndex = allActions.findIndex(action => action.id === actionId);
    
    if (actionIndex === -1) return;
    
    const targetAction = allActions[actionIndex];
    const pastIndex = undoRedoState.past.findIndex(action => action.id === actionId);
    
    if (pastIndex !== -1) {
      // Action is in the past, undo to that point
      const newPast = undoRedoState.past.slice(0, pastIndex + 1);
      const undoneActions = undoRedoState.past.slice(pastIndex + 1);
      const newFuture = [...undoneActions, ...undoRedoState.future];
      
      setUndoRedoState({
        present: targetAction.undoData || undoRedoState.present,
        past: newPast,
        future: newFuture
      });
    } else {
      // Action is in the future, redo to that point
      const futureIndex = undoRedoState.future.findIndex(action => action.id === actionId);
      const redoneActions = undoRedoState.future.slice(0, futureIndex + 1);
      const newFuture = undoRedoState.future.slice(futureIndex + 1);
      const newPast = [...undoRedoState.past, ...redoneActions];
      
      setUndoRedoState({
        present: targetAction.undoData || undoRedoState.present,
        past: newPast,
        future: newFuture
      });
    }
    
    if (enableToasts) {
      toast.info(`Jumped to: ${targetAction.description}`, {
        duration: 2000,
        position: 'bottom-right'
      });
    }
  }, [undoRedoState, enableToasts]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              redo();
            } else {
              e.preventDefault();
              undo();
            }
            break;
            
          case 'y':
            e.preventDefault();
            redo();
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, undo, redo]);
  
  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    state: undoRedoState.present,
    canUndo: undoRedoState.past.length > 0,
    canRedo: undoRedoState.future.length > 0,
    undo,
    redo,
    executeAction,
    clearHistory,
    getHistory,
    jumpToAction
  };
};

// Hook for managing multiple undo/redo contexts
export const useMultipleUndoRedo = <T extends Record<string, any>>(
  initialStates: T,
  options: UseUndoRedoOptions = {}
) => {
  const contexts = Object.keys(initialStates).reduce((acc, key) => {
    acc[key] = useUndoRedo(initialStates[key], options);
    return acc;
  }, {} as Record<keyof T, UseUndoRedoReturn<T[keyof T]>>);
  
  const undoAll = useCallback(() => {
    Object.values(contexts).forEach(context => {
      if (context.canUndo) {
        context.undo();
      }
    });
  }, [contexts]);
  
  const redoAll = useCallback(() => {
    Object.values(contexts).forEach(context => {
      if (context.canRedo) {
        context.redo();
      }
    });
  }, [contexts]);
  
  const clearAllHistory = useCallback(() => {
    Object.values(contexts).forEach(context => {
      context.clearHistory();
    });
  }, [contexts]);
  
  return {
    contexts,
    undoAll,
    redoAll,
    clearAllHistory
  };
};

export default useUndoRedo;
export type { Action, UndoRedoState, UseUndoRedoOptions, UseUndoRedoReturn
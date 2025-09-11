import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void> | void;
  delay?: number;
  enabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  debounceDelay?: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: Error | null;
  retryCount: number;
}

export const useAutoSave = ({
  data,
  onSave,
  delay = 30000, // 30 seconds
  enabled = true,
  onSuccess,
  onError,
  debounceDelay = 1000, // 1 second
  maxRetries = 3,
  retryDelay = 5000 // 5 seconds
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<any>();
  const stateRef = useRef<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null,
    retryCount: 0
  });
  
  const [state, setState] = useState<AutoSaveState>(stateRef.current);
  
  const updateState = useCallback((updates: Partial<AutoSaveState>) => {
    stateRef.current = { ...stateRef.current, ...updates };
    setState(stateRef.current);
  }, []);
  
  const performSave = useCallback(async (dataToSave: any, isRetry = false) => {
    if (!enabled || stateRef.current.isSaving) return;
    
    updateState({ isSaving: true, error: null });
    
    try {
      await onSave(dataToSave);
      
      updateState({
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        retryCount: 0
      });
      
      lastDataRef.current = dataToSave;
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (!isRetry) {
        toast.success('Changes saved automatically', {
          duration: 2000,
          position: 'bottom-right'
        });
      }
      
    } catch (error) {
      const err = error as Error;
      
      updateState({
        isSaving: false,
        error: err,
        retryCount: stateRef.current.retryCount + 1
      });
      
      if (onError) {
        onError(err);
      }
      
      // Retry logic
      if (stateRef.current.retryCount < maxRetries) {
        toast.error(`Auto-save failed. Retrying in ${retryDelay / 1000} seconds...`, {
          duration: retryDelay,
          position: 'bottom-right'
        });
        
        retryTimeoutRef.current = setTimeout(() => {
          performSave(dataToSave, true);
        }, retryDelay);
      } else {
        toast.error('Auto-save failed after multiple attempts. Please save manually.', {
          duration: 10000,
          position: 'bottom-right',
          action: {
            label: 'Retry',
            onClick: () => {
              updateState({ retryCount: 0 });
              performSave(dataToSave);
            }
          }
        });
      }
    }
  }, [enabled, onSave, onSuccess, onError, maxRetries, retryDelay, updateState]);
  
  const scheduleAutoSave = useCallback((dataToSave: any) => {
    if (!enabled) return;
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the auto-save to avoid too frequent saves
    debounceTimeoutRef.current = setTimeout(() => {
      timeoutRef.current = setTimeout(() => {
        performSave(dataToSave);
      }, delay);
    }, debounceDelay);
  }, [enabled, delay, debounceDelay, performSave]);
  
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    performSave(data);
  }, [data, performSave]);
  
  const resetAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    updateState({
      isSaving: false,
      hasUnsavedChanges: false,
      error: null,
      retryCount: 0
    });
    
    lastDataRef.current = data;
  }, [data, updateState]);
  
  // Monitor data changes
  useEffect(() => {
    if (!enabled) return;
    
    const hasChanges = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
    
    if (hasChanges && lastDataRef.current !== undefined) {
      updateState({ hasUnsavedChanges: true });
      scheduleAutoSave(data);
    }
  }, [data, enabled, scheduleAutoSave, updateState]);
  
  // Initialize last data reference
  useEffect(() => {
    if (lastDataRef.current === undefined) {
      lastDataRef.current = data;
    }
  }, [data]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  // Save on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stateRef.current.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && stateRef.current.hasUnsavedChanges) {
        // Attempt to save when page becomes hidden
        navigator.sendBeacon && navigator.sendBeacon('/api/auto-save', JSON.stringify(data));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [data]);
  
  return {
    ...state,
    saveNow,
    resetAutoSave
  };
};

// Hook for form auto-save with additional form-specific features
export const useFormAutoSave = ({
  formData,
  onSave,
  fieldName,
  ...options
}: UseAutoSaveOptions & {
  formData: Record<string, any>;
  fieldName?: string;
}) => {
  const autoSave = useAutoSave({
    data: formData,
    onSave,
    ...options
  });
  
  const saveField = useCallback(async (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    await onSave(updatedData);
  }, [formData, onSave]);
  
  return {
    ...autoSave,
    saveField
  };
};

// Hook for draft management
export const useDraftManager = ({
  data,
  draftKey,
  onSave,
  autoSaveInterval = 10000, // 10 seconds for drafts
  ...options
}: UseAutoSaveOptions & {
  draftKey: string;
}) => {
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  
  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDrafts = localStorage.getItem('form-drafts');
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts);
        setDrafts(parsedDrafts);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  }, []);
  
  const saveDraft = useCallback((draftData: any) => {
    try {
      const updatedDrafts = {
        ...drafts,
        [draftKey]: {
          data: draftData,
          timestamp: new Date().toISOString()
        }
      };
      
      setDrafts(updatedDrafts);
      localStorage.setItem('form-drafts', JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [drafts, draftKey]);
  
  const loadDraft = useCallback(() => {
    return drafts[draftKey]?.data;
  }, [drafts, draftKey]);
  
  const deleteDraft = useCallback(() => {
    try {
      const updatedDrafts = { ...drafts };
      delete updatedDrafts[draftKey];
      
      setDrafts(updatedDrafts);
      localStorage.setItem('form-drafts', JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }, [drafts, draftKey]);
  
  const hasDraft = Boolean(drafts[draftKey]);
  const draftTimestamp = drafts[draftKey]?.timestamp;
  
  const autoSave = useAutoSave({
    data,
    onSave: saveDraft,
    delay: autoSaveInterval,
    ...options
  });
  
  return {
    ...autoSave,
    loadDraft,
    deleteDraft,
    hasDraft,
    draftTimestamp,
    saveFinal: onSave
  };
};

export default useAutoSave;
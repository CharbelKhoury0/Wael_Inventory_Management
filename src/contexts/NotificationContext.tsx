import React, { createContext, useContext, ReactNode } from 'react';
import { toast, Toaster } from 'sonner';

interface NotificationContextType {
  showSuccess: (message: string, description?: string) => void;
  showError: (message: string, description?: string) => void;
  showWarning: (message: string, description?: string) => void;
  showInfo: (message: string, description?: string) => void;
  showLoading: (message: string) => string | number;
  dismissToast: (id: string | number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  };

  const showError = (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    });
  };

  const showWarning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    });
  };

  const showInfo = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismissToast = (id: string | number) => {
    toast.dismiss(id);
  };

  const value: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismissToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        expand={false}
        visibleToasts={5}
      />
    </NotificationContext.Provider>
  );
};
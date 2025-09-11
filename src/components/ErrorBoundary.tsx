import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // In a real application, you would send this to an error reporting service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Simulate error logging to external service
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous'
    };
    
    // In production, send to error tracking service like Sentry, LogRocket, etc.
    console.log('Error report:', errorReport);
    
    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingErrors.push(errorReport);
      // Keep only last 10 errors
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('errorReports', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Failed to store error report:', e);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false
      });
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    // Clear error state and navigate to home
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
    
    // Reset localStorage page state
    localStorage.removeItem('current-page');
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  private copyErrorDetails = async () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorText = `
Error ID: ${errorId}
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
`;
    
    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('chunk') || message.includes('loading')) {
      return 'low';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'high';
    }
    
    if (message.includes('memory') || message.includes('maximum')) {
      return 'critical';
    }
    
    return 'medium';
  };

  private getErrorSuggestion = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Please check your internet connection and try again.';
    }
    
    if (message.includes('chunk') || message.includes('loading')) {
      return 'There was an issue loading part of the application. Refreshing should resolve this.';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'You may not have permission to access this resource. Please contact your administrator.';
    }
    
    if (message.includes('memory') || message.includes('maximum')) {
      return 'The application is using too much memory. Please close other tabs and refresh.';
    }
    
    return 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId, showDetails, copied } = this.state;
      const severity = error ? this.getErrorSeverity(error) : 'medium';
      const suggestion = error ? this.getErrorSuggestion(error) : '';
      const canRetry = this.retryCount < this.maxRetries;
      
      const severityColors = {
        low: 'bg-blue-50 border-blue-200 text-blue-800',
        medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        high: 'bg-orange-50 border-orange-200 text-orange-800',
        critical: 'bg-red-50 border-red-200 text-red-800'
      };

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-red-500 text-white p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Oops! Something went wrong</h1>
                    <p className="text-red-100 mt-1">
                      We encountered an unexpected error in the application.
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Error Info */}
                <div className="mb-6">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${severityColors[severity]} mb-3`}>
                    <Bug className="h-4 w-4 mr-2" />
                    {severity.charAt(0).toUpperCase() + severity.slice(1)} Severity
                  </div>
                  
                  <p className="text-gray-700 mb-4">{suggestion}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Error ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-200 px-2 py-1 rounded font-mono">
                          {errorId}
                        </code>
                        <button
                          onClick={this.copyErrorDetails}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Copy error details"
                        >
                          {copied ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="text-sm text-gray-600">
                        <strong>Error:</strong> {error.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  {canRetry && (
                    <button
                      onClick={this.handleRetry}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <RefreshCw className="h-5 w-5" />
                      Try Again ({this.maxRetries - this.retryCount} attempts left)
                    </button>
                  )}
                  
                  <button
                    onClick={this.handleReload}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Reload Page
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Home className="h-5 w-5" />
                    Go Home
                  </button>
                </div>

                {/* Technical Details Toggle */}
                <div className="border-t pt-4">
                  <button
                    onClick={this.toggleDetails}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Bug className="h-4 w-4" />
                    {showDetails ? 'Hide' : 'Show'} Technical Details
                  </button>
                  
                  {showDetails && (
                    <div className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-64">
                      <div className="text-sm font-mono space-y-2">
                        {error && (
                          <>
                            <div>
                              <strong className="text-red-400">Error Message:</strong>
                              <div className="ml-4 text-gray-300">{error.message}</div>
                            </div>
                            
                            {error.stack && (
                              <div>
                                <strong className="text-red-400">Stack Trace:</strong>
                                <pre className="ml-4 text-gray-300 whitespace-pre-wrap text-xs">
                                  {error.stack}
                                </pre>
                              </div>
                            )}
                          </>
                        )}
                        
                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <strong className="text-red-400">Component Stack:</strong>
                            <pre className="ml-4 text-gray-300 whitespace-pre-wrap text-xs">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Help Text */}
                <div className="mt-6 text-sm text-gray-500">
                  <p>
                    If this error persists, please contact support with the Error ID above.
                    Our team will investigate and resolve the issue as quickly as possible.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>
                Error occurred at {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
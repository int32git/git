'use client';

import React, { ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-lg border border-destructive/20 bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-destructive">Something went wrong</h2>
            <div className="mb-4 text-muted-foreground">
              <p>An error occurred in the application.</p>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                Technical Details
              </summary>
              <div className="mt-2 max-h-60 overflow-auto rounded-md bg-muted p-2 text-xs">
                <p className="font-medium">Error: {this.state.error?.toString()}</p>
                <pre className="mt-2 text-xs text-muted-foreground">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
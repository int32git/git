'use client';

import React, { ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string; // Component or section name for better error tracking
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
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
    
    // Track error in console
    console.error(`Error caught by ErrorBoundary${this.props.name ? ` in ${this.props.name}` : ''}:`, error, errorInfo);
    
    // Call onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset the error boundary when props change if enabled
    if (this.props.resetOnPropsChange && 
        this.state.hasError && 
        prevProps !== this.props) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-[300px] flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border border-destructive/20 shadow-lg">
            <CardHeader className="text-destructive bg-destructive/5">
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-muted-foreground">
                <p className="mb-4">We encountered an error while rendering this component. Please try again or contact support if the issue persists.</p>
                {this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-primary">
                      Technical Details
                    </summary>
                    <div className="mt-2 max-h-60 overflow-auto rounded-md bg-muted p-2 text-xs">
                      <p className="font-medium">Error: {this.state.error.toString()}</p>
                      <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={this.resetErrorBoundary}
                className="flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex items-center"
              >
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'> = {}
) {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps} name={displayName}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return ComponentWithErrorBoundary;
}

export default ErrorBoundary; 
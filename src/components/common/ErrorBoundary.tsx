import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-xl border border-border bg-card text-center space-y-4 shadow-overlay">
            <div className="h-12 w-12 rounded-lg bg-danger-subtle border border-danger-border text-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-h2 font-semibold text-foreground tracking-tight">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h2>
              <p className="text-caption text-muted-foreground leading-relaxed">
                An unexpected interface error occurred. You can reload the page to restore state from your local database.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-md bg-surface-raised border border-border text-left font-mono text-caption text-danger-foreground max-h-36 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

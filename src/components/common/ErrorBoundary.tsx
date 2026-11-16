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
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl border border-rose-500/30 bg-slate-900/90 text-center space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>
            <Button
              onClick={this.handleReset}
              size="sm"
              className="flex items-center gap-2 mx-auto text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reload Application</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

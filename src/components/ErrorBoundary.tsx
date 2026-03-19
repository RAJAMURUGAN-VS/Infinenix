import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background text-foreground">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-semibold text-destructive">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm text-center">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

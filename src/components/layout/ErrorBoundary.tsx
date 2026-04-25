import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // TODO: could add a call to an error tracking service like Sentry
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

interface FallbackProps {
  error: Error | null;
  resetErrorBoundary?: () => void;
}

export const DefaultErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const { t } = useTranslation();

  const handleRefresh = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-background/50 rounded-xl border border-border">
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        {t('common.error_occurred', 'Something went wrong')}
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        {error?.message || t('common.error_unexpected', 'An unexpected error occurred. Please try again later.')}
      </p>
      <Button onClick={handleRefresh} variant="default" className="gap-2">
        <RefreshCcw className="w-4 h-4" />
        {t('common.refresh', 'Refresh Page')}
      </Button>
    </div>
  );
};

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const { t } = useTranslation();

  let errorMessage = t('common.error_unexpected', 'An unexpected error occurred. Please try again later.');

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}: ${error.data}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <DefaultErrorFallback
      error={new Error(errorMessage)}
      resetErrorBoundary={() => window.location.reload()}
    />
  );
};

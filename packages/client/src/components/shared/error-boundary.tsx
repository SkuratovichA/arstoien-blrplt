import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@arstoien/shared-ui';

interface ErrorBoundaryProps {
  children: React.ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t('Something went wrong')}</h1>
        <p className="text-muted-foreground mb-4">
          {t('An unexpected error occurred. Please try again.')}
        </p>
        {error && (
          <pre className="bg-muted mb-4 rounded-lg p-4 text-left text-sm">{error.message}</pre>
        )}
        <Button onClick={() => window.location.reload()}>{t('Reload page')}</Button>
      </div>
    </div>
  );
}

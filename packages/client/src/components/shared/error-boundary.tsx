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

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
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
        <h1 className="mb-4 text-4xl font-bold">{t('error.title')}</h1>
        <p className="mb-4 text-muted-foreground">{t('error.description')}</p>
        {error && (
          <pre className="mb-4 rounded-lg bg-muted p-4 text-left text-sm">
            {error.message}
          </pre>
        )}
        <Button onClick={() => window.location.reload()}>
          {t('error.reload')}
        </Button>
      </div>
    </div>
  );
}

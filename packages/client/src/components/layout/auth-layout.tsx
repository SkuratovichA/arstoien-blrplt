import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { env } from '@lib/env';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 px-4">
      <div className="mb-8">
        <Link to="/" className="text-2xl font-bold">
          {env.appName}
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

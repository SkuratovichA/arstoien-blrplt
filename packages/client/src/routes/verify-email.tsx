import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client/react';
import { MainLayout } from '../components/layout/main-layout';
import { Button } from '@arstoien/shared-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@arstoien/shared-ui';
import { VERIFY_EMAIL, RESEND_VERIFICATION_EMAIL } from '../graphql/auth.graphql';
import { useAuthStore, isEmailVerified } from '../lib/auth-store';
import toast from 'react-hot-toast';
import { requireAuth, type AuthGuardContext } from '../lib/auth-guard';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/verify-email')({
  beforeLoad: ({ context }) => {
    // Only require auth if there's no token (user accessing the page directly)
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const token = params.get('token');

    if (!token) {
      requireAuth(context as AuthGuardContext);
    }
  },
  component: VerifyEmail,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
});

function VerifyEmail() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const { user, setUser } = useAuthStore();
  const [verifyEmail, { loading: verifying }] = useMutation(VERIFY_EMAIL);
  const [resendEmail, { loading: resending }] = useMutation(RESEND_VERIFICATION_EMAIL);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    try {
      const result = await verifyEmail({
        variables: { token },
      });

      if (result.data?.verifyEmail?.success) {
        if (user) {
          setUser({ ...user, emailVerifiedAt: new Date().toISOString() });
        }

        setIsVerified(true);
        toast.success(t('Email verified successfully'));

        // If user is not logged in, redirect to login
        if (!user) {
          setTimeout(() => {
            navigate({ to: '/login', search: {} });
          }, 2000);
        }
      } else {
        toast.error(result.data?.verifyEmail?.message ?? t('Email verification failed'));
      }
    } catch {
      toast.error(t('Email verification failed'));
    }
  };

  useEffect(() => {
    if (token) {
      handleVerify();
    }
  }, [handleVerify, token]);

  const handleResend = async () => {
    try {
      await resendEmail();
      toast.success(t('Verification email sent'));
    } catch {
      toast.error(t('Failed to resend verification email'));
    }
  };

  if ((user && isEmailVerified(user)) || isVerified) {
    return (
      <MainLayout>
        <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t('Email verified')}</CardTitle>
              <CardDescription>{t('Your email has been successfully verified')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => {
                  if (user) {
                    navigate({ to: '/dashboard', search: {} });
                  } else {
                    navigate({ to: '/login', search: {} });
                  }
                }}
              >
                {user ? t('Go to dashboard') : t('Go to login')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // If there's a token, show verifying message
  if (token && verifying) {
    return (
      <MainLayout>
        <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t('Verifying email...')}</CardTitle>
              <CardDescription>
                {t('Please wait while we verify your email address')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Show resend verification form only if user is logged in and email is not verified
  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t('Email verification')}</CardTitle>
              <CardDescription>{t('Please log in to resend verification email')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate({ to: '/login', search: {} })}>
                {t('Go to login')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('Verify your email')}</CardTitle>
            <CardDescription>{t('Please verify your email address to continue')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {t('Check your email: {{email}}', { email: user?.email })}
            </p>
            <Button
              className="w-full"
              onClick={handleResend}
              disabled={resending || verifying}
              variant="outline"
            >
              {resending ? t('Loading...') : t('Resend verification email')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

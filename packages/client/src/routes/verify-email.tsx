import { useMutation } from '@apollo/client/react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blrplt/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../components/layout/main-layout';
import { RESEND_VERIFICATION_EMAIL, VERIFY_EMAIL } from '../graphql/auth.graphql';
import type { AuthGuardContext } from '../lib/auth-guard';
import { requireAuth } from '../lib/auth-guard';
import { isEmailVerified, useAuthStore } from '../lib/auth-store';

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

  useEffect(() => {
    if (token) {
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
            toast.success(t('auth.verifyEmail.success'));

            // If user is not logged in, redirect to login
            if (!user) {
              setTimeout(() => {
                navigate({ to: '/login', search: {} });
              }, 2000);
            }
          } else {
            toast.error(result.data?.verifyEmail?.message ?? t('auth.verifyEmail.error'));
          }
        } catch {
          toast.error(t('auth.verifyEmail.error'));
        }
      };

      handleVerify();
    }
  }, [token, verifyEmail, user, setUser, navigate, t]);

  const handleResend = async () => {
    try {
      await resendEmail();
      toast.success(t('auth.verifyEmail.resendSuccess'));
    } catch {
      toast.error(t('auth.verifyEmail.resendError'));
    }
  };

  if ((user && isEmailVerified(user)) || isVerified) {
    return (
      <MainLayout>
        <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t('auth.verifyEmail.verified')}</CardTitle>
              <CardDescription>{t('auth.verifyEmail.verifiedDescription')}</CardDescription>
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
                {user ? t('auth.verifyEmail.goToDashboard') : t('auth.verifyEmail.goToLogin')}
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
              <CardTitle>{t('auth.verifyEmail.verifying')}</CardTitle>
              <CardDescription>{t('auth.verifyEmail.verifyingDescription')}</CardDescription>
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
              <CardTitle>{t('auth.verifyEmail.loginRequiredTitle')}</CardTitle>
              <CardDescription>{t('auth.verifyEmail.loginRequiredDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate({ to: '/login', search: {} })}>
                {t('auth.verifyEmail.goToLogin')}
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
            <CardTitle>{t('auth.verifyEmail.title')}</CardTitle>
            <CardDescription>{t('auth.verifyEmail.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {t('auth.verifyEmail.checkEmail', { email: user?.email })}
            </p>
            <Button
              className="w-full"
              onClick={handleResend}
              disabled={resending || verifying}
              variant="outline"
            >
              {resending ? t('common.loading') : t('auth.verifyEmail.resendButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

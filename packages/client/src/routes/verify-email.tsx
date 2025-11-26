import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client/react';
import { MainLayout } from '../components/layout/main-layout';
import { Button } from '@arstoien/shared-ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@arstoien/shared-ui';
import {
  VERIFY_EMAIL,
  RESEND_VERIFICATION_EMAIL,
} from '../graphql/auth.graphql';
import { useAuthStore, isEmailVerified } from '../lib/auth-store';
import toast from 'react-hot-toast';
import { requireAuth, type AuthGuardContext } from '../lib/auth-guard';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/verify-email')({
  beforeLoad: ({ context }) => {
    requireAuth(context as AuthGuardContext);
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
  const [resendEmail, { loading: resending }] = useMutation(
    RESEND_VERIFICATION_EMAIL
  );
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (token) {
      handleVerify();
    }
  }, [token]);

  const handleVerify = async () => {
    try {
      await verifyEmail({
        variables: { token },
      });

      if (user) {
        setUser({ ...user, emailVerifiedAt: new Date().toISOString() });
      }

      setIsVerified(true);
      toast.success(t('auth.verifyEmail.success'));
    } catch (error) {
      toast.error(t('auth.verifyEmail.error'));
    }
  };

  const handleResend = async () => {
    try {
      await resendEmail();
      toast.success(t('auth.verifyEmail.resendSuccess'));
    } catch (error) {
      toast.error(t('auth.verifyEmail.resendError'));
    }
  };

  if (isEmailVerified(user) || isVerified) {
    return (
      <MainLayout>
        <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t('auth.verifyEmail.verified')}</CardTitle>
              <CardDescription>
                {t('auth.verifyEmail.verifiedDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>
                {t('auth.verifyEmail.goToDashboard')}
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
            <CardDescription>
              {t('auth.verifyEmail.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('auth.verifyEmail.checkEmail', { email: user?.email })}
            </p>
            <Button
              className="w-full"
              onClick={handleResend}
              disabled={resending || verifying}
              variant="outline"
            >
              {resending
                ? t('common.loading')
                : t('auth.verifyEmail.resendButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

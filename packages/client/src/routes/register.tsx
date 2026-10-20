import { useMutation } from '@apollo/client/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@blrplt/ui';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { RegisterForm } from '../components/forms/register-form';
import type { RegisterFormData } from '../components/forms/register-form-schema';
import { AuthLayout } from '../components/layout/auth-layout';
import { REGISTER } from '../graphql/auth.graphql.ts';
import type { AuthGuardContext } from '../lib/auth-guard';
import { requireGuest } from '../lib/auth-guard';

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    requireGuest(context as AuthGuardContext);
  },
  component: Register,
});

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [register] = useMutation(REGISTER);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register({
        variables: {
          input: data,
        },
      });

      if (result.data?.register.success) {
        toast.success(result.data.register.message ?? t('auth.register.success'));
        navigate({ to: '/login' });
      }
    } catch {
      toast.error(t('auth.register.error'));
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.register.title')}</CardTitle>
          <CardDescription>{t('auth.register.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm onSubmit={onSubmit} />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-sm">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-foreground hover:underline">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client/react';
import { Former } from '@arstoien/former';
import { AuthLayout } from '../components/layout/auth-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@arstoien/shared-ui';
import { REGISTER } from '../graphql/auth.graphql.ts';
import toast from 'react-hot-toast';
import { requireGuest, type AuthGuardContext } from '../lib/auth-guard';
import { createFormComponentOverrides } from '../components/forms/form-component-overrides';
import {
  createRegisterFormConfig,
  type RegisterFormData,
} from '../components/forms/register-form-config';

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
        toast.success(result.data.register.message ?? t('Registration successful'));
        navigate({ to: '/login' });
      }
    } catch {
      toast.error(t('Registration failed'));
    }
  };

  // Create form configuration
  const formConfig = createRegisterFormConfig({
    t,
    onSubmit,
  });

  // Create component overrides
  const componentOverrides = createFormComponentOverrides<RegisterFormData>(t);

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('Register')}</CardTitle>
          <CardDescription>{t('Create a new account')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Former<RegisterFormData> config={formConfig} componentOverrides={componentOverrides} />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-sm">
            {t('Already have an account?')}{' '}
            <Link to="/login" className="text-foreground hover:underline">
              {t('Sign in')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

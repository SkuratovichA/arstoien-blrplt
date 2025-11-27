import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { AuthLayout } from '../../components/layout/auth-layout';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  PasswordInput,
} from '@arstoien/shared-ui';
import { CheckCircle } from 'lucide-react';
import { SET_PASSWORD_WITH_TOKEN } from '@graphql/auth.graphql.ts';
import { useAuthStore } from '@lib/auth-store.ts';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/auth/set-password')({
  component: SetPassword,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
});

const setPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

function SetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const { setUser } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);

  const [setPassword, { loading }] = useMutation(SET_PASSWORD_WITH_TOKEN);

  const form = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SetPasswordFormData) => {
    if (!token) {
      toast.error(t('Invalid verification token'));
      return;
    }

    try {
      const result = await setPassword({
        variables: {
          input: {
            token,
            password: data.password,
          },
        },
      });

      if (result.data?.setPasswordWithToken) {
        const { accessToken, refreshToken, user } = result.data.setPasswordWithToken;

        // Store tokens if provided
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Update auth store
        setUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
          createdAt: user.createdAt,
        });

        setIsSuccess(true);
        toast.success(t('Password set successfully'));

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate({ to: '/dashboard', search: {} });
        }, 2000);
      }
    } catch (error) {
      console.error('Set password error:', error);
      const errorMessage = error instanceof Error ? error.message : t('Failed to set password');
      toast.error(errorMessage);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              {t('Success!')}
            </CardTitle>
            <CardDescription>
              {t('Your password has been set successfully. Redirecting to dashboard...')}
            </CardDescription>
          </CardHeader>
        </Card>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <CardTitle>{t('Invalid Link')}</CardTitle>
            <CardDescription>
              {t('This verification link is invalid or has expired.')}
            </CardDescription>
          </CardHeader>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('Set Your Password')}</CardTitle>
          <CardDescription>{t('Create a strong password to secure your account')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Password')}</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder={t('Enter your password')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Confirm Password')}</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder={t('Confirm your password')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Setting password...') : t('Set Password')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

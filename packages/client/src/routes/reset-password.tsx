import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client/react';
import { AuthLayout } from '@components/layout';
import { Button } from '@arstoien/shared-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@arstoien/shared-ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@arstoien/shared-ui';
import { PasswordInput } from '@arstoien/shared-ui';
import { RESET_PASSWORD } from '../graphql/auth.graphql';
import toast from 'react-hot-toast';
import { requireGuest, type AuthGuardContext } from '../lib/auth-guard';

export const Route = createFileRoute('/reset-password')({
  beforeLoad: ({ context }) => {
    requireGuest(context as AuthGuardContext);
  },
  component: ResetPassword,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPassword({
        variables: {
          input: {
            token,
            newPassword: data.password,
          },
        },
      });

      toast.success(t('Password reset successful'));
      navigate({ to: '/login' });
    } catch {
      toast.error(t('Failed to reset password'));
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('Reset password')}</CardTitle>
          <CardDescription>{t('Enter your new password')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('New password')}</FormLabel>
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
                    <FormLabel>{t('Confirm password')}</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder={t('Confirm your password')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Loading...') : t('Reset password')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client/react';
import { AuthLayout } from '../components/layout/auth-layout';
import { Button } from '@arstoien/shared-ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@arstoien/shared-ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@arstoien/shared-ui';
import { Input } from '@arstoien/shared-ui';
import { VERIFY_TWO_FACTOR } from '../graphql/auth.graphql';
import { useAuthStore } from '../lib/auth-store';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/two-factor')({
  component: TwoFactor,
});

const twoFactorSchema = z.object({
  code: z.string().length(6),
});

type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

function TwoFactor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [verifyTwoFactor, { loading }] = useMutation(VERIFY_TWO_FACTOR as Parameters<typeof useMutation>[0]);

  const form = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = async (data: TwoFactorFormData) => {
    try {
      const result = await verifyTwoFactor({
        variables: {
          input: { code: data.code },
        },
      });

      const responseData = result.data as { verifyTwoFactor: { user: { id: string; email: string; firstName: string; lastName: string; emailVerifiedAt?: string | null; createdAt: string } } } | null;
      if (responseData?.verifyTwoFactor.user) {
        const user = responseData.verifyTwoFactor.user;
        setUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerifiedAt: user.emailVerifiedAt,
          isTwoFactorEnabled: true, // User just verified 2FA
          createdAt: user.createdAt,
        });
        toast.success(t('auth.twoFactor.success'));
        navigate({ to: '/dashboard' });
      }
    } catch (error) {
      toast.error(t('auth.twoFactor.error'));
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.twoFactor.title')}</CardTitle>
          <CardDescription>{t('auth.twoFactor.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.twoFactor.codeLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('auth.twoFactor.codePlaceholder')}
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('auth.twoFactor.submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

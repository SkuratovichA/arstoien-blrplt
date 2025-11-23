import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client';
import { AuthLayout } from '../components/layout/auth-layout';
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
  Input,
} from '@arstoien/shared-ui';
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
  const [verifyTwoFactor, { loading }] = useMutation(VERIFY_TWO_FACTOR);

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

      if (result.data?.verifyTwoFactor.user) {
        setUser(result.data.verifyTwoFactor.user);
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

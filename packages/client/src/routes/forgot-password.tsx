import { useMutation } from '@apollo/client/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@blrplt/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { AuthLayout } from '../components/layout/auth-layout';
import { FORGOT_PASSWORD } from '../graphql/auth.graphql';
import type { AuthGuardContext } from '../lib/auth-guard';
import { requireGuest } from '../lib/auth-guard';

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: ({ context }) => {
    requireGuest(context as AuthGuardContext);
  },
  component: ForgotPassword,
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function ForgotPassword() {
  const { t } = useTranslation();
  const [forgotPassword, { loading }] = useMutation(FORGOT_PASSWORD);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword({
        variables: {
          input: data,
        },
      });

      setEmailSent(true);
      toast.success(t('auth.forgotPassword.success'));
    } catch {
      toast.error(t('auth.forgotPassword.error'));
    }
  };

  if (emailSent) {
    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <CardTitle>{t('auth.forgotPassword.emailSent')}</CardTitle>
            <CardDescription>{t('auth.forgotPassword.checkEmail')}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/login" className="text-muted-foreground hover:text-foreground text-sm">
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </CardFooter>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.forgotPassword.title')}</CardTitle>
          <CardDescription>{t('auth.forgotPassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.fields.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('auth.fields.emailPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('auth.forgotPassword.submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-muted-foreground hover:text-foreground text-sm">
            {t('auth.forgotPassword.backToLogin')}
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

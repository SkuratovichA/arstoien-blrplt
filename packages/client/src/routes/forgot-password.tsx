import { createFileRoute, Link } from '@tanstack/react-router';
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
  CardFooter,
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
import { FORGOT_PASSWORD } from '../graphql/auth.graphql';
import toast from 'react-hot-toast';
import { requireGuest, type AuthGuardContext } from '../lib/auth-guard';
import { useState } from 'react';

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
      toast.success(t('Password reset email sent'));
    } catch {
      toast.error(t('Failed to send password reset email'));
    }
  };

  if (emailSent) {
    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <CardTitle>{t('Email sent')}</CardTitle>
            <CardDescription>
              {t('Check your email for password reset instructions')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/login" className="text-muted-foreground hover:text-foreground text-sm">
              {t('Back to login')}
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
          <CardTitle>{t('Forgot password')}</CardTitle>
          <CardDescription>
            {t('Enter your email to receive a password reset link')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('Enter your email')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Loading...') : t('Send reset link')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-muted-foreground hover:text-foreground text-sm">
            {t('Back to login')}
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

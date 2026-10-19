import { useLazyQuery, useMutation } from '@apollo/client/react';
import { tryCatch } from '@arstoien/former';
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
  PasswordInput,
} from '@arstoien/shared-ui';
import { AuthLayout } from '@components/layout';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { CHECK_OTP_ENABLED, LOGIN, REQUEST_OTP_LOGIN } from '../graphql/auth.graphql.ts';
import type { AuthGuardContext } from '../lib/auth-guard';
import { requireGuest } from '../lib/auth-guard';
import { useAuthStore } from '../lib/auth-store';

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    requireGuest(context as AuthGuardContext);
  },
  component: Login,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [emailEntered, setEmailEntered] = useState(false);

  const [login, { loading }] = useMutation(LOGIN);
  const [checkOtpEnabled, { loading: checkingOtp }] = useLazyQuery(CHECK_OTP_ENABLED);
  const [requestOtpLogin, { loading: requestingOtp }] = useMutation(REQUEST_OTP_LOGIN);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleEmailSubmit = async () => {
    const email = form.getValues('email');
    if (!email) return;

    const [, error] = await tryCatch(
      (async () => {
        // Check if OTP is enabled for this email
        const result = await checkOtpEnabled({ variables: { email } });

        if (result.error) {
          console.error('OTP check GraphQL error:', result.error);
          throw result.error;
        }

        if (result.data?.isOtpEnabled) {
          // OTP is enabled, request OTP code
          const otpResult = await requestOtpLogin({
            variables: { email },
          });

          if (otpResult.data?.requestOtpLogin?.success) {
            toast.success(t('OTP code sent to your email'));
            // Navigate to OTP verification page
            navigate({
              to: '/verify-otp',
              search: { email },
            });
          } else {
            const errorMsg = otpResult.data?.requestOtpLogin?.message ?? t('Failed to send OTP');
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }
        } else {
          // OTP is not enabled, show password field
          setShowPassword(true);
          setEmailEntered(true);
        }
      })()
    );

    if (error) {
      console.error('Email check error details:', error);
      // Show error to user but still allow password login as fallback
      toast.error(t('Could not check OTP status. Defaulting to password login.'));
      setShowPassword(true);
      setEmailEntered(true);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    if (!emailEntered) {
      // First step: check email for OTP
      await handleEmailSubmit();
      return;
    }

    // Traditional password login - validate password is provided
    if (!data.password) {
      form.setError('password', { message: t('Password is required') });
      return;
    }

    try {
      const result = await login({
        variables: {
          input: {
            email: data.email,
            password: data.password,
          },
        },
      });

      if (result.data?.login) {
        const { accessToken, refreshToken, user } = result.data.login;

        // Store tokens if needed (server might be setting httpOnly cookies)
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        setUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerifiedAt: user.emailVerifiedAt,
          createdAt: user.createdAt,
        });
        toast.success(t('Login successful'));
        navigate({ to: '/dashboard', search: {} });
      } else {
        throw new Error(t('Login failed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : t('Login failed');
      toast.error(errorMessage);
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('Login')}</CardTitle>
          <CardDescription>{t('Sign in to your account')}</CardDescription>
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
                      <Input
                        type="email"
                        placeholder={t('Enter your email')}
                        disabled={checkingOtp || requestingOtp || emailEntered}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showPassword && (
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
              )}

              {showPassword && (
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    {t('Forgot password?')}
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || checkingOtp || requestingOtp}
              >
                {loading
                  ? t('Signing in...')
                  : checkingOtp
                    ? t('Checking authentication method...')
                    : requestingOtp
                      ? t('Sending verification code...')
                      : showPassword
                        ? t('Sign in')
                        : t('Continue')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-sm">
            {t("Don't have an account?")}{' '}
            <Link to="/register" className="text-foreground hover:underline">
              {t('Sign up')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

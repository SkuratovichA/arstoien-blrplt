import { useLazyQuery, useMutation } from '@apollo/client/react';
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
} from '@blrplt/ui';
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

    try {
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
          toast.success(t('auth.login.otpSent'));
          // Navigate to OTP verification page
          navigate({
            to: '/verify-otp',
            search: { email },
          });
        } else {
          const errorMsg = otpResult.data?.requestOtpLogin?.message ?? t('auth.otp.sendError');
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      } else {
        // OTP is not enabled, show password field
        setShowPassword(true);
        setEmailEntered(true);
      }
    } catch (error) {
      console.error('Email check error details:', error);
      // Show error to user but still allow password login as fallback
      toast.error(t('auth.login.otpStatusError'));
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
      form.setError('password', { message: t('auth.login.passwordRequired') });
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
        toast.success(t('auth.login.success'));
        navigate({ to: '/dashboard', search: {} });
      } else {
        throw new Error(t('auth.login.error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : t('auth.login.error');
      toast.error(errorMessage);
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.login.title')}</CardTitle>
          <CardDescription>{t('auth.login.description')}</CardDescription>
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
                      <FormLabel>{t('auth.fields.password')}</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder={t('auth.fields.passwordPlaceholder')}
                          {...field}
                        />
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
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || checkingOtp || requestingOtp}
              >
                {loading
                  ? t('auth.login.submitting')
                  : checkingOtp
                    ? t('auth.login.checking')
                    : requestingOtp
                      ? t('auth.login.sendingCode')
                      : showPassword
                        ? t('auth.login.submit')
                        : t('auth.login.continue')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-sm">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-foreground hover:underline">
              {t('auth.login.signUp')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

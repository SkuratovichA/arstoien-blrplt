import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
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
  FormDescription,
} from '@arstoien/shared-ui';
import { Input } from '@arstoien/shared-ui';
import { VERIFY_OTP_LOGIN, REQUEST_OTP_LOGIN } from '../graphql/auth.graphql.ts';
import { useAuthStore } from '../lib/auth-store';
import toast from 'react-hot-toast';
import { requireGuest, type AuthGuardContext } from '../lib/auth-guard';
import { useState, useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/verify-otp')({
  beforeLoad: ({ context }) => {
    requireGuest(context as AuthGuardContext);
  },
  component: VerifyOtp,
  validateSearch: z.object({
    email: z.string().email().catch(''),
  }),
});

const otpSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits'),
});

type OtpFormData = z.infer<typeof otpSchema>;

function VerifyOtp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: '/verify-otp' });
  const { setUser } = useAuthStore();
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyOtp, { loading: verifying }] = useMutation(VERIFY_OTP_LOGIN);
  const [requestOtp, { loading: requesting }] = useMutation(REQUEST_OTP_LOGIN);

  const form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: '',
    },
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format countdown for display
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendCode = async () => {
    if (!search.email) {
      toast.error(t('Email address is required'));
      return;
    }

    try {
      const result = await requestOtp({
        variables: { email: search.email },
      });

      if (result.data?.requestOtpLogin?.success) {
        toast.success(t('New OTP code sent to your email'));
        setCountdown(300); // Reset countdown
        setCanResend(false);
        form.reset();
      } else {
        throw new Error(result.data?.requestOtpLogin?.message ?? t('Failed to send OTP'));
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(t('Failed to resend code'));
    }
  };

  const onSubmit = async (data: OtpFormData) => {
    if (!search.email) {
      toast.error(t('Email address is required'));
      navigate({ to: '/login' });
      return;
    }

    try {
      const result = await verifyOtp({
        variables: {
          email: search.email,
          code: data.code,
        },
      });

      if (result.data?.verifyOtpLogin) {
        const { accessToken, refreshToken, user } = result.data.verifyOtpLogin;

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
        throw new Error(t('Invalid or expired code'));
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = error instanceof Error ? error.message : t('Invalid or expired code');
      toast.error(errorMessage);
      form.setError('code', { message: errorMessage });
    }
  };

  // Handle individual digit inputs
  const handleDigitChange = (index: number, value: string) => {
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Combine all digit values
    const digits = Array.from({ length: 6 }, (_, i) => {
      if (i === index) return value;
      return inputRefs.current[i]?.value ?? '';
    });

    form.setValue('code', digits.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData) {
      const digits = pastedData.split('');
      digits.forEach((digit, index) => {
        if (inputRefs.current[index]) {
          inputRefs.current[index].value = digit;
        }
      });
      form.setValue('code', pastedData);

      // Focus the next empty input or the last one
      const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
      inputRefs.current[nextEmptyIndex]?.focus();
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('Enter Verification Code')}</CardTitle>
          <CardDescription>
            {t('We sent a 6-digit code to')} <strong>{search.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={() => (
                  <FormItem>
                    <FormLabel>{t('Verification Code')}</FormLabel>
                    <FormControl>
                      <div className="flex justify-center gap-2">
                        {Array.from({ length: 6 }, (_, index) => (
                          <Input
                            key={index}
                            ref={(el) => {
                              inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="w-12 h-12 text-center text-lg font-bold"
                            onChange={(e) => handleDigitChange(index, e.target.value.replace(/\D/g, ''))}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            autoComplete="one-time-code"
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription className="text-center">
                      {countdown > 0 ? (
                        <>
                          {t('Code expires in')} <strong>{formatCountdown(countdown)}</strong>
                        </>
                      ) : (
                        <span className="text-destructive">{t('Code has expired')}</span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={verifying}>
                {verifying ? t('Verifying...') : t('Verify Code')}
              </Button>

              <div className="text-center space-y-2">
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm"
                    onClick={handleResendCode}
                    disabled={!canResend || requesting}
                  >
                    {requesting
                      ? t('Sending...')
                      : canResend
                        ? t('Resend Code')
                        : t('Resend available in {{time}}', { time: formatCountdown(countdown) })
                    }
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  {t('Wrong email?')}{' '}
                  <Link to="/login" className="text-foreground hover:underline">
                    {t('Back to login')}
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
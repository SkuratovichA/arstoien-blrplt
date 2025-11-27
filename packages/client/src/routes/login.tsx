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
import { Input, PasswordInput } from '@arstoien/shared-ui';
import { LOGIN } from '../graphql/auth.graphql.ts';
import { useAuthStore } from '../lib/auth-store';
import toast from 'react-hot-toast';
import { Link } from '@tanstack/react-router';
import { requireGuest, type AuthGuardContext } from '../lib/auth-guard';

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    requireGuest(context as AuthGuardContext);
  },
  component: Login,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [login, { loading }] = useMutation(LOGIN);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login({
        variables: {
          input: data,
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
                      <Input type="email" placeholder={t('Enter your email')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {t('Forgot password?')}
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Loading...') : t('Sign in')}
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

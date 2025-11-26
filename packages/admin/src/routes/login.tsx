import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LOGIN_MUTATION } from '@/graphql/admin.graphql';
import { useAuthStore, type User, UserRole } from '@/lib/auth-store';
import { hasAdminAccess } from '@/lib/auth-guard';
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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { data } = await login({
        variables: { input: values },
      });

      if (data?.login) {
        const { accessToken, user } = data.login;

        // Check if user has admin access (SUPER_ADMIN, ADMIN, or MODERATOR)
        if (!hasAdminAccess(user.role as UserRole)) {
          toast.error(t('You do not have permission to access the admin panel'));
          return;
        }

        setAuth(accessToken, user as User);
        toast.success(t('Login successful'));
        navigate({ to: '/' });
      }
    } catch (error) {
      toast.error(t('Invalid email or password'));
      console.error('Login error:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t('Admin Panel')}</CardTitle>
          <CardDescription>{t('Sign in to access the admin panel')}</CardDescription>
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
                        {...field}
                      />
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
                      <Input
                        type="password"
                        placeholder={t('Enter your password')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Signing in...') : t('Sign in')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

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
} from '@arstoien/shared-ui';
import { LOGIN } from '../graphql/auth.graphql';
import { useAuthStore } from '../lib/auth-store';
import toast from 'react-hot-toast';
import { Link } from '@tanstack/react-router';
import { requireGuest } from '../lib/auth-guard';

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    requireGuest(context);
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

      if (result.data?.login.requiresTwoFactor) {
        navigate({ to: '/two-factor' });
        return;
      }

      if (result.data?.login.user) {
        setUser(result.data.login.user);
        toast.success(t('auth.login.success'));
        navigate({ to: '/dashboard' });
      }
    } catch (error) {
      toast.error(t('auth.login.error'));
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
                    <FormLabel>{t('auth.fields.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('auth.fields.passwordPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('auth.login.submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
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

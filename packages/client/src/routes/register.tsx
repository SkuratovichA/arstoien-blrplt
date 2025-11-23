import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
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
import { REGISTER } from '../graphql/auth.graphql';
import { useAuthStore } from '../lib/auth-store';
import toast from 'react-hot-toast';
import { requireGuest } from '../lib/auth-guard';

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    requireGuest(context);
  },
  component: Register,
});

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [register, { loading }] = useMutation(REGISTER);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...input } = data;
      const result = await register({
        variables: {
          input,
        },
      });

      if (result.data?.register.user) {
        setUser(result.data.register.user);
        toast.success(t('auth.register.success'));
        navigate({ to: '/verify-email' });
      }
    } catch (error) {
      toast.error(t('auth.register.error'));
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.register.title')}</CardTitle>
          <CardDescription>{t('auth.register.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.fields.firstName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('auth.fields.firstNamePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.fields.lastName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('auth.fields.lastNamePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.fields.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t(
                          'auth.fields.confirmPasswordPlaceholder'
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('auth.register.submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-foreground hover:underline">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

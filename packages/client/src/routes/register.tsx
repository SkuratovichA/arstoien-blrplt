import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
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
import { REGISTER } from '../graphql/auth.graphql.ts';
import toast from 'react-hot-toast';
import { requireGuest, type AuthGuardContext } from '../lib/auth-guard';

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    requireGuest(context as AuthGuardContext);
  },
  component: Register,
});

const registerSchema = z.object({
  email: z.email(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [register, { loading }] = useMutation(REGISTER);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register({
        variables: {
          input: data,
        },
      });

      if (result.data?.register.success) {
        toast.success(result.data.register.message || t('Registration successful'));
        navigate({ to: '/login' });
      }
    } catch {
      toast.error(t('Registration failed'));
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('Register')}</CardTitle>
          <CardDescription>{t('Create a new account')}</CardDescription>
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
                      <FormLabel>{t('First name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('Enter your first name')} {...field} />
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
                      <FormLabel>{t('Last name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('Enter your last name')} {...field} />
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Phone')}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder={t('Enter your phone number')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Loading...') : t('Register')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-sm">
            {t('Already have an account?')}{' '}
            <Link to="/login" className="text-foreground hover:underline">
              {t('Sign in')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}

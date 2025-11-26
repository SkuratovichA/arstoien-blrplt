import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { requireAuth } from '@/lib/auth-guard';
import { ME_QUERY, UPDATE_PROFILE_MUTATION, CHANGE_PASSWORD_MUTATION } from '@/graphql/admin.graphql';
import { useAuthStore } from '@/lib/auth-store';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Loading } from '@/components/shared/loading';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@arstoien/shared-ui';

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export const Route = createFileRoute('/profile')({
  beforeLoad: () => requireAuth(),
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const updateUser = useAuthStore((state) => state.updateUser);

  const { data, loading } = useQuery(ME_QUERY);
  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE_MUTATION);
  const [changePassword, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD_MUTATION);

  const user = data?.currentUser;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: user ? {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
    } : undefined,
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      const { data } = await updateProfile({
        variables: {
          input: values,
        },
      });
      if (data?.updateProfile) {
        updateUser(data.updateProfile);
        toast.success(t('Profile updated successfully'));
      }
    } catch (error) {
      toast.error(t('Failed to update profile'));
      console.error('Update error:', error);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      const { data } = await changePassword({
        variables: {
          input: {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          },
        },
      });
      if (data?.changePassword?.success) {
        toast.success(t('Password changed successfully'));
        passwordForm.reset();
      } else {
        toast.error(data?.changePassword?.message || t('Failed to change password'));
      }
    } catch (error) {
      toast.error(t('Failed to change password'));
      console.error('Password change error:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Profile')}</h1>
          <p className="text-muted-foreground">{t('Manage your account settings')}</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">{t('Profile')}</TabsTrigger>
            <TabsTrigger value="password">{t('Password')}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t('Profile Information')}</CardTitle>
                <CardDescription>{t('Update your profile details')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('First Name')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Last Name')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Email')}</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={updating}>
                      {updating ? t('Saving...') : t('Save Changes')}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>{t('Change Password')}</CardTitle>
                <CardDescription>{t('Update your password')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Current Password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('New Password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Confirm New Password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword ? t('Changing...') : t('Change Password')}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

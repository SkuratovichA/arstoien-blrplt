import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client/react';
import { MainLayout } from '../components/layout/main-layout';
import { Button } from '@arstoien/shared-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@arstoien/shared-ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@arstoien/shared-ui';
import { Input, PasswordInput } from '@arstoien/shared-ui';
import { UPDATE_PROFILE, CHANGE_PASSWORD, DELETE_ACCOUNT } from '../graphql/user.graphql';
import { useAuthStore } from '../lib/auth-store';
import toast from 'react-hot-toast';
import { requireAuth, requireEmailVerified, type AuthGuardContext } from '../lib/auth-guard';

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => {
    requireAuth(context as AuthGuardContext);
    requireEmailVerified(context as AuthGuardContext);
  },
  component: Profile,
});

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function Profile() {
  const { t } = useTranslation();
  const { user, setUser, logout } = useAuthStore();

  const [updateProfile, { loading: updatingProfile }] = useMutation(
    UPDATE_PROFILE as Parameters<typeof useMutation>[0]
  );
  const [changePassword, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD);
  const [deleteAccount, { loading: deletingAccount }] = useMutation(DELETE_ACCOUNT);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const result = await updateProfile({
        variables: { input: data },
      });

      const responseData = result.data as {
        updateProfile: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          phone?: string | null;
          emailVerifiedAt?: string | null;
          createdAt: string;
        };
      } | null;
      if (responseData?.updateProfile && user) {
        const updated = responseData.updateProfile;
        setUser({
          ...user,
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone ?? undefined,
          emailVerifiedAt: updated.emailVerifiedAt,
        });
        toast.success(t('profile.updateSuccess'));
      }
    } catch {
      toast.error(t('profile.updateError'));
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword({
        variables: {
          input: {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
        },
      });

      passwordForm.reset();
      toast.success(t('profile.passwordChangeSuccess'));
    } catch {
      toast.error(t('profile.passwordChangeError'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('profile.deleteAccountConfirm'))) return;

    try {
      const password = prompt(t('profile.enterPassword'));
      if (!password) return;

      await deleteAccount({
        variables: { input: { password } },
      });

      logout();
      toast.success(t('profile.deleteAccountSuccess'));
    } catch {
      toast.error(t('profile.deleteAccountError'));
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">{t('profile.title')}</h1>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.personalInfo')}</CardTitle>
              <CardDescription>{t('profile.personalInfoDescription')}</CardDescription>
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
                          <FormLabel>{t('auth.fields.firstName')}</FormLabel>
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
                          <FormLabel>{t('auth.fields.lastName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>{t('auth.fields.email')}</FormLabel>
                    <Input value={user?.email} disabled />
                  </div>

                  <Button type="submit" disabled={updatingProfile}>
                    {updatingProfile ? t('common.loading') : t('profile.updateButton')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.changePassword')}</CardTitle>
              <CardDescription>{t('profile.changePasswordDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profile.currentPassword')}</FormLabel>
                        <FormControl>
                          <PasswordInput {...field} />
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
                        <FormLabel>{t('profile.newPassword')}</FormLabel>
                        <FormControl>
                          <PasswordInput {...field} />
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
                        <FormLabel>{t('auth.fields.confirmPassword')}</FormLabel>
                        <FormControl>
                          <PasswordInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? t('common.loading') : t('profile.changePasswordButton')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{t('profile.dangerZone')}</CardTitle>
              <CardDescription>{t('profile.dangerZoneDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? t('common.loading') : t('profile.deleteAccount')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

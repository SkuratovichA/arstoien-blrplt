import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client/react';
import { Former } from '@arstoien/former';
import { MainLayout } from '../components/layout/main-layout';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@arstoien/shared-ui';
import { CHANGE_PASSWORD, DELETE_ACCOUNT, UPDATE_PROFILE } from '../graphql/user.graphql';
import { useAuthStore } from '../lib/auth-store';
import toast from 'react-hot-toast';
import { type AuthGuardContext, requireAuth, requireEmailVerified } from '../lib/auth-guard';
import { createFormComponentOverrides } from '../components/forms/form-component-overrides';
import {
  createProfileUpdateFormConfig,
  type ProfileUpdateFormData,
} from '../components/forms/profile-form-config';
import {
  createPasswordChangeFormConfig,
  type PasswordChangeFormData,
} from '../components/forms/password-form-config';

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => {
    requireAuth(context as AuthGuardContext);
    requireEmailVerified(context as AuthGuardContext);
  },
  component: Profile,
});

function Profile() {
  const { t } = useTranslation();
  const { user, setUser, logout } = useAuthStore();

  const [updateProfile] = useMutation(UPDATE_PROFILE as Parameters<typeof useMutation>[0]);
  const [changePassword] = useMutation(CHANGE_PASSWORD);
  const [deleteAccount, { loading: deletingAccount }] = useMutation(DELETE_ACCOUNT);

  const onProfileSubmit = async (data: ProfileUpdateFormData) => {
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
        toast.success(t('Profile updated successfully'));
      }
    } catch {
      toast.error(t('Failed to update profile'));
    }
  };

  const onPasswordSubmit = async (data: PasswordChangeFormData) => {
    try {
      await changePassword({
        variables: {
          input: {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
        },
      });

      toast.success(t('Password changed successfully'));
    } catch {
      toast.error(t('Failed to change password'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('Are you sure you want to delete your account? This action cannot be undone.')))
      return;

    try {
      const password = prompt(t('Please enter your password to confirm'));
      if (!password) return;

      await deleteAccount({
        variables: { input: { password } },
      });

      logout();
      toast.success(t('Account deleted successfully'));
    } catch {
      toast.error(t('Failed to delete account'));
    }
  };

  // Create form configurations
  const profileFormConfig = createProfileUpdateFormConfig({
    t,
    onSubmit: onProfileSubmit,
    initialValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  const passwordFormConfig = createPasswordChangeFormConfig({
    t,
    onSubmit: onPasswordSubmit,
  });

  // Create component overrides for each form
  const profileOverrides = createFormComponentOverrides<ProfileUpdateFormData>(t);
  const passwordOverrides = createFormComponentOverrides<PasswordChangeFormData>(t);

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">{t('Profile')}</h1>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Personal Information')}</CardTitle>
              <CardDescription>
                {t('Update your personal details')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t('Email')}
                </label>
                <Input value={user?.email} disabled className="mt-2" />
              </div>

              <Former<ProfileUpdateFormData>
                config={profileFormConfig}
                componentOverrides={profileOverrides}
              />
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Change Password')}</CardTitle>
              <CardDescription>
                {t('Update your password to keep your account secure')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Former<PasswordChangeFormData>
                config={passwordFormConfig}
                componentOverrides={passwordOverrides}
              />
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{t('Danger Zone')}</CardTitle>
              <CardDescription>
                {t('Permanently delete your account and all associated data')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? t('Loading...') : t('Delete Account')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

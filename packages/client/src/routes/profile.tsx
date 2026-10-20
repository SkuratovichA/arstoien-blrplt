import { useMutation } from '@apollo/client/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@blrplt/ui';
import { MainLayout } from '@components/layout';
import { createFileRoute } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { PasswordChangeForm } from '../components/forms/password-form';
import type { PasswordChangeFormData } from '../components/forms/password-form-schema';
import { ProfileUpdateForm } from '../components/forms/profile-form';
import type { ProfileUpdateFormData } from '../components/forms/profile-form-schema';
import { CHANGE_PASSWORD, DELETE_ACCOUNT, UPDATE_PROFILE } from '../graphql/user.graphql';
import type { AuthGuardContext } from '../lib/auth-guard';
import { requireAuth, requireEmailVerified } from '../lib/auth-guard';
import { useAuthStore } from '../lib/auth-store';

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
        toast.success(t('profile.updateSuccess'));
      }
    } catch {
      toast.error(t('profile.updateError'));
    }
  };

  const onPasswordSubmit = async (data: PasswordChangeFormData): Promise<boolean> => {
    try {
      await changePassword({
        variables: {
          input: {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
        },
      });

      toast.success(t('profile.passwordChangeSuccess'));
      return true;
    } catch {
      toast.error(t('profile.passwordChangeError'));
      return false;
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('profile.deleteAccountConfirm'))) return;

    try {
      const password = prompt(t('profile.deleteAccountPrompt'));
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

            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="profile-email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('auth.fields.email')}
                </label>
                <Input id="profile-email" value={user?.email} disabled className="mt-2" />
              </div>

              <ProfileUpdateForm
                initialValues={{ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' }}
                onSubmit={onProfileSubmit}
              />
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.changePassword')}</CardTitle>
              <CardDescription>{t('profile.changePasswordDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm onSubmit={onPasswordSubmit} />
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

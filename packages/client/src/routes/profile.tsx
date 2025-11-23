import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client';
import { MainLayout } from '../components/layout/main-layout';
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
  Separator,
} from '@arstoien/shared-ui';
import {
  UPDATE_PROFILE,
  CHANGE_PASSWORD,
  ENABLE_TWO_FACTOR,
  CONFIRM_TWO_FACTOR,
  DISABLE_TWO_FACTOR,
  DELETE_ACCOUNT,
} from '../graphql/user.graphql';
import { useAuthStore } from '../lib/auth-store';
import toast from 'react-hot-toast';
import { requireAuth, requireEmailVerified } from '../lib/auth-guard';
import { useState } from 'react';

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => {
    requireAuth(context);
    requireEmailVerified(context);
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

const twoFactorConfirmSchema = z.object({
  code: z.string().length(6),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type TwoFactorConfirmFormData = z.infer<typeof twoFactorConfirmSchema>;

function Profile() {
  const { t } = useTranslation();
  const { user, setUser, logout } = useAuthStore();
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    secret: string;
    qrCode: string;
  } | null>(null);

  const [updateProfile, { loading: updatingProfile }] =
    useMutation(UPDATE_PROFILE);
  const [changePassword, { loading: changingPassword }] =
    useMutation(CHANGE_PASSWORD);
  const [enableTwoFactor, { loading: enablingTwoFactor }] =
    useMutation(ENABLE_TWO_FACTOR);
  const [confirmTwoFactor, { loading: confirmingTwoFactor }] = useMutation(
    CONFIRM_TWO_FACTOR
  );
  const [disableTwoFactor, { loading: disablingTwoFactor }] =
    useMutation(DISABLE_TWO_FACTOR);
  const [deleteAccount, { loading: deletingAccount }] =
    useMutation(DELETE_ACCOUNT);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
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

  const twoFactorForm = useForm<TwoFactorConfirmFormData>({
    resolver: zodResolver(twoFactorConfirmSchema),
    defaultValues: {
      code: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const result = await updateProfile({
        variables: { input: data },
      });

      if (result.data?.updateProfile) {
        setUser(result.data.updateProfile);
        toast.success(t('profile.updateSuccess'));
      }
    } catch (error) {
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
    } catch (error) {
      toast.error(t('profile.passwordChangeError'));
    }
  };

  const handleEnableTwoFactor = async () => {
    try {
      const result = await enableTwoFactor();

      if (result.data?.enableTwoFactor) {
        setTwoFactorSetup({
          secret: result.data.enableTwoFactor.secret,
          qrCode: result.data.enableTwoFactor.qrCode,
        });
      }
    } catch (error) {
      toast.error(t('profile.twoFactorEnableError'));
    }
  };

  const onTwoFactorConfirm = async (data: TwoFactorConfirmFormData) => {
    try {
      const result = await confirmTwoFactor({
        variables: { input: data },
      });

      if (result.data?.confirmTwoFactor.success && user) {
        setUser({ ...user, isTwoFactorEnabled: true });
        setTwoFactorSetup(null);
        twoFactorForm.reset();
        toast.success(t('profile.twoFactorEnableSuccess'));
      }
    } catch (error) {
      toast.error(t('profile.twoFactorConfirmError'));
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!confirm(t('profile.twoFactorDisableConfirm'))) return;

    try {
      const password = prompt(t('profile.enterPassword'));
      if (!password) return;

      const result = await disableTwoFactor({
        variables: { input: { password } },
      });

      if (result.data?.disableTwoFactor.success && user) {
        setUser({ ...user, isTwoFactorEnabled: false });
        toast.success(t('profile.twoFactorDisableSuccess'));
      }
    } catch (error) {
      toast.error(t('profile.twoFactorDisableError'));
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
    } catch (error) {
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
              <CardDescription>
                {t('profile.personalInfoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="space-y-4"
                >
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
                    {updatingProfile
                      ? t('common.loading')
                      : t('profile.updateButton')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.changePassword')}</CardTitle>
              <CardDescription>
                {t('profile.changePasswordDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profile.currentPassword')}</FormLabel>
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
                        <FormLabel>{t('profile.newPassword')}</FormLabel>
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
                        <FormLabel>{t('auth.fields.confirmPassword')}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword
                      ? t('common.loading')
                      : t('profile.changePasswordButton')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.twoFactor')}</CardTitle>
              <CardDescription>
                {t('profile.twoFactorDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('profile.twoFactorStatus')}:{' '}
                  <span className="font-medium">
                    {user?.isTwoFactorEnabled
                      ? t('common.enabled')
                      : t('common.disabled')}
                  </span>
                </p>
              </div>

              {!user?.isTwoFactorEnabled && !twoFactorSetup && (
                <Button
                  onClick={handleEnableTwoFactor}
                  disabled={enablingTwoFactor}
                >
                  {enablingTwoFactor
                    ? t('common.loading')
                    : t('profile.enableTwoFactor')}
                </Button>
              )}

              {twoFactorSetup && (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      {t('profile.scanQrCode')}
                    </p>
                    <img
                      src={twoFactorSetup.qrCode}
                      alt="QR Code"
                      className="rounded-lg border"
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">
                      {t('profile.manualEntry')}
                    </p>
                    <code className="block rounded-lg bg-muted p-2 text-sm">
                      {twoFactorSetup.secret}
                    </code>
                  </div>

                  <Form {...twoFactorForm}>
                    <form
                      onSubmit={twoFactorForm.handleSubmit(onTwoFactorConfirm)}
                      className="space-y-4"
                    >
                      <FormField
                        control={twoFactorForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('profile.enterVerificationCode')}
                            </FormLabel>
                            <FormControl>
                              <Input maxLength={6} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={confirmingTwoFactor}>
                        {confirmingTwoFactor
                          ? t('common.loading')
                          : t('profile.confirmTwoFactor')}
                      </Button>
                    </form>
                  </Form>
                </div>
              )}

              {user?.isTwoFactorEnabled && (
                <Button
                  variant="destructive"
                  onClick={handleDisableTwoFactor}
                  disabled={disablingTwoFactor}
                >
                  {disablingTwoFactor
                    ? t('common.loading')
                    : t('profile.disableTwoFactor')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('profile.dangerZone')}
              </CardTitle>
              <CardDescription>
                {t('profile.dangerZoneDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount
                  ? t('common.loading')
                  : t('profile.deleteAccount')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

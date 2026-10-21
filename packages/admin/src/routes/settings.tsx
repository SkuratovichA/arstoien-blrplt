import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Switch,
} from '@blrplt/ui';
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Loading } from '@/components/shared/loading';
import { SYSTEM_SETTINGS_QUERY, UPDATE_SETTINGS_MUTATION } from '@/graphql/settings.graphql';
import { requireAdminRole } from '@/lib/auth-guard';

export const Route = createFileRoute('/settings')({
  beforeLoad: () => requireAdminRole(),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(SYSTEM_SETTINGS_QUERY);
  const [updateSettings, { loading: updating }] = useMutation(UPDATE_SETTINGS_MUTATION);

  const settings = data?.systemSettings;

  // Form with system settings including OTP toggle
  const form = useForm({
    defaultValues: {
      supportEmail: settings?.supportEmail ?? '',
      otpAuthEnabled: settings?.otpAuthEnabled ?? false,
    },
  });

  const onSubmit = async (values: { supportEmail: string; otpAuthEnabled: boolean }) => {
    try {
      await updateSettings({
        variables: {
          input: {
            supportEmail: values.supportEmail,
            otpAuthEnabled: values.otpAuthEnabled,
          },
        },
      });
      toast.success(t('settings.updated'));
    } catch (error) {
      toast.error(t('settings.updateError'));
      console.error('Update error:', error);
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
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.description')}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.emailTitle')}</CardTitle>
                <CardDescription>{t('settings.emailDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.supportEmail')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="support@example.com" />
                      </FormControl>
                      <FormDescription>{t('settings.supportEmailDescription')}</FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('settings.authTitle')}</CardTitle>
                <CardDescription>{t('settings.authDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="otpAuthEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t('settings.otpTitle')}</FormLabel>
                        <FormDescription>{t('settings.otpDescription')}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t('settings.otpToggle')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updating}>
                {updating ? t('common.saving') : t('settings.save')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}

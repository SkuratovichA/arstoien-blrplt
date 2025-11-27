import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { requireAdminRole } from '@/lib/auth-guard';
import { SYSTEM_SETTINGS_QUERY, UPDATE_SETTINGS_MUTATION } from '@/graphql/settings.graphql';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Input,
} from '@arstoien/shared-ui';

export const Route = createFileRoute('/settings')({
  beforeLoad: () => requireAdminRole(),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(SYSTEM_SETTINGS_QUERY);
  const [updateSettings, { loading: updating }] = useMutation(UPDATE_SETTINGS_MUTATION);

  const settings = data?.systemSettings;

  // Since systemSettings only has supportEmail, we'll create a simple form for that
  const form = useForm({
    defaultValues: {
      supportEmail: settings?.supportEmail ?? '',
    },
  });

  const onSubmit = async (values: Record<string, string>) => {
    try {
      await updateSettings({
        variables: {
          input: {
            supportEmail: values.supportEmail,
          },
        },
      });
      toast.success(t('Settings updated successfully'));
    } catch (error) {
      toast.error(t('Failed to update settings'));
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
          <h1 className="text-3xl font-bold tracking-tight">{t('System Settings')}</h1>
          <p className="text-muted-foreground">
            {t('Configure system-wide settings and preferences')}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('Email Settings')}</CardTitle>
                <CardDescription>{t('Configure support email address')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Support Email')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="support@example.com" />
                      </FormControl>
                      <FormDescription>{t('Email address for support inquiries')}</FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updating}>
                {updating ? t('Saving...') : t('Save Settings')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}

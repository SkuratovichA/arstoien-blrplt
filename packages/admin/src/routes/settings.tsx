import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from '@apollo/client';
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
  FormMessage,
  Input,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@arstoien/shared-ui';

export const Route = createFileRoute('/settings')({
  beforeLoad: () => requireAdminRole(),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(SYSTEM_SETTINGS_QUERY);
  const [updateSettings, { loading: updating }] = useMutation(UPDATE_SETTINGS_MUTATION);

  const settings = data?.systemSettings || [];

  const generalSettings = settings.filter((s) => s.category === 'GENERAL');
  const securitySettings = settings.filter((s) => s.category === 'SECURITY');
  const emailSettings = settings.filter((s) => s.category === 'EMAIL');

  const form = useForm({
    defaultValues: settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {}),
  });

  const onSubmit = async (values: Record<string, string>) => {
    try {
      const settingsArray = Object.entries(values).map(([key, value]) => ({
        key,
        value: String(value),
      }));

      await updateSettings({
        variables: {
          settings: settingsArray,
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

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">{t('General')}</TabsTrigger>
            <TabsTrigger value="security">{t('Security')}</TabsTrigger>
            <TabsTrigger value="email">{t('Email')}</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('General Settings')}</CardTitle>
                    <CardDescription>
                      {t('Basic system configuration')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generalSettings.map((setting) => (
                      <FormField
                        key={setting.key}
                        control={form.control}
                        name={setting.key}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {setting.key.replace(/_/g, ' ')}
                              </FormLabel>
                              {setting.description && (
                                <FormDescription>{setting.description}</FormDescription>
                              )}
                            </div>
                            <FormControl>
                              {setting.type === 'BOOLEAN' ? (
                                <Switch
                                  checked={field.value === 'true'}
                                  onCheckedChange={(checked) =>
                                    field.onChange(String(checked))
                                  }
                                />
                              ) : (
                                <Input {...field} className="max-w-xs" />
                              )}
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Security Settings')}</CardTitle>
                    <CardDescription>
                      {t('Configure security and authentication settings')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {securitySettings.map((setting) => (
                      <FormField
                        key={setting.key}
                        control={form.control}
                        name={setting.key}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {setting.key.replace(/_/g, ' ')}
                              </FormLabel>
                              {setting.description && (
                                <FormDescription>{setting.description}</FormDescription>
                              )}
                            </div>
                            <FormControl>
                              {setting.type === 'BOOLEAN' ? (
                                <Switch
                                  checked={field.value === 'true'}
                                  onCheckedChange={(checked) =>
                                    field.onChange(String(checked))
                                  }
                                />
                              ) : (
                                <Input {...field} className="max-w-xs" />
                              )}
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Email Settings')}</CardTitle>
                    <CardDescription>
                      {t('Configure email notifications and templates')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {emailSettings.map((setting) => (
                      <FormField
                        key={setting.key}
                        control={form.control}
                        name={setting.key}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {setting.key.replace(/_/g, ' ')}
                              </FormLabel>
                              {setting.description && (
                                <FormDescription>{setting.description}</FormDescription>
                              )}
                            </div>
                            <FormControl>
                              {setting.type === 'BOOLEAN' ? (
                                <Switch
                                  checked={field.value === 'true'}
                                  onCheckedChange={(checked) =>
                                    field.onChange(String(checked))
                                  }
                                />
                              ) : (
                                <Input {...field} className="max-w-xs" />
                              )}
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end">
                <Button type="submit" disabled={updating}>
                  {updating ? t('Saving...') : t('Save Settings')}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

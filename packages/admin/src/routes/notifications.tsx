import { useMutation, useQuery } from '@apollo/client/react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@blrplt/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Loading } from '@/components/shared/loading';
import { DELETE_NOTIFICATION_MUTATION, NOTIFICATIONS_QUERY } from '@/graphql/settings.graphql';
import { requireAuth } from '@/lib/auth-guard';

const notificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  recipientType: z.enum(['ALL', 'ADMINS', 'MODERATORS', 'USERS']),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export const Route = createFileRoute('/notifications')({
  beforeLoad: () => requireAuth(),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, loading, refetch } = useQuery(NOTIFICATIONS_QUERY, {
    variables: { filters: {} },
  });

  const [deleteNotification] = useMutation(DELETE_NOTIFICATION_MUTATION);

  const notifications = data?.myNotifications ?? [];

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      type: 'INFO',
      priority: 'MEDIUM',
      recipientType: 'ALL',
    },
  });

  const onSubmit = async (_values: NotificationFormValues) => {
    try {
      // TODO: CREATE_NOTIFICATION_MUTATION is not properly implemented in GraphQL
      // For now, just close the dialog and show a message
      toast(t('notifications.createNotImplemented'));
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error(t('notifications.createError'));
      console.error('Create error:', error);
    }
  };

  const handleSend = async (_id: string) => {
    try {
      // TODO: SEND_NOTIFICATION_MUTATION is not properly implemented in GraphQL
      toast(t('notifications.sendNotImplemented'));
    } catch (error) {
      toast.error(t('notifications.sendError'));
      console.error('Send error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification({
        variables: { notificationId: id },
      });
      toast.success(t('notifications.deleted'));
      refetch();
    } catch (error) {
      toast.error(t('notifications.deleteError'));
      console.error('Delete error:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('notifications.title')}</h1>
            <p className="text-muted-foreground">{t('notifications.description')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('notifications.createButton')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t('notifications.createTitle')}</DialogTitle>
                <DialogDescription>{t('notifications.createDescription')}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('notifications.fieldTitle')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('notifications.fieldMessage')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('notifications.fieldType')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="INFO">{t('notifications.typeInfo')}</SelectItem>
                              <SelectItem value="WARNING">
                                {t('notifications.typeWarning')}
                              </SelectItem>
                              <SelectItem value="ERROR">{t('notifications.typeError')}</SelectItem>
                              <SelectItem value="SUCCESS">
                                {t('notifications.typeSuccess')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('notifications.fieldPriority')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LOW">{t('notifications.priorityLow')}</SelectItem>
                              <SelectItem value="MEDIUM">
                                {t('notifications.priorityMedium')}
                              </SelectItem>
                              <SelectItem value="HIGH">
                                {t('notifications.priorityHigh')}
                              </SelectItem>
                              <SelectItem value="URGENT">
                                {t('notifications.priorityUrgent')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recipientType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('notifications.fieldRecipients')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ALL">
                                {t('notifications.recipientsAll')}
                              </SelectItem>
                              <SelectItem value="ADMINS">
                                {t('notifications.recipientsAdmins')}
                              </SelectItem>
                              <SelectItem value="MODERATORS">
                                {t('notifications.recipientsModerators')}
                              </SelectItem>
                              <SelectItem value="USERS">
                                {t('notifications.recipientsUsers')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit">{t('notifications.create')}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Loading />
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">{t('notifications.empty')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {notifications.map((notification: (typeof notifications)[0]) => (
              <Card key={notification.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <CardDescription>{notification.message}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{notification.type}</Badge>
                      <Badge variant={notification.status === 'READ' ? 'default' : 'secondary'}>
                        {notification.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">
                      <p>
                        {t('notifications.created')}:{' '}
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {notification.readAt && (
                        <p>
                          {t('notifications.read')}:{' '}
                          {new Date(notification.readAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {notification.status !== 'READ' && (
                        <Button size="sm" onClick={() => handleSend(notification.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          {t('notifications.send')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

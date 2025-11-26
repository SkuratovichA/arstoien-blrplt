import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { requireAuth } from '@/lib/auth-guard';
import {
  NOTIFICATIONS_QUERY,
  DELETE_NOTIFICATION_MUTATION,
} from '@/graphql/settings.graphql';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Loading } from '@/components/shared/loading';
import {
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
  Badge,
} from '@arstoien/shared-ui';
import { Plus, Send, Trash2 } from 'lucide-react';

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

  const notifications = data?.myNotifications || [];

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
      toast(t('Notification creation is not yet implemented'));
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error(t('Failed to create notification'));
      console.error('Create error:', error);
    }
  };

  const handleSend = async (_id: string) => {
    try {
      // TODO: SEND_NOTIFICATION_MUTATION is not properly implemented in GraphQL
      toast(t('Notification sending is not yet implemented'));
    } catch (error) {
      toast.error(t('Failed to send notification'));
      console.error('Send error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification({
        variables: { notificationId: id },
      });
      toast.success(t('Notification deleted successfully'));
      refetch();
    } catch (error) {
      toast.error(t('Failed to delete notification'));
      console.error('Delete error:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Notifications')}</h1>
            <p className="text-muted-foreground">
              {t('Create and manage system notifications')}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('Create Notification')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t('Create Notification')}</DialogTitle>
                <DialogDescription>
                  {t('Create a new notification to send to users')}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Title')}</FormLabel>
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
                        <FormLabel>{t('Message')}</FormLabel>
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
                          <FormLabel>{t('Type')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="INFO">{t('Info')}</SelectItem>
                              <SelectItem value="WARNING">{t('Warning')}</SelectItem>
                              <SelectItem value="ERROR">{t('Error')}</SelectItem>
                              <SelectItem value="SUCCESS">{t('Success')}</SelectItem>
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
                          <FormLabel>{t('Priority')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LOW">{t('Low')}</SelectItem>
                              <SelectItem value="MEDIUM">{t('Medium')}</SelectItem>
                              <SelectItem value="HIGH">{t('High')}</SelectItem>
                              <SelectItem value="URGENT">{t('Urgent')}</SelectItem>
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
                          <FormLabel>{t('Recipients')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ALL">{t('All Users')}</SelectItem>
                              <SelectItem value="ADMINS">{t('Admins')}</SelectItem>
                              <SelectItem value="MODERATORS">
                                {t('Moderators')}
                              </SelectItem>
                              <SelectItem value="USERS">{t('Users')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t('Cancel')}
                    </Button>
                    <Button type="submit">
                      {t('Create')}
                    </Button>
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
              <p className="text-muted-foreground">{t('No notifications')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {notifications.map((notification: typeof notifications[0]) => (
              <Card key={notification.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <CardDescription>{notification.message}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{notification.type}</Badge>
                      <Badge
                        variant={
                          notification.status === 'READ' ? 'default' : 'secondary'
                        }
                      >
                        {notification.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>
                        {t('Created')}: {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {notification.readAt && (
                        <p>
                          {t('Read')}: {new Date(notification.readAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {notification.status !== 'READ' && (
                        <Button
                          size="sm"
                          onClick={() => handleSend(notification.id)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {t('Send')}
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

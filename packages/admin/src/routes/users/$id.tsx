import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { requireAuth } from '@/lib/auth-guard';
import { USER_QUERY, UPDATE_USER_MUTATION, DELETE_USER_MUTATION } from '@/graphql/users.graphql';
import { USER_AUDIT_LOGS_QUERY } from '@/graphql/audit.graphql';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@arstoien/shared-ui';
import { Trash2 } from 'lucide-react';

const userSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
  status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED']),
  phoneNumber: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

export const Route = createFileRoute('/users/$id')({
  beforeLoad: () => requireAuth(),
  component: UserDetailPage,
});

function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data, loading } = useQuery(USER_QUERY, {
    variables: { id },
  });

  const { data: auditData } = useQuery(USER_AUDIT_LOGS_QUERY, {
    variables: { userId: id, skip: 0, take: 20 },
  });

  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER_MUTATION);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER_MUTATION);

  const user = data?.user;
  const auditLogs = auditData?.userAuditLogs?.nodes || [];

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    values: user ? {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      status: user.status,
      phoneNumber: user.phoneNumber || '',
    } : undefined,
  });

  const onSubmit = async (values: UserFormValues) => {
    try {
      await updateUser({
        variables: {
          id,
          data: values,
        },
      });
      toast.success(t('User updated successfully'));
    } catch (error) {
      toast.error(t('Failed to update user'));
      console.error('Update error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser({
        variables: { id },
      });
      toast.success(t('User deleted successfully'));
      navigate({ to: '/users' });
    } catch (error) {
      toast.error(t('Failed to delete user'));
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center">
          <p className="text-lg text-muted-foreground">{t('User not found')}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('Delete User')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('This action cannot be undone. This will permanently delete the user account.')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  {t('Delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">{t('Details')}</TabsTrigger>
            <TabsTrigger value="activity">{t('Activity')}</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>{t('User Information')}</CardTitle>
                <CardDescription>{t('Update user details')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Phone Number')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Role')}</FormLabel>
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
                                <SelectItem value="USER">{t('User')}</SelectItem>
                                <SelectItem value="MODERATOR">{t('Moderator')}</SelectItem>
                                <SelectItem value="ADMIN">{t('Admin')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('Status')}</FormLabel>
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
                                <SelectItem value="ACTIVE">{t('Active')}</SelectItem>
                                <SelectItem value="PENDING">{t('Pending')}</SelectItem>
                                <SelectItem value="SUSPENDED">{t('Suspended')}</SelectItem>
                                <SelectItem value="BANNED">{t('Banned')}</SelectItem>
                              </SelectContent>
                            </Select>
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

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>{t('Activity Log')}</CardTitle>
                <CardDescription>{t('Recent user activity')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('No activity found')}</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex flex-col gap-2 border-b pb-4 last:border-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground">{log.entity}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {log.changes && (
                          <pre className="text-xs text-muted-foreground">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

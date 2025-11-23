import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { requireAuth } from '@/lib/auth-guard';
import {
  PENDING_USERS_QUERY,
  APPROVE_USER_MUTATION,
  REJECT_USER_MUTATION,
} from '@/graphql/users.graphql';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Loading } from '@/components/shared/loading';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Textarea,
} from '@arstoien/shared-ui';
import { Check, X } from 'lucide-react';

export const Route = createFileRoute('/users/pending')({
  beforeLoad: () => requireAuth(),
  component: PendingUsersPage,
});

function PendingUsersPage() {
  const { t } = useTranslation();
  const [rejectReason, setRejectReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(PENDING_USERS_QUERY, {
    variables: { skip: 0, take: 50 },
  });

  const [approveUser] = useMutation(APPROVE_USER_MUTATION);
  const [rejectUser] = useMutation(REJECT_USER_MUTATION);

  const pendingUsers = data?.pendingUsers?.nodes || [];

  const handleApprove = async (userId: string) => {
    try {
      await approveUser({
        variables: { id: userId },
      });
      toast.success(t('User approved successfully'));
      refetch();
    } catch (error) {
      toast.error(t('Failed to approve user'));
      console.error('Approve error:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedUserId) return;

    try {
      await rejectUser({
        variables: {
          id: selectedUserId,
          reason: rejectReason,
        },
      });
      toast.success(t('User rejected'));
      setRejectReason('');
      setSelectedUserId(null);
      refetch();
    } catch (error) {
      toast.error(t('Failed to reject user'));
      console.error('Reject error:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Pending Users')}</h1>
          <p className="text-muted-foreground">
            {t('Review and approve or reject pending user registrations')}
          </p>
        </div>

        {loading ? (
          <Loading />
        ) : pendingUsers.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">{t('No pending users')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {user.firstName} {user.lastName}
                      </CardTitle>
                      <CardDescription className="text-sm">{user.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {t('Registered')}: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleApprove(user.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        {t('Approve')}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            {t('Reject')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('Reject User')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('Provide a reason for rejecting this user registration')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <Textarea
                            placeholder={t('Reason for rejection...')}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setRejectReason('')}>
                              {t('Cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleReject}>
                              {t('Reject')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

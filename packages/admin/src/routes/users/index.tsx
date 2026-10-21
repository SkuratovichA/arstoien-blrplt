import { useMutation, useQuery } from '@apollo/client/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@blrplt/ui';
import { createFileRoute } from '@tanstack/react-router';
import { MoreHorizontal, Shield, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Loading } from '@/components/shared/loading';
import { AddUserModal } from '@/components/users/add-user-modal';
import { UserFilters } from '@/components/users/user-filters';
import { UserTable } from '@/components/users/user-table';
import type { UserStatus } from '@/gql/graphql';
import { BULK_UPDATE_OTP_MUTATION, USERS_QUERY } from '@/graphql/users.graphql';
import { requireAuth } from '@/lib/auth-guard';

export const Route = createFileRoute('/users/')({
  beforeLoad: () => requireAuth(),
  component: UsersPage,
});

function UsersPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<{
    search: string;
    role: string | undefined;
    status: string | undefined;
  }>({
    search: '',
    role: undefined,
    status: undefined,
  });
  const [pagination, setPagination] = useState({
    skip: 0,
    take: 10,
  });
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpAction, setOtpAction] = useState<'enable' | 'disable' | null>(null);

  const { data, loading, refetch } = useQuery(USERS_QUERY as Parameters<typeof useQuery>[0], {
    variables: {
      search: filters.search || undefined,
      role: filters.role ?? undefined,
      status: filters.status ?? undefined,
      ...pagination,
    },
  });

  const [bulkUpdateOtp] = useMutation(BULK_UPDATE_OTP_MUTATION);

  const responseData = data as
    | {
        users: Array<{
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          phone?: string | null;
          role: string;
          status: UserStatus;
          createdAt: string;
          updatedAt: string;
        }>;
      }
    | undefined;
  const users = (responseData?.users ?? []).map((user) => ({
    ...user,
    emailVerified: false, // TODO: Add emailVerifiedAt to query and compute this
  }));
  const totalCount = users.length;

  const handleBulkOtpUpdate = async () => {
    if (!otpAction) return;

    try {
      const result = await bulkUpdateOtp({
        variables: {
          input: {
            enabled: otpAction === 'enable',
          },
        },
      });

      if (result.data?.bulkUpdateOtp?.success) {
        toast.success(result.data.bulkUpdateOtp.message ?? t('users.otp.updated'));
        refetch();
      } else {
        toast.error(t('users.otp.updateError'));
      }
    } catch (error) {
      console.error('Bulk OTP update error:', error);
      toast.error(t('users.otp.updateError'));
    } finally {
      setShowOtpDialog(false);
      setOtpAction(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
            <p className="text-muted-foreground">{t('users.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  {t('users.bulkActions')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t('users.otp.settings')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setOtpAction('enable');
                    setShowOtpDialog(true);
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t('users.otp.enableAll')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setOtpAction('disable');
                    setShowOtpDialog(true);
                  }}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  {t('users.otp.disableAll')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AddUserModal onUserCreated={refetch} />
          </div>
        </div>

        <UserFilters filters={filters} onFiltersChange={setFilters} />

        {loading ? (
          <Loading />
        ) : (
          <UserTable
            users={users}
            totalCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRefetch={refetch}
          />
        )}

        <AlertDialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {otpAction === 'enable'
                  ? t('users.otp.enableAllTitle')
                  : t('users.otp.disableAllTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {otpAction === 'enable'
                  ? t('users.otp.enableAllDescription')
                  : t('users.otp.disableAllDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkOtpUpdate}>
                {otpAction === 'enable' ? t('users.otp.enable') : t('users.otp.disable')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

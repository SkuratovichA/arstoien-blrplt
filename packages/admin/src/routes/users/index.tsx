import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { requireAuth } from '@/lib/auth-guard';
import { BULK_UPDATE_OTP_MUTATION, USERS_QUERY } from '@/graphql/users.graphql';
import { AdminLayout } from '@/components/layout/admin-layout';
import { UserTable } from '@/components/users/user-table';
import { UserFilters } from '@/components/users/user-filters';
import { Loading } from '@/components/shared/loading';
import { AddUserModal } from '@/components/users/add-user-modal';
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
} from '@arstoien/shared-ui';
import { MoreHorizontal, Shield, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

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
          status: string;
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
        toast.success(result.data.bulkUpdateOtp.message ?? t('OTP settings updated'));
        refetch();
      } else {
        toast.error(t('Failed to update OTP settings'));
      }
    } catch (error) {
      console.error('Bulk OTP update error:', error);
      toast.error(t('Failed to update OTP settings'));
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
            <h1 className="text-3xl font-bold tracking-tight">{t('Users')}</h1>
            <p className="text-muted-foreground">{t('Manage all users in the system')}</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  {t('Bulk Actions')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t('OTP Settings')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setOtpAction('enable');
                    setShowOtpDialog(true);
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t('Enable OTP for All Users')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setOtpAction('disable');
                    setShowOtpDialog(true);
                  }}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  {t('Disable OTP for All Users')}
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
                  ? t('Enable OTP for All Users?')
                  : t('Disable OTP for All Users?')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {otpAction === 'enable'
                  ? t(
                      'This will enable OTP authentication for all users in the system. Users will be able to sign in using OTP codes sent to their email addresses.'
                    )
                  : t(
                      'This will disable OTP authentication for all users in the system. Users will need to use passwords to sign in.'
                    )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkOtpUpdate}>
                {otpAction === 'enable' ? t('Enable OTP') : t('Disable OTP')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

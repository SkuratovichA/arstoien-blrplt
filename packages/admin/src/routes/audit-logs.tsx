import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { requireAuth } from '@/lib/auth-guard';
import { AUDIT_LOGS_QUERY } from '@/graphql/audit.graphql';
import { AdminLayout } from '@/components/layout/admin-layout';
import { DataTable } from '@/components/shared/data-table';
import { Loading } from '@/components/shared/loading';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@arstoien/shared-ui';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

const columnHelper = createColumnHelper();

export const Route = createFileRoute('/audit-logs')({
  beforeLoad: () => requireAuth(),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<{
    search: string;
    action: string | undefined;
    entity: string | undefined;
  }>({
    search: '',
    action: undefined,
    entity: undefined,
  });
  const [pagination] = useState({
    page: 1,
    pageSize: 20,
  });

  const { data, loading } = useQuery(AUDIT_LOGS_QUERY, {
    variables: pagination,
  });

  const auditLogs = data?.auditLogs || [];

  const columns = [
    columnHelper.accessor('action', {
      header: t('Action'),
      cell: (info) => (
        <span className="font-medium">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('entityType', {
      header: t('Entity'),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('userId', {
      header: t('User'),
      cell: (info) => {
        const userId = info.getValue();
        if (!userId) return <span className="text-muted-foreground">{t('System')}</span>;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{userId}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('ipAddress', {
      header: t('IP Address'),
      cell: (info) => (
        <span className="font-mono text-sm">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: t('Date'),
      cell: (info) => (
        <span className="text-sm">{new Date(info.getValue()).toLocaleString()}</span>
      ),
    }),
  ];

  const table = useReactTable({
    data: auditLogs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Audit Logs')}</h1>
          <p className="text-muted-foreground">
            {t('View all system activity and changes')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('Filters')}</CardTitle>
            <CardDescription>{t('Filter audit logs by action or entity')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                placeholder={t('Search...')}
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
              <Select
                value={filters.action}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, action: value || undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All Actions')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREATE">{t('Create')}</SelectItem>
                  <SelectItem value="UPDATE">{t('Update')}</SelectItem>
                  <SelectItem value="DELETE">{t('Delete')}</SelectItem>
                  <SelectItem value="LOGIN">{t('Login')}</SelectItem>
                  <SelectItem value="LOGOUT">{t('Logout')}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.entity}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, entity: value || undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All Entities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t('User')}</SelectItem>
                  <SelectItem value="SETTING">{t('Setting')}</SelectItem>
                  <SelectItem value="NOTIFICATION">{t('Notification')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Loading />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable table={table} />
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

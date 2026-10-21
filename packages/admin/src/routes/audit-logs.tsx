import { useQuery } from '@apollo/client/react';
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
} from '@blrplt/ui';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper, stockFeatures, useTable } from '@tanstack/react-table';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layout/admin-layout';
import { DataTable } from '@/components/shared/data-table';
import { Loading } from '@/components/shared/loading';
import type { AuditLogsQuery } from '@/gql/graphql';
import { AUDIT_LOGS_QUERY } from '@/graphql/audit.graphql';
import { requireAuth } from '@/lib/auth-guard';

type AuditLog = AuditLogsQuery['auditLogs'][number];

const columnHelper = createColumnHelper<typeof stockFeatures, AuditLog>();

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

  const auditLogs = data?.auditLogs ?? [];

  const columns = columnHelper.columns([
    columnHelper.accessor('action', {
      header: t('auditLogs.columnAction'),
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor('entityType', {
      header: t('auditLogs.columnEntity'),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('userId', {
      header: t('common.user'),
      cell: (info) => {
        const userId = info.getValue();
        if (!userId) return <span className="text-muted-foreground">{t('common.system')}</span>;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{userId}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('ipAddress', {
      header: t('auditLogs.columnIpAddress'),
      cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: t('auditLogs.columnDate'),
      cell: (info) => <span className="text-sm">{new Date(info.getValue()).toLocaleString()}</span>,
    }),
  ]);

  const table = useTable({
    features: stockFeatures,
    data: auditLogs,
    columns,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('auditLogs.title')}</h1>
          <p className="text-muted-foreground">{t('auditLogs.description')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('common.filters')}</CardTitle>
            <CardDescription>{t('auditLogs.filterDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                placeholder={t('auditLogs.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, action: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('auditLogs.allActions')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREATE">{t('auditLogs.actionCreate')}</SelectItem>
                  <SelectItem value="UPDATE">{t('auditLogs.actionUpdate')}</SelectItem>
                  <SelectItem value="DELETE">{t('auditLogs.actionDelete')}</SelectItem>
                  <SelectItem value="LOGIN">{t('auditLogs.actionLogin')}</SelectItem>
                  <SelectItem value="LOGOUT">{t('auditLogs.actionLogout')}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.entity}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, entity: value || undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('auditLogs.allEntities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t('auditLogs.entityUser')}</SelectItem>
                  <SelectItem value="SETTING">{t('auditLogs.entitySetting')}</SelectItem>
                  <SelectItem value="NOTIFICATION">{t('auditLogs.entityNotification')}</SelectItem>
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

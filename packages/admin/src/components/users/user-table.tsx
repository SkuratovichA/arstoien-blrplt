import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
} from '@arstoien/shared-ui';
import { DataTable } from '@/components/shared/data-table';
import { Eye } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  avatar?: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

interface UserTableProps {
  users: User[];
  totalCount: number;
  pagination: {
    skip: number;
    take: number;
  };
  onPaginationChange: (pagination: { skip: number; take: number }) => void;
  onRefetch: () => void;
}

const columnHelper = createColumnHelper<User>();

export function UserTable({ users, totalCount, pagination, onPaginationChange }: UserTableProps) {
  const { t } = useTranslation();

  const columns = [
    columnHelper.accessor('email', {
      header: t('User'),
      cell: (info) => {
        const user = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.avatar ?? undefined} />
              <AvatarFallback>
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('role', {
      header: t('Role'),
      cell: (info) => {
        const role = info.getValue();
        const variant =
          role === 'ADMIN' ? 'destructive' : role === 'MODERATOR' ? 'default' : 'secondary';
        return <Badge variant={variant}>{role}</Badge>;
      },
    }),
    columnHelper.accessor('status', {
      header: t('Status'),
      cell: (info) => {
        const status = info.getValue();
        const variant =
          status === 'ACTIVE' ? 'default' : status === 'PENDING' ? 'secondary' : 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
      },
    }),
    columnHelper.accessor('emailVerified', {
      header: t('Verified'),
      cell: (info) => (
        <Badge variant={info.getValue() ? 'default' : 'secondary'}>
          {info.getValue() ? t('Yes') : t('No')}
        </Badge>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: t('Joined'),
      cell: (info) => (
        <span className="text-sm">{new Date(info.getValue()).toLocaleDateString()}</span>
      ),
    }),
    columnHelper.accessor('lastLoginAt', {
      header: t('Last Login'),
      cell: (info) => {
        const date = info.getValue();
        return (
          <span className="text-sm">{date ? new Date(date).toLocaleDateString() : t('Never')}</span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: t('Actions'),
      cell: (info) => (
        <Link to="/users/$id" params={{ id: info.row.original.id }}>
          <Button size="sm" variant="ghost">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.take),
  });

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable table={table} />
        <div className="flex items-center justify-between border-t p-4">
          <div className="text-muted-foreground text-sm">
            {t('Showing')} {pagination.skip + 1} -{' '}
            {Math.min(pagination.skip + pagination.take, totalCount)} {t('of')} {totalCount}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  skip: Math.max(0, pagination.skip - pagination.take),
                })
              }
              disabled={pagination.skip === 0}
            >
              {t('Previous')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  skip: pagination.skip + pagination.take,
                })
              }
              disabled={pagination.skip + pagination.take >= totalCount}
            >
              {t('Next')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

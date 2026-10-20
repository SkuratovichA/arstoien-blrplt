import { useTranslation } from 'react-i18next';
import type { UserStatus } from '@/gql/graphql';

/** The variants of the Badge of @blrplt/ui that a status is shown with */
type StatusVariant = 'default' | 'secondary' | 'destructive';

/**
 * Every status of the server enum UserStatus with the badge variant that shows it.
 * The object is checked against the union that the code generation derives from schema.graphql, so a status that the schema adds or drops stops the type check here until the table follows; user-status.test.ts compares the table with the schema file itself.
 */
export const USER_STATUS_VARIANT = {
  ACTIVE: 'default',
  PENDING_APPROVAL: 'secondary',
  FRESHLY_CREATED_REQUIRES_PASSWORD: 'secondary',
  SUSPENDED: 'destructive',
  BLOCKED: 'destructive',
  REJECTED: 'destructive',
  DELETED: 'destructive',
} satisfies Record<UserStatus, StatusVariant>;

const STATUS_NAMES: readonly string[] = Object.keys(USER_STATUS_VARIANT);

export function isUserStatus(value: string): value is UserStatus {
  return STATUS_NAMES.includes(value);
}

/** Every status of the server enum, in the order of the table above */
export const USER_STATUSES: readonly UserStatus[] = STATUS_NAMES.filter(isUserStatus);

/** The translated name of a status; one t() call per status, so that the extraction of the keys sees every label */
export function useUserStatusLabel(): (status: UserStatus) => string {
  const { t } = useTranslation();

  return (status) => {
    switch (status) {
      case 'ACTIVE':
        return t('Active');
      case 'PENDING_APPROVAL':
        return t('Pending');
      case 'FRESHLY_CREATED_REQUIRES_PASSWORD':
        return t('Awaiting password');
      case 'SUSPENDED':
        return t('Suspended');
      case 'BLOCKED':
        return t('Banned');
      case 'REJECTED':
        return t('Rejected');
      case 'DELETED':
        return t('Deleted');
    }
  };
}

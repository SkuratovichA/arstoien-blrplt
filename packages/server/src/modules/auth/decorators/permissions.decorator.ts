import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export enum Resource {
  USER = 'USER',
  AUDIT_LOG = 'AUDIT_LOG',
  SETTINGS = 'SETTINGS',
  STATISTICS = 'STATISTICS',
  NOTIFICATION = 'NOTIFICATION',
}

export enum Action {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUSPEND = 'SUSPEND',
  EXPORT = 'EXPORT',
}

export interface Permission {
  resource: Resource;
  action: Action;
}

/**
 * Decorator to specify required permissions for a route
 * @param permissions Required permissions
 * @example
 * @Permissions({ resource: Resource.USER, action: Action.UPDATE })
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Shorthand decorators for common permission patterns
 */
export const RequireUserRead = () =>
  Permissions({ resource: Resource.USER, action: Action.READ });

export const RequireUserWrite = () =>
  Permissions({ resource: Resource.USER, action: Action.CREATE }, { resource: Resource.USER, action: Action.UPDATE });

export const RequireUserManagement = () =>
  Permissions(
    { resource: Resource.USER, action: Action.READ },
    { resource: Resource.USER, action: Action.UPDATE },
    { resource: Resource.USER, action: Action.APPROVE },
    { resource: Resource.USER, action: Action.REJECT }
  );

export const RequireFullUserControl = () =>
  Permissions(
    { resource: Resource.USER, action: Action.READ },
    { resource: Resource.USER, action: Action.CREATE },
    { resource: Resource.USER, action: Action.UPDATE },
    { resource: Resource.USER, action: Action.DELETE },
    { resource: Resource.USER, action: Action.APPROVE },
    { resource: Resource.USER, action: Action.REJECT },
    { resource: Resource.USER, action: Action.SUSPEND }
  );

export const RequireAuditLogAccess = () =>
  Permissions({ resource: Resource.AUDIT_LOG, action: Action.READ });

export const RequireStatisticsAccess = () =>
  Permissions({ resource: Resource.STATISTICS, action: Action.READ });

export const RequireSettingsManagement = () =>
  Permissions(
    { resource: Resource.SETTINGS, action: Action.READ },
    { resource: Resource.SETTINGS, action: Action.UPDATE }
  );
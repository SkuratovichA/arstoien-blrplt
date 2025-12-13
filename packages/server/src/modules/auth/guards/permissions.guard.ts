import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Permission, Resource, Action, PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;

    if (!user) {
      return false;
    }

    // Get user's permissions based on their role
    const userPermissions = this.getUserPermissions(user.role);

    // Check if user has all required permissions
    return requiredPermissions.every(required =>
      userPermissions.some(
        perm =>
          perm.resource === required.resource &&
          perm.action === required.action
      )
    );
  }

  /**
   * Maps user roles to their permissions
   * This is the central permission matrix for the application
   */
  private getUserPermissions(role: UserRole): Permission[] {
    const baseUserPermissions: Permission[] = [
      { resource: Resource.USER, action: Action.READ }, // Can read own profile
    ];

    const permissionMap: Record<UserRole, Permission[]> = {
      [UserRole.CUSTOMER]: baseUserPermissions,

      [UserRole.CARRIER]: baseUserPermissions,

      [UserRole.SUPPORT]: [
        ...baseUserPermissions,
        { resource: Resource.USER, action: Action.READ }, // Can read all users
        { resource: Resource.STATISTICS, action: Action.READ }, // Can view statistics
        { resource: Resource.NOTIFICATION, action: Action.CREATE }, // Can create support notifications
      ],

      [UserRole.MODERATOR]: [
        ...baseUserPermissions,
        { resource: Resource.USER, action: Action.READ }, // Can read all users
        { resource: Resource.USER, action: Action.UPDATE }, // Can update user status
        { resource: Resource.USER, action: Action.APPROVE }, // Can approve users
        { resource: Resource.USER, action: Action.REJECT }, // Can reject users
        { resource: Resource.USER, action: Action.SUSPEND }, // Can suspend users
        { resource: Resource.AUDIT_LOG, action: Action.READ }, // Can view audit logs
        { resource: Resource.STATISTICS, action: Action.READ }, // Can view statistics
        { resource: Resource.NOTIFICATION, action: Action.CREATE }, // Can create notifications
        { resource: Resource.NOTIFICATION, action: Action.READ }, // Can read notifications
      ],

      [UserRole.MANAGER]: [
        ...baseUserPermissions,
        { resource: Resource.USER, action: Action.READ }, // Full user read
        { resource: Resource.USER, action: Action.CREATE }, // Can create users
        { resource: Resource.USER, action: Action.UPDATE }, // Can update users
        { resource: Resource.USER, action: Action.DELETE }, // Can delete users
        { resource: Resource.USER, action: Action.APPROVE }, // Can approve users
        { resource: Resource.USER, action: Action.REJECT }, // Can reject users
        { resource: Resource.USER, action: Action.SUSPEND }, // Can suspend users
        { resource: Resource.AUDIT_LOG, action: Action.READ }, // Full audit log access
        { resource: Resource.AUDIT_LOG, action: Action.EXPORT }, // Can export audit logs
        { resource: Resource.STATISTICS, action: Action.READ }, // Can view statistics
        { resource: Resource.STATISTICS, action: Action.EXPORT }, // Can export statistics
        { resource: Resource.SETTINGS, action: Action.READ }, // Can read settings
        { resource: Resource.SETTINGS, action: Action.UPDATE }, // Can update settings
        { resource: Resource.NOTIFICATION, action: Action.CREATE }, // Can create notifications
        { resource: Resource.NOTIFICATION, action: Action.READ }, // Can read notifications
        { resource: Resource.NOTIFICATION, action: Action.UPDATE }, // Can update notifications
        { resource: Resource.NOTIFICATION, action: Action.DELETE }, // Can delete notifications
      ],

      [UserRole.ADMIN]: [
        ...baseUserPermissions,
        { resource: Resource.USER, action: Action.READ }, // Full user read
        { resource: Resource.USER, action: Action.CREATE }, // Can create users
        { resource: Resource.USER, action: Action.UPDATE }, // Can update users
        { resource: Resource.USER, action: Action.APPROVE }, // Can approve users
        { resource: Resource.USER, action: Action.REJECT }, // Can reject users
        { resource: Resource.USER, action: Action.SUSPEND }, // Can suspend users
        { resource: Resource.AUDIT_LOG, action: Action.READ }, // Can view audit logs
        { resource: Resource.STATISTICS, action: Action.READ }, // Can view statistics
        { resource: Resource.SETTINGS, action: Action.READ }, // Can read settings
        { resource: Resource.NOTIFICATION, action: Action.CREATE }, // Can create notifications
        { resource: Resource.NOTIFICATION, action: Action.READ }, // Can read notifications
        { resource: Resource.NOTIFICATION, action: Action.UPDATE }, // Can update notifications
      ],

      [UserRole.SUPER_ADMIN]: [
        // Super admin has all permissions
        { resource: Resource.USER, action: Action.READ },
        { resource: Resource.USER, action: Action.CREATE },
        { resource: Resource.USER, action: Action.UPDATE },
        { resource: Resource.USER, action: Action.DELETE },
        { resource: Resource.USER, action: Action.APPROVE },
        { resource: Resource.USER, action: Action.REJECT },
        { resource: Resource.USER, action: Action.SUSPEND },
        { resource: Resource.USER, action: Action.EXPORT },
        { resource: Resource.AUDIT_LOG, action: Action.READ },
        { resource: Resource.AUDIT_LOG, action: Action.CREATE },
        { resource: Resource.AUDIT_LOG, action: Action.UPDATE },
        { resource: Resource.AUDIT_LOG, action: Action.DELETE },
        { resource: Resource.AUDIT_LOG, action: Action.EXPORT },
        { resource: Resource.SETTINGS, action: Action.READ },
        { resource: Resource.SETTINGS, action: Action.CREATE },
        { resource: Resource.SETTINGS, action: Action.UPDATE },
        { resource: Resource.SETTINGS, action: Action.DELETE },
        { resource: Resource.STATISTICS, action: Action.READ },
        { resource: Resource.STATISTICS, action: Action.CREATE },
        { resource: Resource.STATISTICS, action: Action.UPDATE },
        { resource: Resource.STATISTICS, action: Action.DELETE },
        { resource: Resource.STATISTICS, action: Action.EXPORT },
        { resource: Resource.NOTIFICATION, action: Action.READ },
        { resource: Resource.NOTIFICATION, action: Action.CREATE },
        { resource: Resource.NOTIFICATION, action: Action.UPDATE },
        { resource: Resource.NOTIFICATION, action: Action.DELETE },
      ],
    };

    return permissionMap[role] || [];
  }
}
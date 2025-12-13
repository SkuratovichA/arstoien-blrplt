import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuthStore } from '../lib/auth-store';
import { requireAuth, requireEmailVerified, type AuthGuardContext } from '../lib/auth-guard';
import { UserRole } from '@/gql/graphql';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    requireAuth(context as AuthGuardContext);
    requireEmailVerified(context as AuthGuardContext);
  },
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuthStore();

  // Redirect based on user role
  if (user?.role === UserRole.Customer) {
    return <Navigate to="/dashboard/customer" />;
  } else if (user?.role === UserRole.Carrier) {
    return <Navigate to="/dashboard/carrier" />;
  } else if (
    user?.role === UserRole.Admin ||
    user?.role === UserRole.Moderator ||
    user?.role === UserRole.Manager ||
    user?.role === UserRole.SuperAdmin
  ) {
    // For admin/moderator/manager roles, redirect to admin dashboard
    return <Navigate to="/admin" />;
  } else {
    // Default fallback - redirect to customer dashboard or show a loading/error state
    // This handles cases where role might not be set yet
    return <Navigate to="/dashboard/customer" />;
  }
}

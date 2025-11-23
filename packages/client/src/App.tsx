import { RouterProvider } from '@tanstack/react-router';
import { router, useRouterContext } from './router';

export function App() {
  const context = useRouterContext();

  return <RouterProvider router={router} context={context} />;
}

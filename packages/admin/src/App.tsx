import { Outlet } from '@tanstack/react-router';
import { Toaster } from 'react-hot-toast';

export function App() {
  return (
    <>
      <Outlet />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </>
  );
}

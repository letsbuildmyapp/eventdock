import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgb(var(--panel))',
          color: 'rgb(var(--ink))',
          border: '2px solid rgb(var(--ink))',
          borderRadius: '16px',
          boxShadow: '4px 4px 0 0 rgb(var(--ink))',
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 500,
        },
      }}
    />
  );
}

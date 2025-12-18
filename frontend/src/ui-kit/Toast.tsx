/**
 * Toast - Wrapper para react-hot-toast usando tokens
 * Usa react-hot-toast internamente, mas com estilos baseados em tokens
 */
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { tokens } from './tokens';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: tokens.colors.card.default,
          color: tokens.colors.text.body,
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: tokens.borderRadius.card,
          padding: tokens.spacing.md,
          fontFamily: tokens.typography.fontFamily,
          fontSize: tokens.typography.fontSize.body.sm,
        },
        success: {
          iconTheme: {
            primary: tokens.colors.primary.default,
            secondary: tokens.colors.background,
          },
        },
        error: {
          iconTheme: {
            primary: tokens.colors.danger,
            secondary: tokens.colors.background,
          },
        },
      }}
    />
  );
}

// Re-export toast functions for convenience
export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  loading: (message: string) => hotToast.loading(message),
  dismiss: (toastId?: string) => hotToast.dismiss(toastId),
};


import { useMemo } from 'react';

import { useSonner } from 'sonner';

export const useToastOverlay = () => {
  const { toasts } = useSonner();

  return useMemo(() => {
    // Check if there are any active toasts
    const hasToasts = toasts.length > 0;

    // Determine the overlay type based on toast types
    const getOverlayGradient = () => {
      if (!hasToasts) return '';

      // Check for success toasts
      const hasSuccess = toasts.some(
        toast =>
          toast.className?.includes('toast-type-success') ||
          toast.type === 'success'
      );

      // Check for error toasts
      const hasError = toasts.some(
        toast =>
          toast.className?.includes('toast-type-error') ||
          toast.type === 'error'
      );

      // Check for warning toasts
      const hasWarning = toasts.some(
        toast =>
          toast.className?.includes('toast-type-warning') ||
          toast.type === 'warning'
      );

      // Check for info toasts
      const hasInfo = toasts.some(toast =>
        toast.className?.includes('toast-type-info')
      );

      // Priority: Error > Warning > Success > Info > Default
      if (hasError) {
        return 'linear-gradient(0deg, rgba(127, 16, 16, 0.50) -2.6%, rgba(255, 255, 255, 0.00) 100%)';
      }
      if (hasWarning) {
        return 'linear-gradient(0deg, rgba(123, 127, 16, 0.50) -2.6%, rgba(255, 255, 255, 0.00) 100%)';
      }
      if (hasSuccess) {
        return 'linear-gradient(0deg, rgba(7, 96, 11, 0.50) -2.6%, rgba(255, 255, 255, 0.00) 100%)';
      }
      if (hasInfo) {
        return 'linear-gradient(0deg, rgba(59, 130, 246, 0.50) -2.6%, rgba(255, 255, 255, 0.00) 100%)';
      }

      // Default black overlay for custom or other types
      return 'rgba(0, 0, 0, 0.5)';
    };

    return {
      hasToasts,
      overlayGradient: getOverlayGradient(),
    };
  }, [toasts]);
};

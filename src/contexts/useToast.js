import { useContext } from 'react';
import ToastContext from './toastContextValue';

/**
 * Hook to access the toast API.
 * @returns {{ showToast: (opts: { message: string, type?: 'success'|'error'|'info', duration?: number }) => void }}
 */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

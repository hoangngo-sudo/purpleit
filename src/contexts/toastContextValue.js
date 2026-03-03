import { createContext } from 'react';

/**
 * React context for the toast notification system.
 * Use `useToast()` hook to consume.
 */
const ToastContext = createContext(null);

export default ToastContext;

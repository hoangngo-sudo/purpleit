import { useCallback, useReducer } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import ToastContext from './toastContextValue';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let nextId = 0;

const ICON_MAP = {
  success: 'bi-check-circle-fill',
  error: 'bi-exclamation-triangle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

const BG_MAP = {
  success: 'text-bg-success',
  error: 'text-bg-danger',
  warning: 'text-bg-warning',
  info: 'text-bg-primary',
};

const DEFAULT_DURATION = {
  success: 4000,
  error: 6000,
  warning: 4000,
  info: 4000,
};

/* ------------------------------------------------------------------ */
/*  Single Toast                                                       */
/* ------------------------------------------------------------------ */

const Toast = ({ toast, onClose }) => {
  const icon = ICON_MAP[toast.type] || ICON_MAP.info;
  const bg = BG_MAP[toast.type] || BG_MAP.info;
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`toast show ${bg} border-0 mb-2`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ minWidth: '280px', willChange: 'transform, opacity' }}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
      }
      onAnimationComplete={(definition) => {
        if (definition === 'exit') onClose(toast.id);
      }}
    >
      <div className="toast-body d-flex align-items-center gap-2">
        <i className={`bi ${icon} fs-5`}></i>
        <span className="flex-grow-1">{toast.message}</span>
        <button
          type="button"
          className={`btn-close ${toast.type === 'warning' ? '' : 'btn-close-white'} ms-2`}
          aria-label="Close"
          onClick={() => onClose(toast.id)}
        />
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Container (portal, fixed bottom-right)                             */
/* ------------------------------------------------------------------ */

const ToastContainer = ({ toasts, onClose }) =>
  createPortal(
    <div
      className="position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1090 }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD':
      return [...state, { id: action.id, message: action.message, type: action.toastType }];
    case 'REMOVE':
      return state.filter(t => t.id !== action.id);
    default:
      return state;
  }
};

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export const ToastProvider = ({ children }) => {
  const [toasts, dispatch] = useReducer(reducer, []);

  const showToast = useCallback(
    ({ message, type = 'info', duration } = {}) => {
      const id = ++nextId;
      const ms = duration ?? DEFAULT_DURATION[type] ?? 4000;

      dispatch({ type: 'ADD', id, message, toastType: type });

      if (ms > 0) {
        setTimeout(() => dispatch({ type: 'REMOVE', id }), ms);
      }
    },
    [], // dispatch is stable — no deps needed
  );

  const handleClose = (id) => dispatch({ type: 'REMOVE', id });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={handleClose} />
    </ToastContext.Provider>
  );
};


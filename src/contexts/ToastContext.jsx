import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
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

const Toast = ({ toast, onStartClose, onClose }) => {
  const icon = ICON_MAP[toast.type] || ICON_MAP.info;
  const bg = BG_MAP[toast.type] || BG_MAP.info;

  return (
    <div
      className={`toast show ${bg} border-0 mb-2`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        minWidth: '280px',
        animation: toast.closing ? 'fadeOutDown .25s ease forwards' : 'fadeInUp .25s ease',
      }}
      onAnimationEnd={() => { if (toast.closing) onClose(toast.id); }}
    >
      <div className="toast-body d-flex align-items-center gap-2">
        <i className={`bi ${icon} fs-5`}></i>
        <span className="flex-grow-1">{toast.message}</span>
        <button
          type="button"
          className={`btn-close ${toast.type === 'warning' ? '' : 'btn-close-white'} ms-2`}
          aria-label="Close"
          onClick={() => onStartClose(toast.id)}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Container (portal, fixed bottom-right)                             */
/* ------------------------------------------------------------------ */

const ToastContainer = ({ toasts, onStartClose, onClose }) =>
  createPortal(
    <div
      className="position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1090 }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onStartClose={onStartClose} onClose={onClose} />
      ))}
    </div>,
    document.body,
  );

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Mark a toast as closing so it plays the exit animation; actual removal
  // happens in Toast's onAnimationEnd handler.
  const startClose = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
    );
  }, []);

  const showToast = useCallback(
    ({ message, type = 'info', duration } = {}) => {
      const id = ++nextId;
      const ms = duration ?? DEFAULT_DURATION[type] ?? 4000;

      setToasts((prev) => [...prev, { id, message, type }]);

      if (ms > 0) {
        setTimeout(() => startClose(id), ms);
      }
    },
    [startClose],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onStartClose={startClose} onClose={removeToast} />
    </ToastContext.Provider>
  );
};


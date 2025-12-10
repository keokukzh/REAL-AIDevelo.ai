import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const ToastItem: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const Icon = icons[toast.type];
  const duration = toast.duration || 5000;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, toast.id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 p-4 rounded-lg border ${colors[toast.type]} min-w-[300px] max-w-md`}
    >
      <Icon size={20} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-current opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast Hook/Context (simplified version)
let toastIdCounter = 0;
const toastListeners: Array<(toast: Toast) => void> = [];

export const toast = {
  success: (message: string, duration?: number) => {
    const toast: Toast = { id: `toast-${++toastIdCounter}`, type: 'success', message, duration };
    toastListeners.forEach((listener) => listener(toast));
  },
  error: (message: string, duration?: number) => {
    const toast: Toast = { id: `toast-${++toastIdCounter}`, type: 'error', message, duration };
    toastListeners.forEach((listener) => listener(toast));
  },
  warning: (message: string, duration?: number) => {
    const toast: Toast = { id: `toast-${++toastIdCounter}`, type: 'warning', message, duration };
    toastListeners.forEach((listener) => listener(toast));
  },
  info: (message: string, duration?: number) => {
    const toast: Toast = { id: `toast-${++toastIdCounter}`, type: 'info', message, duration };
    toastListeners.forEach((listener) => listener(toast));
  },
};

// React Hook for using toasts
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToast: Toast) => {
      setToasts((prev) => [...prev, newToast]);
    };
    toastListeners.push(listener);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, removeToast };
};



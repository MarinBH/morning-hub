"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-[--radius-md] bg-surface border border-border shadow-xl shadow-black/30 animate-[toast-in_200ms_ease-out]"
          >
            {t.type === "success" && <CheckCircle2 size={15} className="text-success flex-shrink-0" />}
            {t.type === "error" && <AlertCircle size={15} className="text-error flex-shrink-0" />}
            {t.type === "info" && <AlertCircle size={15} className="text-accent flex-shrink-0" />}
            <span className="text-[13px] text-text-primary font-medium flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="p-0.5 text-muted hover:text-text-secondary flex-shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

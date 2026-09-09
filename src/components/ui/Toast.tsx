"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => {
          let bg = "bg-slate-900 text-white border-slate-700";
          let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;

          if (t.type === "success") {
            bg = "bg-emerald-900/95 text-white border-emerald-700";
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (t.type === "error") {
            bg = "bg-rose-900/95 text-white border-rose-700";
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          } else if (t.type === "warning") {
            bg = "bg-amber-900/95 text-white border-amber-700";
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur transition-all duration-300 transform translate-y-0 ${bg}`}
            >
              {icon}
              <div className="flex-1 text-sm">
                {t.title && <div className="font-semibold">{t.title}</div>}
                <div className="text-slate-200">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

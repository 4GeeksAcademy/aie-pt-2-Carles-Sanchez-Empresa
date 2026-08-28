"use client";

import { useEffect } from "react";

export function SuccessToast({
  message,
  visible,
  onClose,
  duration = 3000,
}: {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [visible, onClose, duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-12 pointer-events-none">
      <div className="pointer-events-auto animate-slide-down rounded-xl border border-green-300 bg-green-50 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
      </div>
    </div>
  );
}
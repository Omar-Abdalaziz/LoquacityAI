import React, { useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from './icons';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-dismiss after 4 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 w-full max-w-md p-4 rounded-xl shadow-lg border animate-pop-in
        ${isSuccess 
            ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200'
        }`}
      role="alert"
    >
      {isSuccess ? 
        <CheckCircleIcon className="w-6 h-6 text-green-500" /> : 
        <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
      }
      <p className="font-semibold text-sm">{message}</p>
    </div>
  );
};

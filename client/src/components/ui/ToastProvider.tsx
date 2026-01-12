import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          top: 80,
        }}
        toastOptions={{
          duration: 4000,
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          },
        }}
      />
    </>
  );
};

// Hook for using toast
export const useToast = () => {
  return {
    success: toast.success,
    error: toast.error,
    loading: toast.loading,
    promise: toast.promise,
    dismiss: toast.dismiss,
  };
};

import toast, { Toast, ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    maxWidth: '500px',
  },
};

export const toastHelper = {
  /**
   * Show success toast
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, { ...defaultOptions, ...options });
  },

  /**
   * Show error toast
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, { ...defaultOptions, ...options });
  },

  /**
   * Show info toast
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      icon: 'ℹ️',
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      icon: '⚠️',
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #ff9800',
      },
    });
  },

  /**
   * Show loading toast
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, { ...defaultOptions, ...options });
  },

  /**
   * Show promise toast (automatically handles loading, success, error states)
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, { ...defaultOptions, ...options });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Custom toast with custom content
   */
  custom: (content: React.ReactNode, options?: ToastOptions) => {
    return toast.custom(content, { ...defaultOptions, ...options });
  },

  /**
   * Update an existing toast
   */
  update: (toastId: string, options: Partial<Toast>) => {
    // Note: react-hot-toast doesn't have a direct update method
    // We dismiss the old one and create a new one
    toast.dismiss(toastId);
    if (options.type === 'success') {
      return toast.success(options.message || '', { id: toastId });
    } else if (options.type === 'error') {
      return toast.error(options.message || '', { id: toastId });
    }
    return toast(options.message || '', { id: toastId });
  },
};

// Export individual functions for convenience
export const { success, error, info, warning, loading, promise, dismiss, dismissAll, custom } =
  toastHelper;

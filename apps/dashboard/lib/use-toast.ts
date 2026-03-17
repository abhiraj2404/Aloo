import toast from "react-hot-toast";

export interface ToastOptions {
  duration?: number;
  id?: string;
}

export class ToastManager {
  static success(message: string, options?: ToastOptions) {
    return toast.success(message, options);
  }

  static error(message: string, options?: ToastOptions) {
    return toast.error(message, options);
  }

  static loading(message: string, options?: ToastOptions) {
    return toast.loading(message, options);
  }

  static dismiss(toastId?: string) {
    return toast.dismiss(toastId);
  }

  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) {
    return toast.promise(promise, messages, options);
  }
}

export function useToast() {
  return {
    success: ToastManager.success,
    error: ToastManager.error,
    loading: ToastManager.loading,
    dismiss: ToastManager.dismiss,
    promise: ToastManager.promise,
  };
}
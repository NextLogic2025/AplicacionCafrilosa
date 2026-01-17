import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { ToastNotification, ToastType } from '../components/ui/ToastNotification';
import { registerToastHandler, unregisterToastHandler } from '../utils/toastService';

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType; duration: number } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'success', duration = 2000) => {
        setToast({ message, type, duration });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    useEffect(() => {
        registerToastHandler(showToast);
        return () => unregisterToastHandler();
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <ToastNotification
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onHide={hideToast}
                />
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

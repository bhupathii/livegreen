import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, Heart, ShoppingCart, AlertCircle } from "lucide-react";

type ToastType = "success" | "error" | "cart" | "wishlist";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = ++toastId;
        setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    }, []);

    const icons = {
        success: <Check className="h-4 w-4" />,
        error: <AlertCircle className="h-4 w-4" />,
        cart: <ShoppingCart className="h-4 w-4" />,
        wishlist: <Heart className="h-4 w-4 fill-current" />,
    };

    const colors = {
        success: "bg-[#1B5E20] text-white",
        error: "bg-red-600 text-white",
        cart: "bg-[#1B5E20] text-white",
        wishlist: "bg-pink-600 text-white",
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-20 right-4 z-[200] space-y-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 100, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.9 }}
                            className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl ${colors[toast.type]} min-w-[250px]`}
                        >
                            <div className="flex-shrink-0">{icons[toast.type]}</div>
                            <p className="text-sm font-medium font-inter flex-1">{toast.message}</p>
                            <button onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))} className="flex-shrink-0 opacity-60 hover:opacity-100 cursor-pointer">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be inside ToastProvider");
    return ctx;
}

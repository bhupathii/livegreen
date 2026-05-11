import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/lib/api";

interface WishlistContextType {
    wishlistIds: number[];
    addToWishlist: (productId: number) => void;
    removeFromWishlist: (productId: number) => void;
    isInWishlist: (productId: number) => boolean;
    toggleWishlist: (productId: number) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
        const saved = localStorage.getItem("wishlist");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Handle transition from old format (objects) to new format (ids)
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
                    return parsed.map((p: any) => p.id);
                }
                return parsed;
            } catch {
                return [];
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem("wishlist", JSON.stringify(wishlistIds));
    }, [wishlistIds]);

    const addToWishlist = (productId: number) => {
        setWishlistIds((prev) => prev.includes(productId) ? prev : [...prev, productId]);
    };

    const removeFromWishlist = (productId: number) => {
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
    };

    const isInWishlist = (productId: number) => wishlistIds.includes(productId);

    const toggleWishlist = (productId: number) => {
        if (isInWishlist(productId)) removeFromWishlist(productId);
        else addToWishlist(productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlistIds, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) throw new Error("useWishlist must be used within WishlistProvider");
    return context;
}

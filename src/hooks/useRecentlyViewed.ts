import { useState, useEffect } from "react";
import { Product } from "@/lib/api";

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
    const [items, setItems] = useState<Product[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setItems(JSON.parse(stored));
        } catch { }
    }, []);

    const addItem = (product: Product) => {
        setItems(prev => {
            const filtered = prev.filter(p => p.id !== product.id);
            const updated = [product, ...filtered].slice(0, MAX_ITEMS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const clearAll = () => {
        localStorage.removeItem(STORAGE_KEY);
        setItems([]);
    };

    return { items, addItem, clearAll };
}

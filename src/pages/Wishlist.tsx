import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getProducts, Product } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Heart, Trash2, ArrowRight, Sparkles, Star, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Wishlist() {
    const { wishlistIds, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [likedProducts, setLikedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProducts().then((res) => {
            setProducts(res);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            setLikedProducts(products.filter((p) => wishlistIds.includes(p.id)));
        } else {
            setLikedProducts([]);
        }
    }, [wishlistIds, products]);

    const handleAddToCart = (product: Product) => {
        addToCart(product, 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1B5E20]"></div>
                    <p className="text-xs text-[#1B5E20]/40 uppercase tracking-widest font-inter">Loading Wishlist...</p>
                </div>
            </div>
        );
    }

    if (likedProducts.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] text-center px-4">
                <div className="h-24 w-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                    <Heart className="h-10 w-10 text-rose-500/20" />
                </div>
                <h2 className="text-3xl font-bold text-[#1B5E20] font-serif mb-4">Your wishlist is empty</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8 font-inter leading-relaxed">
                    Looks like you haven't saved any of our raw, organic harvests yet. Explore our collection and save your favorites!
                </p>
                <Link to="/shop">
                    <Button className="rounded-full px-10 py-6 text-sm font-black uppercase tracking-widest bg-[#1B5E20] hover:bg-[#144a18] shadow-xl shadow-green-900/10">
                        Explore Collection
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-gray-100 pb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                <Heart className="h-4 w-4 fill-current" />
                            </div>
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.3em] font-inter">Favorites</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-[#1B5E20] font-serif tracking-tight">Your Wishlist</h1>
                    </div>
                    <p className="text-sm text-gray-500 font-inter italic">
                        You have {likedProducts.length} item{likedProducts.length !== 1 ? 's' : ''} saved for later
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {likedProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-green-900/5 transition-all duration-500"
                            >
                                <Link to={`/product/${product.id}`} className="block">
                                    <div className="aspect-[4/5] overflow-hidden relative bg-[#F9FBF9]">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                removeFromWishlist(product.id);
                                            }}
                                            className="absolute top-6 right-6 h-10 w-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-lg transition-all hover:scale-110 z-10 border border-gray-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>

                                        {product.originalPrice > product.price && (
                                            <div className="absolute top-6 left-6 bg-[#1B5E20] text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                                Sale
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-bold text-honey uppercase tracking-widest font-inter">{product.category}</span>
                                        <div className="flex items-center gap-1 text-honey">
                                            <Star className="h-3 w-3 fill-current" />
                                            <span className="text-[10px] font-bold text-[#1B5E20] ml-1 font-inter">4.9</span>
                                        </div>
                                    </div>

                                    <Link to={`/product/${product.id}`}>
                                        <h3 className="font-serif text-2xl font-bold text-[#1B5E20] hover:text-[#2E7D32] transition-colors mb-3 line-clamp-1">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <div className="flex items-baseline gap-3 mb-6">
                                        <span className="text-2xl font-bold text-[#1B5E20] font-serif">₹{product.price}</span>
                                        {product.originalPrice > product.price && (
                                            <span className="text-xs text-gray-400 line-through font-inter italic">₹{product.originalPrice}</span>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleAddToCart(product)}
                                            className="flex-1 rounded-full h-12 bg-[#1B5E20] hover:bg-[#144a18] text-cream font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-900/10 transition-all"
                                        >
                                            <ShoppingBag className="h-3.5 w-3.5" /> Buy Now
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Explore More Section */}
                <div className="mt-24 pt-16 border-t border-gray-100 text-center">
                    <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full text-forest text-xs font-bold mb-6">
                        <Sparkles className="h-3 w-3 text-honey" />
                        <span>Handpicked for you</span>
                    </div>
                    <h2 className="text-3xl font-bold text-forest font-serif mb-10">Continue Shopping</h2>
                    <Link to="/shop">
                        <Button variant="outline" className="rounded-full px-8 h-12 border-forest/10 hover:border-forest/30 text-forest text-xs font-black uppercase tracking-widest flex items-center gap-3">
                            View All Products <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

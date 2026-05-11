import React, { useState, useEffect } from "react";
import { getReviews, updateReviewStatus, Review } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, Star, ShieldCheck, XCircle } from "lucide-react";
import { motion } from "motion/react";

export function ReviewsTab() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getReviews();
        setReviews(data);
    };

    const handleUpdateStatus = async (id: number, currentStatus: string, newStatus: string) => {
        if (currentStatus === newStatus) return;
        await updateReviewStatus(id, newStatus);
        loadData();
    };

    const filteredItems = reviews.filter(r =>
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.productName && r.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.comment.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Product Reviews</h2>
                    <p className="text-gray-500 mt-1">Moderate customer reviews before they appear publicly.</p>
                </div>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search by customer, product, or comment..."
                    className="pl-12 h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-3xl border border-gray-100">
                        No reviews found matching your search.
                    </div>
                ) : (
                    filteredItems.map(review => (
                        <motion.div key={review.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{review.customerName}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{new Date(review.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-lg">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="font-bold text-sm">{review.rating}.0</span>
                                </div>
                            </div>

                            <div className="mb-4 text-sm font-medium text-[#1B5E20] bg-green-50 px-3 py-1.5 rounded-xl inline-block w-fit">
                                {review.productName || `Product ID: ${review.productId}`}
                            </div>

                            <div className="flex-1">
                                <p className="text-sm text-gray-600 italic leading-relaxed">
                                    "{review.comment}"
                                </p>
                            </div>

                            <div className="border-t border-gray-50 mt-6 pt-4 flex items-center justify-between">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                  ${review.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                        review.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}
                                >
                                    {review.status}
                                </span>

                                <div className="flex gap-2">
                                    {review.status !== 'approved' && (
                                        <button
                                            onClick={() => handleUpdateStatus(review.id, review.status, 'approved')}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                                            title="Approve Review"
                                        >
                                            <ShieldCheck className="w-5 h-5" />
                                        </button>
                                    )}
                                    {review.status !== 'rejected' && (
                                        <button
                                            onClick={() => handleUpdateStatus(review.id, review.status, 'rejected')}
                                            className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
                                            title="Reject Review"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

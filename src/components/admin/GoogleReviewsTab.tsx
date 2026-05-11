import React, { useState, useEffect } from "react";
import { Star, Plus, Trash2, Eye, EyeOff, Edit2, X, Save, ExternalLink } from "lucide-react";
import { getGoogleReviewsAdmin, createGoogleReview, updateGoogleReview, deleteGoogleReview, GoogleReview, getProducts, Product } from "@/lib/api";

export function GoogleReviewsTab() {
    const [reviews, setReviews] = useState<GoogleReview[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [aggregate, setAggregate] = useState({ rating: "4.9", totalReviews: "0", mapsUrl: "" });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({ reviewerName: "", rating: 5, reviewText: "", reviewDate: "", product_id: null as number | null });

    const loadReviews = async () => {
        try {
            const data = await getGoogleReviewsAdmin();
            setReviews(data.reviews);
            setAggregate(data.aggregate);
            const prods = await getProducts();
            setProducts(prods);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { loadReviews(); }, []);

    const handleSave = async () => {
        try {
            if (editId) {
                await updateGoogleReview(editId, { ...form, isVisible: 1 });
            } else {
                await createGoogleReview({ ...form, isVisible: 1 });
            }
            setShowForm(false); setEditId(null);
            setForm({ reviewerName: "", rating: 5, reviewText: "", reviewDate: "", product_id: null });
            loadReviews();
        } catch (e) { console.error(e); }
    };

    const handleEdit = (r: GoogleReview) => {
        setForm({ reviewerName: r.reviewerName, rating: r.rating, reviewText: r.reviewText, reviewDate: r.reviewDate, product_id: r.product_id || null });
        setEditId(r.id); setShowForm(true);
    };

    const handleToggle = async (r: GoogleReview) => {
        try {
            await updateGoogleReview(r.id, { isVisible: r.isVisible ? 0 : 1 } as any);
            loadReviews();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this review?")) return;
        try { await deleteGoogleReview(id); loadReviews(); } catch (e) { console.error(e); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Google Reviews...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-[#1B5E20]">Google Reviews</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage reviews displayed on your website. Add reviews from your Google Maps listing manually.</p>
                </div>
                <div className="flex gap-3">
                    {aggregate.mapsUrl && (
                        <a href={aggregate.mapsUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            <ExternalLink className="h-4 w-4" /> View on Google
                        </a>
                    )}
                    <button onClick={() => { setShowForm(true); setEditId(null); setForm({ reviewerName: "", rating: 5, reviewText: "", reviewDate: "", product_id: null }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1B5E20] text-white rounded-xl text-sm font-medium hover:bg-[#144a18] transition-colors">
                        <Plus className="h-4 w-4" /> Add Review
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Google Rating</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-3xl font-bold text-gray-900">{aggregate.rating}</span>
                        <Star className="h-6 w-6 text-yellow-400 fill-current" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Total Reviews (Google)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{aggregate.totalReviews}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Displayed on Website</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{reviews.filter(r => r.isVisible === 1).length}</p>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{editId ? "Edit Review" : "Add New Review"}</h3>
                        <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Reviewer Name</label>
                            <input type="text" value={form.reviewerName} onChange={e => setForm({ ...form, reviewerName: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none" placeholder="e.g., Priya Sharma" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Review Date</label>
                            <input type="text" value={form.reviewDate} onChange={e => setForm({ ...form, reviewDate: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none" placeholder="e.g., 2 weeks ago" />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Product (Optional)</label>
                        <select value={form.product_id || ""} onChange={e => setForm({ ...form, product_id: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none bg-white">
                            <option value="">General Site Review (No Product)</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button key={s} onClick={() => setForm({ ...form, rating: s })}
                                    className={`h-8 w-8 rounded flex items-center justify-center transition-colors ${form.rating >= s ? "text-yellow-400" : "text-gray-200"}`}>
                                    <Star className="h-5 w-5 fill-current" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Review Text</label>
                        <textarea value={form.reviewText} onChange={e => setForm({ ...form, reviewText: e.target.value })}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none h-24 resize-none" placeholder="Paste the review text from Google..." />
                    </div>
                    <button onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-medium hover:bg-[#144a18]">
                        <Save className="h-4 w-4" /> {editId ? "Update Review" : "Save Review"}
                    </button>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-3">
                {reviews.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                        <p className="text-gray-400">No reviews yet. Add reviews from your Google Maps listing.</p>
                    </div>
                ) : (
                    reviews.map(r => (
                        <div key={r.id} className={`bg-white rounded-xl p-5 border transition-all ${r.isVisible ? "border-gray-100" : "border-red-100 opacity-60"}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-sm font-bold text-[#1B5E20] flex-shrink-0">
                                        {r.reviewerName[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 text-sm">{r.reviewerName}</span>
                                            {r.product_id && products.find(p => p.id === r.product_id) && (
                                                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                                                    {products.find(p => p.id === r.product_id)?.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex text-yellow-400">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div>
                                            <span className="text-xs text-gray-400">{r.reviewDate}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">{r.reviewText}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                                    <button onClick={() => handleToggle(r)} className={`p-2 rounded-lg transition-colors ${r.isVisible ? "text-green-600 hover:bg-green-50" : "text-red-400 hover:bg-red-50"}`} title={r.isVisible ? "Hide" : "Show"}>
                                        {r.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </button>
                                    <button onClick={() => handleEdit(r)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600" title="Edit">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500" title="Delete">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

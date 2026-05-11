import React, { useState, useEffect } from "react";
import {
    Calendar, User, Mail, Package, CheckCircle, XCircle,
    PauseCircle, PlayCircle, Clock, RefreshCw, Search, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { getAllSubscriptions, updateAdminSubscriptionStatus } from "@/lib/api";

interface Subscription {
    id: number;
    order_id: string;
    customer_name: string;
    customer_email: string;
    product_id: number;
    product_name: string;
    frequency: string;
    amount: number;
    status: 'active' | 'cancelled' | 'paused' | 'failed';
    next_billing_date: string;
    last_billing_date: string | null;
    created_at: string;
}

export function SubscriptionsTab() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
            const data = await getAllSubscriptions();
            setSubscriptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch subscriptions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            await updateAdminSubscriptionStatus(id, newStatus);
            fetchSubscriptions();
        } catch (error) {
            console.error("Failed to update subscription status:", error);
        }
    };

    const filteredSubs = subscriptions.filter(sub => {
        const matchesSearch =
            sub.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.order_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-50 border-green-100';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-100';
            case 'paused': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Subscriptions</h2>
                    <p className="text-gray-500 text-sm">Manage recurring customer orders and billing schedules.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchSubscriptions}
                        className="p-2 text-gray-400 hover:text-honey transition-colors bg-white border border-gray-200 rounded-lg shadow-sm"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search name, email, or order ID..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-honey/20 focus:border-honey outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-honey/20 focus:border-honey text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Subscription</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Customer</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Schedule</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <AnimatePresence mode="popLayout">
                                {filteredSubs.map((sub) => (
                                    <motion.tr
                                        key={sub.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{sub.product_name}</div>
                                            <div className="text-honey font-mono text-xs mt-1">₹{sub.amount} • {sub.frequency}</div>
                                            <div className="text-gray-400 text-[10px] mt-1 uppercase tracking-tighter">Orig Order: {sub.order_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-honey/10 flex items-center justify-center text-honey font-bold text-xs">
                                                    {sub.customer_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{sub.customer_name}</div>
                                                    <div className="text-gray-500 text-xs">{sub.customer_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                                                    <Clock className="h-3 w-3 text-honey" />
                                                    <span>Next: {new Date(sub.next_billing_date).toLocaleDateString()}</span>
                                                </div>
                                                {sub.last_billing_date && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <CheckCircle className="h-3 w-3" />
                                                        <span>Last: {new Date(sub.last_billing_date).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(sub.status)}`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {sub.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(sub.id, 'paused')}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Pause Subscription"
                                                    >
                                                        <PauseCircle className="h-5 w-5" />
                                                    </button>
                                                ) : sub.status === 'paused' ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(sub.id, 'active')}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Resume Subscription"
                                                    >
                                                        <PlayCircle className="h-5 w-5" />
                                                    </button>
                                                ) : null}

                                                {sub.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(sub.id, 'cancelled')}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Cancel Subscription"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {filteredSubs.length === 0 && !isLoading && (
                    <div className="py-20 text-center">
                        <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-gray-900 font-bold">No subscriptions found</h3>
                        <p className="text-gray-500 text-sm">Matching your current filters or searching.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

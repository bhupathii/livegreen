import React, { useState, useEffect } from "react";
import { getReferrals, Referral } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, Users, Gift, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

export function ReferralsTab() {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getReferrals();
        setReferrals(data);
    };

    const filteredItems = referrals.filter(r =>
        r.referrerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referredEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Referrals Program</h2>
                    <p className="text-gray-500 mt-1">Track customer invites and successful referrals.</p>
                </div>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search by referrer or referred email..."
                    className="pl-12 h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500">Date Sent</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Referrer (Sender)</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Referred (Recipient)</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Reward Code</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No referrals found matching your search.</td>
                                </tr>
                            ) : (
                                filteredItems.map(referral => (
                                    <tr key={referral.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(referral.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-[#1B5E20]" />
                                                <span className="font-medium text-gray-900">{referral.referrerEmail}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Gift className="w-4 h-4 text-emerald-500" />
                                                <span className="text-gray-600">{referral.referredEmail}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${referral.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                                            >
                                                {referral.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                                {referral.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                                            {referral.rewardCode ? (
                                                <span className="bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{referral.rewardCode}</span>
                                            ) : (
                                                <span className="text-gray-400 font-sans font-normal text-xs italic">Pending purchase...</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

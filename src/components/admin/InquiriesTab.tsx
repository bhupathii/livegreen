import React, { useState, useEffect } from "react";
import { getInquiries, updateInquiryStatus, Inquiry } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, Mail, MailOpen, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

export function InquiriesTab() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getInquiries();
        setInquiries(data);
    };

    const handleUpdateStatus = async (id: number, currentStatus: string, newStatus: string) => {
        if (currentStatus === newStatus) return;
        await updateInquiryStatus(id, newStatus);
        loadData();
    };

    const filteredItems = inquiries.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Inquiries (CRM)</h2>
                    <p className="text-gray-500 mt-1">Manage messages received from the Contact page.</p>
                </div>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search by name, email, or subject..."
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
                                <th className="px-6 py-4 font-semibold text-gray-500">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Sender</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Subject</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Message</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No inquiries found matching your search.</td>
                                </tr>
                            ) : (
                                filteredItems.map(inquiry => (
                                    <tr key={inquiry.id} className={`hover:bg-gray-50/50 transition-colors ${inquiry.status === 'unread' ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {new Date(inquiry.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{inquiry.name}</div>
                                            <div className="text-xs text-gray-500"><a href={`mailto:${inquiry.email}`} className="hover:underline">{inquiry.email}</a></div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-[200px]" title={inquiry.subject}>
                                            {inquiry.subject}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 truncate max-w-[300px]" title={inquiry.message}>
                                            {inquiry.message}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <select
                                                value={inquiry.status}
                                                onChange={(e) => handleUpdateStatus(inquiry.id, inquiry.status, e.target.value)}
                                                className={`appearance-none bg-transparent outline-none cursor-pointer pl-3 pr-8 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border 
                          ${inquiry.status === 'unread' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                        inquiry.status === 'read' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                            'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
                                            >
                                                <option value="unread">Unread</option>
                                                <option value="read">Read</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
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

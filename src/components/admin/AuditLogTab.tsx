import React, { useState, useEffect } from "react";
import { getAuditLog, AuditLogEntry } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight, Shield, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AuditLogTab() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = async (p = 1) => {
        setLoading(true);
        try {
            const res = await getAuditLog(p);
            setLogs(res.logs || []);
            setTotalPages(res.pages || 1);
            setPage(res.page || 1);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtered = logs.filter(l =>
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.admin_user?.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_type?.toLowerCase().includes(search.toLowerCase())
    );

    const actionColor = (action: string) => {
        if (action?.includes('delete')) return 'text-rose-600 bg-rose-50';
        if (action?.includes('create') || action?.includes('insert')) return 'text-emerald-600 bg-emerald-50';
        if (action?.includes('update') || action?.includes('status')) return 'text-blue-600 bg-blue-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif flex items-center gap-3">
                        <Shield className="w-7 h-7 text-[#1B5E20]" /> Audit Log
                    </h2>
                    <p className="text-gray-500 mt-1">Track all admin actions for accountability.</p>
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input placeholder="Search by action, admin, or entity..." className="pl-12 h-12 rounded-xl bg-white border-gray-200"
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">No audit logs found.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map(log => (
                            <div key={log.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition">
                                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${actionColor(log.action)}`}>
                                    {log.action}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-bold text-gray-900">{log.admin_user}</span>
                                        {log.entity_type && (
                                            <span className="text-gray-400">→ {log.entity_type} {log.entity_id && `#${log.entity_id}`}</span>
                                        )}
                                    </div>
                                    {log.details && (
                                        <p className="text-xs text-gray-500 mt-1 truncate">{log.details}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                                    <Clock className="w-3 h-3" />
                                    {new Date(log.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button onClick={() => load(page - 1)} disabled={page <= 1}
                        className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-30">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button onClick={() => load(page + 1)} disabled={page >= totalPages}
                        className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-30">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

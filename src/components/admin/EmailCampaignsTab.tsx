import React, { useState, useEffect } from "react";
import { getEmailCampaigns, createEmailCampaign, sendEmailCampaign, deleteEmailCampaign, updateEmailCampaign, getAbandonedCarts, sendCartRecovery } from "@/lib/api";
import { Mail, Send, Plus, ShoppingCart, CheckCircle, Trash2, Edit3, RefreshCw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EmailCampaignsTab() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [tab, setTab] = useState<'campaigns' | 'abandoned'>('campaigns');
    const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', body: '', type: 'newsletter' });
    const [sending, setSending] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState({ name: '', subject: '', body: '', type: 'newsletter' });

    const load = async () => {
        setLoading(true);
        try {
            const [c, a] = await Promise.all([getEmailCampaigns(), getAbandonedCarts()]);
            setCampaigns(Array.isArray(c) ? c : []);
            setAbandonedCarts(Array.isArray(a) ? a : []);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!newCampaign.name || !newCampaign.subject) return;
        await createEmailCampaign(newCampaign);
        setNewCampaign({ name: '', subject: '', body: '', type: 'newsletter' });
        setShowCreate(false);
        load();
    };

    const handleSend = async (id: number) => {
        if (!confirm('Send this campaign to ALL customers and subscribers?')) return;
        setSending(id);
        try {
            const res = await sendEmailCampaign(id);
            alert(`Campaign sent to ${res.sent}/${res.total} recipients!`);
            load();
        } catch { alert('Failed to send.'); }
        setSending(null);
    };

    const handleResend = async (id: number) => {
        // Reset status to draft, then send again
        if (!confirm('Resend this campaign to ALL customers?')) return;
        setSending(id);
        try {
            await updateEmailCampaign(id, { status: 'draft' });
            const res = await sendEmailCampaign(id);
            alert(`Campaign resent to ${res.sent}/${res.total} recipients!`);
            load();
        } catch { alert('Failed to resend.'); }
        setSending(null);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this campaign permanently?')) return;
        try {
            await deleteEmailCampaign(id);
            load();
        } catch { alert('Failed to delete.'); }
    };

    const startEdit = (c: any) => {
        setEditingId(c.id);
        setEditData({ name: c.name, subject: c.subject, body: c.body, type: c.type });
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        await updateEmailCampaign(editingId, editData);
        setEditingId(null);
        load();
    };

    const handleRecover = async (cartId: number) => {
        setSending(cartId);
        try {
            await sendCartRecovery(cartId);
            alert('Recovery email sent!');
            load();
        } catch { alert('Failed to send.'); }
        setSending(null);
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-600',
            sending: 'bg-blue-100 text-blue-600',
            sent: 'bg-emerald-100 text-emerald-600',
            failed: 'bg-rose-100 text-rose-600',
        };
        return colors[status] || colors.draft;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif flex items-center gap-3">
                        <Mail className="w-7 h-7 text-[#1B5E20]" /> Email Campaigns
                    </h2>
                    <p className="text-gray-500 mt-1">Send campaigns to all customers & subscribers.</p>
                </div>
                <Button onClick={() => { setShowCreate(!showCreate); setEditingId(null); }} className="bg-[#1B5E20] hover:bg-[#144a18] rounded-xl">
                    <Plus className="w-4 h-4 mr-2" /> New Campaign
                </Button>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 mb-6">
                {(['campaigns', 'abandoned'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                            ${tab === t ? 'bg-[#1B5E20] text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                        {t === 'campaigns' ? <><Mail className="w-4 h-4 inline mr-1.5" />Campaigns ({campaigns.length})</>
                            : <><ShoppingCart className="w-4 h-4 inline mr-1.5" />Abandoned Carts ({abandonedCarts.length})</>}
                    </button>
                ))}
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 space-y-4">
                    <h3 className="font-bold text-gray-900">Create New Campaign</h3>
                    <Input placeholder="Campaign Name" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                        className="h-11 rounded-xl" />
                    <Input placeholder="Email Subject" value={newCampaign.subject} onChange={e => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                        className="h-11 rounded-xl" />
                    <textarea placeholder="Email body (HTML supported)" value={newCampaign.body}
                        onChange={e => setNewCampaign({ ...newCampaign, body: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm h-32 outline-none focus:border-[#1B5E20]/50" />
                    <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 outline-none">
                        <option value="newsletter">Newsletter</option>
                        <option value="promo">Promo</option>
                        <option value="custom">Custom</option>
                    </select>
                    <div className="flex gap-3">
                        <Button onClick={handleCreate} className="bg-[#1B5E20] hover:bg-[#144a18] rounded-xl">Save Campaign</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancel</Button>
                    </div>
                </div>
            )}

            {/* Edit form */}
            {editingId && (
                <div className="bg-amber-50 rounded-2xl p-6 shadow-sm border border-amber-200 mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Edit3 className="w-4 h-4" /> Editing Campaign #{editingId}</h3>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    <Input placeholder="Campaign Name" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })}
                        className="h-11 rounded-xl" />
                    <Input placeholder="Email Subject" value={editData.subject} onChange={e => setEditData({ ...editData, subject: e.target.value })}
                        className="h-11 rounded-xl" />
                    <textarea placeholder="Email body (HTML supported)" value={editData.body}
                        onChange={e => setEditData({ ...editData, body: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm h-32 outline-none focus:border-[#1B5E20]/50" />
                    <select value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 outline-none">
                        <option value="newsletter">Newsletter</option>
                        <option value="promo">Promo</option>
                        <option value="custom">Custom</option>
                    </select>
                    <div className="flex gap-3">
                        <Button onClick={handleUpdate} className="bg-amber-500 hover:bg-amber-600 rounded-xl">Save Changes</Button>
                        <Button variant="outline" onClick={() => setEditingId(null)} className="rounded-xl">Cancel</Button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading...</div>
                ) : tab === 'campaigns' ? (
                    campaigns.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">No campaigns yet. Create your first one!</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {campaigns.map((c: any) => (
                                <div key={c.id} className="px-6 py-5 flex items-center gap-4 hover:bg-gray-50/50 transition">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900">{c.name}</p>
                                        <p className="text-sm text-gray-500 truncate">{c.subject}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusBadge(c.status)}`}>
                                        {c.status}
                                    </span>
                                    {c.sent_count > 0 && (
                                        <span className="text-xs text-gray-400 whitespace-nowrap">{c.sent_count} sent</span>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        {/* Send (draft only) */}
                                        {c.status === 'draft' && (
                                            <Button size="sm" onClick={() => handleSend(c.id)} disabled={sending === c.id}
                                                className="bg-[#1B5E20] hover:bg-[#144a18] rounded-lg text-xs h-8 px-3">
                                                {sending === c.id ? '...' : <><Send className="w-3 h-3 mr-1" /> Send</>}
                                            </Button>
                                        )}
                                        {/* Resend (sent campaigns) */}
                                        {c.status === 'sent' && (
                                            <Button size="sm" onClick={() => handleResend(c.id)} disabled={sending === c.id}
                                                className="bg-blue-500 hover:bg-blue-600 rounded-lg text-xs h-8 px-3">
                                                {sending === c.id ? '...' : <><RefreshCw className="w-3 h-3 mr-1" /> Resend</>}
                                            </Button>
                                        )}
                                        {/* Edit */}
                                        <button onClick={() => startEdit(c)}
                                            className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        {/* Delete */}
                                        <button onClick={() => handleDelete(c.id)}
                                            className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-500 transition">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    abandonedCarts.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">No abandoned carts found.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {abandonedCarts.map((cart: any) => (
                                <div key={cart.id} className="px-6 py-5 flex items-center gap-4 hover:bg-gray-50/50 transition">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{cart.email || 'Unknown'}</p>
                                        <p className="text-sm text-gray-500">₹{cart.total_amount} • {new Date(cart.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {cart.reminder_sent ? (
                                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Reminded
                                        </span>
                                    ) : (
                                        <Button size="sm" onClick={() => handleRecover(cart.id)} disabled={sending === cart.id}
                                            className="bg-amber-500 hover:bg-amber-600 rounded-lg text-xs">
                                            {sending === cart.id ? '...' : <><Mail className="w-3 h-3 mr-1" /> Send Recovery</>}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

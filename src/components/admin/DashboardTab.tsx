import React, { useState, useEffect, useCallback, useRef } from "react";
import { getAnalyticsDashboard, AnalyticsDashboard } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import {
    DollarSign, ShoppingBag, Users, TrendingUp,
    Target, UserPlus, Heart, ShoppingCart, Star,
    ThumbsUp, Globe, RefreshCw, ArrowUpRight, ArrowDownRight,
    Zap, Activity, Eye, Clock
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line,
    RadialBarChart, RadialBar
} from "recharts";

/* ═══════════════ THEME ═══════════════ */
const PALETTE = {
    emerald: { main: '#10b981', light: '#d1fae5', bg: 'from-emerald-500/10 to-emerald-500/5' },
    blue: { main: '#3b82f6', light: '#dbeafe', bg: 'from-blue-500/10 to-blue-500/5' },
    purple: { main: '#8b5cf6', light: '#ede9fe', bg: 'from-purple-500/10 to-purple-500/5' },
    amber: { main: '#f59e0b', light: '#fef3c7', bg: 'from-amber-500/10 to-amber-500/5' },
    rose: { main: '#f43f5e', light: '#ffe4e6', bg: 'from-rose-500/10 to-rose-500/5' },
    cyan: { main: '#06b6d4', light: '#cffafe', bg: 'from-cyan-500/10 to-cyan-500/5' },
    indigo: { main: '#6366f1', light: '#e0e7ff', bg: 'from-indigo-500/10 to-indigo-500/5' },
    teal: { main: '#14b8a6', light: '#ccfbf1', bg: 'from-teal-500/10 to-teal-500/5' },
    orange: { main: '#f97316', light: '#ffedd5', bg: 'from-orange-500/10 to-orange-500/5' },
    lime: { main: '#84cc16', light: '#ecfccb', bg: 'from-lime-500/10 to-lime-500/5' },
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];
const NPS_COLORS = ['#10b981', '#eab308', '#ef4444'];
const STATUS_COLORS: Record<string, string> = {
    Pending: '#f59e0b', Processing: '#3b82f6', Shipped: '#8b5cf6',
    Delivered: '#10b981', Cancelled: '#f43f5e',
};

type DatePreset = 'today' | '7d' | '30d' | '90d' | '1y' | 'custom';

/* ═══════════════ HELPERS ═══════════════ */
function formatCurrency(value: number) {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString('en-IN')}`;
}

function getDateRange(preset: DatePreset): { from: string; to: string } {
    const to = new Date();
    const from = new Date();
    switch (preset) {
        case 'today': break;
        case '7d': from.setDate(from.getDate() - 7); break;
        case '30d': from.setDate(from.getDate() - 30); break;
        case '90d': from.setDate(from.getDate() - 90); break;
        case '1y': from.setFullYear(from.getFullYear() - 1); break;
    }
    return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
}

/* ═══════════════ ANIMATED COUNTER ═══════════════ */
function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }: {
    value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
    const [display, setDisplay] = useState(0);
    const animRef = useRef<number>(0);
    const startRef = useRef(0);
    const startTime = useRef(0);

    useEffect(() => {
        startRef.current = display;
        startTime.current = performance.now();
        const duration = 1200;
        const animate = (now: number) => {
            const elapsed = now - startTime.current;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
            setDisplay(startRef.current + (value - startRef.current) * eased);
            if (progress < 1) animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [value]);

    const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-IN');
    return <span>{prefix}{formatted}{suffix}</span>;
}

/* ═══════════════ SPARKLINE ═══════════════ */
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
    if (!data || data.length < 2) return null;
    const chartData = data.map((v, i) => ({ v, i }));
    return (
        <div style={{ height, width: '100%' }}>
            <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
                        fill={`url(#spark-${color.replace('#', '')})`} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ═══════════════ CUSTOM TOOLTIP ═══════════════ */
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900/95 backdrop-blur-xl text-white rounded-2xl px-5 py-3.5 shadow-2xl border border-white/10 text-sm">
            <p className="font-bold text-white/70 text-xs uppercase tracking-wider mb-1.5">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-white/60 capitalize">{p.name}:</span>
                    <span className="font-bold">{p.name === 'revenue' ? `₹${p.value?.toLocaleString('en-IN')}` : p.value}</span>
                </div>
            ))}
        </div>
    );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export function DashboardTab() {
    const [data, setData] = useState<AnalyticsDashboard | null>(null);
    const [preset, setPreset] = useState<DatePreset>('30d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setError('');
        try {
            const range = preset === 'custom' && customFrom && customTo
                ? { from: customFrom, to: customTo }
                : getDateRange(preset);
            const result = await getAnalyticsDashboard(range.from, range.to);
            setData(result);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to load');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [preset, customFrom, customTo]);

    useEffect(() => { loadData(); }, [loadData]);

    // Auto-refresh every 60s
    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(() => loadData(true), 60000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [autoRefresh, loadData]);

    const presets: { key: DatePreset; label: string; icon?: React.ReactNode }[] = [
        { key: 'today', label: 'Today' },
        { key: '7d', label: '7D' },
        { key: '30d', label: '30D' },
        { key: '90d', label: '90D' },
        { key: '1y', label: '1Y' },
        { key: 'custom', label: 'Custom' },
    ];

    const sparkData = data?.revenueTrend?.map(r => r.revenue) || [];
    const orderSparkData = data?.revenueTrend?.map(r => r.orders) || [];

    if (error && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-rose-500" />
                </div>
                <p className="text-rose-600 font-semibold">{error}</p>
                <button onClick={() => loadData()} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition shadow-lg">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* ═══ HEADER ═══ */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute right-1/3 top-1/2 w-32 h-32 bg-purple-500/8 rounded-full blur-2xl" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl lg:text-3xl font-bold font-serif tracking-tight">Analytics Dashboard</h2>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/50">
                            {data && <span>{data.dateRange.from} → {data.dateRange.to}</span>}
                            {lastUpdated && (
                                <span className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                                    Updated {lastUpdated.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Date Presets */}
                        <div className="flex bg-white/5 rounded-xl p-1 backdrop-blur-sm border border-white/10">
                            {presets.map(p => (
                                <button key={p.key} onClick={() => setPreset(p.key)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300
                                        ${preset === p.key
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {/* Auto-refresh toggle */}
                        <button onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`p-2 rounded-lg transition-all ${autoRefresh ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30'}`}
                            title={autoRefresh ? 'Auto-refresh ON (60s)' : 'Auto-refresh OFF'}>
                            <Eye className="w-4 h-4" />
                        </button>
                        {/* Manual refresh */}
                        <button onClick={() => loadData(true)}
                            className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Custom date range */}
                <AnimatePresence>
                    {preset === 'custom' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} className="overflow-hidden relative z-10">
                            <div className="flex flex-wrap gap-3 items-end pt-5 border-t border-white/10 mt-5">
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-1">From</label>
                                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-emerald-500/50 transition" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-1">To</label>
                                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-emerald-500/50 transition" />
                                </div>
                                <button onClick={() => loadData()}
                                    className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/25">
                                    Apply
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══ LOADING STATE ═══ */}
            {loading && !data ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-emerald-500" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Loading analytics...</p>
                </div>
            ) : data && (
                <>
                    {/* ═══ QUICK INSIGHTS BAR ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl px-6 py-4 flex flex-wrap items-center gap-6 border border-emerald-100/50">
                        <div className="flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-500">Quick Insights:</span>
                        </div>
                        <InsightPill label="Revenue" value={formatCurrency(data.revenue)} change={data.revenueChange} />
                        <InsightPill label="Orders" value={String(data.totalOrders)} change={data.ordersChange} />
                        <InsightPill label="Avg Order" value={formatCurrency(data.avgOrderValue)} />
                        <InsightPill label="NPS" value={String(data.npsScore)} positive={data.npsScore >= 0} />
                    </motion.div>

                    {/* ═══ KPI CARDS ═══ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <KpiCard idx={0} title="Revenue" value={data.revenue} format="currency"
                            change={data.revenueChange} icon={DollarSign} color="emerald"
                            sparkData={sparkData} />
                        <KpiCard idx={1} title="Avg Order Value" value={data.avgOrderValue} format="currency"
                            icon={ShoppingBag} color="blue" />
                        <KpiCard idx={2} title="Conversion Rate" value={data.conversionRate} format="percent"
                            subtitle={`${data.visits} visits`} icon={Target} color="purple" />
                        <KpiCard idx={3} title="Acquisition Cost" value={data.cac} format="currency"
                            subtitle={`${data.newCustomers} new`} icon={UserPlus} color="amber" />
                        <KpiCard idx={4} title="Customer LTV" value={data.clv} format="currency"
                            icon={Heart} color="rose" />
                        <KpiCard idx={5} title="Repeat Purchase" value={data.repeatRate} format="percent"
                            subtitle={`${data.repeatCustomers}/${data.totalCustomers}`}
                            icon={RefreshCw} color="cyan" />
                        <KpiCard idx={6} title="Cart Abandon" value={data.cartAbandonmentRate} format="percent"
                            icon={ShoppingCart} color="orange" inverted />
                        <KpiCard idx={7} title="CSAT" value={data.csatAvg} format="rating"
                            subtitle={`${data.csatPercent}% happy`} icon={Star} color="amber" />
                        <KpiCard idx={8} title="NPS" value={data.npsScore} format="plain"
                            subtitle={`${data.npsTotal} responses`} icon={ThumbsUp} color="indigo"
                            sparkData={[]} npsValue={data.npsScore} />
                        <KpiCard idx={9} title="Visitors" value={data.visits} format="number"
                            subtitle={`${data.trafficSources.length} sources`} icon={Globe} color="teal"
                            sparkData={orderSparkData} />
                    </div>

                    {/* ═══ REVENUE TREND + TRAFFIC SOURCES ═══ */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-500">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 font-serif">Revenue Trend</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Daily revenue over the selected period</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-emerald-500" /> Revenue</span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-blue-500" /> Orders</span>
                                </div>
                            </div>
                            <div style={{ height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.revenueTrend}>
                                        <defs>
                                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                                            tickFormatter={(v) => v >= 1000 ? `₹${v / 1000}K` : `₹${v}`} />
                                        <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5}
                                            fill="url(#revGrad)" name="revenue" dot={false} activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                                        <Area yAxisId="ord" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={1.5}
                                            fill="url(#ordGrad)" name="orders" dot={false} activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Traffic Sources Donut */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-500">
                            <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">Traffic Sources</h3>
                            <p className="text-xs text-gray-400 mb-3">Where visitors come from</p>
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data.trafficSources} cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={88} paddingAngle={3}
                                            dataKey="value" nameKey="name" animationBegin={200} animationDuration={800}>
                                            {data.trafficSources.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}
                                                    stroke="white" strokeWidth={3} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {data.trafficSources.map((src, i) => {
                                    const total = data.trafficSources.reduce((s, t) => s + t.value, 0);
                                    const pct = total > 0 ? Math.round((src.value / total) * 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-gray-600 truncate">{src.name}</span>
                                            <span className="ml-auto font-bold text-gray-900">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* ═══ ORDERS BY STATUS + NPS ═══ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Orders by Status */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-500">
                            <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">Orders by Status</h3>
                            <p className="text-xs text-gray-400 mb-4">Distribution of orders</p>
                            <div style={{ height: 260 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.ordersByStatus} layout="vertical" margin={{ left: 10, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="status" tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                                            axisLine={false} tickLine={false} width={80} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24} animationDuration={800}>
                                            {data.ordersByStatus.map((entry, i) => (
                                                <Cell key={i} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* NPS */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-500">
                            <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">Net Promoter Score</h3>
                            <p className="text-xs text-gray-400 mb-3">Customer loyalty metric</p>
                            <div className="flex items-center gap-6">
                                <div className="text-center flex-shrink-0">
                                    <div className={`text-6xl font-black tracking-tight
                                        ${data.npsScore >= 50 ? 'text-emerald-500' : data.npsScore >= 0 ? 'text-amber-500' : 'text-rose-500'}`}>
                                        <AnimatedCounter value={data.npsScore} />
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">NPS Score</div>
                                    <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full
                                        ${data.npsScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                                            data.npsScore >= 50 ? 'bg-emerald-50 text-emerald-600' :
                                                data.npsScore >= 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {data.npsScore >= 70 ? '🔥 Excellent' : data.npsScore >= 50 ? '👍 Great' : data.npsScore >= 0 ? '✓ Good' : '⚠ Needs Work'}
                                    </div>
                                </div>
                                <div className="flex-1" style={{ height: 180 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={data.npsBreakdown} cx="50%" cy="50%"
                                                innerRadius={45} outerRadius={75} paddingAngle={3}
                                                dataKey="value" nameKey="name" animationBegin={300} animationDuration={800}>
                                                {data.npsBreakdown.map((_, i) => (
                                                    <Cell key={i} fill={NPS_COLORS[i]} stroke="white" strokeWidth={3} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<ChartTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                {[
                                    { label: 'Promoters', sub: '9-10', idx: 0, color: 'emerald' },
                                    { label: 'Passives', sub: '7-8', idx: 1, color: 'amber' },
                                    { label: 'Detractors', sub: '0-6', idx: 2, color: 'rose' },
                                ].map(({ label, sub, idx, color }) => {
                                    const count = data.npsBreakdown[idx]?.value || 0;
                                    const pct = data.npsTotal > 0 ? Math.round((count / data.npsTotal) * 100) : 0;
                                    return (
                                        <div key={idx} className="bg-gray-50 rounded-xl p-3 text-center">
                                            <div className="text-xl font-black text-gray-900">{pct}%</div>
                                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className={`h-full rounded-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1">{label} ({sub})</div>
                                            <div className="text-xs font-bold text-gray-600">{count}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* ═══ CSAT ═══ */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-500">
                        <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">Customer Satisfaction</h3>
                        <p className="text-xs text-gray-400 mb-4">Based on {data.csatCount} reviews</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-5xl font-black text-amber-500">
                                    <AnimatedCounter value={data.csatAvg} decimals={1} />
                                </div>
                                <div className="flex gap-1 mt-3">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <motion.div key={star} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: 0.1 * star, type: 'spring', stiffness: 200 }}>
                                            <Star className={`w-7 h-7 ${star <= Math.round(data.csatAvg) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                        </motion.div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-400 mt-3">{data.csatPercent}% satisfaction rate</p>
                                <div className="mt-3 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                                    {data.csatAvg >= 4.5 ? '⭐ Outstanding' : data.csatAvg >= 4 ? '👍 Great' : data.csatAvg >= 3 ? '✓ Average' : '⚠ Needs Improvement'}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[...data.ratingDistribution].reverse().map(rd => {
                                    const maxCount = Math.max(...data.ratingDistribution.map(r => r.count), 1);
                                    const pct = (rd.count / maxCount) * 100;
                                    return (
                                        <div key={rd.rating} className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 w-10 justify-end text-sm font-bold text-gray-600">
                                                {rd.rating} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            </div>
                                            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, delay: 0.15 * rd.rating }}
                                                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-inner" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 w-8 text-right">{rd.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══ RECENT ORDERS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 font-serif">Recent Orders</h3>
                                <p className="text-xs text-gray-400">Latest transactions in period</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{data.recentOrders.length} orders shown</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="pb-3 font-bold text-xs text-gray-400 uppercase tracking-wider">Order ID</th>
                                        <th className="pb-3 font-bold text-xs text-gray-400 uppercase tracking-wider">Customer</th>
                                        <th className="pb-3 font-bold text-xs text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="pb-3 font-bold text-xs text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                        <th className="pb-3 font-bold text-xs text-gray-400 uppercase tracking-wider text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-300">
                                                <ShoppingBag className="w-10 h-10 mx-auto mb-2" />
                                                <p>No orders in this period</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        data.recentOrders.map((order, i) => (
                                            <motion.tr key={order.id}
                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.05 * i }}
                                                className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors group cursor-default">
                                                <td className="py-4 font-mono font-bold text-gray-900 text-xs">{order.id}</td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                            {order.customerName?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <span className="font-medium text-gray-800 truncate max-w-[120px]">{order.customerName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-gray-400 text-xs">{new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                                                <td className="py-4 text-right font-bold text-gray-900">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                                                <td className="py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider
                                                        ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                                                            order.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                                                                order.status === 'shipped' ? 'bg-purple-50 text-purple-700' :
                                                                    order.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                                                                        'bg-amber-50 text-amber-700'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full
                                                            ${order.status === 'delivered' ? 'bg-emerald-500' :
                                                                order.status === 'processing' ? 'bg-blue-500' :
                                                                    order.status === 'shipped' ? 'bg-purple-500' :
                                                                        order.status === 'cancelled' ? 'bg-rose-500' :
                                                                            'bg-amber-500'}`} />
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}

/* ═══════════════ KPI CARD ═══════════════ */
interface KpiCardProps {
    idx: number;
    title: string;
    value: number;
    format: 'currency' | 'percent' | 'number' | 'plain' | 'rating';
    change?: number;
    subtitle?: string;
    icon: React.ComponentType<any>;
    color: keyof typeof PALETTE;
    inverted?: boolean;
    sparkData?: number[];
    npsValue?: number;
}

function KpiCard({ idx, title, value, format, change, subtitle, icon: Icon, color, inverted, sparkData, npsValue }: KpiCardProps) {
    const pal = PALETTE[color];

    const formattedValue = () => {
        switch (format) {
            case 'currency': return <AnimatedCounter value={value} prefix="₹" />;
            case 'percent': return <AnimatedCounter value={value} suffix="%" decimals={1} />;
            case 'number': return <AnimatedCounter value={value} />;
            case 'rating': return <AnimatedCounter value={value} suffix="/5" decimals={1} />;
            default: return <AnimatedCounter value={value} />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 150, damping: 20 }}
            className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 hover:shadow-xl hover:-translate-y-1 
                transition-all duration-500 relative overflow-hidden group cursor-default`}
        >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${pal.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Content */}
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{title}</p>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{ background: `${pal.main}15` }}>
                        <Icon className="w-4.5 h-4.5" style={{ color: pal.main }} />
                    </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{formattedValue()}</h3>

                {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}

                {/* Sparkline or NPS indicator */}
                {sparkData && sparkData.length > 2 && (
                    <div className="mt-2 -mx-1">
                        <Sparkline data={sparkData} color={pal.main} height={32} />
                    </div>
                )}

                {change !== undefined && (
                    <div className={`mt-2 flex items-center text-[11px] font-bold
                        ${(inverted ? change <= 0 : change >= 0) ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {(inverted ? change <= 0 : change >= 0)
                            ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                            : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                        <span>{Math.abs(change)}% vs prev</span>
                    </div>
                )}
            </div>

            {/* Decorative circle */}
            <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-[0.04] group-hover:opacity-10 transition-opacity duration-500"
                style={{ background: pal.main }} />
        </motion.div>
    );
}

/* ═══════════════ INSIGHT PILL ═══════════════ */
function InsightPill({ label, value, change, positive }: {
    label: string; value: string; change?: number; positive?: boolean
}) {
    const isPos = change !== undefined ? change >= 0 : positive;
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700 font-semibold">{label}:</span>
            <span className="font-black text-gray-900">{value}</span>
            {change !== undefined && (
                <span className={`flex items-center text-xs font-bold ${isPos ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(change)}%
                </span>
            )}
        </div>
    );
}

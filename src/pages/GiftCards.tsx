import React, { useState } from "react";
import { motion } from "motion/react";
import { Gift, Copy, Check, Send } from "lucide-react";
import { Input } from "@/components/ui/input";

const amounts = [500, 1000, 1500, 2000, 2500, 5000];

export default function GiftCards() {
    const [amount, setAmount] = useState(1000);
    const [sent, setSent] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => setSent(false), 3000);
    };

    return (
        <div className="bg-[#FAFAFA] min-h-screen">
            <div className="bg-[#0D3B0E] py-28 sm:py-36 relative overflow-hidden noise-overlay">
                <div className="absolute inset-0 honeycomb-pattern opacity-10" />
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center z-10">
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-4 font-inter">Share the Sweetness</motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl font-bold text-white sm:text-6xl">Gift Cards</motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 text-sm text-white/70 max-w-md mx-auto font-inter">Give the gift of pure honey. Perfect for any occasion.</motion.p>
                </div>
            </div>

            <div className="mx-auto max-w-3xl px-6 lg:px-8 -mt-12 relative z-10 pb-24">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl border border-[#CDDBCE]/30 overflow-hidden">
                    {/* Card Preview */}
                    <div className="relative bg-gradient-to-br from-[#0D3B0E] to-[#1B5E20] p-10 text-center overflow-hidden">
                        <div className="absolute inset-0 honeycomb-pattern opacity-10" />
                        <div className="relative z-10">
                            <Gift className="h-10 w-10 text-[#F5A623] mx-auto mb-4" />
                            <p className="text-xs text-white/70 uppercase tracking-widest font-inter mb-2">Live Green Honey</p>
                            <p className="text-5xl font-bold text-white font-serif">₹{amount}</p>
                            <p className="text-xs text-white/60 mt-2 font-inter">Digital Gift Card</p>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Amount selection */}
                        <div className="mb-8">
                            <label className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-3 block font-inter">Select Amount</label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {amounts.map((a) => (
                                    <button key={a} onClick={() => setAmount(a)}
                                        className={`py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer font-inter ${amount === a ? "bg-[#1B5E20] text-white shadow-lg" : "bg-[#F5FFF5] text-[#6B9E6E] border border-[#CDDBCE]/40 hover:bg-[#E8F5E9]"}`}>
                                        ₹{a}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recipient form */}
                        <form onSubmit={handleSend} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-[#6B9E6E] uppercase tracking-wider font-inter">Recipient Name</label>
                                    <Input placeholder="Friend's name" className="mt-1 h-11 rounded-full bg-[#FAFAFA] border-[#CDDBCE] text-sm" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#6B9E6E] uppercase tracking-wider font-inter">Recipient Email</label>
                                    <Input type="email" placeholder="friend@email.com" className="mt-1 h-11 rounded-full bg-[#FAFAFA] border-[#CDDBCE] text-sm" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[#6B9E6E] uppercase tracking-wider font-inter">Personal Message (optional)</label>
                                <textarea placeholder="Enjoy some sweetness from Mother Nature!" className="mt-1 w-full rounded-2xl border border-[#CDDBCE] bg-[#FAFAFA] p-4 text-sm focus:border-[#3A8E3C] focus:outline-none min-h-[80px]" />
                            </div>
                            <button type="submit" className={`btn-primary w-full h-12 cursor-pointer inline-flex items-center justify-center gap-2 font-inter ${sent ? "!bg-[#F5A623]" : ""}`}>
                                {sent ? <><Check className="h-4 w-4" /> Gift Card Sent!</> : <><Send className="h-4 w-4" /> Send Gift Card — ₹{amount}</>}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

import React, { useState } from "react";
import { motion } from "motion/react";
import { Gift, Copy, Check, Users, Star, Zap } from "lucide-react";

export default function Referral() {
    const [copied, setCopied] = useState(false);
    const refCode = "LIVEGREEN100";

    const handleCopy = () => {
        navigator.clipboard.writeText(refCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const steps = [
        { icon: <Gift className="h-5 w-5" />, title: "Share Your Code", desc: "Copy your unique referral code and share it with friends & family." },
        { icon: <Users className="h-5 w-5" />, title: "Friend Orders", desc: "When they use your code on checkout, they get ₹100 off their first order." },
        { icon: <Zap className="h-5 w-5" />, title: "You Earn ₹100", desc: "Once their order is delivered, you get ₹100 credit in your account." },
    ];

    return (
        <div className="bg-[#FAFAFA] min-h-screen">
            <div className="bg-[#0D3B0E] py-28 sm:py-36 relative overflow-hidden noise-overlay">
                <div className="absolute inset-0 honeycomb-pattern opacity-10" />
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center z-10">
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-4 font-inter">Referral Program</motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl font-bold text-white sm:text-6xl">Give ₹100, Get ₹100</motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 text-sm text-white/70 max-w-md mx-auto font-inter">Share the sweetness and earn rewards.</motion.p>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-6 lg:px-8 -mt-12 relative z-10 pb-24">
                {/* Referral Code Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-10 shadow-xl border border-[#CDDBCE]/30 text-center mb-12">
                    <p className="text-xs text-[#6B9E6E] uppercase tracking-widest font-inter font-semibold mb-3">Your Referral Code</p>
                    <div className="inline-flex items-center gap-3 bg-[#F5FFF5] rounded-2xl px-8 py-4 border-2 border-dashed border-[#3A8E3C]/30 mb-4">
                        <span className="text-3xl font-bold text-[#1B5E20] font-serif tracking-wider">{refCode}</span>
                        <button onClick={handleCopy} className="h-10 w-10 bg-[#1B5E20] rounded-full flex items-center justify-center text-white hover:bg-[#0D3B0E] transition-colors cursor-pointer">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-[#6B9E6E] font-inter">Share this code with friends and earn ₹100 for every successful referral!</p>

                    <div className="flex items-center justify-center gap-4 mt-6">
                        <a href={`https://wa.me/?text=Use%20code%20${refCode}%20for%20₹100%20off%20at%20Live%20Green%20Honey!%20livegreenhoney.com`}
                            target="_blank" rel="noopener noreferrer"
                            className="btn-primary h-11 px-6 text-sm cursor-pointer inline-flex items-center gap-2 font-inter">
                            <i className="lni lni-whatsapp"></i> Share on WhatsApp
                        </a>
                    </div>
                </motion.div>

                {/* How it works */}
                <h2 className="font-serif text-2xl font-bold text-[#1B5E20] text-center mb-8">How It Works</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {steps.map((step, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-2xl p-8 border border-[#CDDBCE]/30 text-center card-lift cursor-pointer relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-8 bg-[#1B5E20] text-white rounded-full flex items-center justify-center text-xs font-bold font-inter">{i + 1}</div>
                            <div className="h-12 w-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-[#3A8E3C] mx-auto mb-4 mt-2">{step.icon}</div>
                            <h3 className="font-serif text-base font-bold text-[#1B5E20] mb-2">{step.title}</h3>
                            <p className="text-xs text-[#6B9E6E] leading-relaxed font-inter">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Stats */}
                <div className="mt-12 bg-[#1B5E20] rounded-3xl p-8 text-center text-white">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { value: "2,847", label: "Happy Referrers" },
                            { value: "₹5.6L", label: "Total Rewards Earned" },
                            { value: "4.9", label: "Average Rating" },
                        ].map((stat, i) => (
                            <div key={i}>
                                <p className="text-2xl font-bold font-serif">{stat.value}</p>
                                <p className="text-[10px] text-white/70 uppercase tracking-wider font-inter mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

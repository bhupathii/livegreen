import React, { useState } from "react";
import { motion } from "motion/react";
import { Calculator, Heart, Droplet, Zap, Brain, Moon } from "lucide-react";

const benefits = [
    { icon: <Heart className="h-5 w-5" />, title: "Heart Health", desc: "Antioxidants in honey support cardiovascular function.", color: "#E8F5E9" },
    { icon: <Zap className="h-5 w-5" />, title: "Energy Boost", desc: "Natural sugars provide sustained energy without crashes.", color: "#FFF8E7" },
    { icon: <Brain className="h-5 w-5" />, title: "Brain Function", desc: "Raw honey contains pinocembrin which supports brain health.", color: "#E8F5E9" },
    { icon: <Droplet className="h-5 w-5" />, title: "Immunity", desc: "Antibacterial properties strengthen the immune system.", color: "#FFF8E7" },
    { icon: <Moon className="h-5 w-5" />, title: "Better Sleep", desc: "Honey before bed helps release melatonin naturally.", color: "#E8F5E9" },
];

export default function HealthCalculator() {
    const [weight, setWeight] = useState(70);
    const [goal, setGoal] = useState("general");
    const [activity, setActivity] = useState("moderate");

    const goals: Record<string, { label: string; multiplier: number }> = {
        general: { label: "General Wellness", multiplier: 1 },
        immunity: { label: "Immunity Boost", multiplier: 1.3 },
        energy: { label: "Energy & Fitness", multiplier: 1.5 },
        sleep: { label: "Better Sleep", multiplier: 0.8 },
        skincare: { label: "Skin & Hair", multiplier: 0.7 },
    };

    const activities: Record<string, { label: string; multiplier: number }> = {
        low: { label: "Sedentary", multiplier: 0.8 },
        moderate: { label: "Moderate", multiplier: 1 },
        high: { label: "Very Active", multiplier: 1.3 },
    };

    const baseTbsp = Math.max(1, Math.round((weight / 70) * 2 * goals[goal].multiplier * activities[activity].multiplier * 10) / 10);
    const grams = Math.round(baseTbsp * 21);
    const calories = Math.round(grams * 3.04);

    return (
        <div className="bg-[#FAFAFA] min-h-screen">
            <div className="bg-[#0D3B0E] py-28 sm:py-36 relative overflow-hidden noise-overlay">
                <div className="absolute inset-0 honeycomb-pattern opacity-10" />
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center z-10">
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-4 font-inter">Wellness Tool</motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl font-bold text-white sm:text-6xl">Honey Calculator</motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 text-sm text-white/70 max-w-md mx-auto font-inter">Find your ideal daily honey intake.</motion.p>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 lg:px-8 -mt-12 relative z-10 pb-24">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#CDDBCE]/30">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Inputs */}
                        <div className="space-y-8">
                            <div>
                                <label className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-3 block font-inter">Body Weight</label>
                                <div className="flex items-center gap-4">
                                    <input type="range" min={30} max={150} value={weight} onChange={(e) => setWeight(+e.target.value)}
                                        className="flex-1 accent-[#3A8E3C] h-2 rounded-full cursor-pointer" />
                                    <span className="text-2xl font-bold text-[#1B5E20] font-serif w-20 text-right">{weight} kg</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-3 block font-inter">Health Goal</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(goals).map(([key, { label }]) => (
                                        <button key={key} onClick={() => setGoal(key)}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer font-inter ${goal === key ? "bg-[#1B5E20] text-white shadow-lg" : "bg-[#F5FFF5] text-[#6B9E6E] border border-[#CDDBCE]/40 hover:bg-[#E8F5E9]"}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-3 block font-inter">Activity Level</label>
                                <div className="flex gap-2">
                                    {Object.entries(activities).map(([key, { label }]) => (
                                        <button key={key} onClick={() => setActivity(key)}
                                            className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex-1 font-inter ${activity === key ? "bg-[#1B5E20] text-white shadow-lg" : "bg-[#F5FFF5] text-[#6B9E6E] border border-[#CDDBCE]/40 hover:bg-[#E8F5E9]"}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Result */}
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 rounded-2xl bg-[#E8F5E9] flex items-center justify-center mb-6">
                                <Calculator className="h-7 w-7 text-[#3A8E3C]" />
                            </div>
                            <p className="text-xs text-[#6B9E6E] uppercase tracking-wider mb-2 font-inter font-semibold">Your Daily Recommendation</p>
                            <p className="text-6xl font-bold text-[#1B5E20] font-serif">{baseTbsp}</p>
                            <p className="text-lg text-[#3A8E3C] font-medium font-inter">tablespoons / day</p>
                            <div className="flex items-center gap-6 mt-6">
                                <div className="text-center">
                                    <p className="text-xl font-bold text-[#1B5E20] font-serif">{grams}g</p>
                                    <p className="text-[10px] text-[#6B9E6E] uppercase tracking-wider font-inter">Weight</p>
                                </div>
                                <div className="h-8 w-px bg-[#CDDBCE]/40" />
                                <div className="text-center">
                                    <p className="text-xl font-bold text-[#1B5E20] font-serif">{calories}</p>
                                    <p className="text-[10px] text-[#6B9E6E] uppercase tracking-wider font-inter">Calories</p>
                                </div>
                            </div>
                            <p className="mt-6 text-[10px] text-[#6B9E6E] font-inter max-w-xs">Best consumed in the morning with warm water and lemon, or before bed for sleep support.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Benefits */}
                <div className="mt-16">
                    <h2 className="font-serif text-2xl font-bold text-[#1B5E20] mb-8 text-center">Health Benefits of Raw Honey</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {benefits.map((b, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                                className="bg-white rounded-2xl p-6 border border-[#CDDBCE]/30 text-center card-lift cursor-pointer">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3 text-[#3A8E3C]" style={{ background: b.color }}>{b.icon}</div>
                                <h3 className="text-sm font-bold text-[#1B5E20] font-serif mb-1">{b.title}</h3>
                                <p className="text-[11px] text-[#6B9E6E] leading-relaxed font-inter">{b.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

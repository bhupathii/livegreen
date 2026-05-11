import React from "react";
import { motion } from "motion/react";

export default function NutritionFacts() {
    return (
        <div className="mt-8 bg-white rounded-2xl p-6 border border-[#CDDBCE]/30 shadow-sm relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F5A623]/10 rounded-full blur-3xl z-0" />

            <div className="relative z-10">
                <h3 className="font-serif text-xl font-bold text-[#1B5E20] mb-6 flex items-center gap-2">
                    <span className="bg-[#E8F5E9] p-1.5 rounded-lg text-[#3A8E3C]">🍯</span>
                    Nutrition Facts
                </h3>

                <div className="bg-[#FFEB3B] rounded-xl border-2 border-[#1B5E20] p-1 overflow-hidden">
                    <div className="bg-[#FFEB3B] rounded-lg">

                        {/* Table Header */}
                        <div className="border-b-4 border-[#1B5E20] px-4 py-3 text-center">
                            <h4 className="text-3xl font-black text-[#333333] tracking-wide font-inter">Nutrition Facts</h4>
                        </div>

                        {/* Table Body */}
                        <div className="flex font-inter text-[#333333] font-bold text-sm sm:text-base">

                            {/* Labels Column */}
                            <div className="w-1/2 flex flex-col border-r-2 border-[#1B5E20] px-4 py-2 space-y-2">
                                <div>Energy</div>
                                <div>Protein</div>
                                <div>Carbohydrates</div>
                                <div>Total Fat</div>
                                <div>Moisture</div>
                                <div>Total Sugars</div>
                                <div>Sodium</div>
                                <div>Dietary Fiber</div>
                            </div>

                            {/* Values Column */}
                            <div className="w-1/4 flex flex-col border-r-2 border-[#1B5E20] px-4 py-2 space-y-2 text-right">
                                <div>335.2</div>
                                <div>0.3</div>
                                <div>83.8</div>
                                <div>BLQ</div>
                                <div>18</div>
                                <div>81.24</div>
                                <div>3</div>
                                <div>0.2</div>
                            </div>

                            {/* Units Column */}
                            <div className="w-1/4 flex flex-col px-4 py-2 space-y-2 text-right">
                                <div>K.Cal</div>
                                <div>g/100g</div>
                                <div>g/100g</div>
                                <div>g/100g</div>
                                <div>%</div>
                                <div>g/100g</div>
                                <div>mg/100g</div>
                                <div>g/100g</div>
                            </div>

                        </div>
                    </div>
                </div>

                <p className="text-[10px] text-gray-500 mt-4 font-inter text-center">
                    *Values may vary slightly per batch due to natural seasonal changes.
                </p>
            </div>
        </div>
    );
}

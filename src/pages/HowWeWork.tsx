import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Leaf, Droplet, Package, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getPublicSettings } from "@/lib/api";

const ICON_MAP: Record<string, any> = {
  Leaf,
  Droplet,
  Package
};

export default function HowWeWork() {
  const [siteSettings, setSiteSettings] = useState<any>({});

  useEffect(() => {
    getPublicSettings().then(setSiteSettings);
  }, []);

  const steps = useMemo(() => {
    try {
      if (siteSettings.how_we_work_json) {
        const raw = JSON.parse(siteSettings.how_we_work_json);
        return raw.map((s: any) => ({
          ...s,
          icon: ICON_MAP[s.icon] || Leaf
        }));
      }
    } catch (e) { console.error("Invalid how_we_work_json", e); }
    return [
      {
        id: 1,
        title: "Ethical Sourcing",
        description: "We partner with local tribal beekeepers who understand the forests better than anyone. Our honey is sourced from deep, pollution-free forests where bees forage on wild medicinal flora.",
        icon: Leaf,
        image: "/images/himalayan-forest.png",
        points: ["Cruelty-free harvesting", "Supporting tribal livelihoods", "Biodiversity protection"]
      },
      {
        id: 2,
        title: "Natural Extraction",
        description: "Unlike commercial honey, we never heat or pasteurize our product. We use a simple gravity filtration method to remove bee wax and debris, keeping all the natural enzymes and pollen intact.",
        icon: Droplet,
        image: "/images/multiflora-honey.png",
        points: ["Cold extracted", "Zero adulteration", "Lab tested for purity"]
      },
      {
        id: 3,
        title: "Sustainable Packaging",
        description: "We believe in plastic-free living. Our honey is packed in sterilized glass jars that preserve its quality and taste. Even our shipping materials are eco-friendly and biodegradable.",
        icon: Package,
        image: "/images/himalayan-forest.png",
        points: ["Glass jars", "Plastic-free shipping", "Recyclable materials"]
      }
    ];
  }, [siteSettings.how_we_work_json]);

  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      {/* Hero */}
      <section className="relative bg-[#0D3B0E] py-28 sm:py-36 overflow-hidden">
        <div className="absolute inset-0 honeycomb-pattern opacity-10" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-[#F5A623]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[400px] w-[400px] rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl font-bold tracking-tight text-white sm:text-6xl"
          >
            From Hive to Home
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-lg leading-8 text-green-100/80 max-w-2xl mx-auto"
          >
            Discover the journey of our honey. Pure, ethical, and sustainable every step of the way.
          </motion.p>
        </div>
      </section>

      {/* Process Roadmap */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-green-200 to-transparent hidden lg:block" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <span className="text-[#F5A623] font-bold tracking-wider uppercase text-sm bg-[#FFF3D6] px-4 py-1.5 rounded-full inline-block mb-4">Our Journey</span>
            <h2 className="font-serif text-4xl font-bold text-[#0D3B0E] sm:text-5xl">
              The Roadmap to Pure Honey
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Every jar tells a story of sustainable harvesting and minimal processing.
            </p>
          </div>

          <div className="space-y-24 relative">
            {steps.map((step: any, index: number) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                className={`flex flex-col lg:flex-row gap-12 items-center relative ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                {/* Center Node */}
                <div className="absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-white border-4 border-[#1B5E20] z-10 hidden lg:flex items-center justify-center shadow-lg">
                  <span className="font-bold text-[#1B5E20] font-serif text-lg">{step.id}</span>
                </div>

                {/* Image */}
                <div className="flex-1 w-full lg:w-1/2">
                  <div className={`relative rounded-3xl overflow-hidden shadow-2xl shadow-black/10 aspect-[4/3] group border-[6px] border-white cursor-pointer ${index % 2 === 0 ? 'lg:mr-12' : 'lg:ml-12'}`}>
                    <img
                      src={step.image}
                      alt={step.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                </div>

                {/* Text */}
                <div className={`flex-1 w-full lg:w-1/2 space-y-6 ${index % 2 === 0 ? 'lg:pl-12 text-left' : 'lg:pr-12 lg:text-right'}`}>
                  <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-50 text-[#1B5E20] mb-2 shadow-sm ${index % 2 === 1 ? 'lg:ml-auto' : ''}`}>
                    <step.icon className="h-8 w-8" />
                  </div>

                  <h3 className="font-serif text-3xl font-bold text-[#0D3B0E]">
                    {step.title}
                  </h3>

                  <p className="text-lg text-gray-500 leading-relaxed">
                    {step.description}
                  </p>

                  <ul className={`space-y-3 ${index % 2 === 1 ? 'lg:items-end flex flex-col' : ''}`}>
                    {step.points.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-3 text-gray-700 font-medium">
                        {index % 2 === 0 && <CheckCircle className="h-5 w-5 text-[#2E7D32] flex-shrink-0" />}
                        {point}
                        {index % 2 === 1 && <CheckCircle className="h-5 w-5 text-[#2E7D32] flex-shrink-0" />}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 animated-gradient relative overflow-hidden">
        <div className="absolute inset-0 honeycomb-pattern opacity-10" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
          <h2 className="font-serif text-3xl font-bold text-white sm:text-5xl mb-6">
            Ready to taste the difference?
          </h2>
          <p className="text-green-100/80 mb-10 max-w-2xl mx-auto text-lg">
            Experience the purity of nature in every drop. Order your jar of Live Green Honey today.
          </p>
          <Link to="/shop">
            <Button size="lg" className="h-14 px-10 text-base rounded-full bg-white text-[#1B5E20] hover:bg-green-50 font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
              Shop Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

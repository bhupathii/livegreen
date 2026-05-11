import React, { useState, useEffect, useMemo } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { motion } from "motion/react";
import { HelpCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublicSettings } from "@/lib/api";

export default function FAQ() {
  const [siteSettings, setSiteSettings] = useState<any>({});

  useEffect(() => {
    getPublicSettings().then(setSiteSettings);
  }, []);

  const faqs = useMemo(() => {
    try {
      if (siteSettings.faq_json) return JSON.parse(siteSettings.faq_json);
    } catch (e) { console.error("Invalid faq_json", e); }
    return [
      { question: "Why does my honey crystallize?", answer: "Crystallization is a natural process and a sign of purity! Raw honey contains glucose and fructose. Over time, glucose separates from water and forms crystals. To liquefy, simply place the jar in warm water." },
      { question: "Is your honey heated or pasteurized?", answer: "No. Our honey is 100% raw and unfiltered. We only strain it to remove bee wax and debris. It is never heated above hive temperature, preserving all natural vitamins, enzymes, and antioxidants." },
      { question: "Do you add sugar or syrup?", answer: "Absolutely not. Our honey is lab tested to ensure zero adulteration. It comes directly from the honeycomb to the bottle." },
      { question: "Is it safe for children?", answer: "Honey is safe for children over 1 year of age. Doctors recommend avoiding honey for infants under 12 months due to the risk of botulism spores." },
      { question: "How should I store the honey?", answer: "Store it in a cool, dry place away from direct sunlight. There is no need to refrigerate honey; in fact, refrigeration accelerates crystallization." },
      { question: "What is the shelf life of your honey?", answer: "Raw honey never spoils if stored correctly! However, for best flavor and quality, we recommend consuming it within 18-24 months of harvest." },
    ];
  }, [siteSettings.faq_json]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="bg-[#0D3B0E] py-28 sm:py-36 relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 honeycomb-pattern opacity-10" />
        <div className="absolute top-0 left-0 -ml-20 -mt-20 h-[400px] w-[400px] rounded-full bg-[#3A8E3C]/8 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-sm text-[#F5A623] border border-white/8">
            <HelpCircle className="h-6 w-6" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-3 font-inter">Support</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-serif text-4xl font-bold text-white sm:text-6xl tracking-tight">Frequently Asked Questions</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-6 text-sm text-white/70 max-w-md mx-auto font-inter">
            Everything you need to know about our raw honey, sourcing, and delivery.
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-[#CDDBCE]/30">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq: any, index: number) => (
              <AccordionItem key={index} value={`item-${index}`}
                className="bg-[#F5FFF5]/50 rounded-2xl border border-[#CDDBCE]/20 px-6 overflow-hidden data-[state=open]:bg-[#E8F5E9]/30 data-[state=open]:border-[#3A8E3C]/20 transition-colors">
                <AccordionTrigger className="text-left text-sm font-semibold text-[#1B5E20] hover:text-[#3A8E3C] hover:no-underline py-5">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-[#6B9E6E] text-sm leading-relaxed pb-5 font-inter">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-[#CDDBCE]/30 text-center">
          <div className="h-12 w-12 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="h-5 w-5 text-[#3A8E3C]" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1B5E20] mb-1.5">Still have questions?</h3>
          <p className="text-xs text-[#6B9E6E] mb-6 font-inter">We're here to help. Reach out directly.</p>
          <Link to="/contact">
            <button className="btn-primary h-10 px-8 cursor-pointer text-xs font-inter">Contact Us</button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

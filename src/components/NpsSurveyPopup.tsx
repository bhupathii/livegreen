import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { submitNpsSurvey } from "@/lib/api";
import { X, Send, Heart } from "lucide-react";

interface NpsSurveyPopupProps {
    orderId?: string;
    delay?: number; // ms before showing
}

export default function NpsSurveyPopup({ orderId, delay = 5000 }: NpsSurveyPopupProps) {
    const [show, setShow] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        // Don't show if already submitted for this session
        if (sessionStorage.getItem('nps_submitted')) return;
        const timer = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    const handleSubmit = async () => {
        if (score === null) return;
        setSending(true);
        try {
            await submitNpsSurvey(score, comment || undefined);
            setSubmitted(true);
            sessionStorage.setItem('nps_submitted', '1');
        } catch { }
        setSending(false);
    };

    const labels = ['😡', '😟', '😕', '😐', '🙂', '😊', '😄', '🤩', '🥰', '💚', '🔥'];

    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)]"
            >
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1B5E20] to-[#3A8E3C] p-5 text-white relative">
                        <button onClick={() => setShow(false)}
                            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                            <X className="w-4 h-4" />
                        </button>
                        {submitted ? (
                            <div className="text-center py-2">
                                <Heart className="w-10 h-10 mx-auto mb-2 text-rose-300" />
                                <p className="font-bold text-lg">Thank you! 🎉</p>
                                <p className="text-white/70 text-sm">Your feedback means the world to us.</p>
                            </div>
                        ) : (
                            <>
                                <p className="font-bold text-lg">How was your experience?</p>
                                <p className="text-white/70 text-sm mt-1">How likely are you to recommend us?</p>
                            </>
                        )}
                    </div>

                    {!submitted && (
                        <div className="p-5">
                            {/* Score selection */}
                            <div className="flex justify-between mb-2">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                    <button key={n} onClick={() => setScore(n)}
                                        className={`w-[26px] h-[26px] rounded-full text-[10px] font-bold transition-all duration-200
                                            ${score === n
                                                ? n <= 6 ? 'bg-rose-500 text-white scale-125 ring-2 ring-rose-200'
                                                    : n <= 8 ? 'bg-amber-500 text-white scale-125 ring-2 ring-amber-200'
                                                        : 'bg-emerald-500 text-white scale-125 ring-2 ring-emerald-200'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400 mb-4 px-1">
                                <span>Not likely</span>
                                <span>Very likely</span>
                            </div>

                            {score !== null && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                    <p className="text-center text-2xl mb-2">{labels[score]}</p>
                                    <textarea value={comment} onChange={e => setComment(e.target.value)}
                                        placeholder="Any feedback? (optional)"
                                        className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none h-16 outline-none focus:border-[#1B5E20]/50 transition" />
                                    <button onClick={handleSubmit} disabled={sending}
                                        className="mt-3 w-full py-3 bg-[#1B5E20] text-white rounded-xl font-bold text-sm hover:bg-[#144a18] transition flex items-center justify-center gap-2">
                                        {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            : <><Send className="w-4 h-4" /> Submit Feedback</>}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

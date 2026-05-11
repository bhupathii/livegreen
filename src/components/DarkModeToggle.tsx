import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

export default function DarkModeToggle() {
    const [dark, setDark] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") === "dark";
        }
        return false;
    });

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [dark]);

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDark(!dark)}
            className="h-9 w-9 rounded-full bg-[#E8F5E9] dark:bg-white/10 flex items-center justify-center text-[#1B5E20] dark:text-[#F5A623] hover:bg-[#1B5E20] hover:text-white dark:hover:bg-white/20 transition-all duration-300 cursor-pointer"
            aria-label="Toggle dark mode"
        >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.button>
    );
}

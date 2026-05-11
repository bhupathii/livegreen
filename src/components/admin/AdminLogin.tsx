import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminLogin } from "@/lib/api";
import { LogIn } from "lucide-react";

export function AdminLogin() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await adminLogin(username, password);
            if (res.success && res.token) {
                login(res.token);
            } else {
                setError(res.error || "Invalid credentials");
            }
        } catch (err) {
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 bg-[#F5FFF5] rounded-full items-center justify-center mb-4">
                        <LogIn className="h-8 w-8 text-[#1B5E20]" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-[#1B5E20]">Admin Login</h1>
                    <p className="text-gray-500 mt-2 font-inter">Sign in to manage Live Green</p>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-sm font-medium border border-rose-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-[#1B5E20] mb-2 font-inter">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-4 border border-[#CDDBCE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] transition-all bg-[#FAFAFA]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#1B5E20] mb-2 font-inter">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 border border-[#CDDBCE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] transition-all bg-[#FAFAFA]"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1B5E20] text-white py-4 rounded-xl font-bold font-inter hover:bg-[#144a18] transition-colors disabled:opacity-50 mt-4 custom-shadow"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}

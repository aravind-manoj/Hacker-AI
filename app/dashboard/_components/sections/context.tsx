"use client";

import { useState } from "react";
import { Globe, Sparkles, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ContextSection() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        industry: "",
        services: "",
        email: "",
        phone: "",
        address: "",
        social: "",
    });

    const handleAnalyze = () => {
        if (!url) {
            toast.error("Please enter a valid URL.");
            return;
        }

        setLoading(true);
        // Simulate AI extraction
        setTimeout(() => {
            setFormData({
                name: "Hacker.AI Offensive Security",
                description: "Building Advanced Technology that supercharges your penetration testing workflows with autonomous Sub-Agents, transforming the way you isolate and execute zero-day payloads.",
                industry: "Cybersecurity / Penetration Testing",
                services: "Agentic reconnaissance, Docker isolation, RabbitMQ scaling, Vulnerability orchestration",
                email: "neural-net@hacker.ai",
                phone: "+1 (555) 314-1592",
                address: "714 Subnet Mask Blvd, Null Island",
                social: "https://x.com/HackerAI\nhttps://github.com/hacker-ai",
            });
            setLoading(false);
            toast.success("AI Analysis Complete!");
        }, 2000);
    };

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast.success("Context Saved Successfully!");
        }, 1000);
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto p-6 text-white font-mono animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header section */}
            <div>
                <h2 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3 text-red-500">
                    <Globe className="w-8 h-8" />
                    Context Creation
                </h2>
                <p className="text-gray-400 mt-2 text-sm">
                    Enter a website URL to automatically extract business or portfolio information using AI.
                </p>
            </div>

            {/* URL Input Section */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-10 transition duration-500"></div>
                <div className="relative bg-[#050505] border border-red-900/50 rounded-lg p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-red-500" />
                        <h3 className="font-bold text-white uppercase tracking-wider text-sm">Website URL</h3>
                    </div>
                    <p className="text-gray-400 text-xs mb-4">Enter the website URL you want to analyze</p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://hacker.ai"
                            className="flex-1 bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder:text-gray-700"
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !url}
                            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Analyze with AI
                        </button>
                    </div>
                </div>
            </div>

            {/* Extracted Information Section */}
            <div className="bg-[#050505] border border-red-900/50 rounded-lg p-6 shadow-xl flex flex-col gap-6">
                <div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                        Extracted <span className="text-red-500">Information</span>
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">Edit your business context information below</p>
                </div>

                <div className="flex flex-col gap-5">
                    {/* Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Business/Portfolio Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Industry Code */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Industry/Category</label>
                        <input
                            type="text"
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                    </div>

                    {/* Services */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Services/Products</label>
                        <textarea
                            rows={2}
                            value={formData.services}
                            onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                            className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Two Columns: Email / Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Contact Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Address</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Business address"
                            className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-700"
                        />
                    </div>

                    {/* Social */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Social Media Links</label>
                        <textarea
                            rows={3}
                            value={formData.social}
                            onChange={(e) => setFormData({ ...formData, social: e.target.value })}
                            className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none leading-relaxed"
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:shadow-[0_0_25px_rgba(255,0,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Context
                    </button>
                </div>
            </div>
        </div>
    );
}

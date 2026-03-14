"use client";

import { KeyRound, ShieldCheck, AlertOctagon } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";

export default function SettingsSection() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to change password.");
      return;
    }

    setSuccess(true);
    toast.success("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto p-6 text-white font-mono">
      <div className="border-b border-red-900/40 pb-4 mb-6">
        <h2 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3 text-red-500">
          <KeyRound className="w-8 h-8" />
          Security Credentials
        </h2>
        <p className="text-gray-400 mt-2 text-sm">
          Update the master encryption key used for dashboard access and agent orchestration.
        </p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-[#050505] border border-red-900/50 rounded-lg p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-red-500 font-bold uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                Current Passphrase
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder:text-gray-700"
                placeholder="Enter current master key..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-red-500 font-bold uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                New Passphrase
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder:text-gray-700"
                placeholder="Generate a robust key..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-red-500 font-bold uppercase tracking-wider">
                Confirm New Passphrase
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder:text-gray-700"
                placeholder="Verify new key..."
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500 max-w-[60%]">
                Passphrases must be over 16 characters and contain volatile entropy.
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest px-8 py-3 rounded shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:shadow-[0_0_25px_rgba(255,0,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Committing...
                  </>
                ) : success ? (
                  "Key Updated"
                ) : (
                  "Update Key"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

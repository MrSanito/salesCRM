"use client"
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import toast from "react-hot-toast";
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, ShieldAlert } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "solosales"
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        if (!otpSent) {
          // Step 1: Request OTP
          const res = await fetch("/api/auth/email-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email }),
          });

          const data = await res.json();

          if (res.ok && data.otpSent) {
            setOtpSent(true);
            toast.success("OTP sent to your email!");
          } else {
            toast.error(data.error || "Failed to send OTP");
          }
        } else {
          // Step 2: Verify OTP and Login
          const res = await fetch("/api/auth/email-login/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email, otp }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            toast.success("Login Successful!");
            login(data.user);
          } else {
            toast.error(data.error || "Invalid OTP");
          }
        }
      } else {
        // Register Flow
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success("Registration Successful! Please Login.");
          setIsLogin(true);
          setOtpSent(false);
        } else {
          toast.error(data.error || "Something went wrong");
        }
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 relative z-10">
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="mb-4 flex justify-center">
              <span className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                Solo <span className="text-blue-600">Sales</span>
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
              {isLogin ? "Your Personalized Sales Assistant" : "Enterprise Onboarding"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Company Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400"><LogIn size={18} /></span>
                    <input
                      type="text"
                      required
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                      placeholder="Acme Global Inc."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400"><UserIcon size={18} /></span>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                      placeholder="Arjun Mehta"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400"><Mail size={18} /></span>
                <input
                  type="email"
                  required
                  disabled={isLogin && otpSent}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="admin@solosales.com"
                />
              </div>
            </div>

            {/* Show Password Field only for Registration */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Security Key (Password)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400"><Lock size={18} /></span>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Show OTP Field only for Login when OTP has been sent */}
            {isLogin && otpSent && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">Enter Verification Code (OTP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-blue-600"><Lock size={18} /></span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold tracking-[0.25em] text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                    placeholder="123456"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                  className="text-[9px] font-bold text-slate-400 hover:text-slate-500 transition-colors uppercase tracking-widest mt-1 block pl-1"
                >
                  ← Change Email Address
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white rounded-2xl py-4.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <UserPlus size={14} className="group-hover:scale-110 transition-transform" />}
                  {isLogin ? (otpSent ? "Verify & Log In" : "Send OTP Verification") : "Initialize Account"}
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setOtpSent(false);
                setOtp("");
              }}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors cursor-pointer"
            >
              {isLogin ? "Establish New Company Profile" : "Existing account? Return to portal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
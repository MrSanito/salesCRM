"use client"
import { useState, useEffect } from "react";
import { User, Mail, Shield, Save, ArrowLeft, Camera, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, checkUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (res.ok) {
        toast.success("Identity Updated Successfully");
        await checkUser(); // Refresh global user state
      } else {
        const data = await res.json();
        toast.error(data.error || "Update failed");
      }
    } catch (err) {
      toast.error("Network synchronization error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security & Identity</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your professional profile and access protocols.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col items-center text-center shadow-xl shadow-slate-200/50">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200 relative z-10">
                {user?.initials}
              </div>
              <div className="absolute -inset-2 bg-blue-500 rounded-[2.2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <button className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-xl border-4 border-white shadow-lg transform translate-x-1/4 translate-y-1/4 hover:scale-110 transition-all active:scale-95 z-20">
                <Camera size={14} />
              </button>
            </div>
            
            <div className="mt-6">
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mt-1">{user?.role.replace("ORG_", "").replace("_", " ")}</p>
            </div>

            <div className="w-full h-px bg-slate-50 my-6" />

            <div className="w-full space-y-4">
               <div className="flex items-center justify-between text-left p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee ID</p>
                    <p className="text-xs font-bold text-slate-700">#{user?.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <Fingerprint size={16} className="text-blue-500" />
               </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
             <div className="p-8 sm:p-10 border-b border-slate-50 bg-slate-50/30">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <User size={14} className="text-blue-600" /> Profile & Identity
                </h3>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Legal Name</label>
                      <div className="relative">
                        <User size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                          placeholder="Full Name"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 px-1 italic">This name will be visible to all members of your organization.</p>
                   </div>

                   <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address (Primary)</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 px-1">This email will be used for all system notifications and login.</p>
                   </div>
                </div>
             </div>

             <div className="p-8 sm:p-10 flex items-center justify-between bg-white">
                <div className="hidden sm:block">
                   <p className="text-xs font-bold text-slate-400">Last synced: Just now</p>
                </div>
                <button 
                  type="submit"
                  disabled={loading || (name === user?.name && email === user?.email)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 disabled:shadow-none"
                >
                  <Save size={16} />
                  {loading ? "Updating..." : "Update Email & Profile"}
                </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
}

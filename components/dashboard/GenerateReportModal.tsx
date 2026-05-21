"use client"
import { X, ChevronDown, FileText, Sparkles, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  managerId?: string | null;
}

interface GenerateReportModalProps {
  onClose: () => void;
}

export default function GenerateReportModal({ onClose }: GenerateReportModalProps) {
  const { user } = useAuth();
  const [scope, setScope] = useState<"crm" | "employee">("crm");
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  // Force scope to employee if user is a MANAGER
  useEffect(() => {
    if (user?.role === "MANAGER") {
      setScope("employee");
    }
  }, [user]);

  // Fetch employees if "employee" scope is chosen
  useEffect(() => {
    if (scope === "employee" && employees.length === 0) {
      setFetchingEmployees(true);
      fetch("/api/team")
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to load");
        })
        .then((data: TeamMember[]) => {
          let filtered = data;
          if (user?.role === "MANAGER") {
            filtered = data.filter(emp => emp.id === user.id || emp.managerId === user.id);
          }
          setEmployees(filtered);
          if (filtered.length > 0) {
            setEmployeeId(filtered[0].id);
          }
        })
        .catch(() => toast.error("Could not fetch team list"))
        .finally(() => setFetchingEmployees(false));
    }
  }, [scope, employees.length, user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scope === "employee" && !employeeId) {
      toast.error("Please select an employee");
      return;
    }

    setLoading(true);
    setReportUrl(null);

    // Dynamic step messages to make the UI feel responsive and intelligent
    const steps = [
      "Gathering database metrics...",
      "Analyzing pipeline conversion rates...",
      "Consulting Gemini Flash for performance insights...",
      "Compiling data visualizations & narratives...",
      "Rendering final print-ready PDF...",
      "Securing report in the cloud..."
    ];

    let currentStep = 0;
    setLoadingStep(steps[currentStep]);

    const stepInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setLoadingStep(steps[currentStep]);
      }
    }, 2500);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          employeeId: scope === "employee" ? employeeId : undefined
        })
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (res.ok && data.success && data.fileUrl) {
        setReportUrl(data.fileUrl);
        toast.success("Performance Report Ready!");
      } else {
        toast.error(data.error || "Generation failed. Please try again.");
      }
    } catch (error) {
      clearInterval(stepInterval);
      toast.error("Connection error while generating report");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div 
        className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-250" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">CRM Intelligence Report</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                Generate Performance Analysis
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin flex items-center justify-center" />
                <Sparkles size={20} className="absolute inset-0 m-auto text-indigo-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800 uppercase tracking-wider animate-pulse">
                  Generating PDF Report
                </p>
                <p className="text-[11px] text-slate-400 font-semibold italic min-h-[16px]">
                  {loadingStep}
                </p>
              </div>
            </div>
          ) : reportUrl ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-50">
                <FileText size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800">Report Compiled Successfully</h3>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Ready for local archive & review
                </p>
              </div>

              <div className="w-full flex flex-col gap-3 pt-2">
                <a 
                  href={`/api/reports/download?url=${encodeURIComponent(reportUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                >
                  <Download size={14} />
                  Download PDF Report
                </a>
                <button 
                  onClick={onClose}
                  className="w-full py-3.5 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            /* Configure Report Form */
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Scope Segment Control */}
              {user?.role === "MANAGER" ? (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Analysis Scope
                  </label>
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                        Specific Employee Performance
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      As a Manager, you are scoped to generate performance reports only for yourself and your direct subordinates.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Analysis Scope
                  </label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => setScope("crm")}
                      className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        scope === "crm" 
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-200/30" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Whole CRM Scope
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope("employee")}
                      className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        scope === "employee" 
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-200/30" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Specific Employee
                    </button>
                  </div>
                </div>
              )}

              {/* Employee Selection */}
              {scope === "employee" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Select Target Employee
                  </label>
                  <div className="relative">
                    <select
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      disabled={fetchingEmployees}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all appearance-none pr-10"
                    >
                      {fetchingEmployees ? (
                        <option>Loading employee ledger...</option>
                      ) : (
                        employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.role})
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                      {fetchingEmployees ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]" 
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={scope === "employee" && !employeeId}
                  className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50"
                >
                  Generate Report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

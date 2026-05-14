import { useState, useEffect } from "react";
import { X, User, Building, Phone, Mail, MessageSquare, Info, Download, FileText, CheckCircle, AlertCircle, Layout, Globe } from "lucide-react";
import * as XLSX from 'xlsx';
import axios from "axios";
import { useAuth } from "@/components/auth/AuthContext";
import toast from "react-hot-toast";

interface AddLeadModalProps {
  isOpen?: boolean; // For compatibility with different usage patterns
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddLeadModal({ onClose, onSuccess }: AddLeadModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    phone2: "",
    email: "",
    email2: "",
    industry: "",
    requirement: "",
    notes: "",
    ownerId: "",
    subStatus: "BLANK",
    source: "",
  });
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [importPreview, setImportPreview] = useState<{ headers: string[]; missing: string[]; extra: string[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const REQUIRED_HEADERS = [
    "Person Name", "Company Name", "Industry", "Primary Phone", "Secondary Phone", 
    "Primary Email", "Secondary Email", "Requirement", "Internal Notes", "Source"
  ];

  const handleCommenceImport = async () => {
    if (!importPreview || !file) return;
    setLoading(true);
    
    try {
      if (!file) {
        toast.error("File lost. Please re-upload.");
        setImportPreview(null);
        setLoading(false);
        return;
      }

      const data = await new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            resolve(XLSX.utils.sheet_to_json(ws));
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
      });

      const response = await axios.post("/api/leads/bulk", { 
        action: "CREATE", 
        leads: data.map((l: any) => ({
          contactName: l["Person Name"] || "Unknown",
          company: l["Company Name"] || "Unknown",
          industry: l["Industry"] || null,
          phone: String(l["Primary Phone"] || ""),
          phone2: String(l["Secondary Phone"] || ""),
          email: l["Primary Email"] || null,
          email2: l["Secondary Email"] || null,
          requirement: l["Requirement"] || null,
          notes: l["Internal Notes"] || null,
          source: l["Source"] || null,
        }))
      });

      toast.success(response.data.message || "Import successful!");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Failed to import leads.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls') && !f.name.endsWith('.csv')) {
      toast.error("Please provide an Excel or CSV file.");
      return;
    }
    setFile(f);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      if (data.length > 0) {
        const fileHeaders = data[0].map(h => String(h).trim());
        const missing = REQUIRED_HEADERS.filter(h => !fileHeaders.includes(h));
        const extra = fileHeaders.filter(h => !REQUIRED_HEADERS.includes(h));
        setImportPreview({ headers: fileHeaders, missing, extra });
      }
    };
    reader.readAsBinaryString(f);
  };

  const canAssign = user?.role === "ORG_ADMIN" || user?.role === "MANAGER";

  useEffect(() => {
    if (canAssign) {
      axios.get("/api/team")
        .then(res => {
          const d = res.data;
          if (Array.isArray(d)) {
            setTeam(d);
            // Default to current user
            setFormData(prev => ({ ...prev, ownerId: user?.id || "" }));
          }
        })
        .catch(err => {
          console.error("Failed to fetch team:", err);
        });
    }
  }, [canAssign, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await axios.post("/api/leads", {
        ...formData,
        organizationId: user?.organizationId
      });

      toast.success("Lead Created Successfully!");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Failed to create lead";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Protocol</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Initiating Lead Intelligence</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'manual' 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Layout size={14} />
            MANUAL ENTRY
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'import' 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText size={14} />
            IMPORT FROM EXCEL
          </button>
        </div>

        {activeTab === 'manual' ? <>
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Person Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" 
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Company Name</label>
                  <div className="relative">
                    <Building size={14} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" 
                      placeholder="e.g. Acme Corp" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Primary Phone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" 
                      placeholder="+91 XXXX XXXX" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Secondary Phone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                      type="tel" 
                      value={formData.phone2}
                      onChange={e => setFormData({ ...formData, phone2: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" 
                      placeholder="+91 XXXX XXXX" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Source</label>
                <div className="relative">
                  <Info size={14} className="absolute left-4 top-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" 
                    placeholder="e.g. Website, LinkedIn, Referral" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Primary Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" 
                      placeholder="email@domain.com" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Secondary Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                      type="email" 
                      value={formData.email2}
                      onChange={e => setFormData({ ...formData, email2: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" 
                      placeholder="email2@domain.com" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Industry</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-4 top-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.industry}
                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all" 
                    placeholder="e.g. Technology, Healthcare" 
                  />
                </div>
              </div>

              {canAssign && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Assign To</label>
                  <div className="relative">
                    <User size={14} className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" />
                    <select 
                      value={formData.ownerId}
                      onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all appearance-none"
                    >
                      {team.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-3.5 text-slate-400 pointer-events-none">
                      <Layout size={12} />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Sub Status</label>
                <div className="relative">
                  <AlertCircle size={14} className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" />
                  <select 
                    value={formData.subStatus}
                    onChange={e => setFormData({ ...formData, subStatus: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all appearance-none"
                  >
                    <option value="BLANK">No Substatus</option>
                    <option value="CHATTING">Chatting</option>
                    <option value="NOT_ANSWERED">Not Answered</option>
                    <option value="WRONG_NO">Wrong No.</option>
                    <option value="NO_REQUIREMENT">No Requirement</option>
                    <option value="BUDGET_LOW">Budget Low</option>
                    <option value="PROPOSAL_SENT">Proposal Sent</option>
                    <option value="WARM_LEAD">Warm Lead</option>
                  </select>
                  <div className="absolute right-4 top-3.5 text-slate-400 pointer-events-none">
                    <Layout size={12} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Requirement</label>
                  <div className="relative">
                    <MessageSquare size={14} className="absolute left-4 top-3 text-slate-400" />
                    <textarea 
                      value={formData.requirement}
                      onChange={e => setFormData({ ...formData, requirement: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                        }
                      }}
                      rows={8}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-4 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all min-h-[200px] resize-y" 
                      placeholder="Describe the lead's requirement..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Internal Notes</label>
                <div className="relative">
                  <Info size={14} className="absolute left-4 top-3 text-slate-400" />
                  <textarea 
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                      }
                    }}
                    rows={8}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-4 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 outline-none transition-all min-h-[200px] resize-y" 
                    placeholder="Private internal insights..." 
                  ></textarea>
                </div>
              </div>
              <div className="p-8 pt-0 flex gap-4">
                <button type="button" className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-all active:scale-95" onClick={onClose}>Cancel</button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-4 bg-blue-600 text-white font-bold text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Create Lead"}
                </button>
              </div>
            </div>
          </form>
        </> : <>
          <div className="p-8 space-y-6">
            {/* Import Drop Zone / Status */}
            {!importPreview ? (
              <div 
                className={`border-4 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 transition-all ${
                  isDragging ? "bg-blue-50 border-blue-400" : "bg-slate-50 border-slate-200"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Download size={32} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">Drop Excel or CSV here</p>
                  <p className="text-sm text-slate-500 font-medium">to bulk import leads instantly</p>
                </div>
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden" 
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="mt-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 cursor-pointer transition-all shadow-sm active:scale-95"
                >
                  BROWSE COMPUTER
                </label>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${importPreview.missing.length === 0 ? "bg-green-500" : "bg-amber-500"}`} />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Format Verification</h3>
                    </div>
                    <button 
                      onClick={() => setImportPreview(null)}
                      className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                    >
                      Reset File
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {REQUIRED_HEADERS.map(header => {
                      const isFound = importPreview.headers.includes(header);
                      return (
                        <div 
                          key={header}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                            isFound 
                              ? "bg-green-50 border-green-200 text-green-700" 
                              : "bg-red-50 border-red-200 text-red-600"
                          }`}
                        >
                          {isFound ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          {header}
                        </div>
                      );
                    })}
                  </div>

                  {importPreview.missing.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                      <Info size={16} className="text-red-500 shrink-0" />
                      <p className="text-[11px] text-red-600 font-bold">
                        Missing columns: {importPreview.missing.join(", ")}. Please fix your file before importing.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                   <button 
                    disabled={importPreview.missing.length > 0 || loading}
                    onClick={handleCommenceImport}
                    className="w-full py-4 bg-blue-600 text-white font-black text-sm rounded-[20px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    {loading ? "Processing..." : "Commence Bulk Import"}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-slate-50/50 rounded-[24px] p-6 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Required Template</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Download to ensure compatibility</p>
                </div>
                <button 
                  onClick={() => {
                    const ws = XLSX.utils.aoa_to_sheet([REQUIRED_HEADERS]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Template");
                    XLSX.writeFile(wb, "Solo_Sales_Import_Template.xlsx");
                  }}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
            </div>
          </>
        }
      </div>

      {/* Global Drag Overlay */}
      {isDragging && activeTab === 'import' && (
        <div className="fixed inset-0 z-[110] bg-blue-600/10 backdrop-blur-sm border-4 border-dashed border-blue-500 m-8 rounded-[48px] flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
          <div className="bg-white px-8 py-6 rounded-[32px] shadow-2xl flex flex-col items-center gap-4 border border-blue-100">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 animate-bounce">
              <Download size={32} />
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">Drop Template Here</p>
              <p className="text-sm font-bold text-slate-500">We'll verify the headers instantly</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

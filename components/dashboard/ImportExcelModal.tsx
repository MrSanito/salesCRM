"use client"
import { useState } from "react";
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

interface ImportExcelModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function ImportExcelModal({ onClose, onImportSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        setPreviewData(data.slice(0, 5)); // Preview first 5 rows
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Send to bulk API
        const response = await fetch("/api/leads/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: "CREATE", 
            leads: data.map((l: any) => ({
              contactName: l["Person Name"] || l.contactName || "Unknown",
              company: l["Company Name"] || l.company || "Unknown",
              phone: String(l["Primary Phone"] || l.phone || ""),
              phone2: String(l["Secondary Phone"] || l.phone2 || ""),
              email: l["Primary Email"] || l.email || null,
              email2: l["Secondary Email"] || l.email2 || null,
              requirement: l["Requirement"] || l.requirement || null,
              notes: l["Internal Notes"] || l.notes || null,
              stage: "NEW",
              subStatus: "BLANK"
            }))
          })
        });

        if (response.ok) {
          toast.success(`Successfully imported ${data.length} leads!`);
          onImportSuccess();
          onClose();
        } else {
          toast.error("Failed to import leads. Please check file format.");
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      toast.error("An error occurred during import.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      ["Person Name", "Company Name", "Primary Phone", "Secondary Phone", "Primary Email", "Secondary Email", "Requirement", "Internal Notes"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Lead_Import_Template.xlsx");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">Import Leads</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-widest">Excel or CSV files</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              title="Download Example Template"
            >
              <Download size={12} className="text-blue-500" />
              Template
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-600 shadow-sm transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <p className="mb-2 text-sm text-slate-700 font-bold italic">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400 font-medium">Excel (.xlsx) or CSV (.csv) files only</p>
              </div>
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {previewData.length > 0 && (
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview (First {previewData.length} rows)</p>
                    <CheckCircle2 size={12} className="text-green-500" />
                  </div>
                  <div className="p-3 bg-white overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <tbody>
                        {previewData.map((row: any, i) => (
                          <tr key={i} className={i === 0 ? "font-bold text-slate-900 border-b border-slate-50" : "text-slate-600"}>
                            {row.map((cell: any, j: number) => (
                              <td key={j} className="px-2 py-1.5 whitespace-nowrap">{String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                  Ensure headers match: <span className="font-bold underline">Person Name</span>, <span className="font-bold underline">Company Name</span>, <span className="font-bold underline">Primary Phone</span>, <span className="font-bold underline">Secondary Phone</span>, <span className="font-bold underline">Primary Email</span>, <span className="font-bold underline">Secondary Email</span>, <span className="font-bold underline">Requirement</span>, <span className="font-bold underline">Internal Notes</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-all">
            Cancel
          </button>
          <button 
            onClick={handleImport}
            disabled={!file || loading}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Start Import
          </button>
        </div>
      </div>
    </div>
  );
}

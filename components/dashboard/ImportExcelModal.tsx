"use client"
import { useState, useMemo } from "react";
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

interface ImportExcelModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

const EXPECTED_HEADERS = [
  "Person Name", "Company Name", "Primary Phone", "Secondary Phone",
  "Primary Email", "Secondary Email", "Requirement", "Internal Notes",
  "Industry", "Source", "City", "State"
];

const REQUIRED_FIELDS = ["Person Name", "Company Name", "Primary Phone"];

export default function ImportExcelModal({ onClose, onImportSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState<any[]>([]); // All rows including header
  const [totalRows, setTotalRows] = useState(0);

  // Analyze data for discrepancies
  const analysis = useMemo(() => {
    if (allData.length < 2) return { headerIssues: [], rowIssues: new Map(), issueCount: 0 };

    const headers = allData[0] as string[];
    const headerIssues: string[] = [];

    // Check for missing expected headers
    EXPECTED_HEADERS.forEach(h => {
      if (!headers.some(hh => String(hh).trim().toLowerCase() === h.toLowerCase())) {
        headerIssues.push(h);
      }
    });

    // Check each data row for missing required fields
    const requiredIndices = REQUIRED_FIELDS.map(rf => 
      headers.findIndex(h => String(h).trim().toLowerCase() === rf.toLowerCase())
    );

    const rowIssues = new Map<number, number[]>(); // rowIndex -> array of column indices with issues
    let issueCount = 0;

    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      const issues: number[] = [];
      
      requiredIndices.forEach((colIdx, reqIdx) => {
        if (colIdx === -1) return; // Header missing entirely, already flagged
        const val = row?.[colIdx];
        if (val === undefined || val === null || String(val).trim() === "") {
          issues.push(colIdx);
          issueCount++;
        }
      });

      if (issues.length > 0) {
        rowIssues.set(i, issues);
      }
    }

    return { headerIssues, rowIssues, issueCount };
  }, [allData]);

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
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        // Normalize: ensure all rows have same number of columns as header
        const maxCols = data[0]?.length || 0;
        const normalized = data.map(row => {
          const padded = [...row];
          while (padded.length < maxCols) padded.push("");
          return padded;
        });

        setTotalRows(Math.max(0, normalized.length - 1));
        setAllData(normalized); // Store ALL data
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
              industry: l["Industry"] || l.industry || null,
              source: l["Source"] || l.source || null,
              city: l["City"] || l.city || null,
              state: l["State"] || l.state || null,
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
        setLoading(false);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      toast.error("An error occurred during import.");
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [EXPECTED_HEADERS];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Lead_Import_Template.xlsx");
  };

  const hasIssues = analysis.headerIssues.length > 0 || analysis.issueCount > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Wide modal: 3/4 of screen width, full height constraint */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[75vw] max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 mb-6 animate-bounce">
              <Loader2 size={40} className="text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Importing Leads</h3>
            <p className="text-slate-500 font-medium max-w-xs leading-relaxed">
              We are processing your Excel protocol. <br />
              <span className="text-blue-600 font-bold underline italic">Please don't exit or refresh</span> until success.
            </p>
          </div>
        )}
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">Import Leads</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-widest">Excel or CSV files</p>
            </div>
            {file && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100">
                  {totalRows} rows
                </span>
                {hasIssues && (
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100 flex items-center gap-1">
                    <AlertTriangle size={10} /> {analysis.issueCount} issues
                  </span>
                )}
                {!hasIssues && allData.length > 1 && (
                  <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2.5 py-1 rounded-lg border border-green-100 flex items-center gap-1">
                    <CheckCircle2 size={10} /> All clear
                  </span>
                )}
              </div>
            )}
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

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {!file ? (
            <div className="p-8 flex items-center justify-center">
              <label className="flex flex-col items-center justify-center w-full max-w-md h-72 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  <p className="mb-2 text-sm text-slate-700 font-bold italic">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 font-medium">Excel (.xlsx) or CSV (.csv) files only</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
              </label>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header issues warning */}
              {analysis.headerIssues.length > 0 && (
                <div className="mx-6 mt-4 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-red-700 font-bold mb-1">Missing Expected Headers</p>
                    <p className="text-[11px] text-red-600 leading-relaxed font-medium">
                      {analysis.headerIssues.map((h, i) => (
                        <span key={h}>
                          <span className="font-bold underline">{h}</span>
                          {i < analysis.headerIssues.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              )}

              {/* File info bar */}
              <div className="mx-6 mt-4 flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[300px]">{file.name}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                      {(file.size / 1024).toFixed(1)} KB · {totalRows} data rows · {allData[0]?.length || 0} columns
                    </p>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setAllData([]); setTotalRows(0); }} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Full data table — all rows visible, scrollable */}
              {allData.length > 0 && (
                <div className="mx-6 mt-4 mb-4 rounded-2xl border border-slate-200 overflow-hidden flex-1 min-h-0 flex flex-col">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      All Data — {totalRows} rows · {allData[0]?.length || 0} columns
                    </p>
                    <div className="flex items-center gap-2">
                      {analysis.issueCount > 0 && (
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">
                          {analysis.rowIssues.size} rows with missing required fields
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-[11px] border-collapse">
                      {/* Sticky header row */}
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-900 text-white">
                          <th className="px-3 py-2 text-left font-bold text-[9px] uppercase tracking-widest whitespace-nowrap border-r border-slate-700 w-10">#</th>
                          {(allData[0] || []).map((header: any, j: number) => {
                            const isExpected = EXPECTED_HEADERS.some(h => h.toLowerCase() === String(header).trim().toLowerCase());
                            const isRequired = REQUIRED_FIELDS.some(h => h.toLowerCase() === String(header).trim().toLowerCase());
                            return (
                              <th 
                                key={j} 
                                className={`px-3 py-2 text-left font-bold text-[9px] uppercase tracking-widest whitespace-nowrap border-r border-slate-700 last:border-r-0 ${
                                  !isExpected ? "bg-amber-600" : ""
                                }`}
                              >
                                {String(header ?? "")}
                                {isRequired && <span className="text-red-300 ml-0.5">*</span>}
                                {!isExpected && <span className="ml-1 text-amber-200 text-[8px]">(unknown)</span>}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {allData.slice(1).map((row: any, i) => {
                          const rowIdx = i + 1;
                          const rowHasIssue = analysis.rowIssues.has(rowIdx);
                          const issueColumns = analysis.rowIssues.get(rowIdx) || [];
                          
                          return (
                            <tr 
                              key={rowIdx} 
                              className={`border-b border-slate-50 transition-colors ${
                                rowHasIssue 
                                  ? "bg-red-50 hover:bg-red-100/60" 
                                  : i % 2 === 0 
                                    ? "bg-white hover:bg-slate-50" 
                                    : "bg-slate-50/30 hover:bg-slate-50"
                              }`}
                            >
                              <td className={`px-3 py-1.5 font-mono text-[9px] border-r border-slate-100 ${
                                rowHasIssue ? "text-red-500 font-bold" : "text-slate-300"
                              }`}>
                                {i + 1}
                                {rowHasIssue && <AlertTriangle size={8} className="inline ml-1 text-red-400" />}
                              </td>
                              {(allData[0] || []).map((_: any, j: number) => {
                                const val = row?.[j];
                                const isEmpty = val === undefined || val === null || String(val).trim() === "";
                                const isIssueCell = issueColumns.includes(j);
                                
                                return (
                                  <td 
                                    key={j} 
                                    className={`px-3 py-1.5 whitespace-nowrap border-r border-slate-100/50 last:border-r-0 ${
                                      isIssueCell
                                        ? "bg-red-100 text-red-700 font-bold"
                                        : isEmpty
                                          ? "text-slate-300 italic"
                                          : "text-slate-700"
                                    }`}
                                  >
                                    {isIssueCell && isEmpty ? (
                                      <span className="flex items-center gap-1">
                                        <AlertCircle size={10} className="text-red-400" />
                                        <span className="text-[9px]">MISSING</span>
                                      </span>
                                    ) : isEmpty ? (
                                      "—"
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Header mapping hint */}
              <div className="mx-6 mb-4 flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 flex-shrink-0">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                  Required: <span className="font-bold">Person Name</span>, <span className="font-bold">Company Name</span>, <span className="font-bold">Primary Phone</span>.
                  Optional: Secondary Phone, Primary Email, Secondary Email, Requirement, Internal Notes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer — always visible */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="text-[10px] text-slate-400 font-medium">
            {file && hasIssues && (
              <span className="text-amber-600 font-bold">
                ⚠ {analysis.issueCount} cells with missing required data across {analysis.rowIssues.size} rows
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-all">
              Cancel
            </button>
            <button 
              onClick={handleImport}
              disabled={!file || loading}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {loading ? "Importing..." : `Import ${totalRows > 0 ? totalRows + " Leads" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
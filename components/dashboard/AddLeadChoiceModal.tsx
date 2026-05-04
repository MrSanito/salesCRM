"use client"
import { FileSpreadsheet, FormInput, X } from "lucide-react";

interface AddLeadChoiceModalProps {
  onClose: () => void;
  onFormChoice: () => void;
  onExcelChoice: () => void;
}

export default function AddLeadChoiceModal({ onClose, onFormChoice, onExcelChoice }: AddLeadChoiceModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Add New Lead</h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Choose your preferred method</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-600 transition-all active:scale-95 shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 grid gap-3">
          <button
            onClick={() => {
              onFormChoice();
              onClose();
            }}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FormInput size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Standard Form</p>
              <p className="text-xs text-slate-500 mt-0.5">Enter details manually in a structured form.</p>
            </div>
          </button>

          <button
            onClick={() => {
              onExcelChoice();
              onClose();
            }}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-green-200 hover:bg-green-50/50 transition-all text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Import from Excel</p>
              <p className="text-xs text-slate-500 mt-0.5">Upload .xlsx or .csv files for bulk import.</p>
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-50 text-center">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Quickly expand your pipeline with manual entry or high-volume data imports.
          </p>
        </div>
      </div>
    </div>
  );
}

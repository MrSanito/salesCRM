"use client"
import { ChevronDown, Files, Target, Info, Briefcase, Edit, TrendingUp, MessageSquare } from "lucide-react";

interface IntelligenceDossierProps {
  context: any;
  updateContext: (field: string, val: string) => void;
  isDossierOpen: boolean;
  setIsDossierOpen: (open: boolean) => void;
  expandedField: string | null;
  setExpandedField: (field: string | null) => void;
  isRequirementEditable: boolean;
}

export default function IntelligenceDossier({ 
  context, 
  updateContext, 
  isDossierOpen, 
  setIsDossierOpen,
  expandedField,
  setExpandedField,
  isRequirementEditable
}: IntelligenceDossierProps) {
  
  const fields = [
     { id: "useCase", label: "Use Case", icon: <Info size={12} /> },
    { id: "scope", label: "Scope", icon: <Briefcase size={12} /> },
    { id: "constraints", label: "Constraints", icon: <Edit size={12} /> },
    { id: "drivers", label: "Drivers", icon: <TrendingUp size={12} /> },
    { id: "objections", label: "Objections", icon: <MessageSquare size={12} /> },
  ];

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 flex flex-col h-full">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Context Summary</h3>
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        <div className={`bg-white rounded-2xl border transition-all duration-300 ${isDossierOpen ? "border-slate-300 shadow-xl shadow-slate-100" : "border-slate-200"}`}>
          <button 
            onClick={() => setIsDossierOpen(!isDossierOpen)}
            className={`w-full px-6 py-5 flex items-center justify-between group transition-colors ${isDossierOpen ? "bg-slate-900 border-slate-900 rounded-t-2xl" : "bg-white rounded-2xl"}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-colors ${isDossierOpen ? "bg-white text-slate-900" : "bg-slate-50 text-slate-400 group-hover:text-slate-900"}`}>
                <Files size={16} />
              </div>
              <div className="text-left">
                <h4 className={`text-[12px] font-black uppercase tracking-widest ${isDossierOpen ? "text-white" : "text-slate-700"}`}>Context Summary</h4>
                <p className={`text-[10px] ${isDossierOpen ? "text-slate-400" : "text-slate-400"}`}>Master summary & granular intel</p>
              </div>
            </div>
            <ChevronDown 
              size={18} 
              className={`transition-transform duration-300 ${isDossierOpen ? "rotate-180 text-white" : "text-slate-300"}`} 
            />
          </button>

          {isDossierOpen && (
            <div className="p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                {fields.map((field) => {
                  const isExpanded = expandedField === field.id;
                  const isRequirement = field.id === "requirement";
                  const canEdit = !isRequirement || isRequirementEditable;

                  return (
                    <div 
                      key={field.id} 
                      className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden flex flex-col ${
                        isExpanded 
                          ? (canEdit ? "border-slate-900 shadow-lg shadow-slate-100 ring-1 ring-slate-100" : "border-slate-200 opacity-80") 
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <button 
                        onClick={() => setExpandedField(isExpanded ? null : field.id)}
                        className={`w-full px-4 py-3 flex items-center justify-between group transition-colors ${
                          isExpanded && canEdit ? "bg-slate-900 text-white" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg transition-colors ${isExpanded && canEdit ? "bg-white text-slate-900" : "bg-slate-50 text-slate-400 group-hover:text-slate-900"}`}>
                            {field.icon}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isExpanded && canEdit ? "text-white" : "text-slate-500"}`}>
                            {field.label}
                            {isRequirement && !isRequirementEditable && (
                              <span className="ml-2 text-[8px] font-bold text-slate-300">(Locked)</span>
                            )}
                          </span>
                        </div>
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : "text-slate-300"} ${isExpanded && canEdit ? "text-white" : ""}`} 
                        />
                      </button>
                      
                      <div className={`transition-all duration-300 ease-in-out ${
                        isExpanded 
                          ? "max-h-[200px] opacity-100 border-t border-slate-100" 
                          : "max-h-0 opacity-0"
                      }`}>
                        <div className={`p-3 ${canEdit ? "bg-slate-50" : "bg-slate-100"}`}>
                          <textarea 
                            readOnly={!canEdit}
                            disabled={!canEdit}
                            value={context[field.id as keyof typeof context]}
                            onChange={(e) => updateContext(field.id, e.target.value)}
                            className={`w-full bg-transparent font-medium focus:outline-none resize-none leading-relaxed placeholder:text-slate-300 transition-all ${
                              canEdit 
                                ? "text-slate-700 text-[13px] min-h-[100px]" 
                                : "text-slate-400 text-[11px] min-h-[60px] cursor-not-allowed"
                            }`}
                            placeholder={canEdit ? `Specify ${field.label.toLowerCase()}...` : `Requirement locked. Unlock to edit.`}
                            autoFocus={isExpanded && canEdit}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

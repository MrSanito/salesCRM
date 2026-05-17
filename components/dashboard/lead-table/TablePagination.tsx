"use client"
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  startIndex: number;
  pageSize: number;
  totalCount: number;
  selectedLeadsCount: number;
  currentPage: number;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  totalPages: number;
}

export default function TablePagination({
  startIndex,
  pageSize,
  totalCount,
  selectedLeadsCount,
  currentPage,
  setCurrentPage,
  totalPages,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-slate-50 border-t border-slate-100 gap-2 flex-shrink-0">
      <div className="text-[10px] font-bold text-slate-500">
        Showing <span className="text-slate-800 font-extrabold">{startIndex}</span> to{" "}
        <span className="text-slate-800 font-extrabold">{Math.min(startIndex + pageSize - 1, totalCount)}</span> of{" "}
        <span className="text-slate-800 font-extrabold">{totalCount.toLocaleString()}</span> leads
        {selectedLeadsCount > 0 && (
          <span className="ml-1 text-blue-600">
             (selected <span className="font-extrabold">{selectedLeadsCount}</span>)
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500 transition-all flex items-center justify-center"
        >
          <ChevronLeft size={12} />
        </button>

        {/* Dynamic page numbers summary for extreme elegance */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Logic to center the active page number
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 3 + i;
              if (pageNum + (4 - i) > totalPages) {
                pageNum = totalPages - 4 + i;
              }
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-[11px] font-black transition-all flex items-center justify-center ${
                  currentPage === pageNum
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500 transition-all flex items-center justify-center"
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

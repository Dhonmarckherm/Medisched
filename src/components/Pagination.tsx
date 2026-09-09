"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg bg-white text-gray-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
      >
        <ChevronLeftIcon size={16} />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-9 h-9 border border-gray-200 rounded-lg bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition text-[14px]"
          >
            1
          </button>
          {start > 2 && <span className="text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 border rounded-lg cursor-pointer transition text-[14px] ${
            page === currentPage
              ? "bg-primary text-white border-primary"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-9 h-9 border border-gray-200 rounded-lg bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition text-[14px]"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg bg-white text-gray-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
      >
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}

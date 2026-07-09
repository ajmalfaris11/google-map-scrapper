"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowDownAZ, Check, ChevronDown } from "lucide-react";

export type SortOption = {
  value: string;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { value: "recent", label: "Date (Newest)" },
  { value: "oldest", label: "Date (Oldest)" },
  { value: "name", label: "Name (Z-A)" },
  { value: "rating", label: "Rating (Low-High)" },
  { value: "category", label: "Category" },
  { value: "status", label: "Status" },
];

export const SortDropdown = ({ sortBy, setSortBy }: { sortBy: string, setSortBy: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeOption = SORT_OPTIONS.find(o => o.value === sortBy) || SORT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center border-r border-gray-100 pl-2 pr-1" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-sm font-bold text-gray-700 hover:text-accent-primary hover:bg-gray-50 group"
      >
        <ArrowDownAZ size={16} className="text-gray-400 group-hover:text-accent-primary" />
        {activeOption.label}
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 py-1">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSortBy(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-gray-50 transition-colors ${
                option.value === sortBy ? "text-accent-primary bg-accent-primary/5" : "text-gray-700"
              }`}
            >
              {option.label}
              {option.value === sortBy && <Check size={16} className="text-accent-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

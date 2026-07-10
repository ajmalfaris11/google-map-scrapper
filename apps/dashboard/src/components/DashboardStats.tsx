"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Star, TrendingUp, AlertCircle, Play, ChevronRight } from "lucide-react";

export default function DashboardStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: async () => {
      const response = await api.get("/jobs/stats/overview");
      return response.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Main Hero Card */}
      <div className="md:col-span-2 bg-gradient-to-br from-card-hero-start to-card-hero-end text-card-hero-text rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-lg">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 right-10 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/3"></div>
        
        <div className="relative z-10 flex flex-col gap-2">
          <span className="font-semibold text-sm uppercase tracking-widest opacity-90">Total Leads Extracted</span>
          <span className="text-6xl md:text-7xl font-black tracking-tight mt-2">
            {isLoading ? "..." : data?.totalLeads?.toLocaleString() || "0"}
          </span>
        </div>
        
        <div className="relative z-10 mt-8 md:mt-16 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-0">
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-w-24 flex-1 md:flex-none">
              <span className="text-xs opacity-80 mb-1 flex items-center gap-1.5"><Star size={12} fill="currentColor" /> Rating</span>
              <span className="font-bold text-xl">93</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-w-24 flex-1 md:flex-none">
              <span className="text-xs opacity-80 mb-1 flex items-center gap-1.5"><TrendingUp size={12} /> Trend</span>
              <span className="font-bold text-xl">↑{data?.totalLeadsTrend || 0}%</span>
            </div>
          </div>
          <button className="bg-bg-frame text-text-frame px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-1 shadow-lg w-full md:w-auto">
            VIEW FULL STATISTIC 
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Secondary Cards Column */}
      <div className="flex flex-col gap-6">
        {/* Pastel Card */}
        <div className="bg-card-secondary-bg text-card-secondary-text rounded-[2rem] p-8 flex flex-col relative overflow-hidden flex-1 transition-all hover:shadow-lg justify-between">
          <div className="flex justify-between items-start">
            <span className="font-bold text-sm uppercase tracking-wide opacity-80 mb-4">Active Jobs</span>
            <div className="text-warning flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="12" width="4" height="8" rx="1">
                  <animate attributeName="height" values="4;16;4" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="y" values="16;4;16" dur="1s" repeatCount="indefinite" />
                </rect>
                <rect x="10" y="6" width="4" height="14" rx="1">
                  <animate attributeName="height" values="16;6;16" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="y" values="4;14;4" dur="1.2s" repeatCount="indefinite" />
                </rect>
                <rect x="18" y="10" width="4" height="10" rx="1">
                  <animate attributeName="height" values="8;18;8" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="y" values="12;2;12" dur="1.4s" repeatCount="indefinite" />
                </rect>
              </svg>
            </div>
          </div>
          <span className="text-6xl font-black tracking-tighter">
            {isLoading ? "..." : data?.activeJobs?.toLocaleString() || "0"}
          </span>
          <p className="text-xs mt-6 leading-relaxed opacity-75 font-medium border-b border-black/10 pb-4">
            Your engine has picked up the tasks and is actively parsing leads. <strong>Keep running</strong> to extract more!
          </p>
          <div className="mt-4 flex items-center gap-3">
             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-card-secondary-bg">
                <Play size={14} fill="currentColor" className="ml-1" />
             </div>
             <span className="text-xs font-bold opacity-70">Monitor Jobs Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}

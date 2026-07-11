'use client';

import { useEffect, useState } from 'react';
import { Briefcase, PlayCircle, StopCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const fetchJobs = async () => {
    setLoading(true);
    const token = getCookie('jwt');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.ok) {
      setJobs(await res.json());
    }
    setLoading(false);
  };

  const cancelJob = async (id: string) => {
    const token = getCookie('jwt');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/jobs/${id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchJobs();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Briefcase className="text-[#0052ff]" size={32} />
          Jobs Management
        </h2>
        
        <button
          onClick={fetchJobs}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all border border-gray-300 shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0052ff]"></div>
          </div>
        )}
        
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-gray-500 text-sm font-semibold">
                <th className="px-6 pb-2">Keyword</th>
                <th className="px-6 pb-2">Provider</th>
                <th className="px-6 pb-2">Status</th>
                <th className="px-6 pb-2 text-center">Progress</th>
                <th className="px-6 pb-2">Created At</th>
                <th className="px-6 pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length > 0 ? (
                jobs.map((job: any) => (
                  <tr key={job.id} className="group cursor-pointer">
                    <td className="px-6 py-4.5 bg-white border-y border-l border-gray-100 first:rounded-l-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      <div className="font-semibold text-gray-900">{job.keyword}</div>
                      {job.location && <span className="block text-xs text-gray-400 mt-0.5 font-normal">{job.location}</span>}
                    </td>
                    <td className="px-6 py-4.5 bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-gray-50 text-gray-700 border-gray-200 uppercase tracking-wider">
                        {job.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4.5 bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      <div className="flex flex-col gap-1.5 items-center justify-center">
                        <span className="text-xs text-gray-600 font-semibold">{job.progress}%</span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                          <div className="h-full bg-[#0052ff] transition-all duration-500" style={{ width: `${job.progress}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-gray-500 text-sm bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4.5 bg-white border-y border-r border-gray-100 last:rounded-r-2xl text-right shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      <div className="flex justify-end gap-3">
                        {job.status === 'PROCESSING' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); cancelJob(job.id); }}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <StopCircle size={14} />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    QUEUED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    PROCESSING: 'bg-[#0052ff]/10 text-[#0052ff] border-[#0052ff]/20',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const style = styles[status] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border inline-flex", style)}>
      {status}
    </span>
  );
}

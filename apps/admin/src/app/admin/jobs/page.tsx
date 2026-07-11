'use client';

import { useEffect, useState } from 'react';
import { Briefcase, PlayCircle, StopCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../../lib/utils';

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

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden relative shadow-sm min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0052ff]"></div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Keyword</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Provider</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-center">Progress</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Created At</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.length > 0 ? (
                jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {job.keyword}
                      {job.location && <span className="block text-xs text-gray-500 font-normal">{job.location}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-700 border-gray-200 uppercase">
                        {job.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1 items-center">
                          <span className="text-xs text-gray-600 font-medium">{job.progress}%</span>
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0052ff] transition-all duration-500" style={{ width: `${job.progress}%` }}></div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {job.status === 'PROCESSING' || job.status === 'QUEUED' ? (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Job"
                        >
                          <StopCircle size={20} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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

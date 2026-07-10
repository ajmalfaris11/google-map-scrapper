"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface JobLog {
  id: string;
  message: string;
  createdAt: string;
}

interface Job {
  id: string;
  status: string;
  progress: number;
  processed: number;
  totalFound: number;
  logs?: JobLog[];
}

const LiveJobLeads = ({ jobId, isRunning }: { jobId: string, isRunning: boolean }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['live-job-leads', jobId],
    queryFn: async () => {
      const res = await api.get('/businesses', {
        params: { jobId, limit: 5, sortBy: 'recent' }
      });
      return res.data;
    },
    refetchInterval: isRunning ? 2000 : false,
  });

  if (isLoading) {
    return <div className="p-6 text-center text-text-muted text-xs animate-pulse">Fetching live data...</div>;
  }

  const leads = data?.data || [];

  if (leads.length === 0) {
    return <div className="p-6 text-center text-text-muted text-xs italic">No leads extracted yet for this job...</div>;
  }

  return (
    <div className="bg-bg-tertiary/20 p-4 border-t border-border-color/20">
      <div className="flex items-center gap-2 mb-3 px-2">
        <span className="relative flex h-2 w-2">
          {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? 'bg-success' : 'bg-text-muted'}`}></span>
        </span>
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Latest Extracted Leads</h4>
      </div>
      <div className="flex flex-col gap-2">
        {leads.map((lead: any) => (
          <div key={lead.id} className="flex items-center justify-between bg-bg-canvas rounded-xl p-3 border border-border-color/30 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex flex-col gap-0.5">
               <span className="text-sm font-bold text-text-primary">{lead.name}</span>
               {lead.address && <span className="text-[11px] font-medium text-text-muted truncate max-w-[400px]">{lead.address}</span>}
             </div>
             <div className="flex items-center gap-3 text-xs">
               {lead.category && <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest bg-accent-glow px-2 py-0.5 rounded-md">{lead.category}</span>}
               {lead.phone && <span className="text-warning font-semibold bg-warning/10 px-2 py-1 rounded-md">📞 {lead.phone}</span>}
               {lead.website && <span className="text-success font-semibold bg-success/10 px-2 py-1 rounded-md">🌐 Found</span>}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default function LiveJobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const processedCompletedJobs = useRef(new Set<string>());

  const toggleExpand = (jobId: string) => {
    setExpandedJobId(prev => prev === jobId ? null : jobId);
  };

  const handleAction = async (jobId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      await api.patch(`/jobs/${jobId}/${action}`);
      // Optimistically update the job status in UI (it will be overridden by SSE on next tick)
      setJobs(prev => prev.map(job => {
        if (job.id === jobId) {
          const newStatus = action === 'pause' ? 'PAUSED' : action === 'resume' ? 'QUEUED' : 'CANCELLED';
          return { ...job, status: newStatus };
        }
        return job;
      }));
    } catch (err) {
      console.error(`Failed to ${action} job`, err);
    }
  };

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3001/events/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.jobs) {
          setJobs(data.jobs);
          
          // Check for newly completed jobs to invalidate leads
          let hasNewCompleted = false;
          data.jobs.forEach((job: Job) => {
            if ((job.status === 'COMPLETED' || job.status === 'FAILED') && !processedCompletedJobs.current.has(job.id)) {
              processedCompletedJobs.current.add(job.id);
              hasNewCompleted = true;
            }
          });
          
          if (hasNewCompleted) {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
          }
        }
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    eventSource.onerror = () => {
      setError("Lost connection to live stream. Reconnecting...");
    };

    eventSource.onopen = () => {
      setError(null);
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  if (jobs.length === 0) {
    return (
      <div className="text-text-muted bg-bg-primary border border-border-color p-8 rounded-lg text-center flex flex-col items-center justify-center h-[200px]">
        {error ? (
          <span className="text-warning">{error}</span>
        ) : (
          "No active jobs running."
        )}
      </div>
    );
  }

  return (
    <div className="bg-bg-canvas rounded-[2rem] border border-border-color/30 overflow-hidden shadow-sm">
      <div className="px-8 py-6 border-b border-border-color/30 flex items-center justify-between bg-bg-secondary/20">
        <h3 className="font-bold text-lg text-text-primary tracking-wide">Live Operations</h3>
        <span className="text-xs font-medium text-text-muted uppercase tracking-widest bg-bg-tertiary/50 px-3 py-1 rounded-full">{jobs.length} Active</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-color/30 bg-bg-secondary/10">
              <th className="px-8 py-5">Job ID</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Progress</th>
              <th className="px-8 py-5">Current Action</th>
              <th className="px-8 py-5 text-right">Controls</th>
            </tr>
          </thead>
          <tbody className="bg-bg-canvas divide-y divide-border-color/30">
            {jobs.map((job) => (
              <React.Fragment key={job.id}>
              <tr 
                onClick={() => toggleExpand(job.id)} 
                className={`hover:bg-bg-secondary/50 transition-colors group cursor-pointer ${expandedJobId === job.id ? 'bg-bg-secondary/30' : ''}`}
              >
                <td className="px-8 py-6 whitespace-nowrap text-text-primary font-semibold text-sm">
                  <div className="max-w-[120px] truncate opacity-90" title={job.id}>{job.id}</div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    job.status === 'RUNNING' ? 'bg-accent-glow text-accent-primary' :
                    job.status === 'QUEUED' ? 'bg-warning/10 text-warning' :
                    job.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                    job.status === 'FAILED' ? 'bg-error/10 text-error' :
                    job.status === 'PAUSED' ? 'bg-text-muted/10 text-text-muted' :
                    job.status === 'CANCELLED' ? 'bg-error/10 text-error' :
                    'bg-bg-tertiary text-text-secondary'
                  }`}>
                    {job.status === 'RUNNING' && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-primary"></span>
                      </span>
                    )}
                    {job.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    <div className="flex justify-between text-[11px] font-bold text-text-secondary uppercase tracking-wide">
                      <span>{job.progress}%</span>
                      <span className="opacity-70">{job.processed} / {job.totalFound || '-'}</span>
                    </div>
                    <div className="w-full bg-bg-tertiary/50 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className={`${job.status === 'FAILED' ? 'bg-error' : job.status === 'COMPLETED' ? 'bg-success' : 'bg-accent-primary'} h-2 rounded-full transition-all duration-500 ease-out relative`} 
                        style={{ width: `${job.progress}%` }}
                      >
                        {job.status === 'RUNNING' && (
                          <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-[11px] text-text-secondary font-medium">
                  <div className="max-w-[300px] truncate opacity-80" title={job.logs?.[0]?.message}>
                    {job.logs && job.logs.length > 0 ? job.logs[0].message : <span className="italic opacity-50">Starting engine sequence...</span>}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {job.status === 'RUNNING' && (
                      <button 
                        onClick={() => handleAction(job.id, 'pause')}
                        className="text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-full bg-bg-tertiary hover:bg-border-color text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Pause
                      </button>
                    )}
                    {job.status === 'PAUSED' && (
                      <button 
                        onClick={() => handleAction(job.id, 'resume')}
                        className="text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-full bg-accent-primary hover:bg-accent-hover text-white shadow-md transition-colors"
                      >
                        Resume
                      </button>
                    )}
                    {(job.status === 'RUNNING' || job.status === 'QUEUED' || job.status === 'PAUSED') && (
                      <button 
                        onClick={() => handleAction(job.id, 'cancel')}
                        className="text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-full bg-error/10 hover:bg-error/20 text-error transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              {expandedJobId === job.id && (
                <tr className="bg-bg-secondary/5 border-b border-border-color/30">
                  <td colSpan={5} className="p-0">
                    <LiveJobLeads jobId={job.id} isRunning={job.status === 'RUNNING'} />
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

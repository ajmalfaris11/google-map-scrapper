"use client";

import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

export default function LiveJobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const processedCompletedJobs = useRef(new Set<string>());

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
              <tr key={job.id} className="hover:bg-bg-secondary/30 transition-colors group">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

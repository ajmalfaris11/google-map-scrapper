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
    <div className="overflow-x-auto rounded-lg border border-border-color">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-bg-tertiary text-text-secondary text-sm uppercase tracking-wider">
            <th className="px-6 py-4 font-semibold border-b border-border-color">Job ID</th>
            <th className="px-6 py-4 font-semibold border-b border-border-color">Status</th>
            <th className="px-6 py-4 font-semibold border-b border-border-color">Progress</th>
            <th className="px-6 py-4 font-semibold border-b border-border-color">Current Action</th>
            <th className="px-6 py-4 font-semibold border-b border-border-color text-right">Controls</th>
          </tr>
        </thead>
        <tbody className="bg-bg-primary divide-y divide-border-color">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-bg-secondary transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-text-primary font-medium">
                <div className="max-w-[120px] truncate" title={job.id}>{job.id}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  job.status === 'RUNNING' ? 'bg-accent-glow text-accent-primary' :
                  job.status === 'QUEUED' ? 'bg-warning/10 text-warning' :
                  job.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                  job.status === 'FAILED' ? 'bg-error/10 text-error' :
                  job.status === 'PAUSED' ? 'bg-text-muted/20 text-text-muted' :
                  job.status === 'CANCELLED' ? 'bg-error/10 text-error' :
                  'bg-bg-tertiary text-text-secondary'
                }`}>
                  {job.status === 'RUNNING' && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
                    </span>
                  )}
                  {job.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
                  <div className="flex justify-between text-xs font-medium text-text-secondary">
                    <span>{job.progress}%</span>
                    <span>{job.processed} / {job.totalFound || '-'}</span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`${job.status === 'FAILED' ? 'bg-error' : job.status === 'COMPLETED' ? 'bg-success' : 'bg-accent-primary'} h-1.5 rounded-full transition-all duration-500 ease-out`} 
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary">
                <div className="max-w-[300px] truncate" title={job.logs?.[0]?.message}>
                  {job.logs && job.logs.length > 0 ? job.logs[0].message : <span className="italic">Starting...</span>}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {job.status === 'RUNNING' && (
                    <button 
                      onClick={() => handleAction(job.id, 'pause')}
                      className="text-xs px-3 py-1.5 rounded bg-bg-tertiary hover:bg-border-color text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Pause
                    </button>
                  )}
                  {job.status === 'PAUSED' && (
                    <button 
                      onClick={() => handleAction(job.id, 'resume')}
                      className="text-xs px-3 py-1.5 rounded bg-accent-primary hover:bg-accent-hover text-bg-primary font-medium transition-colors"
                    >
                      Resume
                    </button>
                  )}
                  {(job.status === 'RUNNING' || job.status === 'QUEUED' || job.status === 'PAUSED') && (
                    <button 
                      onClick={() => handleAction(job.id, 'cancel')}
                      className="text-xs px-3 py-1.5 rounded bg-error/10 hover:bg-error/20 text-error transition-colors"
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
  );
}

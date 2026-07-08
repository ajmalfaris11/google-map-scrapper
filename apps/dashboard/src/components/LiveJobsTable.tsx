"use client";

import { useEffect, useState } from "react";

interface Job {
  id: string;
  status: string;
  progress: number;
  processedCount: number;
  totalFound: number;
  currentBusiness: string | null;
}

export default function LiveJobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Note: EventSource doesn't support withCredentials out of the box. 
    // In a real production app with JWT cookies, you might need a polyfill 
    // like event-source-polyfill or use websockets instead of SSE. 
    // For this internal project, we can just hit the public/unprotected SSE endpoint
    // since the controller doesn't seem to have a @UseGuards on the SSE endpoint (based on events.controller.ts)
    const eventSource = new EventSource("http://localhost:3001/events/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.jobs) {
          setJobs(data.jobs);
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
  }, []);

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
            <th className="px-6 py-4 font-semibold border-b border-border-color">Current Extraction</th>
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
                    <span>{job.processedCount} / {job.totalFound || '-'}</span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-accent-primary h-1.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary">
                <div className="max-w-[300px] truncate">
                  {job.currentBusiness || <span className="italic">Starting...</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

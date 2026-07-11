'use client';

import { useEffect, useState } from 'react';
import { Users, Briefcase, Building2, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const fetchStats = async () => {
    try {
      const token = getCookie('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0052ff]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 tracking-wide">
          Platform Overview
        </h2>
        <span className="text-sm font-medium text-gray-500 bg-[#f8fafc] px-4 py-2 rounded-full border border-gray-200 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          Live Data
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} trend="+12%" />
        <StatCard title="Total Jobs" value={stats?.totalJobs || 0} icon={Briefcase} trend="+5%" />
        <StatCard title="Active Jobs" value={stats?.activeJobs || 0} icon={TrendingUp} color="text-green-600" />
        <StatCard title="Scraped Businesses" value={stats?.totalBusinesses || 0} icon={Building2} trend="+24%" />
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-[#0052ff]" size={24} />
            Recent Scraping Jobs
          </h3>
        </div>
        
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-left border-separate border-spacing-y-3.5">
            <thead>
              <tr className="text-gray-500 text-sm font-semibold">
                <th className="px-6 pb-2">Keyword</th>
                <th className="px-6 pb-2">Provider</th>
                <th className="px-6 pb-2">Status</th>
                <th className="px-6 pb-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentJobs?.map((job: any) => (
                <tr key={job.id} className="group cursor-pointer">
                  <td className="px-6 py-4.5 font-semibold text-gray-900 bg-white border-y border-l border-gray-100 first:rounded-l-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                    {job.keyword}
                  </td>
                  <td className="px-6 py-4.5 bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-gray-50 text-gray-700 border-gray-200 uppercase tracking-wider">
                      {job.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4.5 text-gray-500 text-sm bg-white border-y border-r border-gray-100 last:rounded-r-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!stats?.recentJobs?.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-white border border-gray-100 rounded-2xl">
                    No recent jobs found.
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

function StatCard({ title, value, icon: Icon, trend, color = "text-[#0052ff]" }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(0,82,255,0.06)] hover:border-gray-200 transition-all duration-300">
      <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 text-[#0052ff]">
        <Icon size={120} />
      </div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-gray-400 font-semibold text-sm tracking-wider uppercase">{title}</h3>
        <div className={cn("p-2.5 rounded-2xl bg-[#0052ff]/5", color)}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <div>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
        {trend && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 flex items-center gap-0.5">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    QUEUED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    PROCESSING: 'bg-[#0052ff]/5 text-[#0052ff] border-[#0052ff]/20',
    COMPLETED: 'bg-green-50 text-green-700 border-green-200',
    FAILED: 'bg-red-50 text-red-700 border-red-200',
  };

  const style = styles[status] || 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5", style)}>
      {status === 'COMPLETED' && <CheckCircle2 size={12} />}
      {status === 'FAILED' && <AlertCircle size={12} />}
      {status}
    </span>
  );
}

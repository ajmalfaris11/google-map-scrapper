'use client';

import { useEffect, useState } from 'react';
import { Users, Briefcase, Building2, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function AnalyticsPage() {
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
        <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
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

      <div className="mt-12 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-[#0052ff]" size={24} />
            Recent Scraping Jobs
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 rounded-tl-xl">Keyword</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Provider</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 rounded-tr-xl">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentJobs?.map((job: any) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{job.keyword}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-700 border-gray-200 uppercase">
                      {job.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!stats?.recentJobs?.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
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
    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
        <Icon size={120} />
      </div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-gray-500 font-medium">{title}</h3>
        <div className={cn("p-2 rounded-xl bg-gray-50", color)}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-end gap-3 relative z-10">
        <p className="text-4xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span className="text-sm font-medium text-green-600 mb-1">{trend}</span>
        )}
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
  };

  const style = styles[status] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1", style)}>
      {status === 'COMPLETED' && <CheckCircle2 size={12} />}
      {status === 'FAILED' && <AlertCircle size={12} />}
      {status}
    </span>
  );
}

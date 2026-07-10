'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const fetchAnalytics = async () => {
    const token = getCookie('jwt');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setStats(await res.json());
    }
    setLoading(false);
  };

  if (loading || !stats) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
        Platform Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Active Users" value={stats.activeUsers} trend="+5%" />
        <StatCard title="Total Jobs" value={stats.totalJobs} />
        <StatCard title="Businesses Scraped" value={stats.totalBusinesses} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 h-80 flex flex-col justify-center items-center">
          <p className="text-gray-400 mb-4">Users Growth Chart Placeholder</p>
          <div className="w-full h-40 bg-gradient-to-t from-teal-500/20 to-transparent rounded-lg border-b-2 border-teal-500"></div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 h-80 flex flex-col justify-center items-center">
          <p className="text-gray-400 mb-4">Jobs Processed Placeholder</p>
          <div className="w-full h-40 flex items-end justify-around">
            <div className="w-8 bg-blue-500/50 rounded-t-md h-12"></div>
            <div className="w-8 bg-blue-500/50 rounded-t-md h-24"></div>
            <div className="w-8 bg-blue-500/50 rounded-t-md h-16"></div>
            <div className="w-8 bg-blue-500/50 rounded-t-md h-32"></div>
            <div className="w-8 bg-blue-500/50 rounded-t-md h-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend }: { title: string; value: string | number; trend?: string }) {
  return (
    <div className="bg-gray-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-teal-500/30 transition-colors">
      <h3 className="text-gray-400 font-medium mb-2">{title}</h3>
      <div className="flex items-baseline space-x-2">
        <span className="text-4xl font-bold text-white">{value}</span>
        {trend && <span className="text-sm font-medium text-emerald-400">{trend}</span>}
      </div>
    </div>
  );
}

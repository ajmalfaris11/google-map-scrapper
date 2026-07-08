import Link from "next/link";
import LiveJobsTable from "@/components/LiveJobsTable";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-text-secondary text-lg">Real-time insights into your lead extraction engine.</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6 flex flex-col gap-3 transition-all duration-150 hover:border-border-hover hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <span className="text-text-muted font-medium text-sm uppercase tracking-wider">Total Leads Extracted</span>
          <span className="text-4xl font-bold text-text-primary">12,450</span>
          <div className="text-sm font-medium flex items-center gap-1">
            <span className="text-success">↑ 24%</span> from last week
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6 flex flex-col gap-3 transition-all duration-150 hover:border-border-hover hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <span className="text-text-muted font-medium text-sm uppercase tracking-wider">Active Jobs</span>
          <span className="text-4xl font-bold text-text-primary">1</span>
          <div className="text-sm font-medium flex items-center gap-1">
            <span className="text-success">Running</span> since 2 hours ago
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6 flex flex-col gap-3 transition-all duration-150 hover:border-border-hover hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <span className="text-text-muted font-medium text-sm uppercase tracking-wider">Success Rate</span>
          <span className="text-4xl font-bold text-text-primary">98.2%</span>
          <div className="text-sm font-medium flex items-center gap-1">
            <span className="text-success">↑ 1.2%</span> from last week
          </div>
        </div>
      </div>

      <div className="mt-4 bg-bg-secondary border border-border-color rounded-2xl p-8">
        <h2 className="text-xl font-semibold mb-6">Recent Jobs</h2>
        <LiveJobsTable />
      </div>
    </div>
  );
}

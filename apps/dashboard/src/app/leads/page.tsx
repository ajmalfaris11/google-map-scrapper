"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Business {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  reviewsCount: number | null;
  status: string;
  category: string | null;
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch("http://localhost:3001/businesses", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch leads");
        }

        const data = await response.json();
        setLeads(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [router]);

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Leads CRM</h1>
        <p className="text-text-secondary text-lg">Manage and track extracted business leads.</p>
      </div>

      <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border-color flex justify-between items-center bg-glass-bg">
          <h2 className="text-xl font-semibold">Extracted Businesses</h2>
          <div className="text-sm text-text-muted">
            Total: <span className="font-bold text-text-primary">{leads.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <svg className="animate-spin h-8 w-8 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error bg-error/5">{error}</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-text-muted">No leads found. Run a job to extract leads!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-tertiary text-text-secondary text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold border-b border-border-color">Business</th>
                  <th className="px-6 py-4 font-semibold border-b border-border-color">Contact</th>
                  <th className="px-6 py-4 font-semibold border-b border-border-color">Rating</th>
                  <th className="px-6 py-4 font-semibold border-b border-border-color">Status</th>
                </tr>
              </thead>
              <tbody className="bg-bg-primary divide-y divide-border-color">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-bg-secondary transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">{lead.name}</span>
                        {lead.category && <span className="text-xs text-text-muted">{lead.category}</span>}
                        {lead.address && <span className="text-sm text-text-secondary truncate max-w-[300px]" title={lead.address}>{lead.address}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        {lead.phone ? (
                          <span className="text-text-primary">{lead.phone}</span>
                        ) : (
                          <span className="text-text-muted italic">No phone</span>
                        )}
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline truncate max-w-[200px]" title={lead.website}>
                            {lead.website}
                          </a>
                        ) : (
                          <span className="text-text-muted italic">No website</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.rating ? (
                        <div className="flex items-center gap-2">
                          <span className="text-warning font-bold">★ {lead.rating}</span>
                          <span className="text-xs text-text-muted">({lead.reviewsCount || 0})</span>
                        </div>
                      ) : (
                        <span className="text-text-muted text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        lead.status === 'NEW' ? 'bg-success/10 text-success' :
                        lead.status === 'CONTACTED' ? 'bg-accent-glow text-accent-primary' :
                        'bg-bg-tertiary text-text-secondary'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

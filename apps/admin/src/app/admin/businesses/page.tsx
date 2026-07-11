'use client';

import { useEffect, useState } from 'react';
import { Building2, Search, ExternalLink, MapPin } from 'lucide-react';

export default function AdminBusinessesPage() {
  const [data, setData] = useState<{ businesses: any[], total: number, page: number, limit: number }>({ businesses: [], total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    const token = getCookie('jwt');
    // Note: this assumes the API has pagination. We fallback gracefully if it doesn't.
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/businesses?page=1&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.ok) {
      const responseData = await res.json();
      if (Array.isArray(responseData)) {
         setData({ businesses: responseData, total: responseData.length, page: 1, limit: 50 });
      } else {
         setData(responseData);
      }
    }
    setLoading(false);
  };

  // Filter client-side if API doesn't support search yet
  const filtered = data.businesses?.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    (b.keyword && b.keyword.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Building2 className="text-[#0052ff]" size={32} />
          Scraped Businesses
        </h2>
        
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or keyword..."
            className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff] transition-all text-gray-900 placeholder-gray-400"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
        </div>
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
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Business Name</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Keyword</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Contact</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((business: any) => (
                  <tr key={business.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{business.name}</div>
                      {business.address && (
                        <div className="flex items-center text-xs text-gray-500 mt-1 gap-1">
                          <MapPin size={12} />
                          {business.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {business.keyword}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {business.phone ? business.phone : <span className="text-gray-400 italic">No phone</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        {business.website && (
                           <a href={business.website} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#0052ff] transition-colors" title="Website">
                             <ExternalLink size={18} />
                           </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No businesses match your search.
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

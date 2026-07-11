'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, UserCog } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function UsersPage() {
  const [data, setData] = useState<any>({ users: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  
  // Pagination and search state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchUsers(page);
  }, [page, search]);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const fetchUsers = async (pageToFetch = page) => {
    setLoading(true);
    const token = getCookie('jwt');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users?page=${pageToFetch}&limit=${limit}&search=${search}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const token = getCookie('jwt');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers(page);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const token = getCookie('jwt');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ isActive: !currentStatus }),
    });
    fetchUsers(page);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserCog className="text-[#0052ff]" size={32} />
          User Management
        </h2>
        
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email..."
            className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff] transition-all text-gray-900 placeholder-gray-400"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
        </form>
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
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Email</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Role</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Joined</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.users?.length > 0 ? (
                data.users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 w-max",
                        user.role === 'ADMIN' 
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {user.role === 'ADMIN' && <ShieldAlert size={12} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 w-max",
                        user.isActive 
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      )}>
                        {user.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleRole(user.id, user.role)}
                          className="text-xs font-medium text-[#0052ff] hover:text-[#0040d1] bg-[#0052ff]/10 hover:bg-[#0052ff]/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Make {user.role === 'ADMIN' ? 'User' : 'Admin'}
                        </button>
                        <button
                          onClick={() => toggleStatus(user.id, user.isActive)}
                          className={cn(
                            "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                            user.isActive 
                              ? "text-orange-600 hover:text-orange-700 bg-orange-100 hover:bg-orange-200"
                              : "text-green-600 hover:text-green-700 bg-green-100 hover:bg-green-200"
                          )}
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
           <span className="text-sm text-gray-500">
             Showing page {data.page || 1} of {data.totalPages || 1} ({data.total || 0} total)
           </span>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(data.totalPages || 1, p + 1))}
                disabled={page === (data.totalPages || 1)}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

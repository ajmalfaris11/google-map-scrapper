'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, UserCog, UserPlus, ArrowUpDown, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import ReactCountryFlag from "react-country-flag";
import { getData } from 'country-list';

const roleOptions = [
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
];

const businessTypeOptions = [
  { value: 'Marketing Agency', label: 'Marketing Agency' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Other', label: 'Other' },
];

const allCountries = getData();
const countryOptions = allCountries.map((c: any) => ({
  value: c.name,
  label: c.name,
  code: c.code,
}));

const tokenOptions = [
  { value: 25, label: '25 Tokens' },
  { value: 50, label: '50 Tokens' },
  { value: 75, label: '75 Tokens' },
  { value: 100, label: '100 Tokens' },
];

function CustomSelect({ options, value, onChange, placeholder, renderOption }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#0052ff] focus:border-[#0052ff] bg-white flex justify-between items-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? (renderOption ? renderOption(selectedOption) : selectedOption.label) : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((option: any) => (
            <div
              key={option.value}
              className={`p-2.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2 transition-colors ${value === option.value ? 'bg-[#0052ff]/5 text-[#0052ff] font-medium' : 'text-gray-700'}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {renderOption ? renderOption(option) : option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const [data, setData] = useState<any>({ users: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  
  // Pagination, search and sort state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tokenAmount: 25,
    role: 'USER',
    businessName: '',
    businessType: '',
    country: ''
  });

  useEffect(() => {
    fetchUsers(page);
  }, [page, search, sortBy, order]);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const fetchUsers = async (pageToFetch = page) => {
    setLoading(true);
    try {
      const token = getCookie('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users?page=${pageToFetch}&limit=${limit}&search=${search}&sortBy=${sortBy}&order=${order}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Optionally show a toast or error message here
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
    setPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="opacity-30" />;
    return order === 'asc' ? <ArrowUp size={14} className="text-[#0052ff]" /> : <ArrowDown size={14} className="text-[#0052ff]" />;
  };

  const changeRole = async (id: string, newRole: string) => {
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getCookie('jwt');
    
    // Parse token amount to float
    const payload = {
      ...formData,
      tokenAmount: parseFloat(formData.tokenAmount.toString()) || 0
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setFormData({
        name: '', email: '', password: '', tokenAmount: 25, role: 'USER', businessName: '', businessType: '', country: ''
      });
      fetchUsers(1);
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(`Failed to create user: ${errData.message || res.statusText || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserCog className="text-[#0052ff]" size={32} />
          User Management
        </h2>
        
        <div className="flex gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff] transition-all text-gray-900 placeholder-gray-400"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          </form>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0052ff] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#0040d1] transition-colors whitespace-nowrap"
          >
            <UserPlus size={18} />
            Create User
          </button>
        </div>
      </div>

      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0052ff]"></div>
          </div>
        )}
        
        <div className="overflow-x-auto w-full pb-4">
          <table className="w-full min-w-max text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-gray-500 text-sm font-semibold">
                <th className="px-6 pb-2 cursor-pointer hover:text-gray-900 transition-colors sticky left-0 bg-white z-20 min-w-[250px]" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">User {renderSortIcon('name')}</div>
                </th>
                <th className="px-6 pb-2 cursor-pointer hover:text-gray-900 transition-colors whitespace-nowrap" onClick={() => handleSort('role')}>
                  <div className="flex items-center gap-1">Role {renderSortIcon('role')}</div>
                </th>
                <th className="px-6 pb-2 cursor-pointer hover:text-gray-900 transition-colors whitespace-nowrap" onClick={() => handleSort('wallet')}>
                  <div className="flex items-center gap-1">Tokens {renderSortIcon('wallet')}</div>
                </th>
                <th className="px-6 pb-2 cursor-pointer hover:text-gray-900 transition-colors whitespace-nowrap" onClick={() => handleSort('totalSpent')}>
                  <div className="flex items-center gap-1">Spent {renderSortIcon('totalSpent')}</div>
                </th>
                <th className="px-6 pb-2 cursor-pointer hover:text-gray-900 transition-colors whitespace-nowrap" onClick={() => handleSort('isActive')}>
                  <div className="flex items-center gap-1">Status {renderSortIcon('isActive')}</div>
                </th>
                <th className="px-6 pb-2 cursor-pointer hover:text-gray-900 transition-colors whitespace-nowrap" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1">Joined {renderSortIcon('createdAt')}</div>
                </th>
                <th className="px-6 pb-2 text-right sticky right-0 bg-white z-20 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {data.users?.length > 0 ? (
                data.users.map((user: any) => (
                  <tr key={user.id} className="group cursor-pointer hover:bg-gray-50/50" onClick={() => {
                    setSelectedUser(user);
                    setIsViewModalOpen(true);
                  }}>
                    <td className="px-6 py-4.5 bg-white border-y border-l border-gray-100 first:rounded-l-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200 sticky left-0 z-10">
                      <div className="font-semibold text-gray-900">{user.name || 'Unnamed'}</div>
                      <div className="text-sm font-normal text-gray-400 mt-0.5">{user.email}</div>
                      {user.businessName && <div className="text-xs font-normal text-gray-400 mt-0.5">Biz: {user.businessName}</div>}
                    </td>
                    <td className="px-6 py-4.5 bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      <span className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 w-max",
                        user.role === 'SUPER_ADMIN' ? "bg-red-50 text-red-700 border-red-200" :
                        user.role === 'ADMIN' 
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      )}>
                        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && <ShieldAlert size={12} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 font-semibold text-gray-900 bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      {user.wallet?.balance?.toFixed(0) || '0'}
                    </td>
                    <td className="px-6 py-4.5 font-semibold text-gray-500 bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      {user.wallet?.totalSpent?.toFixed(0) || '0'}
                    </td>
                    <td className="px-6 py-4.5 bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      <span className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 w-max",
                        user.isActive 
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {user.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-gray-500 text-sm bg-white border-y border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4.5 bg-white group-hover:bg-gray-50/50 border-y border-r border-gray-100 last:rounded-r-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:border-gray-200 transition-all duration-200 sticky right-0 z-10 text-right">
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-[#0052ff] transition-colors inline-block" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-between bg-transparent px-2">
           <span className="text-sm font-medium text-gray-500">
             Showing page {data.page || 1} of {data.totalPages || 1} ({data.total || 0} total)
           </span>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(data.totalPages || 1, p + 1))}
                disabled={page === (data.totalPages || 1)}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Create New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#0052ff] focus:border-[#0052ff]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Email *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#0052ff] focus:border-[#0052ff]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Password *</label>
                  <input type="password" required placeholder="Enter password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#0052ff] focus:border-[#0052ff]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Role</label>
                  <CustomSelect
                    options={roleOptions}
                    value={formData.role}
                    onChange={(val: string) => setFormData({...formData, role: val})}
                    placeholder="Select a role..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Initial Tokens</label>
                  <CustomSelect
                    options={tokenOptions}
                    value={formData.tokenAmount}
                    onChange={(val: number) => setFormData({...formData, tokenAmount: val})}
                    placeholder="Select tokens..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Country</label>
                  <CustomSelect
                    options={countryOptions}
                    value={formData.country}
                    onChange={(val: string) => setFormData({...formData, country: val})}
                    placeholder="Select a country..."
                    renderOption={(opt: any) => (
                      <span className="flex items-center gap-2">
                        <ReactCountryFlag countryCode={opt.code} svg style={{ width: '1.2em', height: '1.2em', borderRadius: '2px' }} />
                        <span className="truncate">{opt.label}</span>
                      </span>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Business Name</label>
                  <input type="text" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#0052ff] focus:border-[#0052ff]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Business Type</label>
                  <CustomSelect
                    options={businessTypeOptions}
                    value={formData.businessType}
                    onChange={(val: string) => setFormData({...formData, businessType: val})}
                    placeholder="Select business type..."
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#0052ff] text-white rounded-xl hover:bg-[#0040d1] transition-colors font-medium">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                User Details
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded-full border tracking-wide",
                  selectedUser.isActive 
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                )}>
                  {selectedUser.isActive ? 'ACTIVE' : 'SUSPENDED'}
                </span>
              </h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                 <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Name</div>
                    <div className="font-semibold text-gray-900">{selectedUser.name || 'Unnamed'}</div>
                 </div>
                 <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</div>
                    <div className="font-semibold text-gray-900">{selectedUser.email}</div>
                 </div>
                 <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tokens Balance</div>
                    <div className="font-semibold text-gray-900">{selectedUser.wallet?.balance?.toFixed(0) || '0'} T</div>
                 </div>
                 <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Spent</div>
                    <div className="font-semibold text-gray-900">{selectedUser.wallet?.totalSpent?.toFixed(0) || '0'} T</div>
                 </div>
                 <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Business Name</div>
                    <div className="font-semibold text-gray-900">{selectedUser.businessName || 'N/A'}</div>
                 </div>
                 <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Joined Date</div>
                    <div className="font-semibold text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                 </div>
              </div>

              <hr className="border-gray-100" />
              
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Manage Account</h4>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                   <div>
                     <div className="text-sm font-semibold text-gray-900">Access Role</div>
                     <div className="text-xs text-gray-500 mt-0.5">Determine permissions across the app</div>
                   </div>
                   <select
                      value={selectedUser.role}
                      onChange={(e) => {
                        changeRole(selectedUser.id, e.target.value);
                        setSelectedUser({...selectedUser, role: e.target.value});
                      }}
                      className="text-sm font-bold text-[#0052ff] bg-[#0052ff]/10 hover:bg-[#0052ff]/20 px-3 py-2 rounded-xl transition-colors border-none focus:ring-0 cursor-pointer outline-none"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                   <div>
                     <div className="text-sm font-semibold text-gray-900">Account Status</div>
                     <div className="text-xs text-gray-500 mt-0.5">Suspend to block login access</div>
                   </div>
                   <button
                      onClick={() => { 
                        toggleStatus(selectedUser.id, selectedUser.isActive);
                        setSelectedUser({...selectedUser, isActive: !selectedUser.isActive});
                      }}
                      className={cn(
                        "text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm",
                        selectedUser.isActive 
                          ? "text-orange-700 bg-orange-100 hover:bg-orange-200"
                          : "text-green-700 bg-green-100 hover:bg-green-200"
                      )}
                    >
                      {selectedUser.isActive ? 'Suspend User' : 'Activate User'}
                    </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

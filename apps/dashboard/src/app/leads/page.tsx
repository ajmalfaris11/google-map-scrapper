"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { SortDropdown } from "@/components/SortDropdown";
import { StatusDropdown } from "@/components/StatusDropdown";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import {
  Mail,
  Globe,
  Phone,
  MessageCircle,
  MapPin,
  LayoutGrid,
  List,
  ArrowDownWideNarrow,
  Star,
  Search,
  Filter,
  X,
  Check,
  Copy,
  Download
} from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { BookmarkButton } from "@/components/BookmarkButton";

interface Business {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email?: string | null;
  whatsapp?: string | null;
  address: string | null;
  rating: number | null;
  reviewsCount: number | null;
  status: string;
  category: string | null;
  googleMapsUrl?: string | null;
}

const CopyLeadButton = ({ lead }: { lead: Business }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const details = [
      `Name: ${lead.name}`,
      lead.category ? `Category: ${lead.category}` : null,
      lead.address ? `Address: ${lead.address}` : null,
      (lead.phone || lead.email || lead.website) ? `Contact Info:` : null,
      lead.phone ? `- Phone: ${lead.phone}` : null,
      lead.email ? `- Email: ${lead.email}` : null,
      lead.website ? `- Website: ${lead.website}` : null,
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-2 rounded-full flex items-center justify-center transition-all ${
        copied 
          ? "bg-success/10 text-success shadow-sm" 
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 shadow-sm"
      }`}
      title="Copy Details"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
};

const QuickActions = ({ lead }: { lead: Business }) => {
  const hasEmail = !!lead.email;
  const hasWebsite = !!lead.website;
  const hasPhone = !!lead.phone;
  const hasWhatsapp = !!lead.whatsapp || !!lead.phone; 
  const mapLink = lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address || ''}`)}`;
  const cleanPhone = lead.phone?.replace(/[^0-9+]/g, '') || '';

  return (
    <div className="flex items-center gap-2">
      <CopyLeadButton lead={lead} />
      <a
        href={hasEmail ? `mailto:${lead.email}` : undefined}
        target="_blank"
        rel="noreferrer"
        className={`p-2 rounded-full flex items-center justify-center transition-all ${
          hasEmail 
            ? "bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-white shadow-sm" 
            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
        }`}
        title={hasEmail ? `Email ${lead.email}` : "Email not available"}
        onClick={(e) => !hasEmail && e.preventDefault()}
      >
        <Mail size={16} />
      </a>
      
      <a
        href={hasWebsite ? lead.website! : undefined}
        target="_blank"
        rel="noreferrer"
        className={`p-2 rounded-full flex items-center justify-center transition-all ${
          hasWebsite 
            ? "bg-success/10 text-success hover:bg-success hover:text-white shadow-sm" 
            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
        }`}
        title={hasWebsite ? `Visit ${lead.website}` : "Website not available"}
        onClick={(e) => !hasWebsite && e.preventDefault()}
      >
        <Globe size={16} />
      </a>

      <a
        href={hasPhone ? `tel:${cleanPhone}` : undefined}
        className={`p-2 rounded-full flex items-center justify-center transition-all ${
          hasPhone 
            ? "bg-warning/10 text-warning hover:bg-warning hover:text-white shadow-sm" 
            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
        }`}
        title={hasPhone ? `Call ${lead.phone}` : "Phone not available"}
        onClick={(e) => !hasPhone && e.preventDefault()}
      >
        <Phone size={16} />
      </a>

      <a
        href={hasWhatsapp ? `https://wa.me/${cleanPhone}` : undefined}
        target="_blank"
        rel="noreferrer"
        className={`p-2 rounded-full flex items-center justify-center transition-all ${
          hasWhatsapp 
            ? "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white shadow-sm" 
            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
        }`}
        title={hasWhatsapp ? `WhatsApp ${lead.phone}` : "WhatsApp not available"}
        onClick={(e) => !hasWhatsapp && e.preventDefault()}
      >
        <MessageCircle size={16} />
      </a>

      <a
        href={mapLink}
        target="_blank"
        rel="noreferrer"
        className="p-2 rounded-full flex items-center justify-center transition-all bg-error/10 text-error hover:bg-error hover:text-white shadow-sm"
        title="View on Google Maps"
      >
        <MapPin size={16} />
      </a>
    </div>
  );
};

const columnHelper = createColumnHelper<Business>();

const columns = [
  columnHelper.accessor("name", {
    header: "Business Details",
    cell: (info) => {
      const lead = info.row.original;
      return (
        <div className="flex flex-col gap-1 py-2">
          <span className="font-bold text-gray-900 text-base group-hover:text-accent-primary transition-colors">{lead.name}</span>
          {lead.category && <span className="text-xs font-semibold text-accent-primary uppercase tracking-wider bg-accent-glow px-2 py-0.5 rounded-md w-fit">{lead.category}</span>}
          {lead.address && <span className="text-sm text-gray-500 truncate max-w-[300px] mt-1" title={lead.address}>{lead.address}</span>}
        </div>
      );
    },
  }),
  columnHelper.accessor("rating", {
    header: "Reputation",
    cell: (info) => {
      const lead = info.row.original;
      return lead.rating ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 bg-warning/10 px-2.5 py-1 rounded-full w-fit">
            <Star size={14} className="text-warning fill-warning" />
            <span className="text-warning font-bold text-sm">{lead.rating}</span>
          </div>
          <span className="text-xs text-gray-500 font-medium">{lead.reviewsCount?.toLocaleString()} reviews</span>
        </div>
      ) : (
        <span className="text-gray-400 text-sm italic">No reviews</span>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Quick Actions",
    cell: (info) => <QuickActions lead={info.row.original} />,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <StatusDropdown leadId={info.row.original.id} currentStatus={info.getValue() as string} />
    ),
  }),
];

export default function LeadsPage() {
  const router = useRouter();
  
  // UI State
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Filter State
  const [sortBy, setSortBy] = useState<string>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string>("any");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [requireEmail, setRequireEmail] = useState<"any" | "yes" | "no">("any");
  const [requirePhone, setRequirePhone] = useState<"any" | "yes" | "no">("any");
  const [requireWebsite, setRequireWebsite] = useState<"any" | "yes" | "no">("any");
  const [minRating, setMinRating] = useState<number>(0);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["leads", { 
      search: debouncedSearch, 
      category: selectedCategories.join(','), 
      requireEmail, 
      requirePhone, 
      requireWebsite, 
      minRating, 
      sortBy,
      status: statusFilter
    }],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get("/businesses", {
        params: {
          page: pageParam,
          limit: 50,
          status: statusFilter !== 'any' ? statusFilter : undefined,
          search: debouncedSearch || undefined,
          category: selectedCategories.join(',') || undefined,
          requireEmail: requireEmail !== 'any' ? requireEmail : undefined,
          requirePhone: requirePhone !== 'any' ? requirePhone : undefined,
          requireWebsite: requireWebsite !== 'any' ? requireWebsite : undefined,
          minRating: minRating > 0 ? minRating : undefined,
          sortBy
        }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    }
  });

  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Extract unique categories for the filter modal
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    data?.pages.forEach(page => {
      page.data.forEach((l: Business) => {
        if (l.category) cats.add(l.category);
      });
    });
    return Array.from(cats);
  }, [data]);

  const leads = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  const activeFilterCount = 
    (statusFilter !== "any" ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0) + 
    (requireEmail !== "any" ? 1 : 0) + 
    (requirePhone !== "any" ? 1 : 0) + 
    (requireWebsite !== "any" ? 1 : 0) + 
    (minRating > 0 ? 1 : 0);

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const exportToCSV = () => {
    if (!leads || leads.length === 0) return;
    
    const headers = ["Name", "Category", "Status", "Rating", "Reviews", "Phone", "Email", "Website", "Address"];
    const rows = leads.map((l: Business) => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      l.rating || '',
      l.reviewsCount || '',
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto h-full relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1 shrink-0">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-cyan-400">
            Leads Pipeline
          </h1>
          <p className="text-gray-500">Manage, engage, and track your extracted prospects.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={leads.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-sm font-bold border-r border-gray-100 ${
                leads.length === 0 ? 'text-gray-400 cursor-not-allowed opacity-50' : 'text-gray-600 hover:text-accent-primary hover:bg-gray-50'
              }`}
              title="Export filtered leads to CSV"
            >
              <Download size={16} />
              Export
            </button>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-sm font-bold border-r border-gray-100 ${
                activeFilterCount > 0 ? 'text-accent-primary' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-accent-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />

            {/* View Toggles */}
            <div className="flex items-center gap-1 pl-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid" 
                    ? "bg-accent-primary text-white shadow-sm" 
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`}
                title="Card View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "table" 
                    ? "bg-accent-primary text-white shadow-sm" 
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`}
                title="Table View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-20 flex flex-col justify-center items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500 font-medium animate-pulse">Loading prospects...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-error bg-error/10 border border-error/20 rounded-2xl font-semibold shadow-sm">
          {(error as any)?.response?.data?.message || error.message || "Failed to load leads"}
        </div>
      ) : leads.length === 0 ? (
        <div className="p-16 text-center bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
            <Search size={32} className="text-gray-400" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-gray-900">No leads found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
          {(activeFilterCount > 0 || searchQuery) && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategories([]);
                setRequireEmail("any");
                setRequirePhone("any");
                setRequireWebsite("any");
                setMinRating(0);
              }}
              className="mt-2 text-accent-primary font-bold hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {leads.map((lead: Business) => (
                <div 
                  key={lead.id} 
                  className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col justify-between gap-6 transition-all hover:shadow-2xl shadow-lg group relative duration-300 before:absolute before:inset-[-1px] before:rounded-3xl before:border-t-[4px] before:border-t-accent-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2">
                        {lead.name}
                      </h3>
                      <BookmarkButton leadId={lead.id} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {lead.category && (
                          <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest bg-accent-glow px-2.5 py-1 rounded-lg w-fit">
                            {lead.category}
                          </span>
                        )}
                        <StatusDropdown leadId={lead.id} currentStatus={lead.status} />
                      </div>
                      
                      {lead.rating && (
                        <div className="flex items-center gap-1.5 bg-warning/10 px-2 py-0.5 rounded-full">
                          <Star size={12} className="text-warning fill-warning" />
                          <span className="text-warning font-bold text-xs">{lead.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-auto">
                    {lead.address && (
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed" title={lead.address}>
                        {lead.address}
                      </p>
                    )}
                    
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <QuickActions lead={lead} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-200">
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="px-8 py-5 font-bold">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/80 transition-colors group">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-8 py-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          {hasNextPage && (
            <div ref={targetRef} className="w-full h-20 flex items-center justify-center mt-8">
              {isFetchingNextPage ? (
                <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Advanced Filters Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-accent-primary/10 p-2 rounded-xl">
                  <Filter size={20} className="text-accent-primary" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
              </div>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-8 max-h-[60vh] overflow-y-auto">
              
              {/* Status Filter */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {["any", "NEW", "CONTACTED", "INTERESTED", "NOT_INTERESTED", "CLOSED"].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        statusFilter === status 
                          ? 'bg-accent-primary text-white border-accent-primary shadow-sm' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {status === "any" ? "Any Status" : status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Requirements */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contact Details Required</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <span className="text-sm font-bold text-gray-700 select-none">Phone Number</span>
                    <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                      <button onClick={() => setRequirePhone("any")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${requirePhone === "any" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Any</button>
                      <button onClick={() => setRequirePhone("yes")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${requirePhone === "yes" ? "bg-accent-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Must Have</button>
                      <button onClick={() => setRequirePhone("no")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${requirePhone === "no" ? "bg-error text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Must NOT Have</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <span className="text-sm font-bold text-gray-700 select-none">Email Address</span>
                    <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                      <button onClick={() => setRequireEmail("any")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${requireEmail === "any" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Any</button>
                      <button onClick={() => setRequireEmail("yes")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${requireEmail === "yes" ? "bg-accent-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Must Have</button>
                      <button onClick={() => setRequireEmail("no")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${requireEmail === "no" ? "bg-error text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Must NOT Have</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <span className="text-sm font-bold text-gray-700 select-none">Website</span>
                    <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                      <button onClick={() => setRequireWebsite("any")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${requireWebsite === "any" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Any</button>
                      <button onClick={() => setRequireWebsite("yes")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${requireWebsite === "yes" ? "bg-accent-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Must Have</button>
                      <button onClick={() => setRequireWebsite("no")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${requireWebsite === "no" ? "bg-error text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Must NOT Have</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Minimum Rating</h3>
                  <span className="text-xs font-bold text-accent-primary">{minRating > 0 ? `${minRating}+ Stars` : 'Any'}</span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-2xl p-2 border border-gray-200 shadow-sm">
                  <button 
                    onClick={() => setMinRating(0)} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${minRating === 0 ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    Any
                  </button>
                  <div className="flex gap-2 items-center px-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => setMinRating(star)}
                        className={`transition-all hover:scale-110 ${star <= minRating ? 'text-accent-primary' : 'text-gray-200 hover:text-accent-primary/50'}`}
                      >
                        <Star size={24} className={star <= minRating ? 'fill-accent-primary' : ''} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Categories */}
              {allCategories.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Specific Categories</h3>
                    {selectedCategories.length > 0 && (
                      <button onClick={() => setSelectedCategories([])} className="text-xs font-bold text-accent-primary hover:underline">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map(cat => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected 
                              ? 'bg-accent-primary text-white border-accent-primary shadow-sm' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <button 
                onClick={() => {
                  setStatusFilter("any");
                  setSelectedCategories([]);
                  setRequireEmail("any");
                  setRequirePhone("any");
                  setRequireWebsite("any");
                  setMinRating(0);
                }}
                className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Reset All
              </button>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="bg-accent-primary hover:bg-accent-hover text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all"
              >
                Apply Filters ({leads.length} results)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

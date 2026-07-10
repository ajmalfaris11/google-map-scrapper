"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import {
  Wrench, Home, Monitor, Utensils, Stethoscope, Briefcase,
  ChevronDown, Zap, Building2, GraduationCap,
  Dumbbell, Scissors, Car, Pill, Megaphone, BedDouble,
  Landmark, ShoppingCart, Search, MapPin, Gauge, Sparkles
} from "lucide-react";

const BUSINESS_CATEGORIES = [
  { id: "plumbers", label: "Plumbers", icon: <Wrench size={18} /> },
  { id: "real_estate", label: "Real Estate Agents", icon: <Home size={18} /> },
  { id: "software", label: "Software Companies", icon: <Monitor size={18} /> },
  { id: "restaurants", label: "Restaurants", icon: <Utensils size={18} /> },
  { id: "dentists", label: "Dentists", icon: <Stethoscope size={18} /> },
  { id: "lawyers", label: "Lawyers", icon: <Briefcase size={18} /> },
  { id: "hospitals", label: "Hospitals", icon: <Building2 size={18} /> },
  { id: "schools", label: "Schools", icon: <GraduationCap size={18} /> },
  { id: "gyms", label: "Gyms & Fitness Centers", icon: <Dumbbell size={18} /> },
  { id: "salons", label: "Beauty Salons", icon: <Scissors size={18} /> },
  { id: "car_dealers", label: "Car Dealerships", icon: <Car size={18} /> },
  { id: "pharmacies", label: "Pharmacies", icon: <Pill size={18} /> },
  { id: "marketing", label: "Marketing Agencies", icon: <Megaphone size={18} /> },
  { id: "hotels", label: "Hotels", icon: <BedDouble size={18} /> },
  { id: "banks", label: "Banks & Credit Unions", icon: <Landmark size={18} /> },
  { id: "supermarkets", label: "Supermarkets", icon: <ShoppingCart size={18} /> },
];

const PRESET_LIMITS = [
  { value: 25, label: "25 Leads", sub: "Micro Test", estTime: "~30 sec" },
  { value: 50, label: "50 Leads", sub: "Quick Test", estTime: "~1 min" },
  { value: 100, label: "100 Leads", sub: "Standard", estTime: "~2 mins" },
  { value: 250, label: "250 Leads", sub: "Popular", estTime: "~4 mins" },
  { value: 500, label: "500 Leads", sub: "Deep Search", estTime: "~8 mins" },
  { value: 1000, label: "1000 Leads", sub: "Maximum", estTime: "~15 mins" },
];

const jobSchema = z.object({
  keyword: z.string().min(1, "Search keyword is required"),
  location: z.string().min(1, "Location is required for targeted scraping"),
  maxResults: z.number().min(10).max(1000, "Maximum limit is 1000 leads"),
});

const AISearchIcon = ({ className, size = 32 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="2 -2 38 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Broken Glass Circle */}
    <path 
      d="M 26.74 17.65 A 12 12 0 1 1 18.49 11.26" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
    />
    {/* Long Handle */}
    <path 
      d="M 24.48 31.48 L 33 40" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
    />
    {/* Large Sparkle */}
    <path 
      d="M 29 3 Q 29 12 38 12 Q 29 12 29 21 Q 29 12 20 12 Q 29 12 29 3 Z" 
      fill="#FDE047" 
      className="animate-pulse"
    />
    {/* Small Sparkle */}
    <path 
      d="M 19 0 Q 19 6 25 6 Q 19 6 19 12 Q 19 6 13 6 Q 19 6 19 0 Z" 
      fill="currentColor" 
    />
  </svg>
);

type JobForm = z.infer<typeof jobSchema>;

const DynamicMap = dynamic(() => import("@/components/MapComponent"), { ssr: false, loading: () => <div className="w-full h-full bg-bg-secondary animate-pulse rounded-3xl" /> });

export default function NewJobPage() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomQuota, setIsCustomQuota] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      keyword: "",
      location: "",
      maxResults: 100,
    }
  });

  const keywordValue = watch("keyword");
  const locationValue = watch("location");
  const maxResultsValue = watch("maxResults");

  // Handle clicking outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const createJobMutation = useMutation({
    mutationFn: async (data: JobForm) => {
      const response = await api.post("/jobs", {
        keyword: data.keyword,
        location: data.location,
        options: {
          category: data.keyword,
          location: data.location,
          maxResults: data.maxResults,
          headless: true, // Defaulting to true as requested to remove from UI
          concurrency: 5 // Defaulting to 5 as requested to remove from UI
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Job started successfully!");
      router.push("/");
    },
    onError: (error: any) => {
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in first.");
        router.push("/login");
      } else {
        toast.error(error.response?.data?.message || "Failed to create job.");
      }
    },
  });

  const filteredCategories = BUSINESS_CATEGORIES.filter(c =>
    c.label.toLowerCase().includes((keywordValue || "").toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col h-auto md:h-[calc(100vh-180px)] overflow-visible md:overflow-hidden gap-4">
      <form onSubmit={handleSubmit((data) => createJobMutation.mutate(data))} className="flex flex-col gap-4 h-full">

        {/* The Hero Search Box (Top) - Pill Shaped, Shorter, White BG Inputs */}
        <div className="bg-bg-canvas rounded-full p-2 flex flex-col md:flex-row gap-2 relative z-20 items-center shrink-0">

          {/* Keyword Input */}
          <div className="flex-1 flex flex-col relative w-full" ref={dropdownRef}>
            <div className="flex items-center px-6 py-2 bg-white hover:bg-gray-50 transition-all rounded-full border border-gray-200 hover:border-accent-primary/40 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/10 focus-within:bg-white group cursor-text h-14">
              <Search className="text-gray-400 group-focus-within:text-accent-primary shrink-0 mr-3 transition-colors" size={20} />
              <div className="flex flex-col flex-1 justify-center">
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="What? (e.g. Plumbers, Software...)"
                  {...register("keyword")}
                  onClick={() => setIsDropdownOpen(true)}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full bg-transparent text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 cursor-pointer ${isDropdownOpen ? "rotate-180" : ""}`} onClick={() => setIsDropdownOpen(!isDropdownOpen)} />
            </div>
            {errors.keyword && <span className="absolute -bottom-5 left-6 text-[10px] text-error font-bold">{errors.keyword.message}</span>}

            {/* Dropdown for Keyword */}
            {isDropdownOpen && (
              <div className="absolute top-[65px] left-0 right-0 bg-white border border-gray-200 rounded-3xl shadow-xl z-30 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 p-2">
                {filteredCategories.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                    {filteredCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setValue("keyword", category.label, { shouldValidate: true });
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-accent-primary/5 text-left transition-all w-full group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-accent-primary group-hover:border-accent-primary group-hover:text-white transition-all">
                          {category.icon}
                        </div>
                        <span className="font-semibold text-gray-700 group-hover:text-accent-primary transition-colors text-sm">{category.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400 flex flex-col items-center gap-2">
                    <Search size={20} className="opacity-30" />
                    <span className="text-xs font-medium">Press enter to search for "{keywordValue}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Input */}
          <div className="flex-1 flex flex-col relative w-full">
            <div className="flex items-center px-6 py-2 bg-white hover:bg-gray-50 transition-all rounded-full border border-gray-200 hover:border-accent-primary/40 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/10 focus-within:bg-white group cursor-text h-14">
              <MapPin className="text-gray-400 group-focus-within:text-accent-primary shrink-0 mr-3 transition-colors" size={20} />
              <div className="flex flex-col flex-1 justify-center">
                <input
                  type="text"
                  placeholder="Where? (e.g. New York, Dubai...)"
                  {...register("location")}
                  className="w-full bg-transparent text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
            {errors.location && <span className="absolute -bottom-5 left-6 text-[10px] text-error font-bold">{errors.location.message}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createJobMutation.isPending}
            className="md:w-auto w-full bg-accent-primary hover:bg-accent-hover text-white font-bold px-8 h-14 rounded-full transition-all shadow-md hover:shadow-lg hover:shadow-accent-primary/30 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createJobMutation.isPending ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <AISearchIcon size={32} className="text-white" />
            )}
            <span className="hidden md:inline">Search</span>
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-2 min-h-0 pb-2">

          {/* Live Map Preview Area (Left - col-span-7) */}
          <div className="lg:col-span-7 h-full min-h-[300px] rounded-[2rem] overflow-hidden bg-bg-canvas border border-border-color shadow-sm relative">
            <div className="absolute inset-0 p-2 pointer-events-none">
              <DynamicMap locationQuery={locationValue || ""} keywordQuery={keywordValue || ""} />
            </div>

            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl p-4 rounded-3xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Zone</span>
                <span className="text-sm font-bold text-gray-800 truncate max-w-[200px]">
                  {locationValue || "Global"}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-gray-200 mx-2"></div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Niche</span>
                <span className="text-sm font-bold text-accent-primary truncate max-w-[200px]">
                  {keywordValue || "Any Business"}
                </span>
              </div>
            </div>
          </div>

          {/* Settings Area (Right - col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-6 h-full">

            {/* Quota / Limit Selector (Prominent) */}
            <div className="bg-bg-canvas border border-border-color rounded-[2rem] p-6 shadow-sm flex flex-col gap-5 h-full">
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-accent-primary" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Extraction Quota</h3>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-h-0">
                {PRESET_LIMITS.map((preset) => {
                  const isSelected = maxResultsValue === preset.value && !isCustomQuota;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setIsCustomQuota(false);
                        setValue("maxResults", preset.value, { shouldValidate: true });
                      }}
                      className={`flex flex-col items-center justify-center h-full min-h-[70px] rounded-3xl border-2 transition-all ${isSelected
                        ? "border-accent-primary bg-accent-primary shadow-lg shadow-accent-primary/20"
                        : "border-gray-100 bg-white hover:border-accent-primary/30 hover:bg-gray-50 hover:shadow-sm"
                        }`}
                    >
                      <span className={`text-lg lg:text-xl font-black ${isSelected ? "text-white" : "text-gray-800"}`}>
                        {preset.value}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                        {preset.sub}
                      </span>
                      <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? "text-white/60" : "text-gray-400/70"}`}>
                        ⏱ {preset.estTime}
                      </span>
                    </button>
                  );
                })}

                {/* Custom Quota Option */}
                <div
                  onClick={() => setIsCustomQuota(true)}
                  className={`col-span-2 lg:col-span-3 flex flex-col justify-center h-full min-h-[70px] rounded-3xl border-2 transition-all p-4 cursor-pointer ${isCustomQuota
                    ? "border-accent-primary bg-accent-primary/5 shadow-md"
                    : "border-gray-100 bg-white hover:border-accent-primary/30 hover:bg-gray-50 hover:shadow-sm"
                    }`}
                >
                  <div className="w-full flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${isCustomQuota ? "text-accent-primary" : "text-gray-400"}`}>
                        Custom Range
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold ${isCustomQuota ? "text-accent-primary/70" : "text-gray-400/70"}`}>
                          ⏱ Variable
                        </span>
                        <span className={`text-lg font-black ${isCustomQuota ? "text-accent-primary" : "text-gray-500"}`}>
                          {maxResultsValue} Leads
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-gray-400">10</span>
                      <input
                        type="range"
                        min={10}
                        max={1000}
                        step={10}
                        value={maxResultsValue}
                        onChange={(e) => {
                          setIsCustomQuota(true);
                          setValue("maxResults", parseInt(e.target.value), { shouldValidate: true });
                        }}
                        className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer transition-all ${isCustomQuota ? "bg-accent-primary/30 accent-accent-primary" : "bg-gray-200"
                          }`}
                        style={{
                          accentColor: isCustomQuota ? 'var(--accent-primary)' : '#9ca3af'
                        }}
                      />
                      <span className="text-xs font-bold text-gray-400">1000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

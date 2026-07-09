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
  Wrench,
  Home,
  Monitor,
  Utensils,
  Stethoscope,
  Briefcase,
  ChevronDown,
  Settings2,
  Zap,
  Building2,
  GraduationCap,
  Dumbbell,
  Scissors,
  Car,
  Pill,
  Megaphone,
  BedDouble,
  Landmark,
  ShoppingCart
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

const jobSchema = z.object({
  keyword: z.string().min(1, "Search keyword is required"),
  location: z.string().optional(),
  maxResults: z.number().min(10).max(5000),
  concurrency: z.number().min(1).max(20),
  headless: z.boolean(),
});

type JobForm = z.infer<typeof jobSchema>;

const DynamicMap = dynamic(() => import("@/components/MapComponent"), { ssr: false });

export default function NewJobPage() {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
      maxResults: 500,
      concurrency: 5,
      headless: true
    }
  });

  const keywordValue = watch("keyword");

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
        location: data.location || undefined,
        options: {
          category: data.keyword,
          location: data.location || "Global",
          maxResults: data.maxResults,
          headless: data.headless,
          concurrency: data.concurrency
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

  const locationValue = watch("location");

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">New Extraction Job</h1>
        <p className="text-text-secondary">Configure a new scraping job on the lead engine.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch h-full">
        {/* Form Column */}
        <form onSubmit={handleSubmit((data) => createJobMutation.mutate(data))} className="bg-bg-secondary border border-border-color rounded-3xl p-8 flex flex-col gap-8 shadow-sm">

          {/* Keyword Custom Dropdown */}
          <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
            <label htmlFor="keyword" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Target Business Type
            </label>
            <div className="relative">
              <input
                id="keyword"
                type="text"
                autoComplete="off"
                placeholder="Select or type a business (e.g. Plumbers)"
                {...register("keyword")}
                onClick={() => setIsDropdownOpen(true)}
                onFocus={() => setIsDropdownOpen(true)}
                className={`w-full bg-bg-primary border rounded-xl px-4 py-4 pr-12 text-lg font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 transition-all shadow-sm ${errors.keyword ? "border-error focus:ring-error/20" : "border-border-color focus:border-accent-primary focus:ring-accent-primary/20"
                  }`}
              />
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              >
                <ChevronDown size={24} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </div>
            </div>

            {errors.keyword && <span className="text-xs text-error font-medium">{errors.keyword.message}</span>}

            {isDropdownOpen && (
              <div className="absolute top-[85px] left-0 right-0 bg-bg-canvas border border-border-color rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {filteredCategories.length > 0 ? (
                  <div className="p-2 flex flex-col gap-1">
                    {filteredCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setValue("keyword", category.label, { shouldValidate: true });
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-secondary text-left transition-colors w-full group"
                      >
                        <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-secondary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                          {category.icon}
                        </div>
                        <span className="font-semibold text-text-primary">{category.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-text-secondary text-sm">
                    Press enter to use "{keywordValue}" as a custom search
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="location" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Location Target
            </label>
            <input
              id="location"
              type="text"
              placeholder="e.g. New York, London, Remote (Optional)"
              {...register("location")}
              className={`w-full bg-bg-primary border rounded-xl px-4 py-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 transition-all shadow-sm ${errors.location ? "border-error focus:ring-error/20" : "border-border-color focus:border-accent-primary focus:ring-accent-primary/20"
                }`}
            />
            {errors.location && <span className="text-xs text-error font-medium">{errors.location.message}</span>}
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t border-border-color/50 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors uppercase tracking-wider"
            >
              <Settings2 size={18} />
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
            </button>
          </div>

          {/* Advanced Options Panel */}
          {showAdvanced && (
            <div className="bg-bg-canvas border border-border-color/50 rounded-2xl p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-200">

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-text-primary">
                    Maximum Results
                  </label>
                  <span className="text-sm font-mono text-accent-primary font-bold bg-accent-glow px-3 py-1 rounded-full">
                    {watch("maxResults")}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mb-2">Limit the number of leads extracted to save engine resources.</p>
                <input
                  type="range"
                  min="10"
                  max="5000"
                  step="10"
                  {...register("maxResults", { valueAsNumber: true })}
                  className="w-full accent-accent-primary h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-text-primary">
                    Scraper Concurrency
                  </label>
                  <span className="text-sm font-mono text-warning font-bold bg-warning/10 px-3 py-1 rounded-full">
                    {watch("concurrency")} workers
                  </span>
                </div>
                <p className="text-xs text-text-secondary mb-2">Higher concurrency extracts faster but requires more system RAM.</p>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  {...register("concurrency", { valueAsNumber: true })}
                  className="w-full accent-warning h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-color/30">
                <div className="flex flex-col">
                  <label className="text-sm font-bold text-text-primary">Headless Engine Mode</label>
                  <span className="text-xs text-text-secondary">Run Playwright without a visible browser UI.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register("headless")} className="sr-only peer" />
                  <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                </label>
              </div>

            </div>
          )}

          <button
            type="submit"
            disabled={createJobMutation.isPending}
            className="mt-2 bg-accent-primary hover:bg-accent-hover text-white font-bold px-6 py-4 rounded-full transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
          >
            {createJobMutation.isPending ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting Engine...
              </>
            ) : (
              <>
                <Zap size={20} fill="currentColor" /> Initialize Extraction Engine
              </>
            )}
          </button>
        </form>

        {/* Map Column */}
        <div className="w-full rounded-3xl overflow-hidden bg-bg-secondary border border-border-color shadow-sm relative min-h-[400px]">
          <div className="absolute inset-0 p-2">
            <DynamicMap locationQuery={locationValue || ""} keywordQuery={keywordValue || ""} />
          </div>
        </div>
      </div>
    </div>
  );
}

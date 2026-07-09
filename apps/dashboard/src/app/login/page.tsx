"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Logo } from "@/components/Logo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await api.post("/auth/login", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Successfully logged in");
      router.push("/");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to log in. Check your credentials.");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary absolute inset-0 z-50">
      <div className="bg-bg-secondary border border-border-color rounded-2xl p-8 flex flex-col gap-6 shadow-sm w-full max-w-md">
        <div className="text-center flex flex-col gap-2">
          <div className="flex items-center justify-center">
            <h1 className="text-4xl font-bold tracking-wide text-text-primary flex items-center drop-shadow-sm">
              <Logo size={50} className="mr-3" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary">
                SCRAPPER
              </span>
            </h1>
          </div>
          <p className="text-text-secondary text-sm">Sign in to manage lead extraction</p>
        </div>

        <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              className={`w-full bg-bg-primary border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors ${
                errors.email ? "border-error focus:border-error focus:ring-error" : "border-border-color focus:border-accent-primary focus:ring-accent-primary"
              }`}
            />
            {errors.email && <span className="text-xs text-error font-medium">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              className={`w-full bg-bg-primary border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors ${
                errors.password ? "border-error focus:border-error focus:ring-error" : "border-border-color focus:border-accent-primary focus:ring-accent-primary"
              }`}
            />
            {errors.password && <span className="text-xs text-error font-medium">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="mt-2 bg-accent-primary hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-colors flex justify-center items-center disabled:opacity-50"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

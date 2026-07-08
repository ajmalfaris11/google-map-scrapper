import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  role: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data;
    },
    retry: false, // Don't retry on 401
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}

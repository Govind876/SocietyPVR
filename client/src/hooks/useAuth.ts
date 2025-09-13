import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch(API_BASE_URL + "/api/auth/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null; // User not authenticated, return null instead of throwing
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Auth check failed:", error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

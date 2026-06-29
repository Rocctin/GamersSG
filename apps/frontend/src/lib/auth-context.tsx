"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import apiClient, { setAccessToken } from "./api-client";
import type { UserProfileDto } from "@gamers-sg/shared/dto";
import type { Role } from "@gamers-sg/shared/enums";

interface AuthState {
  user: UserProfileDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  requestMagicLink: (email: string) => Promise<string | undefined>;
  verifyToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await apiClient.post("/auth/refresh");
      setAccessToken(data.accessToken);
      setState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      setAccessToken(null);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  // Try to restore session on mount
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const requestMagicLink = async (email: string) => {
    const { data } = await apiClient.post("/auth/magic-link/request", { email });
    // In development, the backend returns the magic link directly
    return data?.devMagicLink;
  };

  const verifyToken = async (token: string) => {
    const { data } = await apiClient.post("/auth/magic-link/verify", { token });
    setAccessToken(data.accessToken);
    setState({
      user: data.user,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore errors — we clear client state regardless
    }
    setAccessToken(null);
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        requestMagicLink,
        verifyToken,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}

// Convenience: check if user has a specific role
export function hasRole(user: UserProfileDto | null, role: Role): boolean {
  return user?.role === role;
}

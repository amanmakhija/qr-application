import { useState, useEffect, useCallback } from "react";
import { User } from "@/types/auth";
import axiosInstance from "@/utils/axiosInstance";
import Cookies from "js-cookie";

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/auth/check-role");

      if (response.status !== 200) {
        throw new Error("Authentication failed");
      }

      const data = response.data;
      if (!data.isAdmin && !data.isStaff) {
        throw new Error("Not authorized");
      }

      setUser(data.user);
    } catch (error) {
      setUser(null);
      Cookies.remove("token");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });

    if (response.status !== 200) {
      throw new Error("Login failed");
    }

    const data: AuthResponse = response.data;

    // Store token in both localStorage and cookies
    localStorage.setItem("token", data.token);
    Cookies.set("token", data.token, {
      expires: 7, // 7 days
      sameSite: "lax",
      path: "/",
    });

    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } finally {
      Cookies.remove("token");
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    isStaff: user?.role === "STAFF",
  };
}

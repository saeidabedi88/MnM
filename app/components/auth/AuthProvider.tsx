'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Function to fetch user details with the token
  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
        headers: { 
          Authorization: `Bearer ${authToken}` 
        },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Check for token on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          // Try to fetch user with stored token
          const userProfile = await fetchUserProfile(storedToken);
          if (userProfile) {
            setToken(storedToken);
            setUser(userProfile);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Configure axios interceptors for auth
  useEffect(() => {
    // Request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          // Clear auth state on 401 errors (token expired or invalid)
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          router.push('/login');
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptors when component unmounts
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token, router]);

  const login = async (email: string, password: string) => {
    try {
      // Create URLSearchParams instead of FormData for proper x-www-form-urlencoded format
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/token`, formData.toString(), {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        withCredentials: true
      });
      
      const { access_token } = response.data;
      
      if (access_token) {
        localStorage.setItem('token', access_token);
        setToken(access_token);
        
        // Fetch user profile with new token
        const userProfile = await fetchUserProfile(access_token);
        if (userProfile) {
          setUser(userProfile);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
} 
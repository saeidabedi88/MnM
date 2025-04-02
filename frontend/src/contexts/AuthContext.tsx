import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Add axios interceptor to include token in all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await axios.get('http://localhost:8000/api/v1/users/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await axios.post('http://localhost:8000/api/v1/token', 
        new URLSearchParams({
          username: email,
          password: password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('Login response:', response.data);
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);

      const userResponse = await axios.get('http://localhost:8000/api/v1/users/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      console.log('User data:', userResponse.data);
      setUser(userResponse.data);
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error response:', error.response.data);
          throw new Error(error.response.data.detail || 'Login failed');
        } else if (error.request) {
          console.error('No response received');
          throw new Error('No response from server');
        }
      }
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await axios.post('http://localhost:8000/api/v1/users/register', {
        email,
        password,
      });
      await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
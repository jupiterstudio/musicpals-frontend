// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authService from '../services/auth';

// Interface for user profile
interface UserProfile {
  auth0Id: string;
  username: string;
  email: string;
  joinDate: string;
  totalPoints: number;
  rank: string;
  lastActivity: Date;
}

// Interface for registration response
interface RegisterResponse {
  auth0Id: string;
  email: string;
  totalPoints: number;
  rank: string;
  _id: string;
  joinDate: string;
  lastActivity: string;
  __v: number;
}

// Interface for auth context
interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<RegisterResponse>;
  logout: () => void;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth context provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth context provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            // Token exists but user fetch failed - token might be invalid
            authService.logout();
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Error checking authentication:', err);
          authService.logout();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userProfile = await authService.login(email, password);
      setUser(userProfile);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> => {
    setLoading(true);
    setError(null);
    try {
      // Register the user but don't set them as authenticated
      const registerResponse = await authService.register(username, email, password);
      // Return the registration response
      return registerResponse;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setIsAuthenticated(false);
      throw err; // Rethrow the error so the LoginPage can handle it
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

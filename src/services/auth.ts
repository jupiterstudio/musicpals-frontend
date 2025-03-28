// src/services/auth.ts
import { userAPI } from './api';
import apiClient from './apiClient';

// Interface for authentication response
interface AuthResponse {
  data: {
    accessToken: string;
  };
  success: boolean;
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

// Auth service
const authService = {
  // Login user
  login: async (email: string, password: string): Promise<UserProfile> => {
    try {
      // Send login request
      const loginResponse = await apiClient.post<AuthResponse>('/auth/login', { email, password });

      // Store token in localStorage
      localStorage.setItem('token', loginResponse.data.data.accessToken);

      // Fetch complete user profile using the ID
      const profileResponse = await userAPI.getProfile();
      const userProfile = profileResponse.data;

      // Cache some user info for quick access
      localStorage.setItem('username', userProfile.username);
      localStorage.setItem('userRank', userProfile.rank);

      return userProfile;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register user
  register: async (
    username: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> => {
    try {
      // Send registration request
      const registerResponse = await apiClient.post<RegisterResponse>('/auth/register', {
        username,
        email,
        password,
      });

      // Return the registration response
      // Note: No token is stored as the API response doesn't include one
      return registerResponse.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Fetch current user profile
  getCurrentUser: async (): Promise<UserProfile | null> => {
    try {
      const response = await userAPI.getProfile();
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRank');
    // Add any other cleanup needed
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

export default authService;

// src/services/api.ts

import apiClient from './apiClient';

// Auth API functions
export const authAPI = {
  login: (email: string, password: string) => {
    return apiClient.post('/auth/login', { email, password });
  },

  signup: (username: string, email: string, password: string) => {
    return apiClient.post('/auth/register', { username, email, password });
  },
};

// User API functions
export const userAPI = {
  getProfile: () => {
    return apiClient.get(`/users/profile`);
  },

  updateProfile: (data: any) => {
    return apiClient.put(`/users`, data);
  },
};

// Progress API functions
export const progressAPI = {
  getUserProgress: () => {
    return apiClient.get(`/progress`);
  },
  getDetailedUserProgress: () => apiClient.get('/progress/detailed'),
  updateProgress: (moduleType: string, progress: number) => {
    return apiClient.post(`/progress/${moduleType}`, { progress });
  },
};

// Exercise API functions
export const exerciseAPI = {
  getUserExercises: () => {
    return apiClient.get(`/exercises`);
  },

  getUserModuleExercises: (moduleType: string) => {
    return apiClient.get(`/exercises/${moduleType}`);
  },

  recordExerciseCompletion: (
    moduleType: string,
    exerciseId: string,
    exerciseName: string,
    score: number,
    difficulty: string
  ) => {
    return apiClient.post('/exercises/record', {
      moduleType,
      exerciseId,
      exerciseName,
      score,
      difficulty,
    });
  },
};

// Achievement API functions
export const achievementAPI = {
  getUserAchievements: () => {
    return apiClient.get(`/achievements`);
  },

  unlockAchievement: (name: string, description: string, icon: string) => {
    return apiClient.post('/achievements/unlock', {
      name,
      description,
      icon,
    });
  },
};

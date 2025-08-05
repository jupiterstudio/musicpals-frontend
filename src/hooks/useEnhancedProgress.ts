// src/hooks/useEnhancedProgress.ts
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

export interface ExerciseSessionData {
  exerciseType: string;
  difficultyLevel: string;
  score: number;
  timeSpent: number;
  mistakesMade: number;
  hintsUsed: number;
  mistakeCategories: string[];
}

export interface UserProgress {
  userId: string;
  moduleType: string;
  skillArea: string;
  currentLevel: number;
  accuracyScore: number;
  totalAttempts: number;
  successfulAttempts: number;
  streakCount: number;
  lastPracticeDate: string;
  difficultyMultiplier: number;
  confidenceLevel: number;
  learningVelocity: number;
  weaknessAreas: string[];
  strengthAreas: string[];
}

export interface LearningInsights {
  totalPracticeTime: number;
  exercisesCompleted: number;
  averageScore: number;
  strongestSkills: string[];
  areasNeedingWork: string[];
  learningVelocity: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  recommendations: string[];
}

export interface AdaptiveDifficultyRecommendation {
  recommendedLevel: string;
  confidenceScore: number;
  reasoning: string;
}

export interface PersonalizedRecommendations {
  insights: LearningInsights;
  skillRecommendations: Array<{
    skillArea: string;
    recommendedLevel: string;
    confidenceScore: number;
    reasoning: string;
  }>;
  priorityAreas: string[];
  nextSteps: string[];
}

export const useEnhancedProgress = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackExerciseSession = useCallback(async (sessionData: ExerciseSessionData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/enhanced-progress/session', sessionData);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track exercise session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserProgressBySkill = useCallback(
    async (moduleType?: string): Promise<UserProgress[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const url = moduleType
          ? `/enhanced-progress/skills?moduleType=${moduleType}`
          : '/enhanced-progress/skills';
        const response = await apiClient.get(url);
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch progress by skill';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getAdaptiveDifficultyRecommendation = useCallback(
    async (moduleType: string, skillArea: string): Promise<AdaptiveDifficultyRecommendation> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(
          `/enhanced-progress/adaptive-difficulty/${moduleType}/${skillArea}`
        );
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get difficulty recommendation';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getLearningInsights = useCallback(async (days: number = 30): Promise<LearningInsights> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/enhanced-progress/insights?days=${days}`);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch learning insights';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDetailedAnalytics = useCallback(async (moduleType?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = moduleType
        ? `/enhanced-progress/analytics?moduleType=${moduleType}`
        : '/enhanced-progress/analytics';
      const response = await apiClient.get(url);
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch detailed analytics';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPersonalizedRecommendations = useCallback(
    async (moduleType: string): Promise<PersonalizedRecommendations> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/enhanced-progress/recommendations/${moduleType}`);
        return response.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recommendations';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getLeaderboard = useCallback(
    async (
      options: {
        moduleType?: string;
        skillArea?: string;
        timeframe?: 'daily' | 'weekly' | 'monthly';
      } = {}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options.moduleType) params.append('moduleType', options.moduleType);
        if (options.skillArea) params.append('skillArea', options.skillArea);
        if (options.timeframe) params.append('timeframe', options.timeframe);

        const response = await apiClient.get(`/enhanced-progress/leaderboard?${params.toString()}`);
        return response.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    // State
    isLoading,
    error,

    // Methods
    trackExerciseSession,
    getUserProgressBySkill,
    getAdaptiveDifficultyRecommendation,
    getLearningInsights,
    getDetailedAnalytics,
    getPersonalizedRecommendations,
    getLeaderboard,
  };
};

// Hook for real-time progress tracking during exercises
export const useExerciseSession = (moduleType: string, skillArea: string) => {
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<Partial<ExerciseSessionData>>({
    mistakesMade: 0,
    hintsUsed: 0,
    mistakeCategories: [],
  });
  const [adaptiveDifficulty, setAdaptiveDifficulty] =
    useState<AdaptiveDifficultyRecommendation | null>(null);

  const { trackExerciseSession, getAdaptiveDifficultyRecommendation } = useEnhancedProgress();

  // Start a new exercise session
  const startSession = useCallback((exerciseType: string, difficultyLevel: string) => {
    setSessionStartTime(Date.now());
    setCurrentSession({
      exerciseType,
      difficultyLevel,
      mistakesMade: 0,
      hintsUsed: 0,
      mistakeCategories: [],
    });
  }, []);

  // Record a mistake during the session
  const recordMistake = useCallback((category?: string) => {
    setCurrentSession(prev => ({
      ...prev,
      mistakesMade: (prev.mistakesMade || 0) + 1,
      mistakeCategories: category
        ? [...(prev.mistakeCategories || []), category]
        : prev.mistakeCategories,
    }));
  }, []);

  // Record hint usage
  const recordHintUsed = useCallback(() => {
    setCurrentSession(prev => ({
      ...prev,
      hintsUsed: (prev.hintsUsed || 0) + 1,
    }));
  }, []);

  // Complete the session and track it
  const completeSession = useCallback(
    async (score: number) => {
      if (!sessionStartTime || !currentSession.exerciseType || !currentSession.difficultyLevel) {
        throw new Error('Session not properly initialized');
      }

      const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000); // in seconds

      const sessionData: ExerciseSessionData = {
        exerciseType: currentSession.exerciseType,
        difficultyLevel: currentSession.difficultyLevel,
        score,
        timeSpent,
        mistakesMade: currentSession.mistakesMade || 0,
        hintsUsed: currentSession.hintsUsed || 0,
        mistakeCategories: currentSession.mistakeCategories || [],
      };

      try {
        const result = await trackExerciseSession(sessionData);

        // Reset session
        setSessionStartTime(null);
        setCurrentSession({
          mistakesMade: 0,
          hintsUsed: 0,
          mistakeCategories: [],
        });

        return result;
      } catch (error) {
        console.error('Failed to complete session:', error);
        throw error;
      }
    },
    [sessionStartTime, currentSession, trackExerciseSession]
  );

  // Get adaptive difficulty recommendation for next exercise
  const getNextDifficulty = useCallback(async () => {
    try {
      const recommendation = await getAdaptiveDifficultyRecommendation(moduleType, skillArea);
      setAdaptiveDifficulty(recommendation);
      return recommendation;
    } catch (error) {
      console.error('Failed to get adaptive difficulty:', error);
      return null;
    }
  }, [moduleType, skillArea, getAdaptiveDifficultyRecommendation]);

  // Get current session statistics
  const getSessionStats = useCallback(() => {
    if (!sessionStartTime) return null;

    return {
      timeElapsed: Math.round((Date.now() - sessionStartTime) / 1000),
      mistakesMade: currentSession.mistakesMade || 0,
      hintsUsed: currentSession.hintsUsed || 0,
      mistakeCategories: currentSession.mistakeCategories || [],
    };
  }, [sessionStartTime, currentSession]);

  return {
    // Session state
    isSessionActive: sessionStartTime !== null,
    currentSession,
    adaptiveDifficulty,

    // Session methods
    startSession,
    recordMistake,
    recordHintUsed,
    completeSession,
    getNextDifficulty,
    getSessionStats,
  };
};

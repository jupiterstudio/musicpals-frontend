// src/pages/ProfilePage.tsx - Updated with API integration
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Award, Music, Mic, BookOpen, Ear, ChevronUp } from 'lucide-react';
import Layout from '../components/Layout';
import { userAPI, progressAPI, achievementAPI } from '../services/api';

// Define interfaces for user data
interface UserProfile {
  _id?: string;
  username: string;
  email: string;
  joinDate: string;
  totalPoints: number;
  rank: string;
  lastActivity: Date;
}

interface Achievement {
  _id?: string;
  userId?: string;
  name: string;
  description: string;
  unlockedDate: string;
  icon: string;
}

interface ModuleProgress {
  moduleType: string;
  progress: number;
  lastUpdated: string;
  exercises: Exercise[];
}

interface Exercise {
  id: number | string;
  name: string;
  score: number;
  completedDate: string;
}

const ProfilePage = () => {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Make API calls in parallel for efficiency
        const [profileResponse, progressResponse, achievementsResponse] = await Promise.all([
          userAPI.getProfile(),
          progressAPI.getDetailedUserProgress(),
          achievementAPI.getUserAchievements(),
        ]);

        // Set data in state
        setUserData(profileResponse.data);
        setModuleProgress(progressResponse.data);
        setUserAchievements(achievementsResponse.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again later.');

      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Toggle module expansion
  const toggleModuleExpansion = (moduleName: string) => {
    if (expandedModules.includes(moduleName)) {
      setExpandedModules(expandedModules.filter(name => name !== moduleName));
    } else {
      setExpandedModules([...expandedModules, moduleName]);
    }
  };

  // Determine icon for module
  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case 'EarTraining':
        return <Ear className="text-indigo-600" size={20} />;
      case 'SightSinging':
        return <Mic className="text-amber-600" size={20} />;
      case 'MusicGeneration':
        return <Music className="text-blue-600" size={20} />;
      case 'Lessons':
        return <BookOpen className="text-green-600" size={20} />;
      default:
        return <Music className="text-indigo-600" size={20} />;
    }
  };

  // Get color for module
  const getModuleColor = (moduleName: string) => {
    switch (moduleName) {
      case 'EarTraining':
        return {
          bg: 'bg-indigo-50',
          text: 'text-indigo-600',
          border: 'border-indigo-200',
          progress: 'bg-indigo-600',
        };
      case 'SightSinging':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-200',
          progress: 'bg-amber-600',
        };
      case 'MusicGeneration':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          progress: 'bg-blue-600',
        };
      case 'Lessons':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-200',
          progress: 'bg-green-600',
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          progress: 'bg-gray-600',
        };
    }
  };

  // Get icon component for achievement
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'award':
        return <Award className="text-yellow-500" size={20} />;
      case 'music':
        return <Music className="text-blue-500" size={20} />;
      case 'book-open':
        return <BookOpen className="text-green-500" size={20} />;
      case 'ear':
        return <Ear className="text-indigo-500" size={20} />;
      case 'mic':
        return <Mic className="text-amber-500" size={20} />;
      default:
        return <Award className="text-yellow-500" size={20} />;
    }
  };

  // Handle viewing all achievements
  const handleViewAllAchievements = () => {
    // In a real app, this might navigate to a dedicated achievements page
    // For demo purposes, expand/collapse all modules
    if (expandedModules.length === moduleProgress.length) {
      setExpandedModules([]);
    } else {
      setExpandedModules(moduleProgress.map(module => module.moduleType));
    }
  };

  // Calculate overall completion percentage
  const calculateOverallProgress = () => {
    if (moduleProgress.length === 0) return 0;

    const totalProgress = moduleProgress.reduce((sum, module) => sum + module.progress, 0);
    return Math.round(totalProgress / moduleProgress.length);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (err) {
      return dateString; // Return original string if parsing fails
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-6 flex justify-center items-center min-h-[70vh]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-t-2 border-r-2 border-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading profile data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout backgroundClass="music-app-background">
      <motion.main
        className="container mx-auto py-8 px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div
          className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center"
          variants={itemVariants}
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
            <p className="text-gray-600">View and track your musical progress</p>
          </div>
          <div className="text-indigo-600">
            <User size={32} />
          </div>
        </motion.div>

        {/* Display error if any */}
        {error && (
          <motion.div
            className="mt-4 bg-red-50 p-4 rounded-md text-red-600"
            variants={itemVariants}
          >
            {error}
          </motion.div>
        )}

        {/* Profile Overview */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Info Card */}
          <motion.div className="bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-4">
                <User size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{userData?.username}</h3>
                <p className="text-gray-600">{userData?.email}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Member Since:</span>
                <span className="text-gray-800">{userData?.joinDate}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Score:</span>
                <span className="text-indigo-600 font-bold">{userData?.totalPoints} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Rank:</span>
                <span className="text-blue-600 font-semibold">{userData?.rank}</span>
              </div>
            </div>
          </motion.div>

          {/* Overall Progress Card */}
          <motion.div className="bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Overall Progress</h3>

            <div className="space-y-4">
              {moduleProgress.map(module => (
                <div key={module.moduleType} className="progress-item">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700">
                      {module.moduleType === 'EarTraining'
                        ? 'Ear Training'
                        : module.moduleType === 'SightSinging'
                        ? 'Sight Singing'
                        : module.moduleType === 'MusicGeneration'
                        ? 'Music Generation'
                        : module.moduleType}
                    </span>
                    <span className="text-gray-600 text-sm">{module.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        getModuleColor(module.moduleType).progress
                      } rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${module.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">
                  {calculateOverallProgress()}%
                </div>
                <div className="text-sm text-gray-600">Total Completion</div>
              </div>
            </div>
          </motion.div>

          {/* Achievements Card */}
          <motion.div className="bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Achievements</h3>

            <div className="space-y-3">
              {userAchievements.slice(0, 3).map((achievement, index) => (
                <div key={index} className="flex items-start p-3 bg-gray-50 rounded-md">
                  <div className="h-8 w-8 flex items-center justify-center bg-white rounded-full mr-3 shadow-sm">
                    {getAchievementIcon(achievement.icon)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{achievement.name}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Earned on {formatDate(achievement.unlockedDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {userAchievements.length === 0 && (
              <div className="text-center p-8 text-gray-500">
                <Award size={40} className="mx-auto mb-2 text-gray-300" />
                <p>You haven't earned any achievements yet. Keep practicing!</p>
              </div>
            )}

            {userAchievements.length > 3 && (
              <div className="mt-4 text-center">
                <button
                  className="text-indigo-600 text-sm hover:underline"
                  onClick={handleViewAllAchievements}
                >
                  View All Achievements ({userAchievements.length})
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Detailed Module Progress */}
        {moduleProgress.length > 0 && (
          <motion.section className="mt-8" variants={itemVariants}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Activity Details</h3>

            <div className="space-y-4">
              {moduleProgress.map(module => {
                const colors = getModuleColor(module.moduleType);
                const isExpanded = expandedModules.includes(module.moduleType);

                return (
                  <motion.div
                    key={module.moduleType}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden border ${colors.border}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Module Header */}
                    <div
                      className={`p-4 ${colors.bg} flex justify-between items-center cursor-pointer`}
                      onClick={() => toggleModuleExpansion(module.moduleType)}
                    >
                      <div className="flex items-center">
                        {getModuleIcon(module.moduleType)}
                        <span className={`ml-2 font-medium ${colors.text}`}>
                          {module.moduleType === 'EarTraining'
                            ? 'Ear Training'
                            : module.moduleType === 'SightSinging'
                            ? 'Sight Singing'
                            : module.moduleType === 'MusicGeneration'
                            ? 'Music Generation'
                            : module.moduleType}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600 text-sm mr-3">
                          Last activity: {formatDate(module.lastUpdated)}
                        </span>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronUp size={16} className="text-gray-600" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Module Content (exercises) */}
                    {isExpanded && (
                      <motion.div
                        className="p-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        {module.exercises && module.exercises.length > 0 ? (
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b">
                                <th className="pb-2 text-gray-700">Exercise</th>
                                <th className="pb-2 text-gray-700">Score</th>
                                <th className="pb-2 text-gray-700">Completed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {module.exercises.map((exercise, idx) => (
                                <tr
                                  key={`${exercise.id}-${idx}`}
                                  className="border-b border-gray-100"
                                >
                                  <td className="py-3 text-gray-800">{exercise.name}</td>
                                  <td className="py-3">
                                    <span
                                      className={`inline-block py-1 px-2 rounded-full text-sm ${
                                        exercise.score >= 80
                                          ? 'bg-green-100 text-green-800'
                                          : exercise.score >= 60
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {exercise.score}%
                                    </span>
                                  </td>
                                  <td className="py-3 text-gray-600 text-sm">
                                    {formatDate(exercise.completedDate)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No activity recorded for this module yet.
                          </div>
                        )}

                        <div className="mt-4 text-right">
                          <button
                            className={`${colors.text} hover:underline text-sm`}
                            onClick={() => {
                              // In a real app, this might navigate to the corresponding module page
                              alert(`Navigating to ${module.moduleType} page`);
                            }}
                          >
                            Go to{' '}
                            {module.moduleType === 'EarTraining'
                              ? 'Ear Training'
                              : module.moduleType === 'SightSinging'
                              ? 'Sight Singing'
                              : module.moduleType === 'MusicGeneration'
                              ? 'Music Generation'
                              : module.moduleType}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </motion.main>
    </Layout>
  );
};

export default ProfilePage;

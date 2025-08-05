// src/pages/ProfilePage.tsx - Updated with API integration
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Award, Music, Mic, BookOpen, Ear, ChevronUp, Trophy, ArrowRight, Target } from 'lucide-react';
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
  const [showAllAchievements, setShowAllAchievements] = useState(false);

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
        return <Ear className="text-white" size={16} />;
      case 'SightSinging':
        return <Mic className="text-white" size={16} />;
      case 'MusicGeneration':
        return <Music className="text-white" size={16} />;
      case 'Lessons':
        return <BookOpen className="text-white" size={16} />;
      default:
        return <Music className="text-white" size={16} />;
    }
  };


  // Get icon component for achievement
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'award':
        return <Award className="text-white" size={24} />;
      case 'music':
        return <Music className="text-white" size={24} />;
      case 'book-open':
        return <BookOpen className="text-white" size={24} />;
      case 'ear':
        return <Ear className="text-white" size={24} />;
      case 'mic':
        return <Mic className="text-white" size={24} />;
      default:
        return <Award className="text-white" size={24} />;
    }
  };

  // Handle viewing all achievements
  const handleViewAllAchievements = () => {
    setShowAllAchievements(!showAllAchievements);
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
      <Layout backgroundClass="">
        {/* Floating musical notes background */}
        <div className="floating-notes">
          <div className="note">🎵</div>
          <div className="note">🎶</div>
          <div className="note">🎼</div>
          <div className="note">🎹</div>
          <div className="note">🎺</div>
          <div className="note">🎸</div>
          <div className="note">🥁</div>
          <div className="note">🎤</div>
        </div>
        
        <div className="py-8 px-4" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div className="kid-welcome-section flex justify-center items-center min-h-[70vh]">
            <div className="flex flex-col items-center" style={{ position: 'relative', zIndex: 2 }}>
              <div className="w-12 h-12 border-t-4 border-r-4 border-pink-500 rounded-full animate-spin mb-4"></div>
              <p className="kid-subtitle text-lg font-bold">✨ Loading your magical profile... ✨</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout backgroundClass="">
      {/* Floating musical notes background */}
      <div className="floating-notes">
        <div className="note">🎵</div>
        <div className="note">🎶</div>
        <div className="note">🎼</div>
        <div className="note">🎹</div>
        <div className="note">🎺</div>
        <div className="note">🎸</div>
        <div className="note">🥁</div>
        <div className="note">🎤</div>
      </div>

      <motion.main
        className="py-8 px-4"
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10,
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div className="kid-welcome-section" variants={itemVariants}>
          <h1
            className="kid-title text-4xl md:text-5xl mb-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            🌟 Your Magical Profile! 🎭
          </h1>
          <div className="musical-icon">🎨</div>
          <p className="kid-subtitle text-xl" style={{ position: 'relative', zIndex: 2 }}>
            Check out your amazing musical journey and all the cool stuff you've learned!
          </p>
        </motion.div>

        {/* Display error if any */}
        {error && (
          <motion.div
            className="mt-6 bg-red-100 p-6 rounded-2xl border-4 border-red-300 text-red-700 text-center font-bold"
            variants={itemVariants}
            style={{ position: 'relative', zIndex: 2 }}
          >
            😅 {error}
          </motion.div>
        )}

        {/* Profile Overview */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Info Card */}
          <motion.div className="kid-welcome-section lg:col-span-1" variants={itemVariants}>
            <div className="flex items-center mb-6" style={{ position: 'relative', zIndex: 2 }}>
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-white mr-6 shadow-lg transform rotate-3">
                <User size={40} />
              </div>
              <div>
                <h3 className="activity-title text-2xl">{userData?.username} 🎸</h3>
                <p className="kid-subtitle text-base">{userData?.email}</p>
              </div>
            </div>
            <div className="border-t-4 border-pink-200 pt-6 space-y-4" style={{ position: 'relative', zIndex: 2 }}>
              <div className="flex justify-between items-center">
                <span className="kid-subtitle font-bold text-lg">🗓️ Member Since:</span>
                <span className="kid-subtitle font-bold text-purple-600 text-lg">{userData?.joinDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="kid-subtitle font-bold text-lg">⭐ Total Score:</span>
                <span className="activity-title text-pink-600 text-xl">{userData?.totalPoints} points</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="kid-subtitle font-bold text-lg">🏆 Current Rank:</span>
                <span className="activity-title text-teal-600 text-xl">{userData?.rank}</span>
              </div>
            </div>
          </motion.div>

          {/* Overall Progress Card */}
          <motion.div className="kid-welcome-section lg:col-span-1" variants={itemVariants}>
            <h3 className="activity-title text-2xl mb-6 text-center" style={{ position: 'relative', zIndex: 2 }}>🎯 Your Amazing Progress! 🚀</h3>

            <div className="space-y-5" style={{ position: 'relative', zIndex: 2 }}>
              {moduleProgress.map(module => (
                <div key={module.moduleType} className="progress-item">
                  <div className="flex justify-between items-center mb-3">
                    <span className="kid-subtitle font-bold text-lg">
                      {module.moduleType === 'EarTraining'
                        ? '👂 Ear Training'
                        : module.moduleType === 'SightSinging'
                        ? '🎤 Sight Singing'
                        : module.moduleType === 'MusicGeneration'
                        ? '🎵 Music Generation'
                        : `🎼 ${module.moduleType}`}
                    </span>
                    <span className="kid-subtitle font-bold text-purple-600 text-lg">{module.progress}%</span>
                  </div>
                  <div className="w-full h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-pink-400 via-yellow-400 to-teal-400 rounded-full shadow-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${module.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t-4 border-pink-200" style={{ position: 'relative', zIndex: 2 }}>
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-yellow-500 to-teal-500 bg-clip-text text-transparent mb-3">
                  {calculateOverallProgress()}%
                </div>
                <div className="kid-subtitle font-bold text-lg">🌟 Total Musical Magic! 🌟</div>
              </div>
            </div>
          </motion.div>

          {/* Achievements Card */}
          <motion.div className="kid-welcome-section lg:col-span-2" variants={itemVariants}>
            <h3 className="activity-title text-2xl mb-6 text-center" style={{ position: 'relative', zIndex: 2 }}>🏆 Your Super Achievements! 🎉</h3>

            <div 
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                showAllAchievements && userAchievements.length > 4 
                  ? 'max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-purple-100' 
                  : ''
              }`}
              style={{ position: 'relative', zIndex: 2 }}
            >
              {(showAllAchievements ? userAchievements : userAchievements.slice(0, 4)).map((achievement, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-start p-5 bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 rounded-2xl border-2 border-yellow-300 shadow-lg transform hover:scale-105 transition-transform"
                  initial={showAllAchievements && index >= 4 ? { opacity: 0, y: 20 } : {}}
                  animate={showAllAchievements && index >= 4 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: (index - 4) * 0.1 }}
                >
                  <div className="h-14 w-14 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mr-4 shadow-lg text-white flex-shrink-0">
                    {getAchievementIcon(achievement.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="kid-subtitle font-bold text-purple-800 text-base">{achievement.name} 🌟</h4>
                    <p className="kid-subtitle text-sm text-purple-600 break-words">{achievement.description}</p>
                    <p className="kid-subtitle text-xs text-purple-500 mt-2 font-bold">
                      🗓️ Earned on {formatDate(achievement.unlockedDate)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {userAchievements.length === 0 && (
              <div className="text-center p-12" style={{ position: 'relative', zIndex: 2 }}>
                <Award size={80} className="mx-auto mb-6 text-yellow-400" />
                <p className="kid-subtitle font-bold text-purple-600 text-lg">🌟 Keep practicing to unlock amazing achievements! 🌟</p>
              </div>
            )}

            {userAchievements.length > 4 && (
              <div className="mt-6 text-center" style={{ position: 'relative', zIndex: 2 }}>
                <motion.button
                  className="kid-button text-base"
                  style={{ background: 'linear-gradient(45deg, #FFE66D, #FF6B9D)' }}
                  onClick={handleViewAllAchievements}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trophy size={20} className="mr-2" />
                  {showAllAchievements ? 'Show Less' : `View All Achievements (${userAchievements.length})`}
                  <Trophy size={20} className="ml-2" />
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Detailed Module Progress */}
        {moduleProgress.length > 0 && (
          <motion.section className="mt-8 kid-welcome-section" variants={itemVariants}>
            <h3 className="activity-title text-2xl text-center mb-6" style={{ position: 'relative', zIndex: 2 }}>🎮 Your Musical Adventure Details! 🎯</h3>

            <div className="space-y-4" style={{ position: 'relative', zIndex: 2 }}>
              {moduleProgress.map(module => {
                const isExpanded = expandedModules.includes(module.moduleType);

                return (
                  <motion.div
                    key={module.moduleType}
                    className="bg-white bg-opacity-95 rounded-2xl overflow-hidden border-4 border-purple-300 shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Module Header */}
                    <div
                      className="p-4 bg-gradient-to-r from-pink-200 via-yellow-200 to-teal-200 flex justify-between items-center cursor-pointer border-b-4 border-purple-300"
                      onClick={() => toggleModuleExpansion(module.moduleType)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white mr-3 shadow-lg">
                          {getModuleIcon(module.moduleType)}
                        </div>
                        <span className="activity-title text-lg">
                          {module.moduleType === 'EarTraining'
                            ? '👂 Ear Training Adventures'
                            : module.moduleType === 'SightSinging'
                            ? '🎤 Sight Singing Magic'
                            : module.moduleType === 'MusicGeneration'
                            ? '🎵 Music Creation Fun'
                            : `🎼 ${module.moduleType} Journey`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="kid-subtitle font-bold text-sm mr-3">
                          🗓️ Last adventure: {formatDate(module.lastUpdated)}
                        </span>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronUp size={20} className="text-purple-600" />
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
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              <div className="kid-subtitle font-bold text-center p-3 bg-gradient-to-r from-pink-300 to-purple-300 rounded-xl text-base">🎯 Exercise</div>
                              <div className="kid-subtitle font-bold text-center p-3 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-xl text-base">⭐ Score</div>
                              <div className="kid-subtitle font-bold text-center p-3 bg-gradient-to-r from-teal-300 to-blue-300 rounded-xl text-base">📅 Completed</div>
                            </div>
                            {module.exercises.map((exercise, idx) => (
                              <div
                                key={`${exercise.id}-${idx}`}
                                className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-yellow-50 rounded-xl border-2 border-purple-200 shadow-sm"
                              >
                                <div className="kid-subtitle font-bold text-purple-800 text-base break-words">{exercise.name}</div>
                                <div className="text-center">
                                  <span
                                    className={`inline-block py-2 px-4 rounded-full text-base font-bold shadow-lg ${
                                      exercise.score >= 80
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                                        : exercise.score >= 60
                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                                        : 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
                                    }`}
                                  >
                                    {exercise.score >= 80 ? '🌟' : exercise.score >= 60 ? '⭐' : '💪'} {exercise.score}%
                                  </span>
                                </div>
                                <div className="kid-subtitle font-bold text-teal-600 text-center text-base">
                                  {formatDate(exercise.completedDate)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="text-8xl mb-6">🎯</div>
                            <p className="kid-subtitle font-bold text-purple-600 text-lg">🌟 Ready for your first adventure? Let's go! 🌟</p>
                          </div>
                        )}

                        <div className="mt-6 text-center">
                          <button
                            className="kid-button"
                            style={{ background: 'linear-gradient(45deg, #4ECDC4, #95E1D3)' }}
                            onClick={() => {
                              // In a real app, this might navigate to the corresponding module page
                              alert(`Navigating to ${module.moduleType} page`);
                            }}
                          >
                            <ArrowRight size={20} className="mr-2" />
                            Go to{' '}
                            {module.moduleType === 'EarTraining'
                              ? 'Ear Training'
                              : module.moduleType === 'SightSinging'
                              ? 'Sight Singing'
                              : module.moduleType === 'MusicGeneration'
                              ? 'Music Generation'
                              : module.moduleType}{' '}
                            Adventure!
                            <Target size={20} className="ml-2" />
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

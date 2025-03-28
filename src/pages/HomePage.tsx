// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Ear, Mic, BookOpen, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import { progressAPI } from '../services/api';

// Interface for progress data
interface UserProgress {
  earTraining: number;
  sightSinging: number;
  musicGeneration: number;
  lessons: number;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [userProgress, setUserProgress] = useState<UserProgress>({
    earTraining: 0,
    sightSinging: 0,
    musicGeneration: 0,
    lessons: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch user progress from API
  useEffect(() => {
    const fetchUserProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch progress from API
        const response = await progressAPI.getUserProgress();
        const progressData = response.data;

        // Map API data to our component state
        // The API might return an array of module progress objects
        const progress: UserProgress = {
          earTraining: 0,
          sightSinging: 0,
          musicGeneration: 0,
          lessons: 0,
        };

        // Process the data based on your API structure
        progressData.forEach((module: any) => {
          switch (module.moduleType) {
            case 'EarTraining':
              progress.earTraining = module.progress;
              break;
            case 'SightSinging':
              progress.sightSinging = module.progress;
              break;
            case 'MusicGeneration':
              progress.musicGeneration = module.progress;
              break;
            case 'Lessons':
              progress.lessons = module.progress;
              break;
          }
        });

        setUserProgress(progress);
      } catch (err) {
        console.error('Failed to fetch user progress', err);
        setError('Failed to load your progress. Please try again later.');

        // Use mock data as fallback
        setUserProgress({
          earTraining: 60,
          sightSinging: 40,
          musicGeneration: 80,
          lessons: 25,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
  }, []);

  return (
    <Layout backgroundClass="sound-wave-background">
      <motion.div
        className="container mx-auto py-8 px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Section */}
        <motion.section
          className="bg-white rounded-lg shadow-sm p-8 flex justify-between items-center"
          variants={itemVariants}
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Welcome to Music Pals!</h2>
            <p className="text-gray-600 mt-2 text-lg">
              Your interactive companion for learning and enjoying music.
            </p>
            <p className="text-gray-600 mt-1">
              Choose from our learning modules below to start your musical journey.
            </p>
          </div>
          <motion.div
            className="text-indigo-600"
            animate={{
              rotate: [0, 10, 0, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: 'easeInOut',
            }}
          >
            <Music size={64} />
          </motion.div>
        </motion.section>

        {/* Feature Cards */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ear Training Card */}
          <motion.div
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.1)' }}
            variants={itemVariants}
          >
            <div className="h-32 bg-indigo-50 flex items-center justify-center">
              <Ear size={48} className="text-indigo-600" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-indigo-600">Ear Training</h3>
              <p className="mt-2 text-gray-600 text-sm">
                Develop your ability to recognize notes, chords, and melodies by ear.
              </p>
              <p className="mt-1 text-gray-600 text-sm">
                Choose from different difficulty levels and improve your musical hearing.
              </p>
              <motion.button
                className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-full flex items-center text-sm font-medium"
                whileHover={{ backgroundColor: '#4338ca' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/ear-training')}
              >
                Start Training
                <ChevronRight size={16} className="ml-1" />
              </motion.button>
            </div>
          </motion.div>

          {/* Sight Singing Card */}
          <motion.div
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.1)' }}
            variants={itemVariants}
          >
            <div className="h-32 bg-amber-50 flex items-center justify-center">
              <Mic size={48} className="text-amber-600" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-amber-600">Sight Singing</h3>
              <p className="mt-2 text-gray-600 text-sm">
                Practice singing musical notation with real-time feedback on your accuracy.
              </p>
              <p className="mt-1 text-gray-600 text-sm">
                Record your voice and see how well you can match the notes.
              </p>
              <motion.button
                className="mt-4 bg-amber-600 text-white py-2 px-4 rounded-full flex items-center text-sm font-medium"
                whileHover={{ backgroundColor: '#b45309' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/sight-singing')}
              >
                Start Singing
                <ChevronRight size={16} className="ml-1" />
              </motion.button>
            </div>
          </motion.div>

          {/* Music Generation Card */}
          <motion.div
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.1)' }}
            variants={itemVariants}
          >
            <div className="h-32 bg-blue-50 flex items-center justify-center">
              <Music size={48} className="text-blue-600" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-blue-600">Music Generation</h3>
              <p className="mt-2 text-gray-600 text-sm">
                Create your own melodies or explore popular tunes through our interactive piano
                roll.
              </p>
              <p className="mt-1 text-gray-600 text-sm">
                Play, pause, and visualize music in real-time.
              </p>
              <motion.button
                className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-full flex items-center text-sm font-medium"
                whileHover={{ backgroundColor: '#1d4ed8' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/music-generation')}
              >
                Start Creating
                <ChevronRight size={16} className="ml-1" />
              </motion.button>
            </div>
          </motion.div>

          {/* Lessons Card */}
          <motion.div
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.1)' }}
            variants={itemVariants}
          >
            <div className="h-32 bg-green-50 flex items-center justify-center">
              <BookOpen size={48} className="text-green-600" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-green-600">Lessons</h3>
              <p className="mt-2 text-gray-600 text-sm">
                Learn music theory and practice with structured lessons covering notation, rhythm,
                and more.
              </p>
              <p className="mt-1 text-gray-600 text-sm">
                Progress through chapters at your own pace.
              </p>
              <motion.button
                className="mt-4 bg-green-600 text-white py-2 px-4 rounded-full flex items-center text-sm font-medium"
                whileHover={{ backgroundColor: '#15803d' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/lessons')}
              >
                Start Learning
                <ChevronRight size={16} className="ml-1" />
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Recent Progress Section */}
        <motion.section
          className="mt-8 mb-12 bg-white rounded-lg shadow-sm p-6"
          variants={itemVariants}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Recent Progress</h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-600 text-sm mb-4">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
              <div className="flex items-center">
                <span className="text-gray-600 w-32">Ear Training:</span>
                <div className="relative w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress.earTraining}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <span className="ml-3 text-gray-500 text-sm">{userProgress.earTraining}%</span>
              </div>

              <div className="flex items-center">
                <span className="text-gray-600 w-32">Music Generation:</span>
                <div className="relative w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress.musicGeneration}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                <span className="ml-3 text-gray-500 text-sm">{userProgress.musicGeneration}%</span>
              </div>

              <div className="flex items-center">
                <span className="text-gray-600 w-32">Sight Singing:</span>
                <div className="relative w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-amber-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress.sightSinging}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </div>
                <span className="ml-3 text-gray-500 text-sm">{userProgress.sightSinging}%</span>
              </div>

              <div className="flex items-center">
                <span className="text-gray-600 w-32">Lessons:</span>
                <div className="relative w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-green-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress.lessons}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <span className="ml-3 text-gray-500 text-sm">{userProgress.lessons}%</span>
              </div>
            </div>
          )}
        </motion.section>
      </motion.div>
    </Layout>
  );
};

export default HomePage;

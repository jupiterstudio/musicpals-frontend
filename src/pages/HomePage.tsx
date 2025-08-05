// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Ear, Mic, BookOpen, ChevronRight, Search, Star, Palette, Rocket, MicVocal } from 'lucide-react';
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

      <motion.div
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
        {/* Welcome Section */}
        <motion.section className="kid-welcome-section" variants={itemVariants}>
          <h1
            className="kid-title text-4xl md:text-5xl mb-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            Welcome to Your Musical Adventure!
          </h1>
          <div className="musical-icon">🎪</div>
          <p className="kid-subtitle text-xl" style={{ position: 'relative', zIndex: 2 }}>
            Ready to explore the magical world of music? Let's make some beautiful sounds together!
          </p>
        </motion.section>

        {/* Activity Cards */}
        <section className="kid-activities-grid">
          {/* Ear Training Card */}
          <motion.div
            className="kid-card ear-training"
            whileHover={{ y: -10, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={itemVariants}
            onClick={() => navigate('/ear-training')}
          >
            <span className="activity-icon">👂🎵</span>
            <h3 className="activity-title">Ear Training Fun!</h3>
            <p className="activity-description">
              Can you guess the mystery sounds? Train your super hearing powers and become a music
              detective!
            </p>
            <motion.button
              className="kid-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search size={20} className="mr-2" />
              Start Listening!
            </motion.button>
          </motion.div>

          {/* Sight Singing Card */}
          <motion.div
            className="kid-card sight-singing"
            whileHover={{ y: -10, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={itemVariants}
            onClick={() => navigate('/sight-singing')}
          >
            <span className="activity-icon">🎤✨</span>
            <h3 className="activity-title">Singing Star!</h3>
            <p className="activity-description">
              Sing along with the notes and watch them light up! Become the next big singing
              sensation!
            </p>
            <motion.button
              className="kid-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <MicVocal size={20} className="mr-2" />
              Let's Sing!
            </motion.button>
          </motion.div>

          {/* Music Generation Card */}
          <motion.div
            className="kid-card music-generation"
            whileHover={{ y: -10, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={itemVariants}
            onClick={() => navigate('/music-generation')}
          >
            <span className="activity-icon">🎹🎨</span>
            <h3 className="activity-title">Music Creator!</h3>
            <p className="activity-description">
              Paint with sounds! Create your own magical melodies and share them with friends!
            </p>
            <motion.button
              className="kid-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Palette size={20} className="mr-2" />
              Create Music!
            </motion.button>
          </motion.div>

          {/* Lessons Card */}
          <motion.div
            className="kid-card lessons"
            whileHover={{ y: -10, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={itemVariants}
            onClick={() => navigate('/lessons')}
          >
            <span className="activity-icon">📚🎵</span>
            <h3 className="activity-title">Musical Stories!</h3>
            <p className="activity-description">
              Join our musical adventures and learn amazing secrets about how music works!
            </p>
            <motion.button
              className="kid-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Rocket size={20} className="mr-2" />
              Start Adventure!
            </motion.button>
          </motion.div>
        </section>

        {/* Recent Progress Section */}
        <motion.section className="kid-welcome-section" variants={itemVariants}>
          <h2 className="kid-title text-3xl mb-6" style={{ position: 'relative', zIndex: 2 }}>
            Your Musical Journey! 🌈
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-t-2 border-b-2 border-pink-500 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-600 text-sm mb-4">{error}</div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              style={{ position: 'relative', zIndex: 2 }}
            >
              <div className="flex flex-col items-center gap-3">
                <span className="kid-subtitle text-lg font-bold">🎧 Ear Training</span>
                <div className="kid-progress-bar w-full">
                  <motion.div
                    className="kid-progress-fill progress-ear-training"
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress.earTraining}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <span className="kid-subtitle text-lg font-bold text-pink-500">
                  {userProgress.earTraining}% Complete! 🎉
                </span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <span className="kid-subtitle text-lg font-bold">🎤 Singing</span>
                <div className="kid-progress-bar w-full">
                  <motion.div
                    className="kid-progress-fill progress-sight-singing"
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress.sightSinging}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                <span className="kid-subtitle text-lg font-bold text-pink-500">
                  {userProgress.sightSinging}% Complete! 🌟
                </span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <span className="kid-subtitle text-lg font-bold">🎹 Creating</span>
                <div className="kid-progress-bar w-full">
                  <motion.div
                    className="kid-progress-fill progress-music-generation"
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress.musicGeneration}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </div>
                <span className="kid-subtitle text-lg font-bold text-pink-500">
                  {userProgress.musicGeneration}% Complete! 🚀
                </span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <span className="kid-subtitle text-lg font-bold">📖 Learning</span>
                <div className="kid-progress-bar w-full">
                  <motion.div
                    className="kid-progress-fill progress-lessons"
                    initial={{ width: 0 }}
                    animate={{ width: `${userProgress.lessons}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <span className="kid-subtitle text-lg font-bold text-pink-500">
                  {userProgress.lessons}% Complete! 💪
                </span>
              </div>
            </div>
          )}

          {/* Achievement badges */}
          <div
            className="flex justify-center gap-4 mt-8 flex-wrap"
            style={{ position: 'relative', zIndex: 2 }}
          >
            <div className="badge badge-gold">🏆</div>
            <div className="badge badge-silver">🥈</div>
            <div className="badge badge-bronze">🥉</div>
            <div className="badge badge-gold">🎨</div>
          </div>
        </motion.section>
      </motion.div>
    </Layout>
  );
};

export default HomePage;

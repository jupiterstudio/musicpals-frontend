// src/pages/LoginPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AtSign, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../assets/small-logo-no-bg.png';
// Make sure to export the interface from auth.ts or create it here
// Importing from AuthContext would also work if you export it there

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { login, register, loading, error } = useAuth();
  const navigate = useNavigate();

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // Handle login
        await login(email, password);
        // Navigate to home page on successful login
        navigate('/');
      } else {
        // Handle registration
        const registrationResponse = await register(username, email, password);

        // Check if we received a response with user data
        if (registrationResponse && registrationResponse.email) {
          // Set registration success message
          setRegistrationSuccess(true);
          // Reset form fields
          setEmail(registrationResponse.email); // Pre-fill email for convenience
          setPassword('');
          setUsername('');
          // Switch to login form after successful registration
          setIsLogin(true);
        }
      }
    } catch (err) {
      // Error is already handled in the auth context
      console.error('Authentication error:', err);
      setRegistrationSuccess(false);
    }
  };

  // Toggle between login and register forms
  const toggleForm = () => {
    setIsLogin(!isLogin);
    // Reset form fields and success message
    setEmail('');
    setPassword('');
    setUsername('');
    setRegistrationSuccess(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-start">
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
        className="max-w-md w-full relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center mb-8 mt-4" variants={itemVariants}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bouncing-logo">
            <span className="text-6xl">🎵</span>
          </div>

          <h2
            className="text-4xl mb-4 text-white"
            style={{
              fontFamily: 'Fredoka One, cursive',
              fontWeight: '400',
            }}
          >
            Music Pals
          </h2>
          <p
            className="text-xl text-white font-semibold"
            style={{
              fontFamily: 'Nunito, sans-serif',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {isLogin ? 'Welcome back, Musical Star! 🌟' : 'Join our Musical Adventure! 🎪'}
          </p>
        </motion.div>

        <motion.div className="kid-welcome-section" variants={itemVariants}>
          <h3
            className="text-2xl mb-6"
            style={{
              position: 'relative',
              zIndex: 2,
              fontFamily: 'Fredoka One, cursive',
              color: '#FF6B9D',
              textShadow: '3px 3px 0px #FFE66D',
            }}
          >
            {isLogin ? "Let's Play Music! 🎵" : 'Become a Music Pal! 🎪'}
          </h3>

          {error && (
            <div
              className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 border-2 border-red-200"
              style={{ position: 'relative', zIndex: 2 }}
            >
              <span className="text-2xl mr-2">😞</span>
              {error}
            </div>
          )}

          {registrationSuccess && (
            <div
              className="bg-green-50 text-green-600 p-4 rounded-2xl mb-6 border-2 border-green-200"
              style={{ position: 'relative', zIndex: 2 }}
            >
              <span className="text-2xl mr-2">🎉</span>
              Welcome to Music Pals! Your email is ready. Just enter your password to start playing!
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 2 }}>
            {!isLogin && (
              <div className="mb-6">
                <label
                  className="block text-base font-bold mb-3"
                  htmlFor="username"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    color: '#666',
                  }}
                >
                  🎭 What should we call you?
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-xl">👤</span>
                  </div>
                  <input
                    id="username"
                    type="text"
                    className="pl-12 w-full py-4 px-6 border-4 border-pink-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-300 focus:border-pink-400 text-lg font-semibold bg-white"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                    placeholder="Your awesome name!"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label
                className="block text-base font-bold mb-3"
                htmlFor="email"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  color: '#666',
                }}
              >
                📧 Your magical email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl">✉️</span>
                </div>
                <input
                  id="email"
                  type="email"
                  className="pl-12 w-full py-4 px-6 border-4 border-pink-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-300 focus:border-pink-400 text-lg font-semibold bg-white"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-8">
              <label
                className="block text-base font-bold mb-3"
                htmlFor="password"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  color: '#666',
                }}
              >
                🔐 Your secret musical password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl">🔑</span>
                </div>
                <input
                  id="password"
                  type="password"
                  className="pl-12 w-full py-4 px-6 border-4 border-pink-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-300 focus:border-pink-400 text-lg font-semibold bg-white"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  placeholder="Super secret password!"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              className="kid-button w-full text-xl py-4 px-6 flex items-center justify-center"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? (
                <div className="w-6 h-6 border-t-2 border-r-2 border-white rounded-full animate-spin mr-3"></div>
              ) : isLogin ? (
                <span className="text-2xl mr-3">🎵</span>
              ) : (
                <span className="text-2xl mr-3">🎪</span>
              )}
              {isLogin ? "Let's Play Music! 🚀" : 'Join the Fun! 🌟'}
            </motion.button>
          </form>

          <div className="mt-8 text-center" style={{ position: 'relative', zIndex: 2 }}>
            <motion.button
              onClick={toggleForm}
              className="text-lg font-bold text-pink-500 hover:text-pink-600 focus:outline-none"
              style={{ fontFamily: 'Nunito, sans-serif' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLogin
                ? '🎪 New here? Join our Musical Adventure!'
                : "🎵 Already a Music Pal? Let's Play!"}
            </motion.button>
          </div>
        </motion.div>

        <motion.div className="text-center mt-8" variants={itemVariants}>
          <p
            className="text-lg font-semibold"
            style={{
              fontFamily: 'Nunito, sans-serif',
              color: '#666',
            }}
          >
            © 2025 Music Pals. Making music magical! 🎵✨
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center px-4 text-start">
      <motion.div
        className="max-w-md w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full text-white mb-4">
            <img src={Logo} alt="Music Pals" className="h-15 w-auto" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800">Music Pals</h2>
          <p className="text-gray-600 mt-2">
            {isLogin
              ? 'Sign in to continue your musical journey'
              : 'Create an account to get started'}
          </p>
        </motion.div>

        <motion.div className="bg-white rounded-xl shadow-lg p-8" variants={itemVariants}>
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h3>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>}

          {registrationSuccess && (
            <div className="bg-green-50 text-green-600 p-4 rounded-md mb-6">
              Registration successful! Your email has been pre-filled. Please enter your password to
              sign in.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition duration-300"
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
              ) : isLogin ? (
                <LogIn size={18} className="mr-2" />
              ) : (
                <UserPlus size={18} className="mr-2" />
              )}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleForm}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium focus:outline-none"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>

        <motion.div className="text-center mt-8 text-sm text-gray-500" variants={itemVariants}>
          <p>© 2025 Music Pals. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

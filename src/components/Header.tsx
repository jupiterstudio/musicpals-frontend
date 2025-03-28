// src/components/Header.tsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Menu, X, Music, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu after navigation
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Ear Training', path: '/ear-training' },
    { name: 'Sight Singing', path: '/sight-singing' },
    { name: 'Music Generation', path: '/music-generation' },
    { name: 'Lessons', path: '/lessons' },
  ];

  // Check if a link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center text-indigo-600">
            <Music size={28} className="mr-2" />
            <span className="font-bold text-xl">Music Pals</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`py-2 transition-colors ${
                  isActive(item.path)
                    ? 'text-indigo-600 font-medium'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="relative ml-4 hidden md:block">
              <Link
                to="/profile"
                className="flex items-center bg-indigo-50 hover:bg-indigo-100 py-2 px-3 rounded-full transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full text-white mr-2">
                  <User size={16} />
                </div>
                <span className="text-gray-700 font-medium">{user?.username || 'User'}</span>
              </Link>
            </div>

            {/* Logout Button (Desktop) */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center text-gray-600 hover:text-red-600 ml-6"
            >
              <LogOut size={18} className="mr-1" />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              className="ml-4 md:hidden text-gray-600 hover:text-indigo-600 focus:outline-none"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden mt-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <nav className="flex flex-col py-2">
                  {navItems.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-6 py-3 ${
                        isActive(item.path)
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={closeMenu}
                    >
                      {item.name}
                    </Link>
                  ))}

                  <Link
                    to="/profile"
                    className={`px-6 py-3 flex items-center ${
                      isActive('/profile')
                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={closeMenu}
                  >
                    <User size={18} className="mr-2" />
                    Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 text-left text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut size={18} className="mr-2" />
                    Logout
                  </button>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;

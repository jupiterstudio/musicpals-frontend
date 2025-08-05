// src/components/Header.tsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
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
    <header
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 0',
        boxShadow: '0 4px 20px rgba(255, 107, 157, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '4px solid #FF6B9D',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '0 auto',
          width: '100%',
          padding: '0 2rem',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            textDecoration: 'none',
          }}
        >
          <span className="bouncing-logo" style={{ fontSize: '3rem' }}>
            🎵
          </span>
          <span className="logo-text">Music Pals</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '25px',
                transition: 'all 0.3s ease',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                textDecoration: 'none',
                background: isActive(item.path)
                  ? 'linear-gradient(45deg, #FF6B9D, #FFE66D)'
                  : 'transparent',
                color: isActive(item.path) ? 'white' : '#666',
                boxShadow: isActive(item.path) ? '0 4px 15px rgba(255, 107, 157, 0.4)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive(item.path)) {
                  const target = e.target as HTMLElement;
                  target.style.background = 'rgba(255, 107, 157, 0.1)';
                  target.style.color = '#FF6B9D';
                }
              }}
              onMouseLeave={e => {
                if (!isActive(item.path)) {
                  const target = e.target as HTMLElement;
                  target.style.background = 'transparent';
                  target.style.color = '#666';
                }
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: isActive('/profile')
                ? 'linear-gradient(45deg, #9B59B6, #3498DB)'
                : 'linear-gradient(45deg, #FF6B9D, #FFE66D)',
              padding: '0.5rem 1.5rem',
              borderRadius: '50px',
              color: 'white',
              fontWeight: 700,
              boxShadow: isActive('/profile')
                ? '0 4px 15px rgba(155, 89, 182, 0.4)'
                : '0 4px 15px rgba(255, 107, 157, 0.4)',
              fontFamily: 'Nunito, sans-serif',
              textDecoration: 'none',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              const target = e.target as HTMLElement;
              target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              const target = e.target as HTMLElement;
              target.style.transform = 'scale(1)';
            }}
          >
            <span>🌟</span>
            <span className="hidden sm:inline">Hey there, {user?.username || 'Musical Star'}!</span>
            <span>🎭</span>
          </Link>

          <button
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(45deg, #FF6B9D, #FFE66D)',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '25px',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 107, 157, 0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              const target = e.target as HTMLElement;
              target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              const target = e.target as HTMLElement;
              target.style.transform = 'scale(1)';
            }}
          >
            Logout
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={toggleMenu}
            style={{
              background: 'none',
              border: 'none',
              color: '#FF6B9D',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(255, 107, 157, 0.3)',
                overflow: 'hidden',
                border: '4px solid #FF6B9D',
              }}
            >
              <nav style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem' }}>
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    style={{
                      padding: '1rem 1.5rem',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 600,
                      textDecoration: 'none',
                      borderRadius: '15px',
                      margin: '0.25rem 0',
                      background: isActive(item.path)
                        ? 'linear-gradient(45deg, #FF6B9D, #FFE66D)'
                        : 'transparent',
                      color: isActive(item.path) ? 'white' : '#666',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

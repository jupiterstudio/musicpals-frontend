import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Ear, Mic, Music, BookOpen, User, LogOut } from 'lucide-react';
import Banner from '../assets/banner.svg';
import Logo from '../assets/small-logo.png';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('/');

  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={16} className="mr-2" /> },
    { path: '/ear-training', label: 'Ear Training', icon: <Ear size={16} className="mr-2" /> },
    { path: '/sight-singing', label: 'Sight Singing', icon: <Mic size={16} className="mr-2" /> },
    {
      path: '/music-generation',
      label: 'Music Generation',
      icon: <Music size={16} className="mr-2" />,
    },
    { path: '/lessons', label: 'Lessons', icon: <BookOpen size={16} className="mr-2" /> },
  ];

  return (
    <header>
      <div className=" text-white sound-wave-background">
        <div className="container mx-auto flex justify-center py-3 px-6">
          <img src={Banner} alt="Music Pals" className="h-50" />
        </div>
      </div>
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={Logo} alt="Music Pals" className="h-15 w-auto" />
            </div>
            <div className="container mx-auto flex">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-4 flex items-center ${
                    activeTab === item.path
                      ? 'bg-indigo-50 border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              <div className="ml-auto flex">
                <Link
                  to="/profile"
                  className={`px-8 py-4 flex items-center ${
                    activeTab === '/profile'
                      ? 'bg-indigo-50 border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User size={16} className="mr-2" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-8 py-4 flex items-center text-gray-600 hover:bg-gray-50"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto flex">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-8 py-4 flex items-center ${
                activeTab === item.path
                  ? 'bg-indigo-50 border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div className="ml-auto flex">
            <Link
              to="/profile"
              className={`px-8 py-4 flex items-center ${
                activeTab === '/profile'
                  ? 'bg-indigo-50 border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User size={16} className="mr-2" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-8 py-4 flex items-center text-gray-600 hover:bg-gray-50"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </nav> */}
    </header>
  );
};

export default Navigation;

// Layout.tsx
import { ReactNode } from 'react';
import Header from './Header';
import Logo from '../assets/logo.png';

interface LayoutProps {
  children: ReactNode;
  backgroundClass?: string; // New prop
}

const Layout = ({ children, backgroundClass = 'bg-gradient-to-br from-yellow-200 via-pink-300 to-teal-300' }: LayoutProps) => {
  return (
    <div className={`min-h-screen flex flex-col ${backgroundClass}`} style={{ 
      background: backgroundClass === '' ? 'linear-gradient(135deg, #FFE66D 0%, #FF6B9D 50%, #4ECDC4 100%)' : undefined 
    }}>
      <Header />
      <main className="flex-grow relative">{children}</main>
      <footer className="bg-white bg-opacity-95 backdrop-blur-lg border-t-4 border-pink-400 py-6 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <img src={Logo} alt="Music Pals" className="h-20 w-auto mr-3" />
              <p className="text-base font-semibold" style={{ 
                fontFamily: 'Nunito, sans-serif',
                color: '#666'
              }}>
                © {new Date().getFullYear()} Music Pals. Making music magical! 🎵
              </p>
            </div>

            <div>
              <ul className="flex space-x-6 text-base">
                <li>
                  <a href="/privacy" className="font-semibold hover:text-pink-500 transition-colors" style={{ 
                    fontFamily: 'Nunito, sans-serif',
                    color: '#666'
                  }}>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="font-semibold hover:text-pink-500 transition-colors" style={{ 
                    fontFamily: 'Nunito, sans-serif',
                    color: '#666'
                  }}>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/contact" className="font-semibold hover:text-pink-500 transition-colors" style={{ 
                    fontFamily: 'Nunito, sans-serif',
                    color: '#666'
                  }}>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

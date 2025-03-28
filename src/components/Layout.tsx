// Layout.tsx
import { ReactNode } from 'react';
import Navigation from './Navigation';
import Logo from '../assets/logo.png';

interface LayoutProps {
  children: ReactNode;
  backgroundClass?: string; // New prop
}

const Layout = ({ children, backgroundClass = 'bg-gray-50' }: LayoutProps) => {
  return (
    <div className={`min-h-screen flex flex-col ${backgroundClass}`}>
      <Navigation />
      <main className="flex-grow">{children}</main>
      <footer className="bg-white border-t border-gray-200 py-6 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <img src={Logo} alt="Music Pals" className="h-20 w-auto mr-3" />
              <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} Music Pals. All rights reserved.
              </p>
            </div>

            <div>
              <ul className="flex space-x-6 text-sm">
                <li>
                  <a href="/privacy" className="text-gray-600 hover:text-indigo-600">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-gray-600 hover:text-indigo-600">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-gray-600 hover:text-indigo-600">
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

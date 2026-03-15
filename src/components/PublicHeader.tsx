import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type PublicHeaderProps = {
  active: 'home' | 'features' | 'pricing' | 'about';
};

const linkClass = (isActive: boolean) =>
  `relative text-sm font-semibold transition-all duration-300 ${
    isActive
      ? 'text-blue-600'
      : 'text-slate-600 hover:text-blue-600'
  }`;

const PublicHeader: React.FC<PublicHeaderProps> = ({ active }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', id: 'home' },
    { name: 'Features', path: '/features', id: 'features' },
    { name: 'Pricing', path: '/pricing', id: 'pricing' },
    { name: 'About', path: '/about', id: 'about' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'py-3 px-4' 
          : 'py-6 px-6'
      }`}
    >
      <nav 
        className={`max-w-7xl mx-auto transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-blue-900/5 rounded-2xl px-6 py-3' 
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <BookOpen className="text-white w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-display font-black tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
              ExamBank
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.id} 
                to={link.path} 
                className={linkClass(active === link.id as any)}
              >
                {link.name}
                {active === link.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-slate-600 font-bold hover:text-blue-600 px-4 py-2 transition-colors duration-300"
            >
              Log in
            </Link>
            <Link 
              to="/register" 
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 hover:scale-105 shadow-lg shadow-slate-900/10 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-6 right-6 p-6 glass rounded-3xl md:hidden z-40 shadow-2xl"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.id}
                  to={link.path} 
                  className={`text-lg font-bold ${active === link.id ? 'text-blue-600' : 'text-slate-600'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-slate-100" />
              <div className="flex flex-col gap-3">
                <Link 
                  to="/login" 
                  className="w-full py-3 text-center font-bold text-slate-600 border border-slate-200 rounded-xl"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  className="w-full py-3 text-center font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicHeader;

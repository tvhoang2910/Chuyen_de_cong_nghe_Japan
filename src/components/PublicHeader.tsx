import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

type PublicHeaderProps = {
  active: 'home' | 'features' | 'pricing' | 'about';
};

const linkClass = (isActive: boolean) =>
  isActive
    ? 'text-blue-600'
    : 'text-slate-600 hover:text-blue-600 transition-colors';

const PublicHeader: React.FC<PublicHeaderProps> = ({ active }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <BookOpen className="text-white w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
            ExamBank
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
          <Link to="/" className={linkClass(active === 'home')}>Home</Link>
          <Link to="/features" className={linkClass(active === 'features')}>Features</Link>
          <Link to="/pricing" className={linkClass(active === 'pricing')}>Pricing</Link>
          <Link to="/about" className={linkClass(active === 'about')}>About</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-slate-600 font-semibold hover:text-blue-600 px-4 py-2 transition-colors">
            Log in
          </Link>
          <Link to="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
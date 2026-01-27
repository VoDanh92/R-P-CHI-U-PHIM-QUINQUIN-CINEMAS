
import React, { useState, useEffect } from 'react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, activePage }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 md:px-12 ${
      scrolled ? 'bg-black/80 backdrop-blur-2xl border-b border-white/5 py-3' : 'bg-transparent'
    }`}>
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onNavigate('home')}
        >
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl italic text-white shadow-xl shadow-red-600/30 group-hover:scale-110 transition-transform">Q</div>
          <span className="text-xl font-black tracking-tighter uppercase italic hidden md:block">
            QUINQUIN <span className="text-red-600 underline decoration-4 underline-offset-8">CINEMAS</span>
          </span>
        </div>

        <div className="flex items-center gap-10">
          <div className="hidden lg:flex items-center gap-12">
            {[
              { id: 'home', label: 'Trang Chủ' },
              { id: 'movies', label: 'Lịch Chiếu' },
              { id: 'admin', label: 'Quản Trị' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-[10px] font-black uppercase tracking-[0.25em] italic transition-all relative group ${
                  activePage === item.id ? 'text-red-500' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {item.label}
                <span className={`absolute -bottom-2 left-0 h-0.5 bg-red-600 transition-all duration-300 ${activePage === item.id ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>
            ))}
          </div>

          <button 
            onClick={() => onNavigate('login')}
            className="w-11 h-11 bg-zinc-900/50 hover:bg-red-600 rounded-2xl border border-white/10 flex items-center justify-center transition-all group shadow-xl active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

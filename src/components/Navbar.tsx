import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="border-b border-slate-800 bg-[var(--color-bg-dark)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary rotate-12 flex items-center justify-center transition-transform group-hover:rotate-0">
            <span className="text-xl font-black text-slate-900 leading-none">H</span>
          </div>
          <span className="text-xl font-bold tracking-tighter neon-text">HAZBIN <span className="text-slate-400 font-light">RP</span></span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {profile?.role === 'Admin' && (
                <Link to="/admin" className="text-xs font-bold text-magenta-400 hover:text-magenta-300 transition-colors uppercase tracking-widest flex items-center gap-1">
                  <ShieldAlert size={14} />
                  Admin
                </Link>
              )}
              <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors">
                <UserIcon size={14} className="text-cyan-400" />
                <span className="text-xs font-medium text-slate-300">{profile?.displayName || user.email?.split('@')[0]}</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-all"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="neon-button text-xs py-1.5">
              INICIAR SESIÓN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

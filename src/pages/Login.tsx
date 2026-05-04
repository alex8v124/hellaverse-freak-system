import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('Credenciales inválidas. Contacta al administrador si tienes problemas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="card-gradient rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,229,255,0.1)]">
              <Sparkles className="text-primary" size={32} />
            </div>
            <h1 className="text-3xl font-black neon-text tracking-tighter">IDENTIFÍCATE</h1>
            <p className="text-slate-400 text-sm mt-2 text-center">Inicia sesión con las credenciales proporcionadas por el administrador.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  required
                  type="email"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-200"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  required
                  type="password"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="neon-button w-full py-4 uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'AUTENTICANDO...' : 'ENTRAR AL REINO'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500 italic">
            ¿No tienes cuenta? Solicita una en el grupo oficial de WhatsApp.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

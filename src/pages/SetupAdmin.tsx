import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

export const SetupAdmin: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: user.displayName || 'Master Admin',
        role: 'Admin'
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      alert('Error: Probablemente las reglas aún no permiten la escritura o ya existe el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center">
      <div className="card-gradient p-8 rounded-3xl border-primary/30">
        <ShieldAlert size={48} className="text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-black neon-text mb-4">INICIALIZACIÓN ADMIN</h1>
        
        {!user ? (
          <p className="text-red-400 text-sm">Debes iniciar sesión con el correo master@cronicasdelrol.com primero.</p>
        ) : profile?.role === 'Admin' ? (
          <div className="space-y-4">
            <p className="text-green-400 flex items-center justify-center gap-2">
              <CheckCircle size={18} /> Ya eres Administrador.
            </p>
            <button onClick={() => navigate('/admin')} className="neon-button w-full">Ir al Panel</button>
          </div>
        ) : done ? (
          <div className="space-y-4">
            <p className="text-green-400">¡Perfil creado exitosamente!</p>
            <button onClick={() => window.location.reload()} className="neon-button w-full">Refrescar Aplicación</button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-slate-400 text-sm">
              Al presionar el botón, se creará tu perfil con rango <span className="text-white font-bold">Admin</span> para el usuario actual: <br/>
              <span className="text-primary">{user.email}</span>
            </p>
            <button 
              onClick={handleSetup} 
              disabled={loading}
              className="neon-button w-full flex items-center justify-center gap-2"
            >
              <Sparkles size={18} /> {loading ? 'PROCESANDO...' : 'RECLAMAR RANGO ADMIN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

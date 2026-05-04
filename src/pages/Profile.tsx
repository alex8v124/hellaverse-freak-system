import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { updateDoc, doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Character } from '../types';
import { User, Save, UserCircle, Shield, Sparkles, Key, Eye, EyeOff } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myCharacters, setMyCharacters] = React.useState<Character[]>([]);

  React.useEffect(() => {
    if (user) {
      const q = query(collection(db, 'characters'), where('ownerId', '==', user.uid));
      const unsub = onSnapshot(q, (snap) => {
        setMyCharacters(snap.docs.map(d => ({ id: d.id, ...d.data() } as Character)));
      });
      return unsub;
    }
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const handleUpdate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update display name in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName
      });

      // Update password if provided
      if (newPassword.trim()) {
        if (newPassword.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres.');
          setSaving(false);
          return;
        }
        await updatePassword(user, newPassword);
        alert('Contraseña actualizada correctamente.');
        setNewPassword('');
      }

      setEditing(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        alert('Para cambiar la contraseña por seguridad debes haber iniciado sesión recientemente. Por favor, cierra sesión y vuelve a entrar.');
      } else {
        alert('Error al actualizar el perfil: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="card-gradient rounded-3xl p-8 border-primary/20 text-center">
            <div className="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4 border-2 border-primary/30">
              <User size={48} className="text-primary/60" />
            </div>
            {editing ? (
              <div className="space-y-4">
                <div className="text-left space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Nombre Público</label>
                  <input
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:border-primary outline-none transition-all"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Tu nombre público"
                  />
                </div>

                <div className="text-left space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Nueva Contraseña (Opcional)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 px-3 pr-10 text-sm focus:border-primary outline-none transition-all"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-600 pl-1 italic">Mínimo 6 caracteres. Deja vacío si no deseas cambiarla.</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={handleUpdate} disabled={saving} className="flex-1 neon-button flex items-center justify-center gap-1 text-xs">
                    <Save size={14} /> {saving ? 'Gua...' : 'GUARDAR'}
                  </button>
                  <button onClick={() => { setEditing(false); setNewPassword(''); }} className="flex-1 p-2 bg-slate-800 rounded-xl text-[10px] font-bold uppercase text-slate-400 hover:text-white transition-colors border border-slate-700/50">
                    CANCELAR
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-white mb-1">{profile?.displayName || 'Usuario'}</h2>
                <p className="text-xs text-slate-500 font-mono mb-4">{user.email}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
                  {profile?.role === 'Admin' ? <Shield size={12} className="text-magenta-400" /> : <UserCircle size={12} />}
                  {profile?.role || 'User'}
                </div>
                <button onClick={() => setEditing(true)} className="w-full neon-button border-slate-700 bg-transparent text-slate-400 hover:text-white py-2 text-xs">
                  EDITAR PERFIL
                </button>
              </>
            )}
          </div>
        </div>

        {/* Characters */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles size={20} className="text-primary" />
            </div>
            <h2 className="text-2xl font-black neon-text italic">MIS PERSONAJES</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myCharacters.map(char => (
              <div key={char.id} className="card-gradient rounded-2xl p-6 border-slate-800 flex flex-col items-center text-center">
                <img 
                  src={char.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${char.name}`} 
                  className="w-20 h-20 rounded-full border-2 border-primary/20 mb-4 object-cover" 
                  alt=""
                  referrerPolicy="no-referrer"
                />
                <h3 className="text-lg font-bold text-white mb-1">{char.name}</h3>
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 mb-4">
                  {char.class} • {char.rank}
                </div>
                <p className="text-xs text-slate-500 italic line-clamp-3">{char.description}</p>
              </div>
            ))}
            {myCharacters.length === 0 && (
              <div className="col-span-full py-20 text-center card-gradient rounded-3xl border-slate-800/50">
                <p className="text-slate-600 italic">No tienes personajes asignados aún.</p>
                <p className="text-xs text-slate-700 mt-2">Envía una solicitud para comenzar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

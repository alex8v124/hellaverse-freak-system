import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Character, CharacterClass } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, Send, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export const CharacterRequest: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isNewCharacter = id === 'new';

  const [character, setCharacter] = useState<Character | null>(
    location.state?.character || (isNewCharacter ? { id: 'new', name: 'Nuevo Personaje', status: 'Libre' } as Character : null)
  );
  const [loading, setLoading] = useState(!character && !isNewCharacter);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    proposedName: '',
    proposedDescription: '',
    proposedAvatar: '',
    roleTest: ''
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 storage
        setError('La imagen es demasiado grande (máximo 1MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
        setFormData(prev => ({ ...prev, proposedAvatar: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!character && id && !isNewCharacter) {
      const fetchCharacter = async () => {
        try {
          const docRef = doc(db, 'characters', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCharacter({ id: docSnap.id, ...docSnap.data() } as Character);
          } else {
            setError('Personaje no encontrado');
          }
        } catch (err) {
          setError('Error al cargar el personaje');
        } finally {
          setLoading(false);
        }
      };
      fetchCharacter();
    }
  }, [id, character, isNewCharacter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!character && !isNewCharacter) return;

    if (formData.roleTest.split('\n').filter(line => line.trim().length > 0).length < 20) {
      setError('La prueba de rol debe tener al menos 20 líneas con contenido.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'requests'), {
        characterId: isNewCharacter ? 'new' : character?.id,
        characterName: isNewCharacter ? formData.proposedName : character?.name,
        characterDescription: isNewCharacter ? formData.proposedDescription : (character?.description || ''),
        characterAvatar: isNewCharacter ? formData.proposedAvatar : (character?.avatar || ''),
        applicantName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Invitado',
        roleTest: formData.roleTest,
        status: 'Pending',
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || null
      });
      setSuccess(true);
    } catch (err) {
      setError('Error al enviar la solicitud. Por favor intenta de nuevo.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle2 size={80} className="text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold neon-text mb-4">¡Solicitud Enviada!</h2>
          <p className="text-slate-400 mb-8">
            Tu solicitud para {isNewCharacter ? 'crear a' : 'interpretar a'} <span className="text-white font-bold">{isNewCharacter ? formData.proposedName : character?.name}</span> ha sido registrada.
            Los administradores revisarán tu prueba de rol pronto.
          </p>
          <button onClick={() => navigate('/')} className="neon-button">
            Volver al Inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
        Volver al Directorio
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="card-gradient rounded-2xl p-6 sticky top-24">
            <div className={`w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary/30 mb-4 shadow-[0_0_20px_rgba(0,229,255,0.2)] ${isNewCharacter && !avatarPreview ? 'bg-slate-800 flex items-center justify-center' : ''}`}>
              {isNewCharacter && !avatarPreview ? (
                <Sparkles size={48} className="text-primary/40" />
              ) : (
                <img 
                  src={isNewCharacter ? avatarPreview! : (character?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${character?.name}`)} 
                  alt={character?.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <h2 className="text-2xl font-bold neon-text text-center mb-2">
              {isNewCharacter ? (formData.proposedName || 'Nuevo OC') : character?.name}
            </h2>
            <div className={`text-center text-xs font-bold uppercase tracking-wider mb-6 ${isNewCharacter ? 'text-magenta-400' : character?.status === 'Libre' ? 'text-green-400' : 'text-amber-400'}`}>
              {isNewCharacter ? 'Propuesta de Personaje' : `Estado: ${character?.status}`}
            </div>
            
            {!isNewCharacter && (
              <div className="space-y-4 text-sm text-slate-400">
                <p>{character?.description}</p>
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between mb-1">
                    <span>Clase:</span>
                    <span className="text-slate-200">{character?.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rango:</span>
                    <span className="text-slate-200">{character?.rank}</span>
                  </div>
                </div>
              </div>
            )}
            
            {isNewCharacter && (
              <p className="text-xs text-slate-500 italic text-center">
                Estás proponiendo un personaje original para el lore del grupo.
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="card-gradient rounded-2xl p-8">
            <h1 className="text-3xl font-black mb-6 tracking-tight">
              {isNewCharacter ? 'NUEVO ' : 'SOLICITUD DE '} 
              <span className="text-primary italic">PERSONAJE</span>
            </h1>
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isNewCharacter && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Imagen del Personaje</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-200 text-xs"
                          placeholder="URL de la imagen..."
                          value={formData.proposedAvatar}
                          onChange={(e) => {
                            setFormData({...formData, proposedAvatar: e.target.value});
                            setAvatarPreview(e.target.value);
                          }}
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="avatar-upload"
                          onChange={handleFileChange}
                        />
                        <label 
                          htmlFor="avatar-upload"
                          className="w-full h-full flex items-center justify-center bg-slate-800 border border-slate-700 border-dashed rounded-xl cursor-pointer hover:bg-slate-700 transition-colors text-xs font-bold text-slate-400 py-3"
                        >
                          SUBIR DESDE PC
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Nombre del Personaje</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-200"
                      placeholder="Ej: Alastor"
                      value={formData.proposedName}
                      onChange={(e) => setFormData({...formData, proposedName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Descripción Breve</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-200 text-sm"
                      placeholder="Resume la historia o concepto del personaje..."
                      value={formData.proposedDescription}
                      onChange={(e) => setFormData({...formData, proposedDescription: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-end pl-1 pr-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prueba de Rol</label>
                  <span className={`text-[10px] font-bold ${formData.roleTest.split('\n').filter(l => l.trim()).length >= 20 ? 'text-green-400' : 'text-amber-400'}`}>
                    Líneas: {formData.roleTest.split('\n').filter(l => l.trim()).length} / 20
                  </span>
                </div>
                <textarea
                  required
                  rows={isNewCharacter ? 10 : 15}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-4 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-200 font-mono text-xs leading-relaxed"
                  placeholder="Escribe tu test de rol aquí. Mínimo 20 líneas de narrativa descriptiva..."
                  value={formData.roleTest}
                  onChange={(e) => setFormData({...formData, roleTest: e.target.value})}
                />
              </div>

              <button
                disabled={submitting}
                type="submit"
                className="neon-button w-full py-4 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'ENVIANDO...' : (
                  <>
                    ENVIAR SOLICITUD
                    <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

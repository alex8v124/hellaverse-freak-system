import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Character, CharacterClass, CharacterStatus, RoleRequest, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Plus, Trash2, Edit, Save, X, Check, Clock, Users as UsersIcon, UserPlus, Link as LinkIcon } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'characters' | 'requests' | 'users'>('characters');

  // Search & Filter State
  const [charSearch, setCharSearch] = useState('');
  const [charClassFilter, setCharClassFilter] = useState<string>('All');
  const [charStatusFilter, setCharStatusFilter] = useState<string>('All');
  
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('All');

  // Confirmation state for deletions
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // New character form
  const [newChar, setNewChar] = useState({
    name: '',
    description: '',
    avatar: '',
    class: 'Demon' as CharacterClass,
    rank: '',
    status: 'Libre' as CharacterStatus
  });

  // User management form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'User' as any
  });

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser(prev => ({ ...prev, password: pass }));
  };

  useEffect(() => {
    const unsubChars = onSnapshot(collection(db, 'characters'), (snap) => {
      setCharacters(snap.docs.map(d => ({ id: d.id, ...d.data() } as Character)));
    });
    const unsubReqs = onSnapshot(collection(db, 'requests'), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as RoleRequest)));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });
    return () => { unsubChars(); unsubReqs(); unsubUsers(); };
  }, []);

  if (profile?.role !== 'Admin') return <Navigate to="/" />;

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'characters'), newChar);
      setNewChar({ name: '', description: '', avatar: '', class: 'Demon', rank: '', status: 'Libre' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'characters');
    }
  };

  const handleUpdateStatus = async (id: string, status: CharacterStatus) => {
    console.log('Intentando actualizar estado de', id, 'a', status);
    try {
      await updateDoc(doc(db, 'characters', id), { status });
      console.log('Estado actualizado exitosamente');
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      alert('Error de permisos: Solo administradores pueden cambiar estados.');
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'characters', id));
      setCharacters(prev => prev.filter(c => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Error al eliminar personaje:', err);
      alert('Error de permisos: No se pudo eliminar el personaje. Verifica tu rango.');
    }
  };

  const [creatingUser, setCreatingUser] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando creación de usuario:', newUser.email);
    
    if (!newUser.email || !newUser.password) {
      alert('Se requiere Correo y Contraseña');
      return;
    }
    
    setCreatingUser(true);

    try {
      console.log('Importando módulos de Firebase...');
      const { initializeApp, deleteApp, getApps } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { firebaseConfig } = await import('../lib/firebase');

      console.log('Limpiando aplicaciones secundarias previas...');
      const apps = getApps();
      const existingSecondary = apps.find(a => a.name === "secondary");
      if (existingSecondary) {
        await deleteApp(existingSecondary);
      }

      console.log('Inicializando app secundaria...');
      const secondaryApp = initializeApp(firebaseConfig, "secondary");
      const secondaryAuth = getAuth(secondaryApp);

      try {
        console.log('Llamando a createUserWithEmailAndPassword...');
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth, 
          newUser.email, 
          newUser.password
        );
        const newUid = userCredential.user.uid;
        console.log('Usuario creado en Auth con UID:', newUid);

        console.log('Creando perfil en Firestore...');
        await setDoc(doc(db, 'users', newUid), {
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role,
          createdAt: new Date()
        });

        console.log('Finalizando sesión secundaria...');
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);

        alert(`¡USUARIO CREADO!\n\nEmail: ${newUser.email}\nContraseña: ${newUser.password}`);
        setNewUser({ email: '', password: '', displayName: '', role: 'User' });
      } catch (authErr: any) {
        console.error('Error en Auth de usuario secundario:', authErr);
        if (secondaryApp) await deleteApp(secondaryApp);
        if (authErr.code === 'auth/email-already-in-use') {
          alert('Error: El correo ya está registrado.');
        } else if (authErr.code === 'auth/weak-password') {
          alert('Error: La contraseña es muy débil (mínimo 6 caracteres).');
        } else {
          alert(`Error de Auth: ${authErr.message}`);
        }
      }
    } catch (err: any) {
      console.error('Error crítico en handleAddUser:', err);
      alert(`Error crítico: ${err.message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(prev => prev.filter(u => u.uid !== uid));
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      alert('Error de permisos: No se pudo eliminar el perfil.');
    }
  };

  const handleUpdateUserRole = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      console.log('Rol actualizado a:', newRole);
    } catch (err: any) {
      console.error('Error al actualizar rol:', err);
      alert('Error de permisos: No se pudo cambiar el rango del usuario.');
    }
  };

  const handleAssignCharacter = async (charId: string, userId: string, userName: string) => {
    try {
      await updateDoc(doc(db, 'characters', charId), {
        ownerId: userId,
        ownerName: userName,
        status: 'Ocupado'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `characters/${charId}`);
    }
  };

  const handleUnassignCharacter = async (charId: string) => {
    try {
      await updateDoc(doc(db, 'characters', charId), {
        ownerId: null,
        ownerName: null,
        status: 'Libre'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `characters/${charId}`);
    }
  };

  const handleRequestAction = async (request: RoleRequest, status: 'Approved' | 'Rejected') => {
    try {
      await updateDoc(doc(db, 'requests', request.id), { status });
      
      if (status === 'Approved') {
        if (request.characterId === 'new') {
          // Create new character from OC request
          await addDoc(collection(db, 'characters'), {
            name: request.characterName,
            description: (request as any).characterDescription || '',
            avatar: (request as any).characterAvatar || '',
            class: request.applicantClass || 'Other',
            rank: request.applicantRank || 'S/R',
            status: 'Ocupado',
            ownerName: request.applicantName,
            ownerId: request.userId || null
          });
        } else {
          // Update existing canon character
          await updateDoc(doc(db, 'characters', request.characterId), { 
            status: 'Ocupado',
            ownerName: request.applicantName,
            ownerId: request.userId || null
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error al procesar la solicitud.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-black neon-text italic">PANEL DE CONTROL</h1>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'characters' ? 'bg-primary text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            PERSONAJES
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'requests' ? 'bg-magenta-400 text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            SOLICITUDES ({requests.filter(r => r.status === 'Pending').length})
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            USUARIOS
          </button>
        </div>
      </div>

      {activeTab === 'characters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1 border-r border-slate-800 pr-0 lg:pr-8">
            <div className="card-gradient rounded-2xl p-6 border-primary/20 bg-primary/5 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-primary" /> Nuevo Personaje
              </h2>
              <form onSubmit={handleAddCharacter} className="space-y-4">
                <input
                  required
                  placeholder="Nombre"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                  value={newChar.name}
                  onChange={e => setNewChar({...newChar, name: e.target.value})}
                />
                <input
                  placeholder="URL Avatar"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                  value={newChar.avatar}
                  onChange={e => setNewChar({...newChar, avatar: e.target.value})}
                />
                <textarea
                  placeholder="Descripción"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                  value={newChar.description}
                  onChange={e => setNewChar({...newChar, description: e.target.value})}
                />
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                  value={newChar.class}
                  onChange={e => setNewChar({...newChar, class: e.target.value as CharacterClass})}
                >
                  <option value="Angel">Ángel</option>
                  <option value="Demon">Demonio</option>
                  <option value="Human">Humano</option>
                  <option value="Other">Otro</option>
                </select>
                <input
                  placeholder="Rango (Overlord, etc)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                  value={newChar.rank}
                  onChange={e => setNewChar({...newChar, rank: e.target.value})}
                />
                <button type="submit" className="neon-button w-full">CREAR</button>
              </form>
            </div>
          </div>

          {/* List Wrapper */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <input 
                  type="text" 
                  placeholder="Buscar por nombre..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                />
              </div>
              <select 
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                value={charClassFilter}
                onChange={(e) => setCharClassFilter(e.target.value)}
              >
                <option value="All">Todas las Clases</option>
                <option value="Angel">Ángel</option>
                <option value="Demon">Demonio</option>
                <option value="Human">Humano</option>
                <option value="Other">Otro</option>
              </select>
              <select 
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                value={charStatusFilter}
                onChange={(e) => setCharStatusFilter(e.target.value)}
              >
                <option value="All">Todos los Estados</option>
                <option value="Libre">Libre</option>
                <option value="Ocupado">Ocupado</option>
                <option value="Reservado">Reservado</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-4">
              {characters
                .filter(c => {
                  const matchesSearch = c.name.toLowerCase().includes(charSearch.toLowerCase());
                  const matchesClass = charClassFilter === 'All' || c.class === charClassFilter;
                  const matchesStatus = charStatusFilter === 'All' || c.status === charStatusFilter;
                  return matchesSearch && matchesClass && matchesStatus;
                })
                .sort((a,b) => a.name.localeCompare(b.name))
                .map(c => (
                  <div key={c.id} className="card-gradient rounded-xl p-4 flex items-center justify-between border-slate-800">
                    <div className="flex items-center gap-4">
                      <img src={c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`} className="w-10 h-10 rounded-full border border-slate-700" alt="" />
                      <div>
                        <h3 className="font-bold text-slate-200">{c.name}</h3>
                        <p className="text-[10px] text-slate-500 uppercase">{c.class} • {c.rank || 'S/R'}</p>
                        {c.ownerName && <p className="text-[10px] text-primary italic">Dueño: {c.ownerName}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select 
                        className="bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white"
                        value={c.status}
                        onChange={e => handleUpdateStatus(c.id, e.target.value as CharacterStatus)}
                      >
                        <option value="Libre">Libre</option>
                        <option value="Ocupado">Ocupado</option>
                        <option value="Reservado">Reservado</option>
                      </select>
                      
                      {confirmDeleteId === c.id ? (
                        <div className="flex items-center gap-1 bg-red-500/20 p-1 rounded-lg border border-red-500/30 animate-pulse">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(c.id); }}
                            className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                            title="Confirmar"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="bg-slate-700 text-white p-1 rounded hover:bg-slate-600"
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }} 
                          className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          {requests.length === 0 && <p className="text-center py-20 text-slate-600 italic">No hay solicitudes pendientes.</p>}
          {requests.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(r => (
            <div key={r.id} className={`card-gradient rounded-2xl p-6 border-l-4 ${r.status === 'Pending' ? 'border-l-primary' : r.status === 'Approved' ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{r.applicantName} <span className="text-slate-500 font-normal">solicita a</span> {r.characterName}</h3>
                  <p className="text-xs text-slate-400">{r.applicantClass} • {r.applicantRank}</p>
                </div>
                <div className="flex items-center gap-2">
                   {r.status === 'Pending' ? (
                     <>
                        <button 
                          onClick={() => handleRequestAction(r, 'Approved')}
                          className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all" title="Aprobar"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleRequestAction(r, 'Rejected')}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Rechazar"
                        >
                          <X size={18} />
                        </button>
                     </>
                   ) : (
                     <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${r.status === 'Approved' ? 'text-green-500 border-green-500' : 'text-red-500 border-red-500'}`}>
                       {r.status}
                     </span>
                   )}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest border-b border-slate-800 pb-1">Prueba de Rol</p>
                <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {r.roleTest}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add User Profile manually if needed */}
          <div className="lg:col-span-1">
            <div className="card-gradient rounded-2xl p-6 border-cyan-500/20 bg-cyan-500/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-400">
                <UserPlus size={20} /> Crear Perfil
              </h2>
              <p className="text-[10px] text-slate-500 mb-4 italic">Genera las credenciales para un nuevo miembro.</p>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Correo Electrónico</label>
                  <input
                    required
                    type="email"
                    placeholder="email@ejemplo.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Contraseña Provisoria</label>
                  <div className="flex gap-2">
                    <input
                      required
                      placeholder="Contraseña"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                    <button 
                      type="button" 
                      onClick={generatePassword}
                      className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 text-cyan-400"
                      title="Generar Aleatoria"
                    >
                      <Clock size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Nombre Público</label>
                  <input
                    required
                    placeholder="Nombre del Usuario"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                    value={newUser.displayName}
                    onChange={e => setNewUser({...newUser, displayName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Rango</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                  >
                    <option value="User">Usuario</option>
                    <option value="Moderator">Moderador</option>
                    <option value="Admin">Administrador</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={creatingUser}
                  className={`neon-button w-full mt-2 transition-all ${creatingUser ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-cyan-500'}`}
                >
                  {creatingUser ? 'PROCESANDO...' : 'GUARDAR Y MOSTRAR DATOS'}
                </button>
              </form>
            </div>
          </div>

          {/* User List Wrapper */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filter */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o correo..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <select 
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="All">Todos los Roles</option>
                <option value="User">Usuario</option>
                <option value="Moderator">Moderador</option>
                <option value="Admin">Administrador</option>
              </select>
            </div>

            {users
              .filter(u => {
                const searchStr = `${u.displayName} ${u.email || ''}`.toLowerCase();
                const matchesSearch = searchStr.includes(userSearch.toLowerCase());
                const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter;
                return matchesSearch && matchesRole;
              })
              .sort((a,b) => a.displayName.localeCompare(b.displayName))
              .map(u => {
                const userChars = characters.filter(c => c.ownerId === u.uid);
                return (
                  <div key={u.uid} className="card-gradient rounded-2xl p-6 border-slate-800">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-200">{u.displayName}</h3>
                          <select 
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border outline-none bg-slate-900 ${u.role === 'Admin' ? 'text-magenta-400 border-magenta-500/30' : 'text-slate-400 border-slate-700'}`}
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.uid, e.target.value)}
                          >
                            <option value="User">Usuario</option>
                            <option value="Moderator">Moderador</option>
                            <option value="Admin">Administrador</option>
                          </select>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-1">{u.email || u.uid}</p>
                      </div>
                      
                      {confirmDeleteId === u.uid ? (
                        <div className="flex items-center gap-1 bg-red-500/20 p-1 rounded-lg border border-red-500/30">
                          <button 
                            onClick={() => handleDeleteUser(u.uid)}
                            className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                            title="Confirmar eliminación del perfil"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-slate-700 text-white p-1 rounded hover:bg-slate-600"
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(u.uid)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <LinkIcon size={14} className="text-primary" /> Personajes Vinculados
                        </h4>
                        <p className="text-[10px] text-slate-500">{userChars.length} personajes</p>
                      </div>

                      {userChars.length === 0 ? (
                        <p className="text-xs text-amber-400/60 italic">Sin personajes asignados. Debe tener al menos uno.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {userChars.map(c => (
                            <div key={c.id} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full pl-1 pr-2 py-1">
                              <img src={c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`} className="w-5 h-5 rounded-full" alt="" />
                              <span className="text-xs text-slate-300">{c.name}</span>
                              <button onClick={() => handleUnassignCharacter(c.id)} className="hover:text-red-500">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2">
                        <p className="text-[10px] text-slate-600 font-bold uppercase mb-2">Vincular Nuevo Personaje:</p>
                        <div className="flex gap-2">
                          <select 
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignCharacter(e.target.value, u.uid, u.displayName);
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">Selecciona un personaje LIBRE...</option>
                            {characters
                              .filter(c => c.status === 'Libre' && c.ownerId !== u.uid)
                              .sort((a,b) => a.name.localeCompare(b.name))
                              .map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.class})</option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};


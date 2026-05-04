import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Character } from '../types';
import { CharacterCard } from '../components/CharacterCard';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Home: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'characters'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));
      setCharacters(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'characters');
    });

    return () => unsubscribe();
  }, []);

  const filteredCharacters = characters.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'All' || c.class === filterClass;
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleSelect = (character: Character) => {
    navigate(`/request/${character.id}`, { state: { character } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-12 text-center relative overflow-hidden py-12 rounded-3xl bg-slate-800/20 border border-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,255,0.1),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-widest mb-4 mx-auto sm:mx-0">
              <Sparkles size={14} />
              Directorio Oficial
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black neon-text mb-4 tracking-tight">
            FORJA TU <span className="text-white italic">DESTINO</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto px-4 mb-8">
            Explora los habitantes del infierno y el cielo. Encuentra tu lugar en el caos y solicita tu personaje favorito o propón uno nuevo.
          </p>
          <button 
            onClick={() => navigate('/request/new')}
            className="neon-button bg-magenta-400 shadow-[0_0_15px_rgba(255,0,127,0.3)] hover:shadow-[0_0_25px_rgba(255,0,127,0.5)] border-none text-white px-8 py-3"
          >
            SOLICITAR NUEVO PERSONAJE (OC)
          </button>
        </motion.div>
      </header>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar personaje..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
            <Filter size={16} className="text-slate-500" />
            <select 
              className="bg-transparent outline-none text-sm text-slate-300"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="All">Todas las Clases</option>
              <option value="Angel">Ángel</option>
              <option value="Demon">Demonio</option>
              <option value="Human">Humano</option>
              <option value="Other">Otro</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
            <select 
              className="bg-transparent outline-none text-sm text-slate-300"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">Todos los Estados</option>
              <option value="Libre">Libre</option>
              <option value="Ocupado">Ocupado</option>
              <option value="Reservado">Reservado</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onSelect={handleSelect}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && filteredCharacters.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">No se encontraron personajes con esos filtros.</p>
        </div>
      )}
    </div>
  );
};

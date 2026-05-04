import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { collection, onSnapshot, writeBatch, doc, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Character } from '../types';
import { useAuth } from '../context/AuthContext';
import { Save, Move, Users, RefreshCw, Info, Link2, Trash2, X } from 'lucide-react';

interface Relationship {
  id: string;
  fromId: string;
  toId: string;
}

export const RelationsTree: React.FC = () => {
  const { profile } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selection for relationship creation
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // We store the positions in local state to allow saving
  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});

  useEffect(() => {
    const unsubChars = onSnapshot(collection(db, 'characters'), (snap) => {
      const chars = snap.docs.map(d => ({ id: d.id, ...d.data() } as Character));
      setCharacters(chars);
      
      const newPositions: Record<string, { x: number, y: number }> = {};
      chars.forEach((c, index) => {
        if (c.x !== undefined && c.y !== undefined) {
          newPositions[c.id] = { x: c.x, y: c.y };
        } else {
          newPositions[c.id] = { 
            x: (index % 6) * 150 + 100, 
            y: Math.floor(index / 6) * 180 + 100 
          };
        }
      });
      setPositions(prev => ({ ...newPositions, ...prev })); // Keep local movements if any? No, better sync
    });

    const unsubRels = onSnapshot(collection(db, 'relationships'), (snap) => {
      setRelationships(snap.docs.map(d => ({ id: d.id, ...d.data() } as Relationship)));
      setLoading(false);
    });

    return () => {
      unsubChars();
      unsubRels();
    };
  }, []);

  const handleDrag = (id: string, info: any) => {
    // Update position in real-time for lines to follow
    setPositions(prev => ({
      ...prev,
      [id]: {
        x: (prev[id]?.x || 0) + info.delta.x,
        y: (prev[id]?.y || 0) + info.delta.y
      }
    }));
  };

  const handleCharacterClick = (id: string) => {
    if (!selectedId) {
      setSelectedId(id);
    } else if (selectedId === id) {
      setSelectedId(null);
    } else {
      // Create relationship
      const exists = relationships.find(r => 
        (r.fromId === selectedId && r.toId === id) || 
        (r.fromId === id && r.toId === selectedId)
      );

      if (!exists) {
        const newRel = { 
          id: `local-${Date.now()}`, 
          fromId: selectedId, 
          toId: id 
        };
        setRelationships(prev => [...prev, newRel]);
      }
      setSelectedId(null);
    }
  };

  const handleRemoveRelationship = (id: string) => {
    setRelationships(prev => prev.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    if (profile?.role !== 'Admin') return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      // Update character positions
      Object.entries(positions).forEach(([id, pos]) => {
        const charRef = doc(db, 'characters', id);
        const p = pos as { x: number, y: number };
        batch.update(charRef, { x: p.x, y: p.y });
      });

      // Handle relationships: this is tricky with batch. 
      // For simplicity, we'll clear and re-add or just add new ones.
      // Better: fetch existing from firestore and sync.
      const snapshot = await getDocs(collection(db, 'relationships'));
      snapshot.docs.forEach(d => {
        batch.delete(doc(db, 'relationships', d.id));
      });

      relationships.forEach(rel => {
        const newRelRef = doc(collection(db, 'relationships'));
        batch.set(newRelRef, { fromId: rel.fromId, toId: rel.toId });
      });

      await batch.commit();
      alert('¡Árbol y relaciones guardados con éxito!');
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error al guardar el árbol.');
    } finally {
      setSaving(false);
    }
  };

  const nodeRadius = 60; // Approximate half of node width

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-block"
          >
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
              Conexiones del Heallaverse
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black neon-text italic uppercase tracking-tighter">Árbol de Relaciones</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Haz clic en dos personajes para unirlos. Arrastra para organizar.
          </p>
        </div>

        {profile?.role === 'Admin' && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="neon-button flex items-center gap-2 px-8 py-3 h-fit shadow-[0_0_20px_rgba(0,255,163,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span className="uppercase tracking-widest text-sm">{saving ? 'Guardando...' : 'Guardar Todo'}</span>
          </motion.button>
        )}
      </header>

      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Link2 size={16} />
        </div>
        <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">
          {selectedId 
            ? "SELECCIONADO: Selecciona otro personaje para crear una relación."
            : "INSTRUCCIÓN: Haz clic en un personaje, luego en otro para trazar una línea."}
        </p>
        {selectedId && (
          <button onClick={() => setSelectedId(null)} className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded hover:text-white uppercase transition-colors">
            Cancelar Selección
          </button>
        )}
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[800px] bg-[#0d1117] border-2 border-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl"
        style={{ 
          backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}
      >
        {/* SVG Layer for lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {relationships.map((rel) => {
            const from = positions[rel.fromId];
            const to = positions[rel.toId];
            if (!from || !to) return null;

            // Centers (approx)
            const x1 = from.x + 70;
            const y1 = from.y + 70;
            const x2 = to.x + 70;
            const y2 = to.y + 70;

            return (
              <g key={rel.id} className="group pointer-events-auto cursor-pointer">
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(0,255,163,0.3)"
                  strokeWidth="3"
                  filter="url(#glow)"
                  className="transition-all group-hover:stroke-primary focus:outline-none"
                  onClick={() => handleRemoveRelationship(rel.id)}
                />
                {/* Hit area for easier deletion */}
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="transparent"
                  strokeWidth="20"
                  onClick={() => handleRemoveRelationship(rel.id)}
                />
              </g>
            );
          })}
        </svg>

        {/* Characters Layer */}
        {characters.map((c) => (
          <motion.div
            key={c.id}
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            dragElastic={0}
            onDrag={(_, info) => handleDrag(c.id, info)}
            initial={false}
            animate={{ 
              x: positions[c.id]?.x ?? 0, 
              y: positions[c.id]?.y ?? 0 
            }}
            className={`absolute z-10 p-2 transition-transform ${selectedId === c.id ? 'scale-110' : ''}`}
            style={{ width: 140 }}
          >
            <div 
              onClick={() => handleCharacterClick(c.id)}
              className={`flex flex-col items-center gap-2 group cursor-pointer ${selectedId === c.id ? 'selected' : ''}`}
            >
              <div className="relative">
                <div className={`absolute -inset-2 bg-primary/20 blur-xl rounded-full transition-opacity ${selectedId === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                
                <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border-4 bg-slate-900 transition-all duration-300 shadow-2xl relative z-10 ${
                  selectedId === c.id ? 'border-primary shadow-[0_0_20px_rgba(0,255,163,0.5)]' : 'border-slate-800 group-hover:border-primary/50'
                }`}>
                  {c.avatar ? (
                    <img 
                      src={c.avatar} 
                      alt={c.name} 
                      className="w-full h-full object-cover transition-transform duration-500 scale-110 group-hover:scale-100" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                      <Users size={32} />
                    </div>
                  )}
                </div>

                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-xl border-4 border-slate-950 flex items-center justify-center z-20 ${
                  c.status === 'Libre' ? 'bg-green-500' : c.status === 'Ocupado' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              <div className="text-center space-y-0.5 z-10">
                <p className={`text-xs font-black uppercase tracking-tighter italic px-3 py-1 rounded-lg border transition-all shadow-lg ${
                  selectedId === c.id ? 'bg-primary text-slate-900 border-primary' : 'bg-slate-950/80 text-white border-slate-800 group-hover:border-primary/30'
                }`}>
                  {c.name}
                </p>
                {c.rank && (
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    {c.rank}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest italic pt-4 border-t border-slate-800/50">
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> <span>Libre</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> <span>Ocupado</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> <span>Reservado</span></div>
        </div>
        <p>HELLAVERSE FREAK - INTERACTIVE RELATIONSHIP MAP</p>
      </div>
    </div>
  );
};

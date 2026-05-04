import React from 'react';
import { motion } from 'motion/react';
import { Character } from '../types';
import { Users, Shield, Zap } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onSelect }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Libre': return 'text-green-400 border-green-400';
      case 'Ocupado': return 'text-red-400 border-red-400';
      case 'Reservado': return 'text-amber-400 border-amber-400';
      default: return 'text-slate-400 border-slate-400';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gradient rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30">
            <img 
              src={character.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}`} 
              alt={character.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className={`absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-[var(--color-bg-dark)] ${getStatusColor(character.status)}`}>
            {character.status}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold neon-text">{character.name}</h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{character.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/50 text-[10px] uppercase font-semibold text-slate-300">
          <Shield size={12} className="text-cyan-400" />
          {character.class || 'Desconocido'}
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/50 text-[10px] uppercase font-semibold text-slate-300">
          <Zap size={12} className="text-magenta-400" />
          {character.rank || 'N/A'}
        </div>
      </div>

      {character.status === 'Libre' ? (
        <button
          onClick={() => onSelect(character)}
          className="neon-button w-full mt-2 text-sm uppercase tracking-wider"
        >
          Solicitar Personaje
        </button>
      ) : (
        <div className="mt-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/50 flex items-center gap-2">
          <Users size={14} className="text-slate-500" />
          <span className="text-xs text-slate-500 italic">Poseso por {character.ownerName || 'alguien'}</span>
        </div>
      )}
      
      {/* Decorative pulse for Libre characters */}
      {character.status === 'Libre' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
      )}
    </motion.div>
  );
};

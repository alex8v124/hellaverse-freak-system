import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Gavel, MapPin, Clock, ChevronRight, Shield, Sparkles } from 'lucide-react';

const sections = [
  {
    id: 'history',
    title: 'Historia',
    icon: <Book size={24} />,
    content: `
      En las profundidades del Heallaverse, la historia comenzó con la rebelión original. 
      Lo que antes eran círculos aislados de castigo se han convertido en una metrópolis vibrante, 
      peligrosa y llena de pecado. Desde la llegada de los primeros pecadores hasta la era 
      actual de los Overlords, el equilibrio de poder siempre ha estado en juego.
      
      Nuestra línea temporal se sitúa en un momento de tensión máxima, donde las alianzas 
      se forjan en sangre y los contratos de alma son la moneda de cambio más valiosa.
    `
  },
  {
    id: 'rules',
    title: 'Reglas',
    icon: <Gavel size={24} />,
    content: `
      1. Respeto ante todo: Trata a los demás usuarios con respeto fuera de rol.
      2. Meta-rol prohibido: Tu personaje no sabe lo que tú sabes como usuario.
      3. Power-gaming: No puedes ser invencible. Todos los personajes tienen debilidades.
      4. Consentimiento: Las acciones permanentes que afecten a otros personajes requieren acuerdo previo.
      5. Coherencia: Mantén la personalidad y habilidades de tu personaje según su rango y clase.
    `
  },
  {
    id: 'places',
    title: 'Lugares',
    icon: <MapPin size={24} />,
    content: `
      • Ciudad Pentagrama: El corazón del Infierno, donde reside la mayor concentración de pecadores.
      • El Hotel Hazbin: Un refugio para aquellos que buscan la redención imposible.
      • Anillo del Orgullo: El hogar de los pecadores y la sede del poder real.
      • Cannibal Town: Un distrito pintoresco pero extremadamente peligroso con estética victoriana.
      • El V-Tower: El centro tecnológico y de medios controlado por los Vees.
    `
  },
  {
    id: 'timeline',
    title: 'Línea de Tiempo',
    icon: <Clock size={24} />,
    content: `
      • La Caída: El origen de los caídos y la creación del sistema de anillos.
      • Era de los Overlords Antiguos: El dominio de Alastor y la desaparición de viejas leyendas.
      • El Ascenso de los Vees: La revolución tecnológica y el control de los medios.
      • El Presente: La apertura del Hotel y los rumores de una rebelión interna.
    `
  }
];

export const Lore: React.FC = () => {
  const [activeTab, setActiveTab] = useState(sections[0].id);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <span className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
            Conoce el Mundo
          </span>
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black neon-text italic">LORE & REGLAS</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
          Explora la historia, las normas y los rincones más oscuros del Heallaverse Freak RP.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <aside className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border outline-none ${
                activeTab === section.id
                  ? 'bg-primary text-slate-900 border-primary shadow-[0_0_15px_rgba(0,255,163,0.3)]'
                  : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {section.icon}
                <span className="font-bold text-sm uppercase tracking-wider">{section.title}</span>
              </div>
              <ChevronRight size={16} className={activeTab === section.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="card-gradient rounded-3xl p-8 border-slate-800 h-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                  {sections.find(s => s.id === activeTab)?.icon}
                </div>
                <h2 className="text-3xl font-black text-slate-200 uppercase tracking-tighter italic">
                  {sections.find(s => s.id === activeTab)?.title}
                </h2>
              </div>
              
              <div className="prose prose-invert max-w-none">
                {activeTab === 'timeline' ? (
                  <div className="relative pl-8 border-l-2 border-primary/20 space-y-12 ml-4 my-8">
                    {[
                      { year: 'Era de la Caída', title: 'La Rebelión Original', desc: 'El origen de los caídos y la creación del complejo sistema de anillos del Infierno.' },
                      { year: 'Hace 50 Años', title: 'El Gran Apagón', desc: 'Desfase de poder masivo donde antiguos Overlords desaparecieron y Alastor marcó su presencia.' },
                      { year: 'Hace 10 Años', title: 'Revolución Tecnológica', desc: 'Vox y los Vees toman el control de las telecomunicaciones, cambiando el mercado de almas.' },
                      { year: 'Actualidad', title: 'El Proyecto Redención', desc: 'Charlie Morningstar abre las puertas del Hotel Hazbin, sembrando esperanza y discordia.' }
                    ].map((item, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={index} 
                        className="relative"
                      >
                        <div className="absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-primary border-4 border-slate-900 shadow-[0_0_15px_rgba(0,255,163,0.5)]" />
                        <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">{item.year}</span>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mt-1 italic">{item.title}</h3>
                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : activeTab === 'rules' ? (
                  <div className="grid grid-cols-1 gap-4 my-6">
                    {[
                      { id: '01', title: 'Respeto Off-Role', desc: 'El respeto mutuo entre usuarios es obligatorio. No se tolerará toxicidad fuera de personaje.' },
                      { id: '02', title: 'Meta-Role Prohibido', desc: 'Tu personaje no posee conocimiento de la información obtenida fuera del rol (OOC).' },
                      { id: '03', title: 'Límites de Poder', desc: 'No se permite el God-Mode. Todos los personajes deben tener debilidades y ser vulnerables.' },
                      { id: '04', title: 'Consentimiento de Rol', desc: 'Acciones permanentes o graves contra otros personajes requieren el permiso del otro usuario.' },
                      { id: '05', title: 'Coherencia Narrativa', desc: 'Las acciones deben ser consistentes con la historia, rango y personalidad declarada del personaje.' }
                    ].map((rule, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={rule.id}
                        className="flex gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-primary/30 transition-all group"
                      >
                        <span className="text-2xl font-black text-primary/20 group-hover:text-primary transition-colors">{rule.id}</span>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{rule.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : activeTab === 'places' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                    {[
                      { name: 'Ciudad Pentagrama', icon: <MapPin size={24} />, desc: 'La capital del Anillo del Orgullo, un nido de vicio y oportunidad constante.' },
                      { name: 'Hotel Hazbin', icon: <Shield size={24} />, desc: 'Un lugar de redención improbable gestionado por la princesa Charlie.' },
                      { name: 'Anillo del Orgullo', icon: <MapPin size={24} />, desc: 'El único lugar donde los pecadores pueden existir, lleno de peligros y jerarquías.' },
                      { name: 'Canibal Town', icon: <MapPin size={24} />, desc: 'Un distrito con estética de finales del siglo XIX donde impera la "etiqueta" y el canibalismo.' },
                      { name: 'V-Tower', icon: <Sparkles size={24} />, desc: 'Centro de control de los Vees, emitiendo propaganda y alta tecnología a todo el infierno.' }
                    ].map((place, index) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        key={place.name}
                        className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800/40 transition-all group"
                      >
                        <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 w-fit mb-4 text-primary group-hover:shadow-[0_0_10px_rgba(0,255,163,0.2)] transition-all">
                          {place.icon}
                        </div>
                        <h4 className="text-lg font-black text-slate-100 uppercase tracking-tighter italic mb-2">{place.name}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{place.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-300 leading-relaxed space-y-4 whitespace-pre-line text-sm md:text-base">
                    {sections.find(s => s.id === activeTab)?.content}
                  </div>
                )}
              </div>

              <div className="mt-12 pt-8 border-t border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-mono italic">
                  * Este contenido está sujeto a actualizaciones según el desarrollo del rol.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

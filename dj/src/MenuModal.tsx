import React, { useState } from 'react';
import { X, SlidersHorizontal, ListMusic, Sparkles, Settings, RotateCcw } from 'lucide-react';
import { useFXConfig, AVAILABLE_BEAT_FX, FX_ABBREVIATIONS } from './useFXConfig';

interface MenuModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const effectsData = [
    {
        id: 'filter',
        name: 'Color Filter',
        description: 'Filtro bipolar (Low Pass y High Pass) de grado profesional. Hacia la izquierda atenúa frecuencias agudas dejando pasar los graves (LPF). Hacia la derecha atenúa frecuencias graves dejando pasar los agudos (HPF). Cuenta con resonancia (Q) dinámica que aumenta al llevar el knob a los extremos, logrando un barrido más pronunciado.',
        type: 'Color FX'
    },
    {
        id: 'echo',
        name: 'Echo',
        description: 'Efecto de retardo (delay) temporal clásico. Copia el sonido y lo repite progresivamente reduciendo su volumen. Está configurado en ruteo Post-Fader, lo que significa que la "cola" del eco se mantiene desvaneciéndose en el máster incluso si bajas bruscamente el fader del canal.',
        type: 'Beat FX'
    },
    {
        id: 'reverb',
        name: 'Reverb',
        description: 'Reverberación algorítmica de estudio. Simula la reflexión acústica del sonido en una sala grande o club. Perfecto para crear transiciones atmosféricas épicas. También ruteado Post-Fader para garantizar desvanecimientos naturales.',
        type: 'Beat FX'
    },
    {
        id: 'spiral',
        name: 'Spiral',
        description: 'Un efecto de delay avanzado e hipnótico que añade modulación de tono (pitch) en el bucle de retroalimentación. Alarga la cola creando una sensación de caída y espiral sónica, ideal para pausas rítmicas (breakdowns).',
        type: 'Beat FX'
    },
    {
        id: 'chorus',
        name: 'Chorus',
        description: 'Duplica la señal y retrasa ligeramente las copias (entre 15ms y 30ms), aplicando sutiles variaciones de modulación (LFOs). Esto engorda el sonido significativamente y expande drásticamente la imagen estéreo de la pista.',
        type: 'Beat FX'
    },
    {
        id: 'vinylbrake',
        name: 'Vinyl Brake',
        description: 'Emula el comportamiento analógico del motor de un plato giradiscos (turntable) perdiendo fuerza. Reduce exponencialmente la velocidad de reproducción de la pista hasta frenarla por completo en aproximadamente 1.5 segundos, logrando un fundido característico.',
        type: 'Control'
    },
    {
        id: 'stutter',
        name: 'Stutter / Roll',
        description: 'Corta rítmicamente el volumen o congela fragmentos de la pista en fracciones de tiempo muy pequeñas (1/4 o 1/8 de beat). Esto genera un sonido tartamudeante rítmico, útil para "build-ups" (subidones) antes del drop.',
        type: 'Beat FX'
    },
    {
        id: 'crush',
        name: 'Crush (Bitcrusher)',
        description: 'Reduce la resolución de profundidad de bits de la señal, inyectando distorsión armónica y ruidos digitales crudos. Destruye creativamente el espectro de frecuencias dando un carácter electrónico muy agresivo.',
        type: 'Beat FX'
    },
    {
        id: 'distortion',
        name: 'Distortion / Overdrive',
        description: 'Satura agresivamente la señal introduciendo armónicos. Utiliza wave-shaping asimétrico para "romper" el audio, ideal para dar energía cruda al techno o estilos duros.',
        type: 'Beat FX'
    },
    {
        id: 'trans',
        name: 'Trans / Gate',
        description: 'Aplica cortes duros de volumen sincronizados al BPM (1/2, 1/4, etc.). A diferencia del stutter, el Trans ahoga completamente la señal generando un ritmo muy marcado.',
        type: 'Beat FX'
    },
    {
        id: 'pitch_shift',
        name: 'Pitch Shift (Glitch)',
        description: 'Altera el tono sin modificar la velocidad del track usando superposición de retardos granulares. Puede sonar un poco metálico/robótico, lo cual se usa creativamente.',
        type: 'Beat FX'
    },
    {
        id: 'helix',
        name: 'Helix',
        description: 'Combina un delay de alta retroalimentación con un flanger/phaser interno. Produce una espiral de sonido espacial ascendente, simulando una hélice metálica infinita.',
        type: 'Beat FX'
    },
    {
        id: 'noise',
        name: 'Noise FX',
        description: 'Inyecta ruido blanco puro generado en tiempo real. Se envía a través de un filtro pasa-banda para crear tensiones (build-ups) o barridos de viento dramáticos.',
        type: 'Color FX'
    },
    {
        id: 'backspin',
        name: 'Backspin',
        description: 'Simula retirar agresivamente la mano de un vinilo mientras suena, lanzándolo hacia atrás. Produce una caída abrupta de tono (pitch drop) muy violenta.',
        type: 'Control'
    }
];

export const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'effects' | 'settings'>('effects');
    const { beatFXList, updateFXSlot, resetToDefault } = useFXConfig();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl h-[85vh] bg-zinc-950/90 border border-zinc-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] flex overflow-hidden backdrop-blur-2xl">
                
                {/* Sidebar Navigation */}
                <div className="w-64 bg-zinc-900/50 border-r border-zinc-800/50 p-6 flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                        Opciones
                    </h2>
                    
                    <button 
                        onClick={() => setActiveTab('effects')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'effects' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'}`}
                    >
                        <Sparkles className="w-5 h-5" />
                        Referencia de FX
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'settings' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'}`}
                    >
                        <Settings className="w-5 h-5" />
                        Configuración
                    </button>
                    
                    {/* Placeholder for future sections */}
                    <div className="mt-auto opacity-50 flex flex-col gap-2">
                        <button className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-zinc-500 cursor-not-allowed border border-transparent">
                            <ListMusic className="w-5 h-5" />
                            Biblioteca (Próximamente)
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950/80 to-zinc-950">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-8 border-b border-zinc-800/50">
                        <h3 className="text-lg font-semibold text-zinc-200">
                            {activeTab === 'effects' ? 'Guía de Efectos Profesionales' : 'Configuración del Sistema'}
                        </h3>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {activeTab === 'effects' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {effectsData.map((fx) => (
                                    <div key={fx.id} className="group bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-600 transition-all hover:bg-zinc-900/50">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{fx.name}</h4>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                {fx.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                                            {fx.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-1">Asignación de Beat FX</h4>
                                        <p className="text-sm text-zinc-400">Configura los 8 efectos que aparecerán en el panel central de tu controladora.</p>
                                    </div>
                                    <button 
                                        onClick={resetToDefault}
                                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Restaurar
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {beatFXList.map((fx, index) => (
                                        <div key={index} className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4 flex flex-col gap-3 relative group">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-zinc-500">SLOT {index + 1}</span>
                                                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                                                    {FX_ABBREVIATIONS[fx] || fx.substring(0, 3)}
                                                </span>
                                            </div>
                                            <select 
                                                value={fx}
                                                onChange={(e) => updateFXSlot(index, e.target.value)}
                                                className="w-full bg-zinc-950 text-white border border-zinc-700 rounded-lg py-2 px-3 text-sm appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors"
                                            >
                                                {AVAILABLE_BEAT_FX.map(availableFx => (
                                                    <option key={availableFx} value={availableFx}>
                                                        {availableFx.replace('_', ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            {/* Custom select arrow */}
                                            <div className="absolute right-7 top-[46px] pointer-events-none">
                                                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #3f3f46;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #52525b;
                }
            `}</style>
        </div>
    );
};

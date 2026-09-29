import React from 'react';
import { Settings, X, Cpu } from 'lucide-react';
import type { ActionId, MIDIMapConfig } from './useMIDIMapping';

interface MIDIMenuProps {
    isOpen: boolean;
    onClose: () => void;
    mappings: MIDIMapConfig;
    learningAction: ActionId | null;
    startLearning: (action: ActionId) => void;
    clearMapping: (action: ActionId) => void;
    exportMappings: () => void;
    importMappings: (file: File) => void;
    resetToDefault: () => void;
}

const DECK_ACTIONS = [
    // Transport & Tempo
    { id: 'play', label: 'Play / Pause' },
    { id: 'cue', label: 'Cue' },
    { id: 'sync', label: 'Sync' },
    { id: 'master_tempo', label: 'Key Lock (MT)' },
    { id: 'pitch', label: 'Pitch Fader', isCC: true },
    { id: 'jog', label: 'Jog Wheel', isCC: true },
    
    // Loops
    { id: 'loop_in', label: 'Loop IN' },
    { id: 'loop_out', label: 'Loop OUT' },
    { id: 'loop_4beat_exit', label: '4 BEAT / EXIT' },
    { id: 'loop_half', label: 'CUE/LOOP CALL < (1/2X)' },
    { id: 'loop_double', label: 'CUE/LOOP CALL > (2X)' },

    // Pad Modes
    { id: 'mode_hotcue', label: 'HOT CUE' },
    { id: 'mode_padfx1', label: 'PAD FX1' },
    { id: 'mode_beatjump', label: 'BEAT JUMP' },
    { id: 'mode_sampler', label: 'SAMPLER' },

    // Pads
    { id: 'pad1', label: 'Pad 1' },
    { id: 'pad2', label: 'Pad 2' },
    { id: 'pad3', label: 'Pad 3' },
    { id: 'pad4', label: 'Pad 4' },
    { id: 'pad5', label: 'Pad 5' },
    { id: 'pad6', label: 'Pad 6' },
    { id: 'pad7', label: 'Pad 7' },
    { id: 'pad8', label: 'Pad 8' },

    // Library
    { id: 'load', label: 'LOAD' },
];

const MIXER_ACTIONS = [
    // Channels
    { id: 'ch1_trim', label: 'CH 1 TRIM', isCC: true },
    { id: 'ch1_eq_hi', label: 'CH 1 EQ HI', isCC: true },
    { id: 'ch1_eq_mid', label: 'CH 1 EQ MID', isCC: true },
    { id: 'ch1_eq_low', label: 'CH 1 EQ LOW', isCC: true },
    { id: 'ch1_cfx', label: 'CH 1 CFX', isCC: true },
    { id: 'ch1_cue', label: 'CH 1 CUE (HP)' },
    { id: 'ch1_fader', label: 'CH 1 Fader', isCC: true },
    
    { id: 'ch2_trim', label: 'CH 2 TRIM', isCC: true },
    { id: 'ch2_eq_hi', label: 'CH 2 EQ HI', isCC: true },
    { id: 'ch2_eq_mid', label: 'CH 2 EQ MID', isCC: true },
    { id: 'ch2_eq_low', label: 'CH 2 EQ LOW', isCC: true },
    { id: 'ch2_cfx', label: 'CH 2 CFX', isCC: true },
    { id: 'ch2_cue', label: 'CH 2 CUE (HP)' },
    { id: 'ch2_fader', label: 'CH 2 Fader', isCC: true },

    // Global
    { id: 'crossfader', label: 'Crossfader', isCC: true },
    { id: 'master_level', label: 'MASTER LEVEL', isCC: true },
    
    // Beat FX Section (Virtual mapping to App State)
    { id: 'beatfx_on', label: 'BEAT FX ON/OFF' },
    { id: 'beatfx_level', label: 'BEAT FX LEVEL/DEPTH', isCC: true },
];

export const MIDIMenu = ({ isOpen, onClose, mappings, learningAction, startLearning, clearMapping, exportMappings, importMappings, resetToDefault }: MIDIMenuProps) => {
    if (!isOpen) return null;

    const renderMappingRow = (fullActionId: string, label: string) => {
        const isLearning = learningAction === fullActionId;
        const mapping = mappings[fullActionId];

        return (
            <div key={fullActionId} className="flex items-center justify-between py-2 border-b border-zinc-800/50 hover:bg-white/5 transition-colors px-2 rounded">
                <span className="text-zinc-300 text-[10px] font-bold w-1/3 truncate">{label}</span>
                <div className="flex-1 flex justify-center">
                    {isLearning ? (
                        <div className="text-purple-400 font-bold text-[9px] animate-pulse bg-purple-900/40 px-2 py-1 rounded">
                            Toca tu mesa física...
                        </div>
                    ) : mapping ? (
                        <div className="text-green-400 font-mono text-[9px] bg-green-900/30 px-2 py-1 rounded flex gap-2 items-center">
                            <span>CH:{mapping.channel}</span>
                            <span>{mapping.isCC ? 'CC' : 'NT'}:{mapping.data1}</span>
                        </div>
                    ) : (
                        <div className="text-zinc-600 text-[9px] italic">Sin asignar</div>
                    )}
                </div>
                <div className="w-1/4 flex justify-end gap-2">
                    {mapping && !isLearning && (
                        <button onClick={() => clearMapping(fullActionId)} className="text-red-500 hover:text-red-400 text-[9px] px-2 py-1 bg-red-900/20 rounded font-bold">X</button>
                    )}
                    <button 
                        onClick={() => startLearning(fullActionId)} 
                        className={`text-[9px] px-3 py-1 rounded font-bold transition-all ${isLearning ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                        LEARN
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#121214] w-[800px] h-[600px] max-h-[90vh] rounded-2xl border border-zinc-700 shadow-[0_30px_60px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center bg-zinc-900 px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2 text-white font-bold tracking-widest text-sm">
                        <Cpu className="w-4 h-4 text-purple-500" />
                        MIDI MAPPER
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={resetToDefault} className="text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 px-3 py-1 rounded transition-colors border border-red-500/30">
                            RESTABLECER POR DEFECTO
                        </button>
                        <button onClick={exportMappings} className="text-[10px] font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded transition-colors">
                            EXPORTAR
                        </button>
                        <label className="text-[10px] font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded transition-colors cursor-pointer">
                            IMPORTAR
                            <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        importMappings(e.target.files[0]);
                                    }
                                    e.target.value = '';
                                }}
                            />
                        </label>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors ml-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex gap-6">
                    {/* Decks */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-black/50 border border-zinc-800 rounded-xl p-4">
                            <h3 className="text-orange-500 font-black text-[11px] mb-3 tracking-widest border-b border-orange-900/50 pb-1">DECK 1 (IZQUIERDA)</h3>
                            <div className="flex flex-col">
                                {DECK_ACTIONS.map(action => renderMappingRow(`deck1_${action.id}`, action.label))}
                            </div>
                        </div>

                        <div className="bg-black/50 border border-zinc-800 rounded-xl p-4">
                            <h3 className="text-blue-500 font-black text-[11px] mb-3 tracking-widest border-b border-blue-900/50 pb-1">DECK 2 (DERECHA)</h3>
                            <div className="flex flex-col">
                                {DECK_ACTIONS.map(action => renderMappingRow(`deck2_${action.id}`, action.label))}
                            </div>
                        </div>
                    </div>

                    {/* Mixer */}
                    <div className="w-[300px] bg-black/50 border border-zinc-800 rounded-xl p-4 h-max">
                        <h3 className="text-zinc-400 font-black text-[11px] mb-3 tracking-widest border-b border-zinc-800 pb-1">MIXER GLOBAL</h3>
                        <div className="flex flex-col">
                            {MIXER_ACTIONS.map(action => renderMappingRow(`mixer_${action.id}`, action.label))}
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 px-4 py-3 border-t border-zinc-800 text-[10px] text-zinc-500 text-center flex justify-between items-center">
                    <span>Pulsa LEARN y luego toca tu controlador físico para enlazarlos.</span>
                    <button onClick={onClose} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-lg transition-colors">
                        HECHO
                    </button>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import type { MIDIMessage } from './useMIDI';

export const MIDIDebugger = ({ deviceName, messages }: { deviceName: string | null, messages: MIDIMessage[] }) => {
    const [minimized, setMinimized] = useState(true);

    if (minimized) {
        return (
            <div 
                className="fixed bottom-4 right-4 bg-black/80 border border-purple-500/50 p-2 rounded cursor-pointer hover:bg-black transition-colors z-50 shadow-[0_0_15px_purple]"
                onClick={() => setMinimized(false)}
            >
                <div className="text-[10px] text-purple-400 font-mono font-bold tracking-widest uppercase">
                    MIDI DETECTADO: {deviceName || "FLX4"}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-black/90 border border-purple-500/50 p-4 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] z-50 w-80 backdrop-blur-md">
            <div className="flex justify-between items-center mb-3 border-b border-purple-500/30 pb-2">
                <div className="text-xs text-purple-400 font-mono font-bold tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                    MIDI DEBUGGER
                </div>
                <button onClick={() => setMinimized(true)} className="text-zinc-500 hover:text-white text-[10px] font-bold px-2 py-0.5 bg-zinc-900 rounded">OCULTAR</button>
            </div>
            
            <div className="text-[10px] text-zinc-400 mb-3 leading-tight">
                Disp: <span className="text-white font-bold">{deviceName || 'Esperando conexión...'}</span><br/>
                <span className="text-purple-300">Gira los platos, faders y botones de tu mesa física para ver los códigos aquí:</span>
            </div>

            <div className="h-40 overflow-y-auto bg-black/50 border border-zinc-800 rounded p-2 flex flex-col gap-1 font-mono text-[9px] scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="text-zinc-600 italic text-center mt-10">Ninguna señal recibida aún...</div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={`${msg.time}-${i}`} className="flex justify-between items-center border-b border-zinc-800/50 pb-1">
                            <span className="text-zinc-500">{new Date(msg.time).toISOString().substring(11, 23)}</span>
                            <span className="text-blue-400">CH:{msg.channel}</span>
                            <span className="text-green-400">NT:{msg.note}</span>
                            <span className="text-orange-400">VAL:{msg.velocity}</span>
                            <span className="text-white font-bold bg-zinc-900 px-1 rounded">{msg.hex}</span>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-3 text-[9px] text-zinc-500 leading-tight">
                Pega los códigos <span className="text-white bg-zinc-800 px-1 rounded">HEX</span> de cada botón al asistente para que pueda programarlos.
            </div>
        </div>
    );
};

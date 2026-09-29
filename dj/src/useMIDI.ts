import { useState, useEffect, useCallback } from 'react';

export interface MIDIMessage {
    time: number;
    command: number;
    channel: number;
    note: number;
    velocity: number;
    hex: string;
}

// --- GLOBAL SINGLETON STATE ---
const globalListeners = new Set<(msg: MIDIMessage) => void>();
let isInitialized = false;
let globalDeviceName: string | null = null;
let globalOutputPorts: any[] = [];
let lastRawMsg = "";
let lastMsgTime = 0;

export function useMIDI() {
    const [midiEnabled, setMidiEnabled] = useState(isInitialized);
    const [deviceName, setDeviceName] = useState<string | null>(globalDeviceName);
    const [lastMessages, setLastMessages] = useState<MIDIMessage[]>([]);
    
    const addListener = useCallback((cb: (msg: MIDIMessage) => void) => {
        globalListeners.add(cb);
    }, []);

    const removeListener = useCallback((cb: (msg: MIDIMessage) => void) => {
        globalListeners.delete(cb);
    }, []);

    const sendMidi = useCallback((command: number, note: number, velocity: number, channel: number = 0) => {
        globalOutputPorts.forEach(port => {
            try {
                port.send([ (command << 4) | (channel & 0xf), note, velocity ]);
            } catch (e) {
                console.error("Error sending MIDI to port:", e);
            }
        });
    }, []);

    useEffect(() => {
        if (!navigator.requestMIDIAccess) {
            console.error("Web MIDI API no está soportada en este navegador.");
            return;
        }

        const handleGlobalMessage = (msgObj: MIDIMessage) => {
            setLastMessages(prev => [msgObj, ...prev].slice(0, 15));
        };
        
        globalListeners.add(handleGlobalMessage);

        if (!isInitialized) {
            isInitialized = true;

            const onMIDIMessage = (event: any) => {
                const data = event.data;
                if (data.length < 3) return; // Ignorar mensajes de sistema cortos
                if (data[0] === 248 || data[0] === 254) return; // Ignorar reloj MIDI de Pioneer

                const command = data[0] >> 4;
                const channel = data[0] & 0xf;
                const note = data[1];
                const velocity = data[2];

                // Debounce mensajes idénticos (Pioneer duplica eventos en múltiples puertos a la vez, < 4ms)
                const rawMsg = `${command}-${channel}-${note}-${velocity}`;
                const now = Date.now();
                if (rawMsg === lastRawMsg && now - lastMsgTime < 4) {
                    return;
                }
                lastRawMsg = rawMsg;
                lastMsgTime = now;

                const hex = `[${data[0].toString(16).padStart(2,'0').toUpperCase()}, ${data[1].toString(16).padStart(2,'0').toUpperCase()}, ${data[2].toString(16).padStart(2,'0').toUpperCase()}]`;

                const msgObj: MIDIMessage = {
                    time: Date.now(),
                    command,
                    channel,
                    note,
                    velocity,
                    hex
                };

                // Notificar a todos los componentes que usen useMIDI()
                globalListeners.forEach(cb => cb(msgObj));
            };

            const initMIDI = async () => {
                try {
                    // Intentamos pedir permisos de SysEx primero (necesario para el handshake profundo de Pioneer)
                    let midiAccess;
                    try {
                        midiAccess = await navigator.requestMIDIAccess({ sysex: true });
                    } catch (e) {
                        midiAccess = await navigator.requestMIDIAccess();
                    }

                    setMidiEnabled(true);

                    const inputs = midiAccess.inputs.values();
                    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
                        const dev = input.value;
                        if (dev.name?.toLowerCase().includes("flx4") || !globalDeviceName) {
                            if (!globalDeviceName) globalDeviceName = dev.name;
                            setDeviceName(dev.name);
                            dev.onmidimessage = onMIDIMessage;
                            // No hacemos break para escuchar todos los puertos de la FLX4 (a veces el puerto principal es el #2)
                        }
                    }

                    const outputs = midiAccess.outputs.values();
                    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
                        const dev = output.value;
                        if (dev.name?.toLowerCase().includes("flx4") || globalOutputPorts.length === 0) {
                            if (!globalOutputPorts.includes(dev)) {
                                globalOutputPorts.push(dev);
                            }
                            dev.open().then(() => {
                                // Pioneer "Track Loaded" LED animation to confirm connection and stop blinking
                                dev.send([0x9F, 0x00, 0x7F]); 
                                dev.send([0x9F, 0x01, 0x7F]);
                                
                                // Pioneer Advanced Init Handshake (SysEx) para apagar el modo Standby
                                try {
                                    dev.send([0xF0, 0x00, 0x40, 0x05, 0x00, 0x00, 0x02, 0x06, 0x00, 0x03, 0x01, 0xF7]);
                                } catch(e) {}
                            }).catch((e: any) => console.error("Error opening MIDI output:", e));
                        }
                    }

                    midiAccess.onstatechange = (e: any) => {
                        if (e.port.type === 'input' && e.port.state === 'connected') {
                            if (e.port.name?.toLowerCase().includes("flx4") || !globalDeviceName) {
                                e.port.onmidimessage = onMIDIMessage;
                                if (!globalDeviceName) globalDeviceName = e.port.name;
                                setDeviceName(globalDeviceName);
                            }
                        }
                        if (e.port.type === 'output' && e.port.state === 'connected') {
                            if (e.port.name?.toLowerCase().includes("flx4") || globalOutputPorts.length === 0) {
                                if (!globalOutputPorts.includes(e.port)) {
                                    globalOutputPorts.push(e.port);
                                }
                                e.port.open().then(() => {
                                    e.port.send([0x9F, 0x00, 0x7F]); 
                                    e.port.send([0x9F, 0x01, 0x7F]);
                                    try {
                                        e.port.send([0xF0, 0x00, 0x40, 0x05, 0x00, 0x00, 0x02, 0x06, 0x00, 0x03, 0x01, 0xF7]);
                                    } catch(err) {}
                                }).catch((err: any) => console.error(err));
                            }
                        }
                    };
                } catch (err) {
                    console.error("No se pudo acceder a MIDI: ", err);
                }
            };

            initMIDI();
        }

        return () => {
            globalListeners.delete(handleGlobalMessage);
        };
    }, []);

    return { midiEnabled, deviceName, lastMessages, addListener, removeListener, sendMidi };
}

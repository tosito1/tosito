import { useState, useEffect, useCallback } from 'react';
import type { MIDIMessage } from './useMIDI';
import defaultMappings from '../flx4_midi_map.json';

export type ActionId = string;

// Defines how a MIDI message uniquely identifies a hardware control
export interface MIDISignature {
    command: number;
    channel: number;
    data1: number; // The note or CC number
    isCC: boolean; // True if it's a Control Change (knob/fader), False if Note (button)
}

// Global mapping store: actionId -> MIDISignature
export type MIDIMapConfig = Record<ActionId, MIDISignature>;

// Increment version to flush user cache when defaults change
const STORAGE_KEY = 'dj_midi_mappings_v8';

export function useMIDIMapping() {
    const [mappings, setMappings] = useState<MIDIMapConfig>(defaultMappings);
    const [learningAction, setLearningAction] = useState<ActionId | null>(null);

    // Force sync with defaultMappings if it changes (e.g. via Vite HMR or updates)
    useEffect(() => {
        setMappings(prev => {
            // Only force update if the user hasn't modified their local storage
            // If they have custom mappings, we shouldn't overwrite them automatically
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return prev;
            return defaultMappings;
        });
    }, [defaultMappings]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setMappings(JSON.parse(saved));
            }
        } catch(e) { console.error("Error loading MIDI map", e); }
    }, []);

    // Save to localStorage when mappings change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
        } catch(e) { console.error("Error saving MIDI map", e); }
    }, [mappings]);

    // Handle an incoming MIDI message
    const processMidiLearn = useCallback((msg: MIDIMessage) => {
        if (!learningAction) return false; // Not in learning mode
        
        // Ignore note-offs (velocity 0) for learning
        if (msg.velocity === 0 && (msg.command === 8 || msg.command === 9)) return false;

        const isCC = msg.command === 11; // 0xB0 to 0xBF is Control Change
        const isNoteOn = msg.command === 9; // 0x90 to 0x9F is Note On
        
        if (!isCC && !isNoteOn) return false; // Ignore pitch bend, sysex, etc for mapping basic controls

        // Prevent mapping to 14-bit LSB (CC 32-63) to avoid wild fader jumping.
        // Exception: CC 34 is often used by Pioneer for jog wheels (relative mode).
        if (isCC && msg.note >= 32 && msg.note <= 63 && msg.note !== 34) {
            return false;
        }

        const signature: MIDISignature = {
            command: msg.command,
            channel: msg.channel,
            data1: msg.note,
            isCC
        };

        setMappings(prev => ({
            ...prev,
            [learningAction]: signature
        }));
        
        setLearningAction(null); // Clear learning state after capturing
        return true; // We intercepted the message
    }, [learningAction]);

    const startLearning = (actionId: ActionId) => {
        setLearningAction(actionId);
    };

    const cancelLearning = () => {
        setLearningAction(null);
    };

    const clearMapping = (actionId: ActionId) => {
        setMappings(prev => {
            const newMap = { ...prev };
            delete newMap[actionId];
            return newMap;
        });
    };

    const exportMappings = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mappings, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "flx4_midi_map.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const importMappings = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (e.target?.result) {
                    const parsed = JSON.parse(e.target.result as string);
                    setMappings(parsed);
                }
            } catch(err) {
                console.error("Error parsing MIDI map file", err);
                alert("Error: El archivo no es un perfil MIDI válido.");
            }
        };
        reader.readAsText(file);
    };

    const resetToDefault = () => {
        setMappings(defaultMappings);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMappings));
        } catch(e) { console.error("Error resetting MIDI map", e); }
    };

    return {
        mappings,
        learningAction,
        startLearning,
        cancelLearning,
        clearMapping,
        processMidiLearn,
        exportMappings,
        importMappings,
        resetToDefault
    };
}

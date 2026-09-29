import { useState, useEffect } from 'react';
export const DEFAULT_BEAT_FX = [
    'ECHO', 'REVERB', 'FLANGER', 'PHASER',
    'CHORUS', 'STUTTER', 'ROLL', 'CRUSH'
];

export const AVAILABLE_BEAT_FX = [
    'ECHO', 'REVERB', 'FLANGER', 'PHASER', 
    'CHORUS', 'STUTTER', 'ROLL', 'CRUSH',
    'DISTORTION', 'TRANS', 'PITCH_SHIFT', 
    'HELIX', 'SPIRAL'
];

export const FX_ABBREVIATIONS: Record<string, string> = {
    'ECHO': 'DLY',
    'REVERB': 'RVB',
    'FLANGER': 'FLG',
    'PHASER': 'PHS',
    'CHORUS': 'CRS',
    'STUTTER': 'STT',
    'ROLL': 'ROL',
    'CRUSH': 'CRH',
    'DISTORTION': 'DST',
    'TRANS': 'TRN',
    'PITCH_SHIFT': 'PTC',
    'HELIX': 'HLX',
    'SPIRAL': 'SPR'
};

export const FX_LEVELS: Record<string, number> = {
    'ECHO': 0.75,
    'REVERB': 0.8,
    'FLANGER': 0.7,
    'PHASER': 0.7,
    'CHORUS': 0.7,
    'STUTTER': 1.0,
    'ROLL': 1.0,
    'CRUSH': 1.0,
    'DISTORTION': 1.0,
    'TRANS': 1.0,
    'PITCH_SHIFT': 1.0,
    'HELIX': 0.8,
    'SPIRAL': 0.8,
    'NOISE': 1.0
};

export const useFXConfig = () => {
    const [beatFXList, setBeatFXList] = useState<string[]>(DEFAULT_BEAT_FX);

    useEffect(() => {
        const loadFx = () => {
            const saved = localStorage.getItem('dj_beat_fx_list') || localStorage.getItem('dj_fx_config');
            if (saved) {
                try {
                    let parsed = JSON.parse(saved);
                    // Migrate old effects and prevent duplicates
                    const migrated = parsed.map((fx: string) => {
                        if (fx === 'ROLL_1/4' || fx === 'ROLL_1/8') return 'ROLL';
                        return fx;
                    });
                    
                    // Deduplicate if ROLL was added twice
                    const uniqueFx = Array.from(new Set(migrated)) as string[];
                    
                    // Si al quitar duplicados nos faltan efectos (normalmente son 8), rellenamos con DEFAULT
                    while (uniqueFx.length < 8) {
                        const nextDefault = DEFAULT_BEAT_FX.find(f => !uniqueFx.includes(f));
                        uniqueFx.push(nextDefault || 'ECHO');
                    }
                    
                    setBeatFXList(uniqueFx);
                    localStorage.setItem('dj_beat_fx_list', JSON.stringify(uniqueFx));
                } catch (e) {
                    setBeatFXList(DEFAULT_BEAT_FX);
                }
            } else {
                setBeatFXList([...DEFAULT_BEAT_FX]);
                localStorage.setItem('dj_beat_fx_list', JSON.stringify(DEFAULT_BEAT_FX));
            }
        };

        loadFx();

        const handleStorageChange = () => {
            loadFx();
        };

        window.addEventListener('dj_fx_updated', handleStorageChange);
        return () => window.removeEventListener('dj_fx_updated', handleStorageChange);
    }, []);

    const updateFXSlot = (index: number, newFx: string) => {
        setBeatFXList(prev => {
            const newList = [...prev];
            newList[index] = newFx;
            localStorage.setItem('dj_beat_fx_list', JSON.stringify(newList));
            window.dispatchEvent(new Event('dj_fx_updated'));
            return newList;
        });
    };

    const resetToDefault = () => {
        localStorage.setItem('dj_beat_fx_list', JSON.stringify(DEFAULT_BEAT_FX));
        window.dispatchEvent(new Event('dj_fx_updated'));
        setBeatFXList(DEFAULT_BEAT_FX);
    };

    return { beatFXList, updateFXSlot, resetToDefault };
};

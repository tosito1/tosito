const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CAMELOT_MAJOR: { [key: string]: string } = {
    'B': '1B', 'F#': '2B', 'C#': '3B', 'G#': '4B', 'D#': '5B', 'A#': '6B',
    'F': '7B', 'C': '8B', 'G': '9B', 'D': '10B', 'A': '11B', 'E': '12B'
};

const CAMELOT_MINOR: { [key: string]: string } = {
    'G#': '1A', 'D#': '2A', 'A#': '3A', 'F': '4A', 'C': '5A', 'G': '6A',
    'D': '7A', 'A': '8A', 'E': '9A', 'B': '10A', 'F#': '11A', 'C#': '12A'
};

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const BASE_FREQS = [
    130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94, // Octave 3
    261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, // Octave 4
    523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 830.61, 880.00, 932.33, 987.77  // Octave 5
];

// Goertzel Algorithm for specific frequency magnitude
function runGoertzel(data: Float32Array, targetFreq: number, sampleRate: number): number {
    const k = Math.round(targetFreq * data.length / sampleRate);
    const w = (2 * Math.PI * k) / data.length;
    const cosine = Math.cos(w);
    const coeff = 2 * cosine;
    let q0 = 0, q1 = 0, q2 = 0;
    
    // Subsample for massive performance gain, 4 is safe up to ~5kHz
    const step = 4;
    for (let i = 0; i < data.length; i += step) {
        q0 = coeff * q1 - q2 + data[i];
        q2 = q1;
        q1 = q0;
    }
    const magnitude = Math.sqrt(q1 * q1 + q2 * q2 - q1 * q2 * coeff);
    return magnitude;
}

export const analyzeKey = async (midData: Float32Array, sampleRate: number): Promise<string> => {
    const chunkLength = sampleRate; // 1 second chunks
    const numChunks = 15; // 15 seconds total of sampling across the track
    const step = Math.floor(midData.length / numChunks);
    
    let chroma = new Array(12).fill(0);
    
    for (let c = 0; c < numChunks; c++) {
        // Yield to UI thread to prevent freezing
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const start = c * step;
        const end = Math.min(start + chunkLength, midData.length);
        const chunk = midData.subarray(start, end);
        
        for (let i = 0; i < 36; i++) {
            const freq = BASE_FREQS[i];
            const mag = runGoertzel(chunk, freq, sampleRate);
            chroma[i % 12] += mag; // Accumulate energy into 12 pitch classes
        }
    }
    
    // Normalize chromagram
    const maxChroma = Math.max(...chroma);
    if (maxChroma > 0) chroma = chroma.map(v => v / maxChroma);
    
    // Krumhansl-Schmuckler Key-Finding Algorithm
    let maxCorr = -Infinity;
    let detectedKey = '8B'; // Default C Major
    
    for (let shift = 0; shift < 12; shift++) {
        let corrMajor = 0;
        let corrMinor = 0;
        for (let i = 0; i < 12; i++) {
            const profileIdx = (i - shift + 12) % 12;
            corrMajor += chroma[i] * MAJOR_PROFILE[profileIdx];
            corrMinor += chroma[i] * MINOR_PROFILE[profileIdx];
        }
        
        if (corrMajor > maxCorr) {
            maxCorr = corrMajor;
            detectedKey = CAMELOT_MAJOR[PITCH_CLASSES[shift]];
        }
        if (corrMinor > maxCorr) {
            maxCorr = corrMinor;
            detectedKey = CAMELOT_MINOR[PITCH_CLASSES[shift]];
        }
    }
    
    return detectedKey;
};

export const analyzeEnergyProfile = (peaks: { lowRms: number, midRms: number, highRms: number }[]): number[] => {
    const profileBins = 150; // 150 points for progress bar
    const energyProfile = [];
    if (peaks.length === 0) return [];

    const binSize = Math.max(1, Math.floor(peaks.length / profileBins));
    let maxEnergy = 0;
    for (let i = 0; i < profileBins; i++) {
        let sum = 0;
        let count = 0;
        for (let j = 0; j < binSize; j++) {
            const idx = i * binSize + j;
            if (idx >= peaks.length) break;
            // Sum low and mid RMS for perceived musical energy
            sum += peaks[idx].lowRms + peaks[idx].midRms;
            count++;
        }
        const val = count > 0 ? sum / count : 0;
        energyProfile.push(val);
        if (val > maxEnergy) maxEnergy = val;
    }

    // Normalize to 0-1
    if (maxEnergy > 0) {
        return energyProfile.map(v => v / maxEnergy);
    }
    return energyProfile;
};

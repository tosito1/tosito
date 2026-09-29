import React, { useState, useEffect, useRef } from 'react';
import { getTrackAnalysis, saveTrackAnalysis } from './utils/db';
import { analyzeKey, analyzeEnergyProfile } from './utils/audioAnalysis';
import { Power, Play, Pause, Disc, Settings, Repeat, Headphones, Mic, Activity, Radio, FolderPlus, ListMusic, Plus, Music, ArrowRightToLine, Search, ChevronUp, ChevronDown, Menu } from 'lucide-react';
import { useMIDI } from './useMIDI';
import { MIDIDebugger } from './MIDIDebugger';
import { MenuModal } from './MenuModal';
import { useFXConfig, FX_ABBREVIATIONS, FX_LEVELS, AVAILABLE_BEAT_FX } from './useFXConfig';

const BPM_BASE = 128;
const DEFAULT_TRACK_INFO = { title: "LOAD TRACK", artist: "NO MEDIA", duration: 0 };

// ============================================================
// PROFESSIONAL FX ENGINE — Studio/Club Grade Web Audio Effects
// ============================================================
const buildReverb = (audioCtx: AudioContext, decaySecs = 3.0, predelayMs = 20, lpFreq = 4500): ConvolverNode => {
    const convolver = audioCtx.createConvolver();
    const sr = audioCtx.sampleRate;
    const predelaySamples = Math.floor((predelayMs / 1000) * sr);
    const totalLength = Math.floor(sr * decaySecs) + predelaySamples;
    const impulse = audioCtx.createBuffer(2, totalLength, sr);
    
    // Create Schroeder-style dense tail by filtering and shaping white noise
    for (let ch = 0; ch < 2; ch++) {
        const channelData = impulse.getChannelData(ch);
        let prev1 = 0, prev2 = 0;
        const alpha1 = 0.15; // steep high-frequency rolloff
        const alpha2 = 0.1;
        
        for (let j = predelaySamples; j < totalLength; j++) {
            const t = j - predelaySamples;
            // Exponential decay envelope
            const envelope = Math.exp(-t / (sr * decaySecs * 0.25));
            // Stereo-decorrelated white noise
            const noise = (Math.random() * 2 - 1) * envelope;
            
            // 2-pole lowpass filter for dark, warm tail
            prev1 = prev1 + alpha1 * (noise - prev1);
            prev2 = prev2 + alpha2 * (prev1 - prev2);
            
            channelData[j] = prev2;
        }
    }
    convolver.buffer = impulse;
    
    // External dampening LP
    const postLp = audioCtx.createBiquadFilter();
    postLp.type = 'lowpass'; postLp.frequency.value = lpFreq; postLp.Q.value = 0.3;
    convolver.connect(postLp);
    (convolver as any)._postLp = postLp;
    return convolver;
};

const createPadFX = (audioCtx: AudioContext, type: string, tempoBPM: number) => {
    const wetGain = audioCtx.createGain();
    wetGain.gain.value = 0;
    let effectNode: any = null;
    let internals: any = {};
    const beatDuration = 60 / tempoBPM;

    switch (type) {
        case 'ROLL': {
            // True Roll: Capture exactly 1 beat, then loop infinitely without taking new audio
            const delay = audioCtx.createDelay(2);
            delay.delayTime.value = beatDuration * 0.5;
            
            // We use a Gate (GainNode) to stop audio from entering the delay line after activation
            const inputGate = audioCtx.createGain();
            inputGate.gain.value = 1.0;
            
            const feedback = audioCtx.createGain(); 
            feedback.gain.value = 1.0; // 100% feedback for infinite loop
            
            const fbLp = audioCtx.createBiquadFilter(); 
            fbLp.type = 'lowpass'; fbLp.frequency.value = 18000;
            
            inputGate.connect(delay);
            delay.connect(fbLp); fbLp.connect(feedback); feedback.connect(delay);
            delay.connect(wetGain);
            
            effectNode = inputGate;
            internals.feedback = feedback;
            internals.rollDelay = delay;
            internals.inputGate = inputGate; // We will use this in triggerPadFX to shut the gate
            break;
        }
        case 'ECHO': {
            const delay = audioCtx.createDelay(4);
            delay.delayTime.value = beatDuration * 0.5;
            
            const echoFb = audioCtx.createGain(); 
            echoFb.gain.value = 0.7; // Pioneer default
            
            // HPF to prevent bass muddiness in the feedback loop
            const hpf = audioCtx.createBiquadFilter();
            hpf.type = 'highpass'; hpf.frequency.value = 300; hpf.Q.value = 0.5;
            
            // LPF to emulate analog decay
            const lpf = audioCtx.createBiquadFilter();
            lpf.type = 'lowpass'; lpf.frequency.value = 4000; lpf.Q.value = 0.3;
            
            effectNode = audioCtx.createGain();
            effectNode.connect(delay);
            delay.connect(hpf); hpf.connect(lpf); lpf.connect(echoFb); echoFb.connect(delay);
            delay.connect(wetGain);
            
            internals.feedback = echoFb;
            internals.echoDelay = delay;
            break;
        }
        case 'REVERB': {
            const convolver = buildReverb(audioCtx, 3.5, 20, 7500);
            const preHpf = audioCtx.createBiquadFilter();
            preHpf.type = 'highpass'; preHpf.frequency.value = 400; // Cut kick from reverb
            
            effectNode = audioCtx.createGain();
            effectNode.connect(preHpf);
            preHpf.connect(convolver);
            
            const postLp = (convolver as any)._postLp as BiquadFilterNode;
            postLp.connect(wetGain);
            
            internals.postLp = postLp;
            internals.preHpf = preHpf;
            break;
        }
        case 'PHASER': {
            // Pioneer style 8-stage stereo Phaser with deep resonance
            const splitter = audioCtx.createChannelSplitter(2);
            const merger = audioCtx.createChannelMerger(2);
            effectNode = audioCtx.createGain();
            effectNode.connect(splitter);
            
            const buildPhaserSide = () => {
                const stages: BiquadFilterNode[] = [];
                for(let i=0; i<8; i++) { // Upgraded to 8 stages
                    const ap = audioCtx.createBiquadFilter();
                    ap.type = 'allpass'; ap.Q.value = 2.0; ap.frequency.value = 1000;
                    stages.push(ap);
                }
                for(let i=0; i<7; i++) stages[i].connect(stages[i+1]);
                
                // Deep resonance feedback
                const fb = audioCtx.createGain();
                fb.gain.value = 0.6;
                stages[7].connect(fb);
                fb.connect(stages[0]);
                
                return stages;
            };
            
            const stagesL = buildPhaserSide();
            const stagesR = buildPhaserSide();
            
            const lfoGainL = audioCtx.createGain(); lfoGainL.gain.value = 1500; // Wider sweep
            const lfoGainR = audioCtx.createGain(); lfoGainR.gain.value = 1500;
            
            const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.4;
            const inverter = audioCtx.createGain(); inverter.gain.value = -1; // Stereo offset
            lfo.connect(lfoGainL);
            lfo.connect(inverter); inverter.connect(lfoGainR);
            
            stagesL.forEach(s => lfoGainL.connect(s.frequency));
            stagesR.forEach(s => lfoGainR.connect(s.frequency));
            
            const sideGainL = audioCtx.createGain(); sideGainL.gain.value = 0.7;
            const sideGainR = audioCtx.createGain(); sideGainR.gain.value = 0.7;
            
            splitter.connect(stagesL[0], 0); stagesL[7].connect(sideGainL); 
            splitter.connect(sideGainL, 0); // Dry pass L for cancellation
            
            splitter.connect(stagesR[0], 1); stagesR[7].connect(sideGainR);
            splitter.connect(sideGainR, 1); // Dry pass R for cancellation
            
            sideGainL.connect(merger, 0, 0);
            sideGainR.connect(merger, 0, 1);
            
            merger.connect(wetGain);
            lfo.start();
            internals.lfo = lfo;
            break;
        }
        case 'FLANGER': {
            // Comb Filter Flanger with high resonance
            const splitter = audioCtx.createChannelSplitter(2);
            const merger = audioCtx.createChannelMerger(2);
            effectNode = audioCtx.createGain();
            effectNode.connect(splitter);
            
            const delayL = audioCtx.createDelay(0.02); delayL.delayTime.value = 0.005;
            const delayR = audioCtx.createDelay(0.02); delayR.delayTime.value = 0.005;
            
            const fbL = audioCtx.createGain(); fbL.gain.value = 0.92; // Metallic resonance
            const fbR = audioCtx.createGain(); fbR.gain.value = 0.92;
            
            delayL.connect(fbL); fbL.connect(delayL);
            delayR.connect(fbR); fbR.connect(delayR);
            
            const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.2;
            const depthL = audioCtx.createGain(); depthL.gain.value = 0.004;
            const depthR = audioCtx.createGain(); depthR.gain.value = -0.004; // Stereo invert
            
            lfo.connect(depthL); depthL.connect(delayL.delayTime);
            lfo.connect(depthR); depthR.connect(delayR.delayTime);
            
            splitter.connect(delayL, 0); splitter.connect(delayR, 1);
            
            const wetL = audioCtx.createGain(); wetL.gain.value = 0.8;
            const wetR = audioCtx.createGain(); wetR.gain.value = 0.8;
            delayL.connect(wetL); delayR.connect(wetR);
            
            splitter.connect(wetL, 0); splitter.connect(wetR, 1); // Add dry for comb effect
            
            wetL.connect(merger, 0, 0); wetR.connect(merger, 0, 1);
            merger.connect(wetGain);
            lfo.start();
            
            internals.lfo = lfo;
            internals.feedbackL = fbL;
            internals.feedbackR = fbR;
            break;
        }
        case 'CRUSH': {
            // True Bitcrusher (Stepped Bit Reduction + LP Filter)
            const n = 256; 
            const bitDepth = 4; // 4-bit for gritty crunch
            const steps = Math.pow(2, bitDepth);
            const crushCurve = new Float32Array(n);
            for (let i = 0; i < n; i++) {
                const x = (i * 2) / n - 1; 
                crushCurve[i] = Math.round(x * steps) / steps; 
            }
            const crusher = audioCtx.createWaveShaper();
            crusher.curve = crushCurve;
            crusher.oversample = 'none'; 
            
            // To simulate sample-rate reduction warmth, use a Lowpass filter
            const crushLp = audioCtx.createBiquadFilter();
            crushLp.type = 'lowpass'; crushLp.frequency.value = 3500; crushLp.Q.value = 2.0;
            
            crusher.connect(crushLp); crushLp.connect(wetGain);
            effectNode = crusher;
            break;
        }
        case 'STUTTER': {
            effectNode = audioCtx.createGain();
            effectNode.gain.value = 0.5; // base level 50%
            
            const stutterLfo = audioCtx.createOscillator();
            stutterLfo.type = 'sine'; // Sine shaped into soft square
            stutterLfo.frequency.value = (tempoBPM / 60) * 4;
            
            const shaper = audioCtx.createWaveShaper();
            const curve = new Float32Array(256);
            for(let i=0; i<256; i++) curve[i] = Math.tanh(((i * 2) / 256 - 1) * 15);
            shaper.curve = curve;
            
            const modGain = audioCtx.createGain(); 
            modGain.gain.value = 0.5; // Scale to -0.5/+0.5
            
            stutterLfo.connect(shaper);
            shaper.connect(modGain);
            modGain.connect(effectNode.gain);
            
            stutterLfo.start();
            effectNode.connect(wetGain);
            internals.stutterLfo = stutterLfo;
            break;
        }
        case 'SPIRAL': {
            effectNode = audioCtx.createGain();
            const delay = audioCtx.createDelay(4);
            delay.delayTime.value = beatDuration * 0.75;
            
            const spiralFb = audioCtx.createGain(); spiralFb.gain.value = 0.6;
            
            // True Pitch-Shifting echo using an asymmetric delay modulation inside the loop
            const pitchShiftDelay = audioCtx.createDelay(1);
            pitchShiftDelay.delayTime.value = 0.02;
            
            const lfo = audioCtx.createOscillator(); lfo.type = 'sawtooth'; lfo.frequency.value = 5;
            const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 0.01;
            lfo.connect(lfoGain); lfoGain.connect(pitchShiftDelay.delayTime);
            lfo.start();

            effectNode.connect(delay);
            delay.connect(pitchShiftDelay);
            pitchShiftDelay.connect(spiralFb); spiralFb.connect(delay);
            delay.connect(wetGain);
            
            internals.spiralLfo = lfo;
            internals.feedback = spiralFb;
            internals.echoDelay = delay;
            break;
        }
        case 'CHORUS': {
            const chorusIn = audioCtx.createGain();
            effectNode = chorusIn;
            for(let i=0; i<3; i++) {
                const delay = audioCtx.createDelay(0.1);
                delay.delayTime.value = 0.015 + (i * 0.005);
                const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.5 + (i * 0.2);
                const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 0.002;
                lfo.connect(lfoGain); lfoGain.connect(delay.delayTime); lfo.start();
                chorusIn.connect(delay); delay.connect(wetGain);
                internals[`lfo${i}`] = lfo;
            }
            break;
        }
        // ──────────────── DISTORTION / OVERDRIVE ────────────────
        case 'DISTORTION': {
            const n = 256;
            const curve = new Float32Array(n);
            for (let i = 0; i < n; ++i) {
                const x = (i * 2) / n - 1;
                curve[i] = (3 + 20) * x * 20 * (Math.PI / 180) / (Math.PI + 20 * Math.abs(x));
            }
            effectNode = audioCtx.createWaveShaper();
            (effectNode as WaveShaperNode).curve = curve;
            (effectNode as WaveShaperNode).oversample = '4x';
            effectNode.connect(wetGain);
            break;
        }
        // ──────────────── TRANS / GATE ────────────────
        case 'TRANS': {
            effectNode = audioCtx.createGain();
            effectNode.gain.value = 0.5; // base level 50%
            
            const transLfo = audioCtx.createOscillator();
            transLfo.type = 'sine'; // Sine shaped into soft square
            transLfo.frequency.value = (tempoBPM / 60) * 2;
            
            const shaper = audioCtx.createWaveShaper();
            const curve = new Float32Array(256);
            for(let i=0; i<256; i++) curve[i] = Math.tanh(((i * 2) / 256 - 1) * 15);
            shaper.curve = curve;
            
            const modGain = audioCtx.createGain(); 
            modGain.gain.value = 0.5; // Scale to -0.5/+0.5
            
            transLfo.connect(shaper);
            shaper.connect(modGain);
            modGain.connect(effectNode.gain);
            
            transLfo.start();
            effectNode.connect(wetGain);
            internals.transLfo = transLfo;
            break;
        }
        // ──────────────── PITCH SHIFT (GLITCH) ────────────────
        case 'PITCH_SHIFT': {
            const inputGain = audioCtx.createGain();
            const delay1 = audioCtx.createDelay(1);
            const delay2 = audioCtx.createDelay(1);
            delay1.delayTime.value = 0.05; delay2.delayTime.value = 0.05;
            const lfo1 = audioCtx.createOscillator(); lfo1.type = 'sawtooth'; lfo1.frequency.value = 5;
            const lfo2 = audioCtx.createOscillator(); lfo2.type = 'sawtooth'; lfo2.frequency.value = 5;
            const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 0.02; 
            lfo1.connect(lfoGain); lfoGain.connect(delay1.delayTime);
            lfo2.connect(lfoGain); lfoGain.connect(delay2.delayTime); 
            inputGain.connect(delay1); inputGain.connect(delay2);
            delay1.connect(wetGain); delay2.connect(wetGain);
            lfo1.start(); lfo2.start(audioCtx.currentTime + 0.1); 
            effectNode = inputGain;
            internals.lfo1 = lfo1; internals.lfo2 = lfo2;
            break;
        }
        // ──────────────── HELIX ────────────────
        case 'HELIX': {
            effectNode = audioCtx.createDelay(4);
            effectNode.delayTime.value = beatDuration * 0.5;
            const helixFb = audioCtx.createGain(); helixFb.gain.value = 0.8;
            const helixPhaser = audioCtx.createBiquadFilter();
            helixPhaser.type = 'allpass'; helixPhaser.frequency.value = 1000;
            const helixLfo = audioCtx.createOscillator(); helixLfo.type = 'sine'; helixLfo.frequency.value = 0.2;
            const helixMod = audioCtx.createGain(); helixMod.gain.value = 800;
            helixLfo.connect(helixMod); helixMod.connect(helixPhaser.frequency);
            helixLfo.start();
            effectNode.connect(helixPhaser); helixPhaser.connect(helixFb); helixFb.connect(effectNode);
            effectNode.connect(wetGain);
            internals.helixLfo = helixLfo;
            break;
        }
        // ──────────────── NOISE ────────────────
        case 'NOISE': {
            effectNode = audioCtx.createGain(); 
            const bufferSize = audioCtx.sampleRate * 2;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            const whiteNoise = audioCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer; whiteNoise.loop = true;
            const noiseFilter = audioCtx.createBiquadFilter();
            noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 1000; noiseFilter.Q.value = 1.0;
            whiteNoise.connect(noiseFilter); noiseFilter.connect(wetGain);
            whiteNoise.start();
            internals.whiteNoise = whiteNoise; internals.noiseFilter = noiseFilter;
            break;
        }
        default: effectNode = audioCtx.createGain();
    }

    if (effectNode && type !== 'PHASER' && type !== 'REVERB' && type !== 'CRUSH' &&
        type !== 'ROLL_1/4' && type !== 'ROLL_1/8' && type !== 'FLANGER' && type !== 'SPIRAL' && type !== 'CHORUS' &&
        type !== 'DISTORTION' && type !== 'TRANS' && type !== 'PITCH_SHIFT' && type !== 'HELIX' && type !== 'NOISE') {
        effectNode.connect(wetGain);
    }
    return { wetGain, effectNode, internals };
};

const playSynthSample = (ctx: AudioContext, type: string) => {
    const t = ctx.currentTime;
    const dest = ctx.destination;

    switch (type) {
        case 'KICK':
            const kOsc = ctx.createOscillator(); const kGain = ctx.createGain();
            kOsc.connect(kGain); kGain.connect(dest);
            kOsc.frequency.setValueAtTime(150, t); kOsc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
            kGain.gain.setValueAtTime(1, t); kGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            kOsc.start(t); kOsc.stop(t + 0.5);
            break;
        case 'SNARE':
            const nSize = ctx.sampleRate * 0.2; const nBuffer = ctx.createBuffer(1, nSize, ctx.sampleRate);
            const nOut = nBuffer.getChannelData(0);
            for (let i = 0; i < nSize; i++) nOut[i] = Math.random() * 2 - 1;
            const nSource = ctx.createBufferSource(); nSource.buffer = nBuffer;
            const nFilter = ctx.createBiquadFilter(); nFilter.type = 'highpass'; nFilter.frequency.value = 1000;
            const sGain = ctx.createGain();
            nSource.connect(nFilter); nFilter.connect(sGain); sGain.connect(dest);
            sGain.gain.setValueAtTime(1, t); sGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            nSource.start(t);
            const sOsc = ctx.createOscillator(); sOsc.type = 'triangle'; sOsc.connect(sGain);
            sOsc.frequency.setValueAtTime(250, t); sOsc.frequency.exponentialRampToValueAtTime(0.01, t + 0.2);
            sOsc.start(t); sOsc.stop(t + 0.2);
            break;
        case 'HI_HAT':
            const hhSize = ctx.sampleRate * 0.05; const hhBuffer = ctx.createBuffer(1, hhSize, ctx.sampleRate);
            const hhOut = hhBuffer.getChannelData(0);
            for (let i = 0; i < hhSize; i++) hhOut[i] = Math.random() * 2 - 1;
            const hhSource = ctx.createBufferSource(); hhSource.buffer = hhBuffer;
            const hhFilter = ctx.createBiquadFilter(); hhFilter.type = 'bandpass'; hhFilter.frequency.value = 10000;
            const hhGain = ctx.createGain();
            hhSource.connect(hhFilter); hhFilter.connect(hhGain); hhGain.connect(dest);
            hhGain.gain.setValueAtTime(1, t); hhGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            hhSource.start(t);
            break;
        case 'AIRHORN':
            const aGain = ctx.createGain(); aGain.connect(dest);
            const osc = ctx.createOscillator(); const osc2 = ctx.createOscillator(); const osc3 = ctx.createOscillator();
            osc.type = 'sawtooth'; osc2.type = 'sawtooth'; osc3.type = 'sawtooth';
            osc.frequency.value = 300; osc2.frequency.value = 315; osc3.frequency.value = 285;
            osc.connect(aGain); osc2.connect(aGain); osc3.connect(aGain);
            aGain.gain.setValueAtTime(0.8, t); aGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
            const pulse = ctx.createOscillator(); pulse.frequency.value = 8;
            const pulseGain = ctx.createGain(); pulseGain.gain.value = 0.5;
            pulse.connect(pulseGain); pulseGain.connect(aGain.gain);
            pulse.start(t); pulse.stop(t + 1.5);
            osc.start(t); osc2.start(t); osc3.start(t);
            osc.stop(t + 1.5); osc2.stop(t + 1.5); osc3.stop(t + 1.5);
            break;
        case 'LASER':
            const lOsc = ctx.createOscillator(); const lGain = ctx.createGain();
            lOsc.connect(lGain); lGain.connect(dest);
            lOsc.type = 'sawtooth'; lOsc.frequency.setValueAtTime(1000, t); lOsc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
            lGain.gain.setValueAtTime(0.5, t); lGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            lOsc.start(t); lOsc.stop(t + 0.3);
            break;
        case 'SUB DROP':
            const subOsc = ctx.createOscillator(); const subGain = ctx.createGain();
            subOsc.connect(subGain); subGain.connect(dest);
            subOsc.type = 'sine'; subOsc.frequency.setValueAtTime(80, t); subOsc.frequency.exponentialRampToValueAtTime(10, t + 2);
            subGain.gain.setValueAtTime(1.0, t); subGain.gain.linearRampToValueAtTime(0, t + 2);
            subOsc.start(t); subOsc.stop(t + 2);
            break;
        case 'SIREN':
            const sirOsc = ctx.createOscillator(); const sirGain = ctx.createGain();
            sirOsc.connect(sirGain); sirGain.connect(dest);
            sirOsc.type = 'sine';
            const sirenLfo = ctx.createOscillator(); sirenLfo.type = 'square'; sirenLfo.frequency.value = 2;
            const sirenLfoGain = ctx.createGain(); sirenLfoGain.gain.value = 400;
            sirenLfo.connect(sirenLfoGain); sirenLfoGain.connect(sirOsc.frequency);
            sirOsc.frequency.value = 800;
            sirGain.gain.setValueAtTime(0.5, t); sirGain.gain.linearRampToValueAtTime(0.5, t + 2); sirGain.gain.linearRampToValueAtTime(0, t + 2.5);
            sirOsc.start(t); sirOsc.stop(t + 2.5); sirenLfo.start(t); sirenLfo.stop(t + 2.5);
            break;
        case 'SWEEP':
            const swSize = ctx.sampleRate * 3; const swBuffer = ctx.createBuffer(1, swSize, ctx.sampleRate);
            const swOut = swBuffer.getChannelData(0);
            for (let i = 0; i < swSize; i++) swOut[i] = Math.random() * 2 - 1;
            const swSource = ctx.createBufferSource(); swSource.buffer = swBuffer;
            const swFilter = ctx.createBiquadFilter(); swFilter.type = 'lowpass';
            const swGain = ctx.createGain();
            swSource.connect(swFilter); swFilter.connect(swGain); swGain.connect(dest);
            swFilter.frequency.setValueAtTime(200, t); swFilter.frequency.exponentialRampToValueAtTime(10000, t + 3);
            swGain.gain.setValueAtTime(0.5, t); swGain.gain.linearRampToValueAtTime(0, t + 3);
            swSource.start(t);
            break;
    }
};

const useMicrophone = (audioContext: AudioContext | null) => {
    const [active, setActive] = useState(false);
    const [vol, setVol] = useState(50);

    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!audioContext) return;
        gainRef.current = audioContext.createGain();
        gainRef.current.gain.value = vol / 100;
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;
        gainRef.current.connect(analyserRef.current);
        gainRef.current.connect(audioContext.destination);
    }, [audioContext]);

    const getLevel = () => {
        if (analyserRef.current && active) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0; for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            return (sum / dataArray.length) / 255;
        }
        return 0;
    };

    const toggleMic = async () => {
        if (active) {
            streamRef.current?.getTracks().forEach(t => t.stop());
            sourceRef.current?.disconnect();
            setActive(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (audioContext && gainRef.current) {
                    const source = audioContext.createMediaStreamSource(stream);
                    source.connect(gainRef.current);
                    sourceRef.current = source;
                    streamRef.current = stream;
                    setActive(true);
                }
            } catch (err) { console.error("Mic access denied", err); }
        }
    };
    return { active, toggleMic, getLevel, vol, setVol };
};

const useAudioDeck = (audioContext: AudioContext | null, beatFXList: string[] = []) => {
    const [isPlayingState, setIsPlayingState] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [gridOffset, setGridOffset] = useState(0);
    const isPlayingRef = useRef(false);
    const isPlaying = isPlayingState;
    const setIsPlaying = (val: boolean) => { isPlayingRef.current = val; setIsPlayingState(val); };

    const [trackInfo, setTrackInfo] = useState(DEFAULT_TRACK_INFO);
    const [bpm, setBpm] = useState(BPM_BASE);
    const [musicalKey, setMusicalKey] = useState("KEY");
    const [energyProfile, setEnergyProfile] = useState<number[]>([]);
    const [pitchPercent, setPitchPercent] = useState(0);
    const [keyLock, setKeyLock] = useState(true);
    const [waveformPeaks, setWaveformPeaks] = useState<{ low: number, mid: number, high: number }[]>([]);
    const [loopActive, setLoopActive] = useState(false);
    const [loopIn, setLoopInState] = useState<number | null>(null);
    const [loopOut, setLoopOutState] = useState<number | null>(null);
    const loopAdjustModeRef = useRef<'none' | 'in' | 'out'>('none');
    const [loopAdjustMode, setLoopAdjustModeState] = useState<'none' | 'in' | 'out'>('none');
    const setLoopAdjustMode = (mode: 'none' | 'in' | 'out' | ((prev: 'none' | 'in' | 'out') => 'none' | 'in' | 'out')) => {
        const nextMode = typeof mode === 'function' ? mode(loopAdjustModeRef.current) : mode;
        loopAdjustModeRef.current = nextMode;
        setLoopAdjustModeState(nextMode);
    };
    const [quantize, setQuantize] = useState(false);
    const [isSyncEnabled, setIsSyncEnabled] = useState(false);
    const [hotCues, setHotCues] = useState<Record<number, number>>({});


    const baseBpmRef = useRef(BPM_BASE);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const bufferRef = useRef<AudioBuffer | null>(null);
    const reversedBufferRef = useRef<AudioBuffer | null>(null);
    const mainTrackGainRef = useRef<GainNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    const eqLowRef = useRef<GainNode | null>(null);
    const eqMidRef = useRef<GainNode | null>(null);
    const eqHighRef = useRef<GainNode | null>(null);
    const colorFilterRef = useRef<BiquadFilterNode | null>(null);
    const colorNoiseRef = useRef<AudioBufferSourceNode | null>(null);
    const colorGainRef = useRef<GainNode | null>(null);
    const trimNodeRef = useRef<GainNode | null>(null);
    const fxNodesRef = useRef<any>({});
    const dryGainRef = useRef<GainNode | null>(null);
    const xfaderNodeRef = useRef<GainNode | null>(null);
    const masterNodeRef = useRef<GainNode | null>(null);

    const pitchRatioRef = useRef(1);
    const startTimeRef = useRef(0);
    const pauseTimeRef = useRef(0);
    const cuePointRef = useRef(0);
    const isStutteringRef = useRef(false);
    const loopInRef = useRef<number | null>(null);
    const loopOutRef = useRef<number | null>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const isScrubbingRef = useRef(false);
    const fxLevelRef = useRef(1.0);

    useEffect(() => {
        if (!audioContext) return;

        const mainTrackGain = audioContext.createGain(); mainTrackGain.gain.value = 1;
        mainTrackGainRef.current = mainTrackGain;

        trimNodeRef.current = audioContext.createGain();
        mainTrackGain.connect(trimNodeRef.current);
        const dryGain = audioContext.createGain(); dryGain.gain.value = 1; dryGainRef.current = dryGain;

        // 24dB/octave (4th Order) Linkwitz-Riley Crossover Network
        const lowPass1 = audioContext.createBiquadFilter(); lowPass1.type = 'lowpass'; lowPass1.frequency.value = 350;
        const lowPass2 = audioContext.createBiquadFilter(); lowPass2.type = 'lowpass'; lowPass2.frequency.value = 350;

        const midHighPass1 = audioContext.createBiquadFilter(); midHighPass1.type = 'highpass'; midHighPass1.frequency.value = 350;
        const midHighPass2 = audioContext.createBiquadFilter(); midHighPass2.type = 'highpass'; midHighPass2.frequency.value = 350;
        const midLowPass1 = audioContext.createBiquadFilter(); midLowPass1.type = 'lowpass'; midLowPass1.frequency.value = 3000;
        const midLowPass2 = audioContext.createBiquadFilter(); midLowPass2.type = 'lowpass'; midLowPass2.frequency.value = 3000;

        const highPass1 = audioContext.createBiquadFilter(); highPass1.type = 'highpass'; highPass1.frequency.value = 3000;
        const highPass2 = audioContext.createBiquadFilter(); highPass2.type = 'highpass'; highPass2.frequency.value = 3000;

        const lowGain = audioContext.createGain();
        const midGain = audioContext.createGain();
        const highGain = audioContext.createGain();
        const eqSum = audioContext.createGain();

        const colorFilter = audioContext.createBiquadFilter();
        colorFilter.type = 'lowpass'; colorFilter.frequency.value = 20000;

        const gainNode = audioContext.createGain();
        const xfaderNode = audioContext.createGain();
        const masterNode = audioContext.createGain();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        trimNodeRef.current.connect(dryGain);

        dryGain.connect(lowPass1); lowPass1.connect(lowPass2); lowPass2.connect(lowGain); lowGain.connect(eqSum);

        dryGain.connect(midHighPass1); midHighPass1.connect(midHighPass2);
        midHighPass2.connect(midLowPass1); midLowPass1.connect(midLowPass2);
        midLowPass2.connect(midGain); midGain.connect(eqSum);

        dryGain.connect(highPass1); highPass1.connect(highPass2); highPass2.connect(highGain); highGain.connect(eqSum);

        eqSum.connect(colorFilter);
        colorFilter.connect(gainNode); gainNode.connect(xfaderNode); xfaderNode.connect(masterNode); masterNode.connect(analyser); analyser.connect(audioContext.destination);

        const fxTap = audioContext.createGain(); fxTap.gain.value = 1;
        xfaderNode.connect(fxTap); // Tap after crossfader!

        const fxNodes: any = {};
        AVAILABLE_BEAT_FX.forEach(fxType => {
            fxNodes[fxType] = createPadFX(audioContext, fxType, bpm);
        });
        fxNodesRef.current = fxNodes;

        Object.values(fxNodesRef.current).forEach((fx: any) => {
            fxTap.connect(fx.effectNode);
            fx.wetGain.connect(masterNode); // wet signal merges directly to master
        });

        gainNodeRef.current = gainNode; eqLowRef.current = lowGain; eqMidRef.current = midGain;
        eqHighRef.current = highGain; colorFilterRef.current = colorFilter; analyserRef.current = analyser;
        xfaderNodeRef.current = xfaderNode; masterNodeRef.current = masterNode;

    }, [audioContext]);

    const getLevel = () => {
        if (analyserRef.current && isPlaying && !isScrubbingRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0; for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            return (sum / dataArray.length) / 255;
        }
        return 0;
    };

    const getProgress = () => {
        if (!bufferRef.current) return 0;
        let time = pauseTimeRef.current;
        if (isPlaying && !isScrubbingRef.current && audioContext) {
            time = (audioContext.currentTime - startTimeRef.current) * pitchRatioRef.current;
        }

        if (loopActive && loopInRef.current !== null && loopOutRef.current !== null) {
            if (time >= loopOutRef.current && time >= loopInRef.current) {
                const loopDuration = loopOutRef.current - loopInRef.current;
                time = loopInRef.current + ((time - loopInRef.current) % loopDuration);
            }
        }

        return (time / bufferRef.current.duration) * 100;
    };

    const calculatePeaks = async (buffer: AudioBuffer) => {
        setIsAnalyzing(true);
        const totalPeaks = 1200;

        try {
            const offlineCtx = new OfflineAudioContext(3, buffer.length, buffer.sampleRate);
            const source = offlineCtx.createBufferSource();
            source.buffer = buffer;

            const lowFilter = offlineCtx.createBiquadFilter();
            lowFilter.type = 'lowpass';
            lowFilter.frequency.value = 350;

            const midFilter1 = offlineCtx.createBiquadFilter();
            midFilter1.type = 'highpass';
            midFilter1.frequency.value = 350;
            const midFilter2 = offlineCtx.createBiquadFilter();
            midFilter2.type = 'lowpass';
            midFilter2.frequency.value = 2500;

            const highFilter = offlineCtx.createBiquadFilter();
            highFilter.type = 'highpass';
            highFilter.frequency.value = 2500;

            const merger = offlineCtx.createChannelMerger(3);

            source.connect(lowFilter);
            lowFilter.connect(merger, 0, 0);

            source.connect(midFilter1);
            midFilter1.connect(midFilter2);
            midFilter2.connect(merger, 0, 1);

            source.connect(highFilter);
            highFilter.connect(merger, 0, 2);

            merger.connect(offlineCtx.destination);
            source.start(0);

            const renderedBuffer = await offlineCtx.startRendering();
            
            const lowData = renderedBuffer.getChannelData(0);
            const midData = renderedBuffer.getChannelData(1);
            const highData = renderedBuffer.getChannelData(2);

            const step = 1024;
            const totalPeaks = Math.floor(renderedBuffer.length / step);
            const peaks = [];

            for (let i = 0; i < totalPeaks; i++) {
                let lowMax = 0, midMax = 0, highMax = 0;
                let lowSum = 0, midSum = 0, highSum = 0;
                const start = i * step;
                const end = start + step;
                for (let j = start; j < end; j++) {
                    const l = Math.abs(lowData[j]);
                    const m = Math.abs(midData[j]);
                    const h = Math.abs(highData[j]);
                    if (l > lowMax) lowMax = l;
                    if (m > midMax) midMax = m;
                    if (h > highMax) highMax = h;
                    lowSum += l * l;
                    midSum += m * m;
                    highSum += h * h;
                }
                peaks.push({
                    low: Math.pow(lowMax, 1.2),
                    mid: Math.pow(midMax, 1.2),
                    high: Math.pow(highMax, 1.2),
                    lowRms: Math.pow(Math.sqrt(lowSum / step), 1.2),
                    midRms: Math.pow(Math.sqrt(midSum / step), 1.2),
                    highRms: Math.pow(Math.sqrt(highSum / step), 1.2)
                });
            }

            // --- FIRST BEAT DETECTION ---
            let detectedOffset = 0;
            const maxLookaheadSamples = Math.min(renderedBuffer.length, renderedBuffer.sampleRate * 10);
            let globalLowMax = 0;
            for (let i = 0; i < renderedBuffer.length; i += 100) {
                if (Math.abs(lowData[i]) > globalLowMax) globalLowMax = Math.abs(lowData[i]);
            }
            
            const threshold = globalLowMax * 0.15; // Lowered to catch intro beats
            if (globalLowMax > 0.05) {
                for (let i = 0; i < maxLookaheadSamples; i++) {
                    if (Math.abs(lowData[i]) > threshold) {
                        detectedOffset = i / renderedBuffer.sampleRate;
                        break;
                    }
                }
            } else {
                let globalMidMax = 0;
                for (let i = 0; i < renderedBuffer.length; i += 100) {
                    if (Math.abs(midData[i]) > globalMidMax) globalMidMax = Math.abs(midData[i]);
                }
                const midThreshold = globalMidMax * 0.15;
                if (globalMidMax > 0.05) {
                    for (let i = 0; i < maxLookaheadSamples; i++) {
                        if (Math.abs(midData[i]) > midThreshold) {
                            detectedOffset = i / renderedBuffer.sampleRate;
                            break;
                        }
                    }
                }
            }

            // --- BPM DETECTION (Interval Histogram) ---
            let detectedBpm = 120;
            try {
                const partSize = offlineCtx.sampleRate / 2; // half a second windows
                const parts = Math.floor(lowData.length / partSize);
                let rawPeaks = [];
                for (let i = 0; i < parts; i++) {
                    let maxVol = 0;
                    let maxPos = 0;
                    for (let j = i * partSize; j < (i + 1) * partSize; j++) {
                        let vol = Math.abs(lowData[j]);
                        if (vol > maxVol) { maxVol = vol; maxPos = j; }
                    }
                    if (maxVol > 0.1) rawPeaks.push({ position: maxPos, volume: maxVol });
                }
                rawPeaks.sort((a, b) => b.volume - a.volume);
                rawPeaks = rawPeaks.splice(0, Math.floor(rawPeaks.length * 0.5)); // Keep top 50% peaks
                rawPeaks.sort((a, b) => a.position - b.position);

                let groups: {tempo: number, count: number}[] = [];
                rawPeaks.forEach((peak, index) => {
                    for (let i = 1; (index + i) < rawPeaks.length && i < 10; i++) {
                        let tempo = (60 * offlineCtx.sampleRate) / (rawPeaks[index + i].position - peak.position);
                        while (tempo < 90) tempo *= 2;
                        while (tempo > 180) tempo /= 2;
                        tempo = Math.round(tempo);
                        
                        let found = false;
                        for(let g of groups) {
                            if (g.tempo === tempo) { g.count++; found = true; break; }
                        }
                        if (!found) groups.push({tempo, count: 1});
                    }
                });
                groups.sort((a, b) => b.count - a.count);
                if (groups.length > 0) detectedBpm = groups[0].tempo;
            } catch(e) {
                console.warn("BPM detection failed, falling back to 120", e);
            }

            const detectedKey = await analyzeKey(midData, offlineCtx.sampleRate);
            const energyProfile = analyzeEnergyProfile(peaks);

            return { offset: detectedOffset, bpm: detectedBpm, peaks, key: detectedKey, energyProfile };
        } catch (e) {
            console.error("Error analyzing waveform:", e);
            return { offset: 0, bpm: 120, peaks: [], key: "8B", energyProfile: [] };
        } finally {
            setIsAnalyzing(false);
        }
    };

    const loadTrack = async (file: File | { file: File, bpm: number }) => {
        if (!audioContext) return;
        try {
            let actualFile = file instanceof File ? file : file.file;
            const arrayBuffer = await actualFile.arrayBuffer();
            const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
            bufferRef.current = decodedBuffer;

            if (sourceRef.current) {
                try { sourceRef.current.stop(); } catch (e) { }
                sourceRef.current.disconnect();
                sourceRef.current = null;
            }

            const reversedBuffer = audioContext.createBuffer(decodedBuffer.numberOfChannels, decodedBuffer.length, decodedBuffer.sampleRate);
            for (let i = 0; i < decodedBuffer.numberOfChannels; i++) {
                const dest = reversedBuffer.getChannelData(i);
                const src = decodedBuffer.getChannelData(i);
                for (let j = 0; j < decodedBuffer.length; j++) dest[j] = src[decodedBuffer.length - 1 - j];
            }
            reversedBufferRef.current = reversedBuffer;

            let analysisData;
            const actualFileObj = actualFile as any;
            const fileId = `${actualFile.name}_${actualFile.size}`;
            
            const cached = await getTrackAnalysis(fileId);
            if (cached && cached.peaks && cached.peaks.length > 0) {
                analysisData = cached;
                setWaveformPeaks(cached.peaks);
                setGridOffset(cached.offset);
                setTrackInfo({ title: actualFile.name.replace(/\.[^/.]+$/, "").substring(0, 30), artist: "PRO DJ", duration: decodedBuffer.duration });
                setBpm(parseFloat((cached.bpm * pitchRatioRef.current).toFixed(1)));
                setMusicalKey(cached.key || "KEY");
                setEnergyProfile(cached.energyProfile || []);
                baseBpmRef.current = cached.bpm;
            } else {
                analysisData = await calculatePeaks(decodedBuffer);
                setWaveformPeaks(analysisData.peaks);
                setGridOffset(analysisData.offset);
                setMusicalKey(analysisData.key);
                setEnergyProfile(analysisData.energyProfile);
                setTrackInfo({ title: actualFile.name.replace(/\.[^/.]+$/, "").substring(0, 30), artist: "PRO DJ", duration: decodedBuffer.duration });

                const newBpm = actualFileObj.bpm ? actualFileObj.bpm : analysisData.bpm;
                baseBpmRef.current = newBpm;
                setBpm(parseFloat((newBpm * pitchRatioRef.current).toFixed(1)));
                
                await saveTrackAnalysis({
                    id: fileId,
                    bpm: newBpm,
                    offset: analysisData.offset,
                    duration: decodedBuffer.duration,
                    peaks: analysisData.peaks,
                    key: analysisData.key,
                    energyProfile: analysisData.energyProfile,
                    timestamp: Date.now()
                });
            }

            pauseTimeRef.current = analysisData.offset; cuePointRef.current = analysisData.offset;
            setIsPlaying(false); setLoopActive(false);
        } catch (e) { console.error(e); }
    };

    const play = (fromTime?: number, noSpinUp: boolean = false) => {
        if (isAnalyzing) return;
        if (!audioContext || !bufferRef.current) return;
        if (isPlayingRef.current && fromTime === undefined) return;
        const source = audioContext.createBufferSource();
        source.buffer = bufferRef.current;

        if (noSpinUp) {
            source.playbackRate.value = pitchRatioRef.current;
        } else {
            source.playbackRate.setValueAtTime(0.001, audioContext.currentTime);
            source.playbackRate.exponentialRampToValueAtTime(pitchRatioRef.current, audioContext.currentTime + 0.1);
        }

        if ('preservesPitch' in source) (source as any).preservesPitch = keyLock;
        source.connect(mainTrackGainRef.current!);

        if (loopActive && loopInRef.current !== null && loopOutRef.current !== null) {
            source.loop = true;
            source.loopStart = loopInRef.current;
            source.loopEnd = loopOutRef.current;
        }

        const offset = fromTime !== undefined ? fromTime : pauseTimeRef.current;
        source.start(0, offset);
        startTimeRef.current = audioContext.currentTime - (offset / pitchRatioRef.current);
        sourceRef.current = source;
        source.onended = () => {
            if (sourceRef.current === source && isPlayingRef.current) {
                setIsPlaying(false);
                pauseTimeRef.current = 0;
            }
        };
        isStutteringRef.current = false;
        setIsPlaying(true);
    };

    const pause = () => {
        if (!audioContext || !isPlayingRef.current || !sourceRef.current) return;
        const t = audioContext.currentTime;
        sourceRef.current.playbackRate.cancelScheduledValues(t);
        sourceRef.current.playbackRate.setValueAtTime(pitchRatioRef.current, t);
        sourceRef.current.playbackRate.exponentialRampToValueAtTime(0.001, t + 0.4);

        setTimeout(() => {
            if (!sourceRef.current) return;
            const src = sourceRef.current;
            sourceRef.current = null;
            src.stop();
            pauseTimeRef.current = (audioContext.currentTime - startTimeRef.current) * pitchRatioRef.current;
            setIsPlaying(false);
        }, 400);
    };

    const triggerVinylBrake = () => {
        if (!audioContext || !sourceRef.current || !isPlayingRef.current) return;
        const t = audioContext.currentTime;
        sourceRef.current.playbackRate.cancelScheduledValues(t);
        sourceRef.current.playbackRate.setValueAtTime(pitchRatioRef.current, t);
        sourceRef.current.playbackRate.exponentialRampToValueAtTime(0.001, t + 1.5);
        
        setTimeout(() => {
            if (!sourceRef.current) return;
            sourceRef.current.stop();
            pauseTimeRef.current = (audioContext.currentTime - startTimeRef.current) * pitchRatioRef.current;
            setIsPlaying(false);
        }, 1500);
    };

    const triggerBackspin = () => {
        if (!audioContext || !sourceRef.current || !isPlayingRef.current) return;
        const t = audioContext.currentTime;
        sourceRef.current.playbackRate.cancelScheduledValues(t);
        sourceRef.current.playbackRate.setValueAtTime(pitchRatioRef.current, t);
        sourceRef.current.playbackRate.exponentialRampToValueAtTime(0.001, t + 0.2); // Muy rápido
        
        if (colorFilterRef.current) {
            colorFilterRef.current.type = 'lowpass';
            colorFilterRef.current.frequency.cancelScheduledValues(t);
            colorFilterRef.current.frequency.setValueAtTime(20000, t);
            colorFilterRef.current.frequency.exponentialRampToValueAtTime(100, t + 0.2);
        }

        setTimeout(() => {
            if (!sourceRef.current) return;
            sourceRef.current.stop();
            pauseTimeRef.current = (audioContext.currentTime - startTimeRef.current) * pitchRatioRef.current;
            setIsPlaying(false);
            if (colorFilterRef.current) {
                colorFilterRef.current.frequency.setValueAtTime(20000, audioContext.currentTime + 0.1);
            }
        }, 250);
    };

    const cue = (isDown: boolean = true) => {
        if (isAnalyzing) return;
        if (isDown) {
            if (isPlayingRef.current) {
                if (sourceRef.current) {
                    try { sourceRef.current.stop(); } catch (e) {}
                }
                setIsPlaying(false);
                pauseTimeRef.current = cuePointRef.current;
                isStutteringRef.current = false;
            } else {
                if (Math.abs(pauseTimeRef.current - cuePointRef.current) < 0.01) {
                    play(cuePointRef.current, true);
                    isStutteringRef.current = true;
                } else {
                    cuePointRef.current = pauseTimeRef.current;
                }
            }
        } else {
            if (isStutteringRef.current) {
                if (sourceRef.current) {
                    try { sourceRef.current.stop(); } catch (e) {}
                }
                setIsPlaying(false);
                pauseTimeRef.current = cuePointRef.current;
                isStutteringRef.current = false;
            }
        }
    };

    const toggleLoop = (beats: number) => {
        if (!audioContext) return;
        if (loopActive) {
            if (sourceRef.current) sourceRef.current.loop = false;
            setLoopActive(false);
        } else {
            const currentPos = (audioContext.currentTime - startTimeRef.current) * pitchRatioRef.current;
            const beatSecs = 60 / bpm;
            loopInRef.current = currentPos;
            loopOutRef.current = currentPos + (beatSecs * beats);
            setLoopInState(loopInRef.current);
            setLoopOutState(loopOutRef.current);
            if (sourceRef.current) {
                sourceRef.current.loopStart = loopInRef.current;
                sourceRef.current.loopEnd = loopOutRef.current;
                sourceRef.current.loop = true;
            }
            setLoopActive(true);
        }
    };

    const triggerHotCue = (index: number) => {
        if (!audioContext || !bufferRef.current) return;
        if (hotCues[index] !== undefined) {
            const cueTime = hotCues[index];
            let jumpTime = cueTime;
            if (quantize && bpm > 0) {
                const beatDuration = 60 / bpm;
                jumpTime = Math.round(cueTime / beatDuration) * beatDuration;
            }
            seekTo((jumpTime / bufferRef.current.duration) * 100);
            if (!isPlayingState) play();
        } else {
            const currentPos = (getProgress() / 100) * bufferRef.current.duration;
            let setTime = currentPos;
            if (quantize && bpm > 0) {
                const beatDuration = 60 / bpm;
                setTime = Math.round(currentPos / beatDuration) * beatDuration;
            }
            setHotCues(prev => ({ ...prev, [index]: setTime }));
        }
    };

    const triggerBeatLoop = (beats: number) => {
        if (!audioContext || !bufferRef.current || bpm <= 0) return;
        const beatDuration = 60 / bpm;
        const currentPos = (getProgress() / 100) * bufferRef.current.duration;
        let startPos = currentPos;

        if (quantize) {
            startPos = Math.round(currentPos / beatDuration) * beatDuration;
        }

        loopInRef.current = startPos;
        loopOutRef.current = startPos + (beats * beatDuration);
        setLoopInState(loopInRef.current);
        setLoopOutState(loopOutRef.current);

        if (sourceRef.current) {
            sourceRef.current.loopStart = loopInRef.current;
            sourceRef.current.loopEnd = loopOutRef.current;
            sourceRef.current.loop = true;
        }
        setLoopActive(true);
        // Snap playhead to loop start if quantized
        if (quantize) seekTo((startPos / bufferRef.current.duration) * 100);
    };

    const triggerBeatJump = (beats: number) => {
        if (!audioContext || !bufferRef.current || bpm <= 0) return;
        const beatDuration = 60 / bpm;
        const currentPos = (getProgress() / 100) * bufferRef.current.duration;
        let jumpTime = currentPos + (beats * beatDuration);

        if (quantize) {
            jumpTime = Math.round(jumpTime / beatDuration) * beatDuration;
        }

        jumpTime = Math.max(0, Math.min(jumpTime, bufferRef.current.duration));
        seekTo((jumpTime / bufferRef.current.duration) * 100);
    };

    const setLoopIn = () => {
        if (!audioContext) return;
        if (loopActive) {
            setLoopAdjustMode(prev => prev === 'in' ? 'none' : 'in');
            return;
        }
        const inTime = (audioContext.currentTime - startTimeRef.current) * pitchRatioRef.current;
        loopInRef.current = inTime;
        setLoopInState(inTime);
        if (sourceRef.current && loopOutRef.current !== null && loopOutRef.current > loopInRef.current) {
            sourceRef.current.loopStart = loopInRef.current;
            sourceRef.current.loopEnd = loopOutRef.current;
            sourceRef.current.loop = true;
            setLoopActive(true);
        }
    };

    const setLoopOut = () => {
        if (!audioContext || loopInRef.current === null) return;
        if (loopActive) {
            setLoopAdjustMode(prev => prev === 'out' ? 'none' : 'out');
            return;
        }
        const currentPos = (audioContext.currentTime - startTimeRef.current) * pitchRatioRef.current;
        if (currentPos > loopInRef.current) {
            loopOutRef.current = currentPos;
            setLoopOutState(currentPos);
            if (sourceRef.current) {
                sourceRef.current.loopStart = loopInRef.current;
                sourceRef.current.loopEnd = loopOutRef.current;
                sourceRef.current.loop = true;
            }
            setLoopActive(true);
        }
    };

    const exitLoop = () => {
        if (sourceRef.current) sourceRef.current.loop = false;
        setLoopActive(false);
        setLoopAdjustMode('none');
    };

    const halveLoop = () => {
        if (!loopActive || loopInRef.current === null || loopOutRef.current === null) return;
        const length = loopOutRef.current - loopInRef.current;
        loopOutRef.current = loopInRef.current + (length / 2);
        setLoopOutState(loopOutRef.current);
        if (sourceRef.current) sourceRef.current.loopEnd = loopOutRef.current;
    };

    const doubleLoop = () => {
        if (!loopActive || loopInRef.current === null || loopOutRef.current === null) return;
        const length = loopOutRef.current - loopInRef.current;
        loopOutRef.current = loopInRef.current + (length * 2);
        setLoopOutState(loopOutRef.current);
        if (sourceRef.current) sourceRef.current.loopEnd = loopOutRef.current;
    };

    const scrub = (deltaSeconds: number) => {
        if (!bufferRef.current || !reversedBufferRef.current || !audioContext) return;

        if (loopAdjustModeRef.current === 'in' && loopInRef.current !== null) {
            // Adjust Loop In by delta (fine-tuned)
            let newIn = loopInRef.current + deltaSeconds * 2.0;
            newIn = Math.max(0, Math.min(newIn, (loopOutRef.current || bufferRef.current.duration) - 0.1));
            loopInRef.current = newIn;
            setLoopInState(newIn);
            if (sourceRef.current) sourceRef.current.loopStart = newIn;
            return;
        }

        if (loopAdjustModeRef.current === 'out' && loopOutRef.current !== null) {
            // Adjust Loop Out by delta
            let newOut = loopOutRef.current + deltaSeconds * 2.0;
            newOut = Math.max((loopInRef.current || 0) + 0.1, Math.min(newOut, bufferRef.current.duration));
            loopOutRef.current = newOut;
            setLoopOutState(newOut);
            if (sourceRef.current) sourceRef.current.loopEnd = newOut;
            return;
        }

        const prevTime = pauseTimeRef.current;
        let newTime = prevTime + deltaSeconds;
        newTime = Math.max(0, Math.min(newTime, bufferRef.current.duration));
        pauseTimeRef.current = newTime;

        // Granular scratch synthesis
        const grainSource = audioContext.createBufferSource();
        const isForward = deltaSeconds >= 0;
        grainSource.buffer = isForward ? bufferRef.current : reversedBufferRef.current;

        // Calculate velocity (pointer events fire ~every 16ms)
        const rate = Math.max(0.1, Math.min(10.0, Math.abs(deltaSeconds) / 0.016));
        grainSource.playbackRate.value = rate;

        const grainGain = audioContext.createGain();
        // Smooth overlap-add window to prevent clicking and simulate needle sound
        grainGain.gain.setValueAtTime(0, audioContext.currentTime);
        grainGain.gain.linearRampToValueAtTime(1.2, audioContext.currentTime + 0.01);
        grainGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);

        grainSource.connect(grainGain);
        grainGain.connect(trimNodeRef.current!);

        if (isForward) {
            grainSource.start(0, prevTime);
        } else {
            // For reversed buffer, position is mirrored
            const revTime = bufferRef.current.duration - prevTime;
            grainSource.start(0, revTime);
        }
        grainSource.stop(audioContext.currentTime + 0.05);
    };

    const setScrubbing = (active: boolean) => {
        if (isAnalyzing) return;
        if (!audioContext) return;
        if (loopAdjustModeRef.current !== 'none') {
            isScrubbingRef.current = false;
            return; // Ignore scrubbing (scratching) while in loop adjust mode
        }
        isScrubbingRef.current = active;
        if (mainTrackGainRef.current) {
            mainTrackGainRef.current.gain.setTargetAtTime(active ? 0 : 1, audioContext.currentTime, 0.05);
        }

        if (active) {
            if (isPlayingRef.current && sourceRef.current) {
                sourceRef.current.onended = null;
                sourceRef.current.stop();
                pauseTimeRef.current = (audioContext.currentTime - startTimeRef.current) * pitchRatioRef.current;
                setIsPlaying(false);
            }
        }
    };

    const seekTo = (percent: number) => {
        if (isAnalyzing) return;
        if (!audioContext || !bufferRef.current) return;
        const targetTime = (Math.max(0, Math.min(100, percent)) / 100) * bufferRef.current.duration;
        pauseTimeRef.current = targetTime;
        if (isPlayingRef.current) {
            if (sourceRef.current) { sourceRef.current.onended = null; sourceRef.current.stop(); }
            play(targetTime, true);
        }
    };

    const toggleKeyLock = () => {
        setKeyLock(!keyLock);
        if (sourceRef.current && 'preservesPitch' in sourceRef.current) (sourceRef.current as any).preservesPitch = !keyLock;
    };

    const setVolume = (val: number) => { if (gainNodeRef.current && audioContext) gainNodeRef.current.gain.setTargetAtTime(val, audioContext.currentTime, 0.05); };
    const setTrim = (val: number) => { if (trimNodeRef.current && audioContext) trimNodeRef.current.gain.setTargetAtTime(val, audioContext.currentTime, 0.05); };
    const setCrossfader = (val: number) => { if (xfaderNodeRef.current && audioContext) xfaderNodeRef.current.gain.setTargetAtTime(val, audioContext.currentTime, 0.05); };
    const setMaster = (val: number) => { if (masterNodeRef.current && audioContext) masterNodeRef.current.gain.setTargetAtTime(val, audioContext.currentTime, 0.05); };

    const setEqVal = (band: 'low' | 'mid' | 'high', val: number) => {
        if (!audioContext) return;
        // Pro Isolator gain mapping with audio taper (squared for natural fade)
        const gain = val <= 50 ? Math.pow(val / 50, 2) : 1.0 + ((val - 50) / 50);
        let node = band === 'low' ? eqLowRef.current : band === 'mid' ? eqMidRef.current : eqHighRef.current;
        if (node) node.gain.setTargetAtTime(gain, audioContext.currentTime, 0.05);
    };

    const setColorFX = (val: number) => {
        if (!audioContext || !colorFilterRef.current) return;
        const node = colorFilterRef.current;
        const dist = Math.abs(val - 50) / 50; 
        const dynamicQ = 0.5 + (dist * 4.5); 
        node.Q.setTargetAtTime(dynamicQ, audioContext.currentTime, 0.1);

        if (val === 50) { node.type = 'lowpass'; node.frequency.setTargetAtTime(20000, audioContext.currentTime, 0.1); }
        else if (val < 50) { node.type = 'lowpass'; node.frequency.setTargetAtTime(100 + (val / 50) * 19900, audioContext.currentTime, 0.1); }
        else { node.type = 'highpass'; node.frequency.setTargetAtTime(20 + ((val - 50) / 50) * 9980, audioContext.currentTime, 0.1); }
    };

    const setColorRes = (val: number) => {
        if (!audioContext || !colorFilterRef.current) return;
        const q = 0.5 + (val / 100) * 10;
        colorFilterRef.current.Q.setTargetAtTime(q, audioContext.currentTime, 0.1);
    };

    const setPitch = (val: number) => {
        const shift = ((val - 50) / 50) * 0.10; // Inverted: UP (0) = slower, DOWN (100) = faster
        pitchRatioRef.current = 1.0 + shift;
        setPitchPercent(shift * 100);
        if (sourceRef.current && audioContext) sourceRef.current.playbackRate.setTargetAtTime(pitchRatioRef.current, audioContext.currentTime, 0.1);
        setBpm(parseFloat((baseBpmRef.current * pitchRatioRef.current).toFixed(1)));
    };

    const setFxLevel = (val: number) => {
        fxLevelRef.current = val / 100;
        if (!audioContext) return;
        const t = audioContext.currentTime;
        let activeInsert = false;
        Object.entries(fxNodesRef.current).forEach(([k, fx]: [string, any]) => {
            if (fx.wetGain.gain.value > 0.01) {
                fx.wetGain.gain.setTargetAtTime(fxLevelRef.current, t, 0.05);
                if (['CRUSH', 'STUTTER', 'ROLL', 'TRANS'].includes(k)) activeInsert = true;
            }
        });
        if (activeInsert && dryGainRef.current) {
            dryGainRef.current.gain.setTargetAtTime(1.0 - fxLevelRef.current, t, 0.05);
        }
    };

    const setFxParam = (val: number) => {
        if (!audioContext) return;
        const t = audioContext.currentTime;
        const paramNorm = val / 100;

        let fraction = 1;
        if (val <= 5) fraction = 1/16;
        else if (val <= 15) fraction = 1/8;
        else if (val <= 28) fraction = 1/4;
        else if (val <= 40) fraction = 1/2;
        else if (val <= 55) fraction = 1;
        else if (val <= 68) fraction = 2;
        else if (val <= 80) fraction = 4;
        else if (val <= 92) fraction = 8;
        else fraction = 16;
        
        const currentBeatDuration = 60 / bpm;

        Object.values(fxNodesRef.current).forEach((fx: any) => {
            if (!fx.internals) return;
            if (fx.internals.feedback) fx.internals.feedback.gain.setTargetAtTime(0.2 + paramNorm * 0.75, t, 0.05);
            
            // Re-sync LFOs to beat division
            const freq = 1 / (currentBeatDuration * fraction);
            if (fx.internals.stutterLfo) fx.internals.stutterLfo.frequency.setTargetAtTime(freq, t, 0.05);
            if (fx.internals.transLfo) fx.internals.transLfo.frequency.setTargetAtTime(freq, t, 0.05);
            if (fx.internals.lfo) fx.internals.lfo.frequency.setTargetAtTime(freq, t, 0.05);
            if (fx.internals.helixLfo) fx.internals.helixLfo.frequency.setTargetAtTime(freq, t, 0.05);
            
            if (fx.internals.rollDelay) fx.internals.rollDelay.delayTime.setTargetAtTime(currentBeatDuration * fraction, t, 0.05);
            if (fx.internals.echoDelay) fx.internals.echoDelay.delayTime.setTargetAtTime(currentBeatDuration * fraction, t, 0.05);
            
            if (fx.internals.noiseFilter) {
                // Map param 0-100 to filter cutoff 100Hz to 18000Hz
                const cutoff = 100 * Math.pow(18000/100, paramNorm);
                fx.internals.noiseFilter.frequency.setTargetAtTime(cutoff, t, 0.05);
            }
        });
    };

    const triggerPadFX = (fxKey: string, active: boolean, customLevel?: number) => {
        if (!audioContext) return;
        const t = audioContext.currentTime;
        const level = customLevel !== undefined ? customLevel : fxLevelRef.current;

        let duckAmt = 1.0;
        if (active) {
            if (['CRUSH', 'STUTTER', 'ROLL', 'TRANS'].includes(fxKey)) {
                duckAmt = 1.0 - level; // Crossfade to maintain full volume
            } else if (['PHASER', 'FLANGER'].includes(fxKey)) {
                duckAmt = 1.0; // Keep dry 100% for phase interference
            } else {
                duckAmt = 0.35; // Default ducking for delays/reverbs
            }
        }
        
        if (dryGainRef.current) dryGainRef.current.gain.setTargetAtTime(duckAmt, t, 0.04);

        Object.entries(fxNodesRef.current).forEach(([k, fx]: [string, any]) => {
            if (k === fxKey && active) {
                fx.wetGain.gain.cancelScheduledValues(t);
                fx.wetGain.gain.setTargetAtTime(level, t, 0.03);
                
                // Roll specific: open the input gate, then schedule it to close after exactly 1 loop cycle
                if (fx.internals.inputGate && fx.internals.rollDelay) {
                    const rollTime = fx.internals.rollDelay.delayTime.value;
                    fx.internals.inputGate.gain.cancelScheduledValues(t);
                    fx.internals.inputGate.gain.setValueAtTime(1.0, t);
                    fx.internals.inputGate.gain.setValueAtTime(0.0, t + rollTime);
                }
            } else {
                fx.wetGain.gain.cancelScheduledValues(t);
                fx.wetGain.gain.setTargetAtTime(0, t, active ? 0.05 : 0.15);
                
                // Reopen the roll input gate when effect is turned off so it's ready for next use
                if (fx.internals.inputGate) {
                    fx.internals.inputGate.gain.cancelScheduledValues(t);
                    fx.internals.inputGate.gain.setTargetAtTime(1.0, t, 0.05);
                }
            }
        });
    };

    const triggerSample = (type: string) => { if (audioContext) playSynthSample(audioContext, type); };

    const setActiveColorFX = (color: string) => {
        if (!colorFilterRef.current || !colorGainRef.current) return;
        // Reconfigure the internal audio nodes for the specific color fx
        // This is a basic implementation of the filter types
        if (color === 'FILTER') {
            colorFilterRef.current.type = 'lowpass'; // will be modulated by setColorFX
        } else if (color === 'NOISE') {
            // just an example, a real implementation would route the noise generator
        }
        // Note: Full implementation of all 6 effects requires complex routing graphs.
        // We are leaving the foundation here.
    };

    return { analyserNode: analyserRef.current, loadTrack, play, pause, cue, scrub, setScrubbing, seekTo, toggleLoop, setLoopIn, setLoopOut, exitLoop, halveLoop, doubleLoop, loopActive, loopIn, loopOut, loopAdjustMode, isPlaying, trackInfo, getProgress, getLevel, bpm, setVolume, setTrim, setEqVal, setColorFX, setColorRes, setActiveColorFX, setPitch, setFxLevel, setFxParam, triggerPadFX, setBpm, triggerSample, waveformPeaks, pitchPercent, keyLock, toggleKeyLock, gainNode: gainNodeRef.current, setCrossfader, setMaster, hotCues, triggerHotCue, triggerBeatLoop, triggerBeatJump, quantize, setQuantize, isSyncEnabled, setIsSyncEnabled, triggerVinylBrake, triggerBackspin, isAnalyzing, gridOffset, musicalKey, energyProfile };
};

const Screw = () => (
    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-700 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.9)] border border-zinc-800">
        <div className="w-[5px] h-[1px] bg-zinc-900/90 rotate-45 shadow-[inset_0_0_1px_rgba(0,0,0,1)]"></div>
    </div>
);

const ProKnob = ({ value, onChange, label, bipolar = false, size = "w-8 h-8", isMaster = false }: { value: number, onChange: (v: number) => void, label: string, bipolar?: boolean, size?: string, isMaster?: boolean }) => {
    const rotation = -150 + (value / 100) * 300;
    return (
        <div className="flex flex-col items-center gap-1 select-none group">
            <div className={`relative ${size} flex items-center justify-center cursor-ns-resize`}
                onPointerDown={(e) => {
                    const startY = e.clientY; const startVal = value;
                    const update = (m: PointerEvent) => onChange(Math.max(0, Math.min(100, startVal + (startY - m.clientY) * 0.5)));
                    const handleUp = () => { window.removeEventListener('pointermove', update); window.removeEventListener('pointerup', handleUp); };
                    window.addEventListener('pointermove', update); window.addEventListener('pointerup', handleUp);
                }} onDoubleClick={() => bipolar && onChange(50)}>
                <svg className="absolute w-full h-full -rotate-90 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="fill-none stroke-zinc-800" strokeWidth="8" />
                    {bipolar ? (
                        <>
                            {value > 50 && <circle cx="50" cy="50" r="40" className="fill-none stroke-orange-500 transition-all duration-75" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - ((value - 50) / 100) * 251.2 * 0.8} />}
                            {value < 50 && <circle cx="50" cy="50" r="40" className="fill-none stroke-blue-500 transition-all duration-75 origin-center -scale-y-100" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - ((50 - value) / 100) * 251.2 * 0.8} />}
                        </>
                    ) : <circle cx="50" cy="50" r="40" className={`fill-none ${isMaster ? 'stroke-red-500' : 'stroke-white'} transition-all duration-75`} strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (value / 100) * 251.2 * 0.8} />}
                </svg>
                <div className="absolute w-[70%] h-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,_#3f3f46_0%,_#18181b_100%)] shadow-[0_5px_10px_rgba(0,0,0,0.8),inset_0_2px_2px_rgba(255,255,255,0.2)] border border-zinc-950 flex items-center justify-center pointer-events-none" style={{ transform: `rotate(${rotation}deg)` }}>
                    <div className={`w-[2px] h-3 ${isMaster ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)]'} rounded-full absolute top-[2px]`}></div>
                </div>
            </div>
            <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
        </div>
    );
};

const ProFader = ({ value, onChange, label, height = "h-28", width = "w-8", horizontal = false, colorClass = "bg-white", invertVertical = false }: { value: number, onChange: (v: number) => void, label?: string, height?: string, width?: string, horizontal?: boolean, colorClass?: string, invertVertical?: boolean }) => {
    const displayValue = invertVertical && !horizontal ? 100 - value : value;
    return (
        <div className={`flex flex-col items-center gap-1 ${horizontal ? 'w-full' : ''}`}>
            <div className={`${height} ${width} flex items-center justify-center relative bg-zinc-950 rounded border border-zinc-800 shadow-[inset_0_10px_20px_rgba(0,0,0,0.9)] cursor-pointer`}
                onPointerDown={(e) => {
                    const faderElement = e.currentTarget;
                    const update = (clientY: number, clientX: number) => {
                        const bounds = faderElement.getBoundingClientRect();
                        if (horizontal) {
                            onChange((Math.max(0, Math.min(bounds.width - 24, clientX - bounds.left - 12)) / (bounds.width - 24)) * 100);
                        } else {
                            let rawVal = 100 - (Math.max(0, Math.min(bounds.height - 32, clientY - bounds.top - 16)) / (bounds.height - 32)) * 100;
                            if (invertVertical) rawVal = 100 - rawVal;
                            onChange(rawVal);
                        }
                    };
                    update(e.clientY, e.clientX);
                    const handleMove = (m: PointerEvent) => update(m.clientY, m.clientX);
                    const handleUp = () => { window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', handleUp); };
                    window.addEventListener('pointermove', handleMove); window.addEventListener('pointerup', handleUp);
                }}>
                <div className={`absolute bg-black rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,1)] flex justify-between ${horizontal ? 'w-[calc(100%-20px)] h-[4px] flex-row' : 'h-[calc(100%-20px)] w-[4px] flex-col'}`}></div>
                <div className={`absolute rounded shadow-[0_5px_15px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.4)] bg-[radial-gradient(ellipse_at_center,_#52525b_0%,_#27272a_100%)] border border-zinc-950 flex items-center justify-center z-10`}
                    style={horizontal ? { height: '24px', width: '20px', left: `calc((100% - 20px) * (${displayValue} / 100))`, cursor: 'grab' } : { width: '24px', height: '32px', bottom: `calc((100% - 32px) * (${displayValue} / 100))`, cursor: 'grab' }}>
                    <div className={`absolute ${horizontal ? 'w-[2px] h-full' : 'h-[2px] w-full'} ${colorClass} opacity-80 mix-blend-screen shadow-[0_0_5px_currentColor]`}></div>
                </div>
            </div>
            {label && <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{label}</span>}
        </div>
    );
};

const VuMeter = ({ levelFn, staticLevel = -1, peak = false }: { levelFn?: () => number, staticLevel?: number, peak?: boolean }) => {
    const meterRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (staticLevel >= 0 || !levelFn) return;
        let animationId: number;
        const draw = () => {
            if (meterRef.current) {
                const lvl = levelFn();
                const leds = meterRef.current.children;
                for (let i = 0; i < 15; i++) {
                    const threshold = i / 15;
                    const isOn = lvl > threshold;
                    const el = leds[i] as HTMLElement;
                    if (isOn) {
                        if (i > 13) el.className = "flex-1 w-full rounded-[1px] transition-all duration-75 bg-red-500 shadow-[0_0_8px_red] opacity-100";
                        else if (i > 10) el.className = "flex-1 w-full rounded-[1px] transition-all duration-75 bg-yellow-400 shadow-[0_0_8px_yellow] opacity-100";
                        else el.className = "flex-1 w-full rounded-[1px] transition-all duration-75 bg-green-500 shadow-[0_0_8px_green] opacity-100";
                    } else {
                        el.className = "flex-1 w-full rounded-[1px] transition-all duration-75 bg-zinc-800 opacity-30";
                    }
                }
            }
            animationId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [levelFn, staticLevel]);

    return (
        <div ref={meterRef} className={`flex flex-col-reverse gap-[1px] ${peak ? 'h-28' : 'h-28'} w-2 bg-black p-[2px] rounded-sm shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] border border-zinc-800`}>
            {Array(15).fill(0).map((_, i) => (
                <div key={i} className={`flex-1 w-full rounded-[1px] transition-all duration-75 ${staticLevel > (i / 15) ? (i > 13 ? 'bg-red-500 shadow-[0_0_8px_red] opacity-100' : i > 10 ? 'bg-yellow-400 shadow-[0_0_8px_yellow] opacity-100' : 'bg-green-500 shadow-[0_0_8px_green] opacity-100') : 'bg-zinc-800 opacity-30'}`}></div>
            ))}
        </div>
    );
};

const WaveformDisplay = ({ peaks, getProgress, zoom, onSeek, bpm, duration, loopIn, loopOut, loopActive, isAnalyzing, gridOffset = 0 }: { peaks: { low: number, mid: number, high: number }[], getProgress: () => number, zoom: number, onSeek: (percent: number) => void, bpm: number, duration: number, loopIn?: number | null, loopOut?: number | null, loopActive?: boolean, isAnalyzing?: boolean, gridOffset?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;
        const width = canvas.width; const height = canvas.height;
        let animationId: number;
        let pulseTime = 0;

        const draw = () => {
            const progress = getProgress();
            ctx.fillStyle = '#0a0a0c';
            ctx.fillRect(0, 0, width, height);

            if (isAnalyzing) {
                pulseTime += 0.05;
                const alpha = 0.5 + Math.sin(pulseTime) * 0.5;
                ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const dots = ".".repeat(Math.floor(pulseTime % 4));
                ctx.fillText(`ANALYZING TRACK${dots}`, width / 2, height / 2);
                animationId = requestAnimationFrame(draw);
                return;
            }

            if (peaks.length === 0) return;


            // === DRAW LOOP HIGHLIGHT ===
            if (duration > 0 && loopIn !== undefined && loopIn !== null) {
                const visiblePercentage = zoom === 1 ? 100 : 100 / zoom;
                const startP = zoom === 1 ? 0 : (progress - visiblePercentage / 2) / 100;
                const visibleStartTime = startP * duration;
                const visibleEndTime = visibleStartTime + (visiblePercentage / 100) * duration;

                const drawLoopStart = loopIn;
                const drawLoopEnd = (loopOut !== null && loopOut !== undefined) ? loopOut : duration;

                if (drawLoopEnd >= visibleStartTime && drawLoopStart <= visibleEndTime) {
                    const startX = Math.max(0, ((drawLoopStart - visibleStartTime) / (visibleEndTime - visibleStartTime)) * width);
                    let endX = width;
                    if (loopOut !== null && loopOut !== undefined) {
                        endX = Math.min(width, ((drawLoopEnd - visibleStartTime) / (visibleEndTime - visibleStartTime)) * width);
                    }

                    if (endX > startX || loopOut === null || loopOut === undefined) {
                        // Background Fill
                        ctx.fillStyle = loopActive ? 'rgba(250, 204, 21, 0.2)' : 'rgba(161, 161, 170, 0.15)';
                        if (loopOut === null || loopOut === undefined) {
                            const grad = ctx.createLinearGradient(startX, 0, startX + 50, 0);
                            grad.addColorStop(0, 'rgba(250, 204, 21, 0.3)');
                            grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
                            ctx.fillStyle = grad;
                            ctx.fillRect(startX, 0, 50, height);
                        } else {
                            ctx.fillRect(startX, 0, endX - startX, height);
                        }

                        // Borders IN and OUT
                        ctx.fillStyle = loopActive ? '#facc15' : '#d4d4d8';
                        if (drawLoopStart >= visibleStartTime) ctx.fillRect(startX, 0, 2, height);
                        if (loopOut !== null && loopOut !== undefined && drawLoopEnd <= visibleEndTime) ctx.fillRect(endX - 2, 0, 2, height);

                        // Draw 'IN' and 'OUT' labels
                        ctx.fillStyle = loopActive ? '#facc15' : '#d4d4d8';
                        ctx.font = '8px monospace';
                        if (drawLoopStart >= visibleStartTime) {
                            ctx.fillText('IN', startX + 4, 10);
                            ctx.fillRect(startX, 0, 10, 2);
                            ctx.fillRect(startX, height - 2, 10, 2);
                        }
                        if (loopOut !== null && loopOut !== undefined && drawLoopEnd <= visibleEndTime) {
                            const textW = ctx.measureText('OUT').width;
                            ctx.fillText('OUT', endX - textW - 4, 10);
                            ctx.fillRect(endX - 10, 0, 10, 2);
                            ctx.fillRect(endX - 10, height - 2, 10, 2);
                        }
                    }
                }
            }

            // Draw Waveform Dynamically
            // Pioneer 3-Band Unified Waveform
            const centerY = height / 2;
            const maxAmplitude = height * 0.48;

            if (duration > 0 && peaks.length > 0) {
                const visP = zoom === 1 ? 100 : 100 / zoom;
                const sP   = zoom === 1 ? 0 : (progress - visP / 2) / 100;
                const vST  = Math.max(0, sP * duration);
                const vET  = vST + (visP / 100) * duration;
                
                const visiblePeaks = ((vET - vST) / duration) * peaks.length;
                const minPeakWidth = 1; // Solid continuous wave
                let groupSize = Math.ceil(visiblePeaks / (width / minPeakWidth));
                if (groupSize < 1) groupSize = 1;

                const startIdx = Math.max(0, Math.floor((vST / duration) * peaks.length));
                const endIdx = Math.min(peaks.length, Math.ceil((vET / duration) * peaks.length));

                ctx.save();
                ctx.globalCompositeOperation = 'screen'; // Professional Color Blending

                for (let p = startIdx; p < endIdx; p += groupSize) {
                    let maxL = 0, maxM = 0, maxH = 0;
                    for (let i = p; i < p + groupSize && i < peaks.length; i++) {
                        const l = peaks[i].lowRms || peaks[i].low;
                        const m = peaks[i].midRms || peaks[i].mid;
                        const h = peaks[i].highRms || peaks[i].high;
                        if (l > maxL) maxL = l;
                        if (m > maxM) maxM = m;
                        if (h > maxH) maxH = h;
                    }

                    // Exact continuous floating point positions
                    const tStart = (p / peaks.length) * duration;
                    const x1 = ((tStart - vST) / (vET - vST)) * width;
                    const bw = Math.max(1, width / (visiblePeaks / groupSize) + 0.5); // overlapping to prevent any gaps

                    const isPlayed = zoom === 1 ? (p / peaks.length) * 100 <= progress : tStart <= (progress/100)*duration;
                    
                    ctx.globalAlpha = isPlayed ? 0.35 : 1.0;

                    if (maxL > 0.001) {
                        const lH = Math.min(maxAmplitude, maxL * maxAmplitude * 0.95);
                        ctx.fillStyle = '#0033ff'; // Solid Deep Blue Lows
                        ctx.fillRect(x1, centerY - lH, bw, lH * 2);
                    }
                    if (maxM > 0.001) {
                        // Boost mids by 1.5x to stand out more against bass
                        const mH = Math.min(maxAmplitude * 0.9, (maxM * 1.5) * maxAmplitude * 0.85);
                        ctx.fillStyle = '#ff6600'; // Amber Mids
                        ctx.fillRect(x1, centerY - mH, bw, mH * 2);
                    }
                    if (maxH > 0.001) {
                        // Boost highs heavily (2.5x) because treble energy is naturally very low
                        const hH = Math.min(maxAmplitude, (maxH * 2.8) * maxAmplitude * 0.90);
                        ctx.fillStyle = '#ffffff'; // White Highs
                        ctx.fillRect(x1, centerY - hH, bw, hH * 2);
                    }
                }
                ctx.restore();
            }

            // ── Draw Beatgrid (Full Height ON TOP) ──
            if (duration > 0 && bpm > 0) {
                const visiblePercentage = zoom === 1 ? 100 : 100 / zoom;
                const startP = zoom === 1 ? 0 : (progress - visiblePercentage / 2) / 100;
                const visibleStartTime = Math.max(0, startP * duration);
                const visibleEndTime = visibleStartTime + (visiblePercentage / 100) * duration;

                const startBeat = Math.floor((visibleStartTime - gridOffset) / (60 / bpm)) - 1;
                const endBeat = Math.ceil((visibleEndTime - gridOffset) / (60 / bpm)) + 1;

                for (let b = startBeat; b <= endBeat; b++) {
                    const beatTime = b * (60 / bpm) + gridOffset;
                    if (beatTime < 0 || beatTime > duration) continue;
                    
                    const beatX = ((beatTime - visibleStartTime) / (visibleEndTime - visibleStartTime)) * width;

                    if (b % 4 === 0) {
                        // Wide glow halo behind the line
                        const haloGrad = ctx.createLinearGradient(beatX - 10, 0, beatX + 10, 0);
                        haloGrad.addColorStop(0,   'rgba(251,146,60,0)');
                        haloGrad.addColorStop(0.5, 'rgba(251,146,60,0.3)');
                        haloGrad.addColorStop(1,   'rgba(251,146,60,0)');
                        ctx.fillStyle = haloGrad;
                        ctx.fillRect(beatX - 10, 0, 20, height);

                        // Sharp Full Height Line
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2.0;
                        ctx.beginPath();
                        ctx.moveTo(beatX, 0); ctx.lineTo(beatX, height);
                        ctx.stroke();
                        
                        // Top and bottom red markers
                        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
                        ctx.beginPath();
                        ctx.moveTo(bx - 4, 0); ctx.lineTo(bx + 4, 0); ctx.lineTo(bx, 6); ctx.closePath();
                        ctx.fill();
                        ctx.beginPath();
                        ctx.moveTo(bx - 4, height); ctx.lineTo(bx + 4, height); ctx.lineTo(bx, height - 6); ctx.closePath();
                        ctx.fill();

                    } else {
                        // Full Height Dashed Line for Beats 2, 3, 4
                        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([4, 4]);
                        ctx.beginPath();
                        ctx.moveTo(bx, 0); ctx.lineTo(bx, height);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                }
            }

            // ── Professional Playhead ──
            const phX = zoom === 1 ? (progress / 100) * width : width / 2;
            
            // Outer bright red halo
            const phGrad = ctx.createLinearGradient(phX - 8, 0, phX + 8, 0);
            phGrad.addColorStop(0, 'rgba(255, 0, 0, 0)');
            phGrad.addColorStop(0.5, 'rgba(255, 0, 0, 0.5)');
            phGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = phGrad;
            ctx.fillRect(phX - 8, 0, 16, height);
            
            // Ultra-sharp white/red center line
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(phX - 0.5, 0, 1, height);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(phX - 1.5, 0, 1, height);
            ctx.fillRect(phX + 0.5, 0, 1, height);
            
            // Large Professional DJ Triangle Cap
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(phX - 6, 0);
            ctx.lineTo(phX + 6, 0);
            ctx.lineTo(phX, 10);
            ctx.closePath();
            ctx.fill();
            
            // Bottom Cap
            ctx.beginPath();
            ctx.moveTo(phX - 6, height);
            ctx.lineTo(phX + 6, height);
            ctx.lineTo(phX, height - 10);
            ctx.closePath();
            ctx.fill();

            animationId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [peaks, zoom, getProgress, bpm, duration]);

    const dragStateRef = useRef({ lastX: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!containerRef.current || peaks.length === 0) return;
        isDraggingRef.current = true;

        dragStateRef.current = {
            lastX: e.clientX
        };

        if (zoom === 1) {
            updateSeek(e);
        }

        const handleMove = (m: PointerEvent) => { if (isDraggingRef.current) updateSeek(m); };
        const handleUp = () => { isDraggingRef.current = false; window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', handleUp); };
        window.addEventListener('pointermove', handleMove); window.addEventListener('pointerup', handleUp);
    };

    const updateSeek = (e: React.PointerEvent | PointerEvent) => {
        if (!containerRef.current || peaks.length === 0) return;
        const rect = containerRef.current.getBoundingClientRect();

        if (zoom === 1) {
            const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const clickRatio = clickX / rect.width;
            onSeek(clickRatio * 100);
            dragStateRef.current.lastX = e.clientX;
        } else {
            // Vinyl scratch logic: Delta from LAST position
            const dx = e.clientX - dragStateRef.current.lastX;
            const percentDelta = (dx / rect.width) * (100 / zoom);

            // Get CURRENT progress, subtract delta (dragging right moves playhead left)
            const currentProgress = getProgress();
            const newProgress = Math.max(0, Math.min(100, currentProgress - percentDelta));

            onSeek(newProgress);
            dragStateRef.current.lastX = e.clientX; // Update lastX for next move
        }
    };

    return (
        <div ref={containerRef} onPointerDown={handlePointerDown} className="w-full h-full bg-[#0a0a0c] border border-zinc-800 rounded relative overflow-hidden shadow-[inset_0_2px_5px_rgba(0,0,0,1)] cursor-crosshair">
            {peaks.length === 0 ? <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-[9px] font-mono">NO TRACK LOADED</div> : <canvas ref={canvasRef} className="w-full h-full" width={1200} height={128} />}
        </div>
    );
};

const InteractiveJogWheel = ({ getProgress, onScrubStart, onScrub, onScrubEnd, trackInfo }: any) => {
    const wheelRef = useRef<HTMLDivElement>(null);
    const innerWheelRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<SVGCircleElement>(null);
    const lastAngleRef = useRef(0);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        let animationId: number;
        const draw = () => {
            if (wheelRef.current && innerWheelRef.current && ringRef.current && !isDraggingRef.current) {
                const prog = getProgress();
                const rot = (prog / 100) * 360 * 50;
                wheelRef.current.style.transform = `rotate(${rot}deg)`;
                innerWheelRef.current.style.transform = `rotate(${-rot}deg)`;
                ringRef.current.style.strokeDashoffset = `${289 - (prog / 100) * 289}`; // 2 * PI * 46
            }
            animationId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [getProgress]);

    const getAngle = (e: PointerEvent, rect: DOMRect) => {
        const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
        return Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!wheelRef.current) return;
        isDraggingRef.current = true;
        const rect = wheelRef.current.getBoundingClientRect();
        lastAngleRef.current = getAngle(e as unknown as PointerEvent, rect);
        onScrubStart();
        const handleMove = (m: PointerEvent) => {
            if (!isDraggingRef.current || !wheelRef.current || !innerWheelRef.current || !ringRef.current) return;
            const currentAngle = getAngle(m, wheelRef.current.getBoundingClientRect());
            let delta = currentAngle - lastAngleRef.current;
            if (delta > 180) delta -= 360; if (delta < -180) delta += 360;

            const currentTransform = wheelRef.current.style.transform;
            const match = currentTransform.match(/rotate\(([-\d.]+)deg\)/);
            const currentRot = match ? parseFloat(match[1]) : 0;
            wheelRef.current.style.transform = `rotate(${currentRot + delta}deg)`;
            innerWheelRef.current.style.transform = `rotate(${-(currentRot + delta)}deg)`;

            const prog = getProgress();
            ringRef.current.style.strokeDashoffset = `${289 - (prog / 100) * 289}`;

            lastAngleRef.current = currentAngle;
            onScrub((delta / 360) * 2.0);
        };
        const handleUp = () => { isDraggingRef.current = false; window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', handleUp); onScrubEnd(); };
        window.addEventListener('pointermove', handleMove); window.addEventListener('pointerup', handleUp);
    };

    return (
        <div className="relative w-56 h-56 rounded-full bg-[#050507] border-[4px] border-[#18181b] shadow-[0_20px_40px_rgba(0,0,0,0.9),inset_0_2px_5px_rgba(255,255,255,0.05)] flex items-center justify-center group shrink-0">
            <div className="absolute w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>
            {/* The platter */}
            <div ref={wheelRef} onPointerDown={handlePointerDown} className="w-[13.5rem] h-[13.5rem] rounded-full bg-[#0a0a0c] shadow-[inset_0_10px_25px_rgba(0,0,0,1)] flex items-center justify-center border border-zinc-800 cursor-grab active:cursor-grabbing relative overflow-hidden">
                <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 100 100">
                    {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx="50" cy="50" r={15 + i * 2.8} className="fill-none stroke-zinc-900" strokeWidth="0.8" />)}
                </svg>
                {/* Red marker on the physical platter */}
                <div className="absolute top-1.5 w-1.5 h-4 bg-red-600 rounded-sm shadow-[0_0_10px_rgba(220,38,38,0.8)] z-0"></div>

                {/* Center LCD Screen */}
                <div ref={innerWheelRef} className="w-32 h-32 rounded-full bg-[#0a0a0c] border-[4px] border-zinc-950 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(0,0,0,1)] relative z-10 overflow-hidden pointer-events-none">
                    {/* Ring inside LCD */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle ref={ringRef} cx="50" cy="50" r="46" className="fill-none stroke-blue-500 opacity-80" strokeWidth="6" strokeDasharray="289" />
                    </svg>

                    {/* Artwork Placeholder */}
                    <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_#1e1b4b_0%,_#000000_100%)] opacity-80 z-0"></div>

                    <div className="z-10 flex flex-col items-center">
                        {trackInfo && <div className="text-[9px] font-black text-white w-24 truncate text-center uppercase drop-shadow-md">{trackInfo.title || 'NO TRACK'}</div>}
                        {trackInfo && <div className="text-[6px] font-bold text-zinc-400 w-20 truncate text-center uppercase mt-0.5">{trackInfo.artist}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Animated progress bar with energy profile
const ProgressBar = ({ getProgress, duration, energyProfile }: { getProgress: () => number, duration: number, energyProfile?: number[] }) => {
    const barRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let id: number;
        const draw = () => {
            if (!barRef.current || !glowRef.current) { id = requestAnimationFrame(draw); return; }
            const prog = getProgress();
            barRef.current.style.width = `${prog}%`;
            let color = '#4ade80'; // green
            if (prog > 90) color = '#ef4444';        // red
            else if (prog > 70) color = '#f97316';   // orange
            barRef.current.style.background = `linear-gradient(90deg, ${color}88, ${color})`;
            barRef.current.style.boxShadow = `0 0 8px ${color}80`;
            glowRef.current.style.left = `${prog}%`;
            glowRef.current.style.background = color;
            glowRef.current.style.boxShadow = `0 0 6px 2px ${color}`;
            id = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(id);
    }, [getProgress]);

    return (
        <div className="absolute bottom-0 left-0 w-full h-[6px] bg-black/80 z-30 flex items-end overflow-hidden border-t border-zinc-800">
            {energyProfile && energyProfile.length > 0 && energyProfile.map((val, i) => (
                <div key={i} className="flex-1 bg-zinc-500/80" style={{ height: `${Math.max(10, val * 100)}%` }} />
            ))}
            <div ref={barRef} className="absolute left-0 top-0 h-full transition-none mix-blend-screen opacity-80" style={{ width: '0%' }} />
            <div ref={glowRef} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full transition-none" style={{ left: '0%' }} />
        </div>
    );
};

const TrackTimeDisplay = ({ getProgress, duration }: { getProgress: () => number, duration: number }) => {
    const elapsedRef = useRef<HTMLDivElement>(null);
    const remainRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!duration) return;
        let animationId: number;
        const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(Math.floor(seconds % 60)).toString().padStart(2, '0')}`;
        const draw = () => {
            if (elapsedRef.current && remainRef.current) {
                const prog = getProgress();
                const timeElapsed = (prog / 100) * duration;
                const timeRemain = duration - timeElapsed;
                elapsedRef.current.innerText = formatTime(timeElapsed || 0);
                remainRef.current.innerText = `-${formatTime(timeRemain || 0)}`;
            }
            animationId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [getProgress, duration]);

    return (
        <div className="text-right">
            <div ref={remainRef} className="text-orange-500 font-mono text-[9px]">- 0:00</div>
            <div ref={elapsedRef} className="text-zinc-400 font-mono text-[8px]">0:00</div>
        </div>
    );
};

const ScreenDeckStrip = ({ deck, id, align }: { deck: any, id: string, align: 'left' | 'right' }) => (
    <div className="flex-1 border-b border-zinc-800/80 relative overflow-hidden bg-black/80">
        <div className={`absolute top-1 ${align === 'left' ? 'left-2' : 'right-2'} z-20 flex gap-2 items-center ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
            <div className="w-8 h-8 bg-zinc-900 border border-zinc-700 rounded flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                <span className="text-zinc-600 font-black text-[10px]">{id}</span>
            </div>
            <div className={`flex flex-col text-white drop-shadow-md ${align === 'right' ? 'items-end' : ''}`}>
                <span className="font-bold text-xs leading-tight truncate w-32">{deck.trackInfo.title || 'NO TRACK'}</span>
                <span className="text-zinc-400 text-[9px] uppercase tracking-widest">{deck.trackInfo.artist}</span>
            </div>
        </div>

        <div className={`absolute top-1 ${align === 'left' ? 'left-48' : 'right-48'} z-20 flex items-center gap-2 bg-black/50 px-2 py-0.5 rounded border border-zinc-800 backdrop-blur-sm scale-75 origin-${align}`}>
            <div className="flex flex-col items-center">
                <span className="text-[6px] text-zinc-500 font-bold tracking-widest mb-0.5">BPM</span>
                <span className="font-mono text-blue-400 text-sm font-black leading-none drop-shadow-[0_0_5px_blue]">{deck.bpm.toFixed(1)}</span>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex flex-col items-center">
                <span className="text-[6px] text-zinc-500 font-bold tracking-widest mb-0.5">PITCH</span>
                <span className="font-mono text-green-400 text-xs font-bold leading-none">{deck.pitchPercent > 0 ? '+' : ''}{deck.pitchPercent.toFixed(2)}%</span>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex flex-col items-center">
                <span className="text-[6px] text-zinc-500 font-bold tracking-widest mb-0.5">KEY</span>
                <span className={`font-bold text-xs leading-none ${deck.keyLock ? 'text-red-500 drop-shadow-[0_0_5px_red]' : 'text-zinc-400'}`}>
                    {deck.keyLock ? `🔒 ${deck.musicalKey}` : deck.musicalKey}
                </span>
            </div>
        </div>

        <div className={`absolute bottom-1 ${align === 'left' ? 'left-2' : 'right-2'} z-20 text-${align} bg-black/50 px-2 py-0.5 rounded border border-zinc-800 backdrop-blur-sm scale-75 origin-bottom-${align}`}>
            <div className="text-orange-500 font-mono text-sm font-black drop-shadow-[0_0_5px_orange]"><TrackTimeDisplay getProgress={deck.getProgress} duration={deck.trackInfo.duration} /></div>
        </div>

        <div className="absolute inset-0 z-0 opacity-80">
            <WaveformDisplay peaks={deck.waveformPeaks} getProgress={deck.getProgress} zoom={4} onSeek={deck.seekTo} bpm={deck.bpm} duration={deck.trackInfo.duration} loopIn={deck.loopIn} loopOut={deck.loopOut} loopActive={deck.loopActive} isAnalyzing={deck.isAnalyzing} gridOffset={deck.gridOffset} />
        </div>

        {/* Full width mini progress bar at the very bottom */}
        <ProgressBar getProgress={deck.getProgress} duration={deck.trackInfo.duration} energyProfile={deck.energyProfile} />
    </div>
);

const CentralScreen = ({ deck1, deck2, deck3, deck4 }: { deck1: any, deck2: any, deck3: any, deck4: any }) => {
    return (
        <div className="w-[720px] bg-[#050507] rounded-t-xl border-[6px] border-zinc-900 border-b-zinc-800 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_5px_30px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden h-[360px] mx-auto shrink-0 z-20">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none z-10"></div>

            <ScreenDeckStrip deck={deck3} id="3" align="left" />
            <ScreenDeckStrip deck={deck1} id="1" align="left" />
            <ScreenDeckStrip deck={deck2} id="2" align="right" />
            <ScreenDeckStrip deck={deck4} id="4" align="right" />

            {/* Global Center Playhead */}
            <div className="absolute top-0 left-1/2 w-[2px] h-full bg-red-500 shadow-[0_0_15px_red] z-30 pointer-events-none transform -translate-x-1/2 flex flex-col justify-between items-center py-2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500"></div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-red-500"></div>
            </div>
        </div>
    );
};

const DeckAZ = ({ id, deckState, isMaster, onSetMaster, onSync, onDropTrack }: { id: string, deckState: any, isMaster: boolean, onSetMaster: () => void, onSync: () => void, onDropTrack: (deckId: string) => void }) => {
    const { loadTrack, play, pause, cue, scrub, setScrubbing, seekTo, toggleLoop, setLoopIn, setLoopOut, exitLoop, halveLoop, doubleLoop, loopActive, loopAdjustMode, isPlaying, getProgress, setPitch, setFxLevel, setFxParam, triggerPadFX, triggerSample, keyLock, toggleKeyLock, trackInfo, hotCues, triggerHotCue, triggerBeatLoop, triggerBeatJump, quantize, setQuantize, isSyncEnabled } = deckState;
    const [pitchFader, setPitchFader] = useState(50);
    const [padMode, setPadMode] = useState<'HOT CUE' | 'BEAT LOOP' | 'SLIP LOOP' | 'BEAT JUMP'>('HOT CUE');
    const [fxParamUI, setFxParamUI] = useState(50);
    const [fxLevelUI, setFxLevelUI] = useState(100);
    const [isDragOver, setIsDragOver] = useState(false);
    const wasPlayingRef = useRef(false);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) loadTrack(e.target.files[0]); };

    useEffect(() => { setPitch(pitchFader); }, [pitchFader]);
    useEffect(() => { setFxLevel(fxLevelUI); }, [fxLevelUI]);
    useEffect(() => { setFxParam(fxParamUI); }, [fxParamUI]);

    const getPadsConfig = () => {
        if (padMode === 'BEAT LOOP') return [
            { label: '1/4', val: 0.25, color: 'bg-green-500' }, { label: '1/2', val: 0.5, color: 'bg-green-500' },
            { label: '1', val: 1, color: 'bg-green-500' }, { label: '2', val: 2, color: 'bg-green-500' },
            { label: '4', val: 4, color: 'bg-green-500' }, { label: '8', val: 8, color: 'bg-green-500' },
            { label: '16', val: 16, color: 'bg-green-500' }, { label: '32', val: 32, color: 'bg-green-500' },
        ];
        if (padMode === 'BEAT JUMP') return [
            { label: '-8', val: -8, color: 'bg-purple-500' }, { label: '-4', val: -4, color: 'bg-purple-500' },
            { label: '-2', val: -2, color: 'bg-purple-500' }, { label: '-1', val: -1, color: 'bg-purple-500' },
            { label: '+1', val: 1, color: 'bg-purple-500' }, { label: '+2', val: 2, color: 'bg-purple-500' },
            { label: '+4', val: 4, color: 'bg-purple-500' }, { label: '+8', val: 8, color: 'bg-purple-500' },
        ];
        if (padMode === 'SLIP LOOP') return [
            { label: '1/16', val: 'roll116', color: 'bg-cyan-500' }, { label: '1/8', val: 'roll18', color: 'bg-cyan-500' },
            { label: '1/4', val: 'roll14', color: 'bg-cyan-500' }, { label: '1/2', val: 'roll12', color: 'bg-cyan-500' },
            { label: '1', val: 'roll1', color: 'bg-cyan-500' }, { label: '2', val: 'roll2', color: 'bg-cyan-500' },
            { label: '3/4', val: 'roll34', color: 'bg-cyan-500' }, { label: '4', val: 'roll4', color: 'bg-cyan-500' },
        ];
        // Default HOT CUE
        return Array.from({ length: 8 }).map((_, i) => ({
            label: hotCues[i] !== undefined ? `CUE ${String.fromCharCode(65 + i)}` : '',
            val: i,
            color: hotCues[i] !== undefined ? 'bg-orange-500' : 'bg-zinc-700'
        }));
    };

    return (
        <div
            className={`flex flex-col w-[400px] bg-gradient-to-b from-[#1c1c1f] to-[#121214] p-4 rounded-xl border transition-all ${isDragOver ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'border-zinc-700/50 shadow-[25px_25px_50px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.05)]'} relative`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDropTrack(id); }}
        >
            <div className="absolute top-2 left-2"><Screw /></div><div className="absolute top-2 right-2"><Screw /></div>
            <div className="absolute bottom-2 left-2"><Screw /></div><div className="absolute bottom-2 right-2"><Screw /></div>

            <div className="bg-black/60 rounded p-2 mb-3 border border-zinc-800 shadow-[inset_0_2px_5px_rgba(0,0,0,1)] flex items-center justify-between">
                <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_blue] animate-pulse"></div>
                    <span className="text-zinc-400 font-bold text-[10px] tracking-widest">DECK {id}</span>
                </div>
                <div className="flex gap-2">
                    <label className="cursor-pointer text-[8px] bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-0.5 rounded border border-zinc-600 transition-colors">
                        BROWSE <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
                    </label>
                </div>
            </div>

            {/* Top Row: Loop Controls */}
            <div className="flex justify-between items-center mb-4 px-2 mt-2">
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-lg border border-zinc-800/50">
                    <button onClick={setLoopIn} className={`w-8 h-8 rounded-full text-[8px] font-black border-2 transition-all ${loopAdjustMode === 'in' ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,1)] animate-pulse scale-105' : 'bg-zinc-900 border-yellow-500/20 text-yellow-500/50 hover:border-yellow-500/50 active:bg-yellow-500 active:text-black'}`}>IN</button>
                    <button onClick={setLoopOut} className={`w-8 h-8 rounded-full text-[8px] font-black border-2 transition-all ${loopAdjustMode === 'out' ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,1)] animate-pulse scale-105' : 'bg-zinc-900 border-yellow-500/20 text-yellow-500/50 hover:border-yellow-500/50 active:bg-yellow-500 active:text-black'}`}>OUT</button>
                    <button onClick={exitLoop} className={`w-8 h-8 rounded-full text-[7px] font-black border-2 transition-all ${loopActive ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:bg-zinc-800'}`}>EXIT</button>
                </div>
                <div className="flex gap-2">
                    <button onClick={halveLoop} className="w-6 h-6 rounded-full text-[10px] font-bold border transition-all bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800">{'<'}</button>
                    <button onClick={doubleLoop} className="w-6 h-6 rounded-full text-[10px] font-bold border transition-all bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800">{'>'}</button>
                    <button onClick={() => toggleLoop(4)} className={`w-10 h-6 rounded text-[8px] font-black border transition-all flex items-center justify-center gap-1 ${loopActive ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}>
                        4 BT
                    </button>
                </div>
            </div>

            {/* Middle Row: Jog Wheel, Search & Pitch */}
            <div className="flex justify-between items-center mb-6">
                {/* Left side of Jog: Search & Utilities */}
                <div className="flex flex-col gap-2 pl-2 w-16">
                    <button className="w-10 py-1 rounded bg-zinc-900 border border-zinc-700 text-[6px] text-white font-bold tracking-widest shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] active:bg-red-600">SLIP</button>
                    <button onClick={() => setQuantize(!quantize)} className={`w-10 py-1 rounded border text-[6px] font-bold tracking-widest shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] transition-all ${quantize ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-zinc-900 text-zinc-500 border-zinc-700'}`}>QUANTIZE</button>

                    <span className="text-[5px] text-zinc-500 font-bold tracking-widest leading-none mt-2">TRACK SEARCH</span>
                    <div className="flex gap-1">
                        <button onClick={() => seekTo(0)} className="w-8 h-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8px] flex items-center justify-center font-black active:bg-zinc-800">{'|<<'}</button>
                        <button onClick={() => seekTo(0)} className="w-8 h-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8px] flex items-center justify-center font-black active:bg-zinc-800">{'>>|'}</button>
                    </div>
                    <span className="text-[5px] text-zinc-500 font-bold tracking-widest leading-none mt-1">SEARCH</span>
                    <div className="flex gap-1">
                        <button onClick={() => seekTo(Math.max(0, getProgress() - 5))} className="w-8 h-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8px] flex items-center justify-center font-black active:bg-zinc-800">{'<<'}</button>
                        <button onClick={() => seekTo(Math.min(100, getProgress() + 5))} className="w-8 h-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8px] flex items-center justify-center font-black active:bg-zinc-800">{'>>'}</button>
                    </div>
                </div>

                {/* Center: CDJ Jog Wheel */}
                <InteractiveJogWheel getProgress={getProgress} onScrubStart={() => { wasPlayingRef.current = isPlaying; setScrubbing(true); }} onScrub={(delta: number) => scrub(delta)} onScrubEnd={() => { setScrubbing(false); if (wasPlayingRef.current) play(undefined, true); }} trackInfo={trackInfo} />

                {/* Right side of Jog: Pitch & Sync */}
                <div className="flex flex-col items-center h-full gap-2 pr-2 w-16">
                    <div className="w-full flex justify-between px-1">
                        <button onClick={onSync} className={`w-8 py-0.5 border rounded text-[5px] font-black transition-all ${isSyncEnabled ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-zinc-900 border-zinc-700 text-zinc-400 active:bg-blue-500 active:text-white'}`}>SYNC</button>
                        <button onClick={onSetMaster} className={`w-8 py-0.5 border rounded text-[5px] font-black transition-all ${isMaster ? 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-zinc-900 border-zinc-700 text-zinc-400 active:bg-orange-500 active:text-white'}`}>MASTER</button>
                    </div>
                    <button onClick={toggleKeyLock} className={`w-10 py-1 border rounded text-[6px] font-black transition-all ${keyLock ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}>MT</button>
                    <div className="mt-4 relative flex justify-center">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[2px] bg-red-500/50 pointer-events-none z-10 mix-blend-screen"></div>
                        <ProFader value={pitchFader} onChange={setPitch} height="h-32" width="w-6" label="" invertVertical={true} />
                    </div>
                    <button className="w-10 py-1 mt-1 border rounded text-[6px] font-black bg-zinc-900 border-zinc-700 text-zinc-500 active:bg-zinc-800">TEMPO</button>
                </div>
            </div>

            {/* Bottom Row: Play/Cue & Performance Pads */}
            <div className="flex gap-4 items-end mt-auto">
                {/* Transport Buttons */}
                <div className="flex flex-col gap-3 pb-2 pl-2 shrink-0">
                    <button onPointerDown={() => cue(true)} onPointerUp={() => cue(false)} onPointerLeave={() => cue(false)} className="w-14 h-14 rounded-full bg-[#111] border-[3px] border-zinc-800 flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.05)] active:scale-95 transition-all group relative overflow-hidden">
                        <div className="absolute inset-0 bg-orange-600 opacity-0 group-active:opacity-20 transition-opacity"></div>
                        <span className="text-orange-500 font-black text-xs tracking-wider group-active:text-white group-active:drop-shadow-[0_0_10px_orange]">CUE</span>
                    </button>
                    <button onClick={isPlaying ? pause : () => play()} className={`w-14 h-14 rounded-full bg-[#111] border-[3px] border-zinc-800 flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.05)] active:scale-95 transition-all group relative overflow-hidden ${isPlaying ? 'border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : ''}`}>
                        <div className={`absolute inset-0 bg-green-500 transition-opacity ${isPlaying ? 'opacity-10' : 'opacity-0 group-active:opacity-20'}`}></div>
                        {isPlaying ?
                            <Pause className="text-green-500 w-5 h-5 drop-shadow-[0_0_15px_rgba(34,197,94,1)]" /> :
                            <Play className="text-green-500 w-5 h-5 group-active:text-white group-active:drop-shadow-[0_0_10px_green] ml-1" />
                        }
                    </button>
                </div>

                {/* Performance Pads below Jog Wheel */}
                <div className="flex-grow bg-black/40 p-2.5 rounded-xl border border-zinc-800/50 shadow-[inset_0_5px_15px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex gap-1">
                            <button onClick={() => setPadMode('HOT CUE')} className={`text-[6px] px-2 py-1 rounded font-black tracking-widest transition-all ${padMode === 'HOT CUE' ? 'bg-white text-black' : 'bg-zinc-900 border border-zinc-700 text-zinc-300'}`}>HOT CUE</button>
                            <button onClick={() => setPadMode('BEAT LOOP')} className={`text-[6px] px-2 py-1 rounded font-black tracking-widest transition-all ${padMode === 'BEAT LOOP' ? 'bg-white text-black' : 'bg-zinc-900 border border-zinc-700 text-zinc-300'}`}>BEAT LOOP</button>
                            <button onClick={() => setPadMode('SLIP LOOP')} className={`text-[6px] px-2 py-1 rounded font-black tracking-widest transition-all ${padMode === 'SLIP LOOP' ? 'bg-white text-black' : 'bg-zinc-900 border border-zinc-700 text-zinc-300'}`}>SLIP LOOP</button>
                            <button onClick={() => setPadMode('BEAT JUMP')} className={`text-[6px] px-2 py-1 rounded font-black tracking-widest transition-all ${padMode === 'BEAT JUMP' ? 'bg-white text-black' : 'bg-zinc-900 border border-zinc-700 text-zinc-300'}`}>BEAT JUMP</button>
                        </div>
                        <div className="flex gap-2">
                            <ProKnob value={fxParamUI} onChange={setFxParamUI} label="PRM" size="w-6 h-6" />
                            <ProKnob value={fxLevelUI} onChange={setFxLevelUI} label="LVL" size="w-6 h-6" />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {getPadsConfig().map((pad: any, i) => (
                            <button key={i}
                                onPointerDown={() => {
                                    if (padMode === 'HOT CUE') triggerHotCue(pad.val);
                                    else if (padMode === 'BEAT LOOP') triggerBeatLoop(pad.val);
                                    else if (padMode === 'BEAT JUMP') triggerBeatJump(pad.val);
                                }}
                                className={`h-11 bg-zinc-900 border-b-[3px] border-zinc-950 rounded shadow-[inset_0_1px_3px_rgba(255,255,255,0.05)] active:border-b-0 active:translate-y-[3px] transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden`}
                            >
                                <div className={`absolute bottom-0 w-full h-1/2 bg-gradient-to-t ${pad.color.replace('bg-', 'from-')} to-transparent opacity-10 group-active:opacity-30 transition-opacity`}></div>
                                <div className={`w-8 h-1 rounded-full ${pad.color} opacity-30 group-active:opacity-100 group-active:shadow-[0_0_15px_currentColor] transition-opacity`}></div>
                                <span className="text-[7px] font-black text-zinc-600 group-active:text-white truncate px-1 w-full text-center tracking-widest">{pad.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isDragOver && (
                <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 rounded-xl flex items-center justify-center border-2 border-blue-500 pointer-events-none">
                    <div className="bg-blue-600 text-white font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                        <ArrowRightToLine className="w-5 h-5" /> LOAD TO DECK {id}
                    </div>
                </div>
            )}

            <label className="absolute top-3 right-3 cursor-pointer opacity-30 hover:opacity-100 transition-opacity bg-zinc-900 p-1 rounded border border-zinc-700 shadow-lg"><Settings className="w-3 h-3 text-zinc-300" /><input type="file" accept="audio/*" onChange={handleFile} className="hidden" /></label>
        </div>
    );
};

const MixerChannelStrip = ({ id, deckState, globalColorFX }: { id: string, deckState: any, globalColorFX: string }) => {
    const { setVolume, setTrim, setEqVal, setColorFX, setColorRes, getLevel } = deckState;
    const [trim, setTrimUI] = useState(50); const [eqHi, setEqHiUI] = useState(50);
    const [eqMid, setEqMidUI] = useState(50); const [eqLow, setEqLowUI] = useState(50);
    const [filter, setFilterUI] = useState(50); const [res, setResUI] = useState(0);
    const [fader, setFaderUI] = useState(100); const [cueActive, setCueActive] = useState(false);

    // Use audio taper (squared curve) for professional fader response
    useEffect(() => { setTrim(trim / 50); }, [trim, setTrim]);
    useEffect(() => { setEqVal('high', eqHi); }, [eqHi, setEqVal]);
    useEffect(() => { setEqVal('mid', eqMid); }, [eqMid, setEqVal]);
    useEffect(() => { setEqVal('low', eqLow); }, [eqLow, setEqVal]);
    useEffect(() => { setColorFX(filter); }, [filter, setColorFX]);
    useEffect(() => { setColorRes(res); }, [res, setColorRes]);
    useEffect(() => { setVolume(Math.pow(fader / 100, 2)); }, [fader, setVolume]);

    return (
        <div className="flex flex-col items-center gap-2 w-12 relative">
            <div className="text-zinc-500 font-black text-[9px] mb-0.5 bg-zinc-900 px-1.5 py-0.5 rounded shadow-inner tracking-widest">{id}</div>
            <ProKnob value={trim} onChange={setTrimUI} label="TRIM" size="w-7 h-7" />
            <div className="w-full h-[1px] bg-zinc-800/80 my-0.5"></div>
            <ProKnob value={eqHi} onChange={setEqHiUI} label="HI" bipolar size="w-7 h-7" />
            <ProKnob value={eqMid} onChange={setEqMidUI} label="MID" bipolar size="w-7 h-7" />
            <ProKnob value={eqLow} onChange={setEqLowUI} label="LOW" bipolar size="w-7 h-7" />
            <div className="w-full h-[1px] bg-zinc-800/80 my-0.5"></div>

            <div className="flex flex-col items-center gap-0.5 bg-zinc-950/50 p-1 rounded">
                <ProKnob value={filter} onChange={setFilterUI} label="COLOR" bipolar size="w-8 h-8" />
                <ProKnob value={res} onChange={setResUI} label="RES" size="w-4 h-4" />
            </div>

            <button onClick={() => setCueActive(!cueActive)} className={`mt-1 w-6 h-5 rounded border flex items-center justify-center transition-all ${cueActive ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}>
                <Headphones className={`w-2.5 h-2.5 ${cueActive ? 'text-orange-500' : 'text-zinc-600'}`} />
            </button>

            <div className="flex gap-1.5 mt-1">
                <ProFader value={fader} onChange={setFaderUI} label="" height="h-28" width="w-5" />
                <VuMeter levelFn={getLevel} />
            </div>
        </div>
    );
};

const MicStrip = ({ micHook }: { micHook: any }) => {
    return (
        <div className="flex flex-col items-center gap-2 w-10 bg-zinc-950/40 p-1.5 rounded-lg border border-zinc-800/50">
            <div className="text-zinc-500 font-black text-[8px] mb-0.5 tracking-widest">MIC</div>
            <button onClick={micHook.toggleMic} className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${micHook.active ? 'bg-red-500/20 border-red-500 shadow-[0_0_10px_red]' : 'bg-zinc-900 border-zinc-700'}`}>
                <Mic className={`w-3 h-3 ${micHook.active ? 'text-red-500' : 'text-zinc-500'}`} />
            </button>
            <div className="w-full h-[1px] bg-zinc-800/80 my-0.5"></div>
            <ProKnob value={micHook.vol} onChange={micHook.setVol} label="LVL" size="w-6 h-6" />
            <div className="flex gap-1 mt-auto pt-1">
                <VuMeter levelFn={micHook.getLevel} />
            </div>
        </div>
    );
}

const SoundColorFXStrip = ({ activeColor, setActiveColor }: { activeColor: string, setActiveColor: (color: string) => void }) => {
    return (
        <div className="flex flex-col items-center gap-1.5 w-12 bg-zinc-950/40 p-1.5 rounded-lg border border-zinc-800/50">
            <div className="text-zinc-500 font-black text-[7px] text-center leading-none tracking-widest mb-1">SOUND<br />COLOR FX</div>

            <div className="grid grid-cols-2 gap-1 w-full mt-2">
                {['SPACE', 'DUB ECHO', 'SWEEP', 'NOISE', 'CRUSH', 'FILTER'].map(fx => (
                    <div key={fx} onClick={() => setActiveColor(fx)} className={`h-5 rounded-[2px] border flex items-center justify-center cursor-pointer transition-colors ${activeColor === fx ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}>
                        <span className={`text-[4px] font-bold tracking-tighter leading-none text-center ${activeColor === fx ? 'text-blue-400' : 'text-zinc-500'}`}>{fx.replace(' ', '\n')}</span>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-2 flex flex-col items-center">
                <ProKnob value={50} onChange={() => { }} label="PARAMETER" size="w-7 h-7" />
            </div>
        </div>
    );
}

const MasterFXStrip = ({ deck1, deck2, deck3, deck4, beatFXList }: { deck1: any, deck2: any, deck3: any, deck4: any, beatFXList: string[] }) => {
    const [masterFxLvl, setMasterFxLvl] = useState(0);
    const [masterFxParam, setMasterFxParam] = useState(40);
    const [activeFx, setActiveFx] = useState(beatFXList[0] || 'REVERB');
    const [fxChannel, setFxChannel] = useState('MASTER');
    const [isOn, setIsOn] = useState(false);

    useEffect(() => {
        if (!beatFXList.includes(activeFx) && beatFXList.length > 0) {
            setActiveFx(beatFXList[0]);
        }
    }, [beatFXList, activeFx]);

    useEffect(() => {
        const type = activeFx;
        const allDecks = [deck1, deck2, deck3, deck4];
        let targetDecks: any[] = [];

        if (fxChannel === '1') targetDecks = [deck1];
        else if (fxChannel === '2') targetDecks = [deck2];
        else if (fxChannel === '3') targetDecks = [deck3];
        else if (fxChannel === '4') targetDecks = [deck4];
        else if (fxChannel === 'MASTER') targetDecks = allDecks;

        if (isOn) {
            targetDecks.forEach(deck => {
                deck.setFxLevel(masterFxLvl);
                deck.setFxParam(masterFxParam);
                deck.triggerPadFX(type, true);
            });
            // Turn off for others
            allDecks.filter(d => !targetDecks.includes(d)).forEach(deck => {
                beatFXList.forEach((fxName: string) => deck.triggerPadFX(fxName, false));
            });
        } else {
            allDecks.forEach(deck => {
                beatFXList.forEach((fxName: string) => deck.triggerPadFX(fxName, false));
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOn, activeFx, masterFxLvl, masterFxParam, fxChannel, beatFXList]);

    return (
        <div className="flex flex-col items-center w-20 bg-zinc-950/40 p-1.5 rounded-lg border border-zinc-800/50 relative overflow-hidden">
            <div className="text-zinc-500 font-black text-[8px] mb-1 tracking-widest text-center leading-none">BEAT FX<br /><span className="text-[5px] text-zinc-600">X-PAD</span></div>

            {/* Mini Screen */}
            <div className="w-full h-8 bg-blue-950/40 border border-blue-900/50 rounded flex flex-col items-center justify-center mb-1 shadow-inner">
                <span className="text-blue-400 font-bold text-[7px] leading-none">{FX_ABBREVIATIONS[activeFx] || activeFx.substring(0, 3).toUpperCase()}</span>
                <span className="text-blue-200 text-[5px] leading-none mt-0.5">{fxChannel}</span>
            </div>

            {/* Beat Buttons & X-PAD */}
            <div className="flex w-full justify-between gap-0.5 mb-1">
                <button className="flex-1 bg-zinc-900 border border-zinc-800 rounded-sm text-[5px] font-bold text-zinc-400 py-0.5 hover:bg-zinc-800">&lt;</button>
                <button className="flex-1 bg-zinc-900 border border-zinc-800 rounded-sm text-[5px] font-bold text-zinc-400 py-0.5 hover:bg-zinc-800">&gt;</button>
            </div>
            <div className="w-full h-2 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-sm mb-2 shadow-inner cursor-ew-resize relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[4px] text-zinc-500 font-black">X-PAD</div>
            </div>

            {/* Selectors */}
            <div className="w-full flex justify-between gap-1 mb-2">
                <div className="flex-1 flex flex-col items-center">
                    <span className="text-[4px] text-zinc-500 font-bold mb-0.5">FX</span>
                    <div onClick={() => {
                        setActiveFx(beatFXList[(beatFXList.indexOf(activeFx) + 1) % beatFXList.length] || beatFXList[0]);
                    }} className="w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-600">
                        <div className="w-1 h-1 bg-zinc-500 rounded-full"></div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                    <span className="text-[4px] text-zinc-500 font-bold mb-0.5">CH</span>
                    <div onClick={() => {
                        const channels = ['1', '2', '3', '4', 'MASTER'];
                        setFxChannel(channels[(channels.indexOf(fxChannel) + 1) % channels.length]);
                    }} className="w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-600">
                        <div className="w-1 h-1 bg-zinc-500 rounded-full"></div>
                    </div>
                </div>
            </div>

            <div className="w-full h-[1px] bg-zinc-800/80 my-1"></div>

            <ProKnob value={masterFxParam} onChange={setMasterFxParam} label="TIME" size="w-8 h-8" />
            <div className="my-1"></div>
            <ProKnob value={masterFxLvl} onChange={setMasterFxLvl} label="LEVEL/DEPTH" size="w-8 h-8" />

            <div className="mt-auto pt-2 flex flex-col items-center">
                <button onClick={() => setIsOn(!isOn)} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-1 cursor-pointer active:scale-95 transition-all ${isOn ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-zinc-900 border-zinc-700'}`}>
                    <span className={`font-black tracking-widest text-[7px] ${isOn ? 'text-blue-400' : 'text-zinc-600'}`}>ON/OFF</span>
                </button>
            </div>
        </div>
    );
}

interface TrackRecord {
    id: string;
    file: File;
    title: string;
    artist: string;
    bpm: number;
    duration: string; // Formatted "mm:ss" for display
}

interface Playlist {
    id: string;
    name: string;
    tracks: string[]; // Array of track IDs
}

export default function App({ onBack }: { onBack?: () => void }) {
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
    const [powerOn, setPowerOn] = useState(true);
    const [crossfader, setCrossfader] = useState(50);
    const [masterVol, setMasterVol] = useState(80);
    const [globalColorFX, setGlobalColorFX] = useState('FILTER');
    const [masterDeckId, setMasterDeckId] = useState<string>('1');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { midiEnabled, deviceName, lastMessages } = useMIDI();

    // Library State
    const [allTracks, setAllTracks] = useState<Record<string, TrackRecord>>({});
    const [playlists, setPlaylists] = useState<Playlist[]>([{ id: 'collection', name: 'Collection', tracks: [] }]);
    const [activePlaylistId, setActivePlaylistId] = useState('collection');
    const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
    const [showAddPlaylist, setShowAddPlaylist] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);

    useEffect(() => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioCtx(ctx);
        return () => { ctx.close(); };
    }, []);

    const { beatFXList } = useFXConfig();
    const deck1 = useAudioDeck(audioCtx, beatFXList);
    const deck2 = useAudioDeck(audioCtx, beatFXList);
    const deck3 = useAudioDeck(audioCtx, beatFXList);
    const deck4 = useAudioDeck(audioCtx, beatFXList);
    const micState = useMicrophone(audioCtx);

    useEffect(() => {
        if (!audioCtx) return;
        const x = crossfader / 100;
        const gain1 = Math.cos(x * 0.5 * Math.PI);
        const gain2 = Math.cos((1.0 - x) * 0.5 * Math.PI);
        deck1.setCrossfader(gain1); deck3.setCrossfader(gain1); // Left side
        deck2.setCrossfader(gain2); deck4.setCrossfader(gain2); // Right side
    }, [crossfader, audioCtx]);

    useEffect(() => {
        if (!audioCtx) return;
        const master = masterVol / 80;
        deck1.setMaster(master); deck2.setMaster(master);
        deck3.setMaster(master); deck4.setMaster(master);
    }, [masterVol, audioCtx]);

    useEffect(() => {
        deck1.setActiveColorFX(globalColorFX);
        deck2.setActiveColorFX(globalColorFX);
        deck3.setActiveColorFX(globalColorFX);
        deck4.setActiveColorFX(globalColorFX);
    }, [globalColorFX]);

    useEffect(() => {
        const decks: Record<string, any> = { '1': deck1, '2': deck2, '3': deck3, '4': deck4 };
        const masterDeck = decks[masterDeckId];
        if (!masterDeck) return;

        Object.entries(decks).forEach(([id, deck]) => {
            if (id !== masterDeckId && deck.isSyncEnabled) {
                deck.setBpm(masterDeck.bpm);
            }
        });
    }, [masterDeckId, deck1.bpm, deck2.bpm, deck3.bpm, deck4.bpm, deck1.isSyncEnabled, deck2.isSyncEnabled, deck3.isSyncEnabled, deck4.isSyncEnabled]);

    const toggleSync = (deckId: string) => {
        const decks: Record<string, any> = { '1': deck1, '2': deck2, '3': deck3, '4': deck4 };
        const deck = decks[deckId];
        const masterDeck = decks[masterDeckId];

        if (!deck.isSyncEnabled) {
            deck.setIsSyncEnabled(true);
            if (masterDeckId !== deckId) {
                deck.setBpm(masterDeck.bpm);
            }
        } else {
            deck.setIsSyncEnabled(false);
        }
    };

    // Persistent File System Access
    const [rootFolderHandle, setRootFolderHandle] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        import('./utils/db').then(({ getDirectoryHandle }) => {
            getDirectoryHandle().then(handle => {
                if (handle) setRootFolderHandle(handle);
            });
        });
    }, []);

    const scanDirectory = async (dirHandle: any, path: string = ''): Promise<File[]> => {
        const files: File[] = [];
        try {
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    if (entry.name.toLowerCase().endsWith('.mp3') || entry.name.toLowerCase().endsWith('.wav') || entry.name.toLowerCase().endsWith('.flac')) {
                        const file = await entry.getFile();
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: path === '' ? `${dirHandle.name}/${entry.name}` : `${dirHandle.name}/${path}/${entry.name}`,
                            writable: false
                        });
                        files.push(file);
                    }
                } else if (entry.kind === 'directory') {
                    const subPath = path === '' ? entry.name : `${path}/${entry.name}`;
                    const subFiles = await scanDirectory(entry, subPath);
                    files.push(...subFiles);
                }
            }
        } catch (err) {
            console.error("Error reading directory", err);
        }
        return files;
    };

    const handleSelectRootFolder = async () => {
        try {
            const dirHandle = await (window as any).showDirectoryPicker();
            const { saveDirectoryHandle } = await import('./utils/db');
            await saveDirectoryHandle(dirHandle);
            setRootFolderHandle(dirHandle);
            setIsScanning(true);
            const files = await scanDirectory(dirHandle);
            processFiles(files);
            setIsScanning(false);
        } catch (err) {
            console.log("User cancelled folder selection", err);
            setIsScanning(false);
        }
    };

    const handleRestoreFolder = async () => {
        if (!rootFolderHandle) return;
        try {
            const permission = await rootFolderHandle.queryPermission({ mode: 'read' });
            if (permission !== 'granted') {
                const request = await rootFolderHandle.requestPermission({ mode: 'read' });
                if (request !== 'granted') return;
            }
            setIsScanning(true);
            const files = await scanDirectory(rootFolderHandle);
            processFiles(files);
            setIsScanning(false);
        } catch (err) {
            console.error("Failed to restore folder", err);
            setIsScanning(false);
        }
    };

    const getMasterLeft = () => (deck1.getLevel() * 0.7) + (deck2.getLevel() * 0.3) + (deck3.getLevel() * 0.7) + (deck4.getLevel() * 0.3) + (micState.getLevel() * 0.5);
    const getMasterRight = () => (deck1.getLevel() * 0.3) + (deck2.getLevel() * 0.7) + (deck3.getLevel() * 0.3) + (deck4.getLevel() * 0.7) + (micState.getLevel() * 0.5);

    // Library Functions
    const processFiles = (files: File[]) => {
        const newTracks: Record<string, TrackRecord> = {};
        const newTrackIds: string[] = [];
        const newPlaylistsMap: Record<string, string[]> = {};


        files.forEach(file => {
            const id = Math.random().toString(36).substring(2, 9);
            // Fake metadata for UI speed. Real metadata requires async decoding or external libs.
            const fakeBpm = 120 + Math.floor(Math.random() * 15);
            const fakeMins = 3 + Math.floor(Math.random() * 4);
            const fakeSecs = Math.floor(Math.random() * 60).toString().padStart(2, '0');

            const keys = ['8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B', '1A', '1B'];
            const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];
            const randIdx = Math.floor(Math.random() * keys.length);

            newTracks[id] = {
                id,
                file: file,
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Unknown Artist",
                bpm: fakeBpm,
                key: keys[randIdx],
                color: colors[randIdx],
                duration: `${fakeMins}:${fakeSecs}`
            };
            newTrackIds.push(id);

            let folderName = 'Imported';
            if (file.webkitRelativePath) {
                const parts = file.webkitRelativePath.split('/');
                if (parts.length > 1) {
                    parts.pop(); 
                    if (parts.length > 1) {
                        folderName = parts.slice(1).join(' / ');
                    } else {
                        folderName = parts[0];
                    }
                }
            }

            if (!newPlaylistsMap[folderName]) newPlaylistsMap[folderName] = [];
            newPlaylistsMap[folderName].push(id);
        });

        setAllTracks(prev => ({ ...prev, ...newTracks }));
        setPlaylists(prev => {
            const updated = [...prev];
            const collectionIndex = updated.findIndex(p => p.id === 'collection');
            if (collectionIndex >= 0) {
                updated[collectionIndex] = { ...updated[collectionIndex], tracks: [...updated[collectionIndex].tracks, ...newTrackIds] };
            }

            Object.entries(newPlaylistsMap).forEach(([folderName, trackIds]) => {
                if (folderName === 'Imported' && Object.keys(newPlaylistsMap).length > 1 && trackIds.length === 0) return;

                const existingIndex = updated.findIndex(p => p.name === folderName);
                if (existingIndex >= 0) {
                    updated[existingIndex] = { ...updated[existingIndex], tracks: [...updated[existingIndex].tracks, ...trackIds] };
                } else {
                    updated.push({ id: 'pl_' + Math.random().toString(36).substring(2, 9), name: folderName, tracks: trackIds });
                }
            });
            return updated;
        });
    };

    const handleImportTracks = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('audio/') || f.name.toLowerCase().endsWith('.mp3') || f.name.toLowerCase().endsWith('.wav') || f.name.toLowerCase().endsWith('.flac'));
        processFiles(files);
    };

    const createPlaylist = () => {
        if (!newPlaylistName) return;
        const id = 'pl_' + Math.random().toString(36).substring(2, 9);
        setPlaylists([...playlists, { id, name: newPlaylistName, tracks: [] }]);
        setNewPlaylistName("");
        setShowAddPlaylist(false);
    };

    const handleDropToDeck = (deckId: string) => {
        if (!draggedTrackId) return;
        const track = allTracks[draggedTrackId];
        if (track) {
            if (deckId === '1') deck1.loadTrack({ file: track.file, bpm: track.bpm });
            if (deckId === '2') deck2.loadTrack({ file: track.file, bpm: track.bpm });
            if (deckId === '3') deck3.loadTrack({ file: track.file, bpm: track.bpm });
            if (deckId === '4') deck4.loadTrack({ file: track.file, bpm: track.bpm });
        }
        setDraggedTrackId(null);
    };

    const activeTracks = playlists.find(p => p.id === activePlaylistId)?.tracks.map(id => allTracks[id]) || [];

    return (
        <div className="h-screen w-full bg-[#0a0a0c] flex flex-col font-sans selection:bg-orange-500 overflow-hidden text-zinc-300">
            {!powerOn ? null : (
                <>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                /* Diseños de Scrollbar Pro (Webkit) */
                ::-webkit-scrollbar { width: 14px; height: 14px; }
                ::-webkit-scrollbar-track { background: #0d0d0f; border-left: 1px solid #18181b; }
                ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 7px; border: 4px solid #0d0d0f; }
                ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
                ::-webkit-scrollbar-corner { background: #0d0d0f; }
            `}} />

                    {/* TOP SECTION: MIXER & DECKS */}
                    <div className="flex-1 min-h-0 bg-[#09090a] flex flex-col items-center relative shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-10 transition-all duration-500 overflow-auto pt-8 px-8 pb-12">
                        <div className="w-full flex justify-between items-center mb-4">
                            {onBack ? (
                                <button
                                    onClick={onBack}
                                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-full transition-colors flex items-center gap-1 font-semibold self-start"
                                >
                                    ← Volver al menú
                                </button>
                            ) : <div></div>}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(true);
                                }}
                                className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs rounded-full border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-2 font-semibold shadow-sm"
                            >
                                <Menu className="w-3 h-3" />
                                Opciones FX
                            </button>
                        </div>

                        <div className="flex gap-4 p-4 bg-[#141416] rounded-2xl border-b-[8px] border-r-[8px] border-zinc-950 shadow-[0_40px_60px_rgba(0,0,0,1)] w-max m-auto items-end">
                            <DeckAZ id="1" deckState={deck1} isMaster={masterDeckId === '1'} onSetMaster={() => setMasterDeckId('1')} onSync={() => toggleSync('1')} onDropTrack={handleDropToDeck} />

                            <div className="flex flex-col items-center gap-0 shrink-0 relative z-10 mx-2">
                                <CentralScreen deck1={deck1} deck2={deck2} deck3={deck3} deck4={deck4} />

                                <div className="w-[560px] bg-gradient-to-b from-[#18181b] to-[#111113] p-4 rounded-b-xl border-[4px] border-t-0 border-zinc-900 shadow-[inset_0_5px_30px_rgba(0,0,0,0.8)] flex flex-col relative shrink-0 flex-1">
                                    <div className="absolute bottom-2 left-2"><Screw /></div><div className="absolute bottom-2 right-2"><Screw /></div>

                                    <div className="w-full text-center text-zinc-600 font-black text-[9px] tracking-widest mb-2 bg-black/40 py-1 rounded border border-zinc-800/50 shadow-inner">DJM PRO V8</div>

                                    <div className="flex justify-between px-1 h-full gap-1">
                                        <SoundColorFXStrip activeColor={globalColorFX} setActiveColor={setGlobalColorFX} />
                                        <MixerChannelStrip id="CH 3" deckState={deck3} globalColorFX={globalColorFX} />
                                        <MixerChannelStrip id="CH 1" deckState={deck1} globalColorFX={globalColorFX} />

                                        <div className="flex flex-col items-center justify-start pt-2 w-14 border-x border-zinc-800/50 px-1 bg-zinc-950/20">
                                            <div className="text-[6px] font-black text-zinc-500 mb-2">MASTER</div>
                                            <ProKnob value={masterVol} onChange={setMasterVol} label="LEVEL" size="w-10 h-10" isMaster={true} />
                                            <div className="w-full h-[1px] bg-zinc-800/80 my-2"></div>
                                            <ProKnob value={50} onChange={() => { }} label="BOOTH" size="w-7 h-7" />

                                            <div className="mt-auto mb-2 flex gap-1 bg-black p-1 rounded border border-zinc-800 shadow-[inset_0_2px_5px_rgba(0,0,0,1)]">
                                                <VuMeter levelFn={() => getMasterLeft() * (masterVol / 80)} peak />
                                                <VuMeter levelFn={() => getMasterRight() * (masterVol / 80)} peak />
                                            </div>
                                            <div className="flex gap-2 mb-2">
                                                <span className="text-[6px] font-bold text-zinc-600">L</span>
                                                <span className="text-[6px] font-bold text-zinc-600">R</span>
                                            </div>
                                        </div>

                                        <MixerChannelStrip id="CH 2" deckState={deck2} globalColorFX={globalColorFX} />
                                        <MixerChannelStrip id="CH 4" deckState={deck4} globalColorFX={globalColorFX} />
                                        <MasterFXStrip deck1={deck1} deck2={deck2} deck3={deck3} deck4={deck4} beatFXList={beatFXList} />
                                    </div>

                                    <div className="mt-2 w-full flex flex-col items-center gap-1.5 bg-black/40 p-2 rounded-lg border border-zinc-800/50 shadow-inner">
                                        <span className="text-[8px] font-bold text-zinc-500 tracking-widest">CROSSFADER</span>
                                        <div className="flex gap-4 items-center">
                                            <span className="text-[7px] font-bold text-zinc-600">A</span>
                                            <ProFader value={crossfader} onChange={setCrossfader} horizontal height="h-8" width="w-64" colorClass="bg-orange-500" />
                                            <span className="text-[7px] font-bold text-zinc-600">B</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DeckAZ id="2" deckState={deck2} isMaster={masterDeckId === '2'} onSetMaster={() => setMasterDeckId('2')} onSync={() => toggleSync('2')} onDropTrack={handleDropToDeck} />
                        </div>
                    </div>

                    {/* TOGGLE BAR */}
                    <div
                        onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                        className="w-full h-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-900 transition-colors group relative z-20 shadow-[0_0_15px_rgba(0,0,0,0.8)] flex-shrink-0"
                        title={isLibraryExpanded ? "Ocultar Librería" : "Mostrar Librería"}
                    >
                        <div className="w-32 h-1 rounded-full bg-zinc-700 group-hover:bg-blue-500 transition-colors"></div>
                        <div className="absolute flex items-center justify-center text-zinc-600 group-hover:text-blue-500 bg-zinc-950 px-2">
                            {isLibraryExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                        </div>
                    </div>

                    {/* BOTTOM SECTION: REKORDBOX LIBRARY */}
                    <div className={`flex bg-[#111113] overflow-hidden transition-all duration-500 ease-in-out flex-shrink-0 ${isLibraryExpanded ? 'h-[40vh] opacity-100' : 'h-0 opacity-0 pointer-events-none'}`}>

                        {/* Playlists Sidebar */}
                        <div className="w-64 flex-shrink-0 bg-[#0d0d0f] border-r border-zinc-800 flex flex-col min-h-0">
                            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#151518]">
                                <span className="font-bold text-sm tracking-wider flex items-center gap-2"><FolderPlus className="w-4 h-4 text-blue-500" /> LIBRARY</span>
                                <div className="flex gap-2">
                                    {rootFolderHandle && (
                                        <button onClick={handleRestoreFolder} disabled={isScanning} className={`cursor-pointer ${isScanning ? 'bg-zinc-700 text-zinc-500' : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'} px-2 py-1 rounded transition-colors text-[10px] font-bold tracking-widest flex items-center gap-1`} title="Restore Saved Folder">
                                            <FolderPlus className="w-3 h-3" /> {isScanning ? 'SCANNING...' : 'RESTORE'}
                                        </button>
                                    )}
                                    <button onClick={handleSelectRootFolder} disabled={isScanning} className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center gap-1 text-[10px] font-bold tracking-widest" title="Link Root Folder">
                                        <Plus className="w-3 h-3" /> LINK FOLDER
                                    </button>
                                    <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-400 p-1 rounded transition-colors" title="Añadir Archivos Sueltos">
                                        <Plus className="w-4 h-4" />
                                        <input type="file" multiple accept="audio/*" className="hidden" onChange={handleImportTracks} />
                                    </label>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {playlists.map(pl => {
                                    const isCollection = pl.id === 'collection';
                                    const parts = pl.name.split(' / ');
                                    const depth = isCollection ? 0 : parts.length - 1;
                                    const displayName = isCollection ? 'Collection' : parts[parts.length - 1];

                                    return (
                                        <div
                                            key={pl.id}
                                            onClick={() => setActivePlaylistId(pl.id)}
                                            style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
                                            className={`py-2 pr-3 rounded-md flex items-center gap-3 cursor-pointer text-sm mb-1 transition-all border-l-2 ${activePlaylistId === pl.id ? 'bg-blue-600/20 text-blue-400 font-bold border-blue-500' : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                                        >
                                            {isCollection ? <ListMusic className="w-4 h-4 flex-shrink-0" /> : <Folder className="w-4 h-4 flex-shrink-0" />}
                                            <span className="truncate">{displayName}</span>
                                        </div>
                                    );
                                })}

                                {showAddPlaylist ? (
                                    <div className="px-2 mt-2">
                                        <input
                                            autoFocus
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                                            placeholder="Playlist name..."
                                            value={newPlaylistName}
                                            onChange={(e) => setNewPlaylistName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                                            onBlur={createPlaylist}
                                        />
                                    </div>
                                ) : (
                                    <div onClick={() => setShowAddPlaylist(true)} className="px-3 py-2 rounded-md flex items-center gap-3 cursor-pointer text-sm mb-1 text-zinc-500 hover:text-zinc-300 mt-4 border border-dashed border-zinc-700/50">
                                        <Plus className="w-4 h-4" /> Create Playlist
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Track List Main Area */}
                        <div className="flex-1 flex flex-col bg-[#141416] min-h-0">
                            <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-[#18181b]">
                                <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                    {playlists.find(p => p.id === activePlaylistId)?.name}
                                    <span className="text-xs text-zinc-500 font-normal bg-black px-2 py-0.5 rounded-full">{activeTracks.length} TRACKS</span>
                                </h2>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                    <input type="text" placeholder="Search in playlist..." className="bg-black border border-zinc-800 rounded-full pl-9 pr-4 py-1 text-sm text-white focus:outline-none focus:border-zinc-600 w-64" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="sticky top-0 bg-[#0d0d0f] text-zinc-500 text-xs shadow-md z-10">
                                        <tr>
                                            <th className="font-medium p-3 w-12 text-center">#</th>
                                            <th className="font-medium p-3">TRACK TITLE</th>
                                            <th className="font-medium p-3">ARTIST</th>
                                            <th className="font-medium p-3 w-24">BPM</th>
                                            <th className="font-medium p-3 w-24">TIME</th>
                                            <th className="font-medium p-3 w-32 text-center">LOAD</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeTracks.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-20 text-zinc-600">
                                                    <Disc className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                    <p>No tracks in this playlist.</p>
                                                    <p className="text-xs mt-1">Import tracks using the <Plus className="w-3 h-3 inline" /> button in the library panel.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            activeTracks.map((track, idx) => (
                                                <tr
                                                    key={track.id}
                                                    draggable
                                                    onDragStart={() => setDraggedTrackId(track.id)}
                                                    onDragEnd={() => setDraggedTrackId(null)}
                                                    className="border-b border-zinc-800/50 hover:bg-blue-600/10 cursor-grab active:cursor-grabbing group transition-colors"
                                                >
                                                    <td className="p-3 text-center text-zinc-600">{idx + 1}</td>
                                                    <td className="p-3 font-medium text-zinc-200">{track.title}</td>
                                                    <td className="p-3 text-zinc-500">{track.artist}</td>
                                                    <td className="p-3 text-zinc-400 font-mono">{track.bpm}</td>
                                                    <td className="p-3 text-zinc-400 font-mono">{track.duration}</td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => deck1.loadTrack({ file: track.file, bpm: track.bpm })} className="px-2 py-1 bg-zinc-800 hover:bg-blue-600 text-[10px] rounded font-bold transition-colors">D1</button>
                                                            <button onClick={() => deck2.loadTrack({ file: track.file, bpm: track.bpm })} className="px-2 py-1 bg-zinc-800 hover:bg-blue-600 text-[10px] rounded font-bold transition-colors">D2</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    <MIDIDebugger deviceName={deviceName} messages={lastMessages} />
                    <MenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                </>
            )}
        </div>
    );
}
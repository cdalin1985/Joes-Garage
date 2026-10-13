/**
 * Synthesized example sounds for the "What's that noise?" decoder (Web Audio,
 * no audio files), plus a silent preview waveform for the oscilloscope when
 * nothing is playing. Playback only ever starts from a click.
 */

import type { Symptom } from "@/lib/symptoms";

export type SoundKind = Symptom["sound"];

let ctx: AudioContext | null = null;

function noiseBuffer(ac: AudioContext, seconds: number) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function burst(ac: AudioContext, out: AudioNode, at: number, dur: number, freq: number, gain: number) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, dur);
  const f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = 2;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(out);
  src.start(at);
}

export type Playback = { analyser: AnalyserNode; endsAt: number; ctx: AudioContext; stop: () => void };

/**
 * Play ~2.5s of the example sound. Returns the analyser (for the scope), the
 * time it ends and a stop function, or null for symptoms without a sound.
 */
export function playSymptom(kind: SoundKind): Playback | null {
  if (kind === "none") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = ctx ?? new AC();
  const ac = ctx;
  if (ac.state === "suspended") void ac.resume();
  const t0 = ac.currentTime + 0.05;
  const dur = 2.5;
  const master = ac.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(0.5, t0 + 0.08);
  master.gain.setValueAtTime(0.5, t0 + dur - 0.25);
  master.gain.linearRampToValueAtTime(0, t0 + dur);
  const analyser = ac.createAnalyser();
  analyser.fftSize = 1024;
  master.connect(analyser).connect(ac.destination);

  const osc = (type: OscillatorType, f: number) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.start(t0);
    o.stop(t0 + dur);
    return o;
  };

  switch (kind) {
    case "squeal": {
      const o = osc("sine", 3100);
      const lfo = osc("sine", 6);
      const depth = ac.createGain();
      depth.gain.value = 45;
      lfo.connect(depth).connect(o.frequency);
      const g = ac.createGain();
      g.gain.value = 0.12;
      o.connect(g).connect(master);
      break;
    }
    case "grind": {
      const src = ac.createBufferSource();
      src.buffer = noiseBuffer(ac, dur);
      const f = ac.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 380;
      f.Q.value = 1.4;
      const am = ac.createGain();
      am.gain.value = 0.35;
      const lfo = osc("square", 28);
      const lfoDepth = ac.createGain();
      lfoDepth.gain.value = 0.3;
      lfo.connect(lfoDepth).connect(am.gain);
      src.connect(f).connect(am).connect(master);
      src.start(t0);
      break;
    }
    case "hum": {
      const o = osc("sawtooth", 80);
      o.frequency.linearRampToValueAtTime(150, t0 + dur);
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      const g = ac.createGain();
      g.gain.value = 0.22;
      const wob = osc("sine", 1.6);
      const wobDepth = ac.createGain();
      wobDepth.gain.value = 0.08;
      wob.connect(wobDepth).connect(g.gain);
      o.connect(lp).connect(g).connect(master);
      break;
    }
    case "clicks":
      for (let i = 0; i < 18; i++) burst(ac, master, t0 + i * 0.13, 0.025, 2600, 0.5);
      break;
    case "rapid-click":
      for (let i = 0; i < 32; i++) burst(ac, master, t0 + i * 0.07, 0.018, 1600, 0.45);
      break;
    case "clunk":
      [0.1, 0.75, 1.15, 1.9].forEach((at) => {
        const o = ac.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(110, t0 + at);
        o.frequency.exponentialRampToValueAtTime(42, t0 + at + 0.18);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.9, t0 + at);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.22);
        o.connect(g).connect(master);
        o.start(t0 + at);
        o.stop(t0 + at + 0.25);
        burst(ac, master, t0 + at, 0.04, 900, 0.25);
      });
      break;
    case "belt": {
      const o = osc("sine", 2500);
      for (let t = 0; t < dur; t += 0.03) o.frequency.setValueAtTime(2500 + (Math.random() - 0.5) * 260, t0 + t);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.15);
      g.gain.exponentialRampToValueAtTime(0.03, t0 + dur);
      o.connect(g).connect(master);
      break;
    }
    case "hiss": {
      const src = ac.createBufferSource();
      src.buffer = noiseBuffer(ac, dur);
      const hp = ac.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3200;
      const g = ac.createGain();
      g.gain.value = 0.16;
      src.connect(hp).connect(g).connect(master);
      src.start(t0);
      break;
    }
  }
  return { analyser, endsAt: t0 + dur, ctx: ac, stop: () => master.disconnect() };
}

/** A silent "what it looks like" waveform for the scope, in -1…1. */
export function previewSample(kind: SoundKind, x: number, t: number): number {
  switch (kind) {
    case "squeal":
      return Math.sin(x * 90 + t * 20) * 0.55;
    case "belt":
      return Math.sin(x * 70 + t * 18 + Math.sin(t * 13) * 2) * 0.5 * (0.7 + 0.3 * Math.sin(t * 9));
    case "grind":
      return (Math.random() * 2 - 1) * 0.6 * (Math.sin(x * 12 + t * 30) > 0 ? 1 : 0.35);
    case "hum":
      return Math.sin(x * 8 + t * 6) * 0.7 * (0.8 + 0.2 * Math.sin(t * 2));
    case "clicks":
    case "rapid-click": {
      const period = kind === "clicks" ? 0.18 : 0.08;
      const phase = (x + t * 0.6) % period;
      return phase < 0.01 ? (Math.random() * 2 - 1) * 0.9 : 0;
    }
    case "clunk": {
      const phase = (x * 0.8 + t * 0.4) % 0.5;
      return Math.sin(phase * 60) * Math.exp(-phase * 14) * 0.9;
    }
    case "hiss":
      return (Math.random() * 2 - 1) * 0.35;
    default:
      return 0;
  }
}

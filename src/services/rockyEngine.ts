import * as Tone from 'tone';

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

export type FunMode = 'canon' | 'scientific' | 'curious' | 'excited' | 'confused' | 'jazz' | 'sleepy';

export interface WordTranslation {
  word: string;
  notes: string[];
  symbols: string;
  glyphPath: string;
  glyphPoints: { x: number; y: number }[];
}

export interface Translation {
  input: string;
  translation: string; // Concatenated symbols
  notes: string[][];
  symbols: string;
  audioReady: boolean;
  words: string[];
  items: WordTranslation[];
}

// -------------------------------------------------------------
// Dictionary Definition
// -------------------------------------------------------------

export const rockyDictionary: Record<string, string[]> = {
  hello: ["C4", "E4", "G4"],
  friend: ["D4", "F4", "A4"],
  yes: ["G4", "B4"],
  no: ["A3", "D4"],
  science: ["C4", "D4", "G4", "B4"],
  human: ["F4", "A4", "C5"],
  rocky: ["E4", "G4", "B4"],
  hail: ["C4", "F4", "A4"],
  mary: ["D4", "G4", "B4"],
  earth: ["C3", "G3", "C4"],
  save: ["E4", "A4", "C5"],
  space: ["D4", "G4", "C5"],
  music: ["F4", "Bb4", "D5"],
  question: ["G4", "C5", "E5"],
  affirmative: ["C4", "E4", "G4", "C5"],
  negative: ["F3", "B3", "D4"],
  greetings: ["C4", "E4", "G4", "C5"],
  smart: ["D4", "F#4", "A4", "C#5"],
  danger: ["Eb4", "Gb4", "A4", "C5"],
  slack: ["E4", "A4", "G4"],
    ryland: ["C4", "E4", "A4"],
  grace: ["D4", "F#4", "A4", "D5"],

  rockyfriend: ["E4", "G4", "B4", "D5"],
  amaze: ["C4", "F4", "B4", "E5"],
  understand: ["C4", "E4", "G4", "B4"],
  confused: ["D4", "Eb4", "A4"],
  explain: ["C4", "G4", "C5", "E5"],

  taumoeba: ["Eb4", "Gb4", "Bb4"],
  astrophage: ["C3", "G3", "D4", "A4"],
  xenonite: ["F#4", "A4", "C5", "E5"],

  cooperate: ["C4", "F4", "G4", "C5"],
  trust: ["D4", "A4", "D5"],
  dangerclose: ["Eb4", "Gb4", "A4", "Db5"],
  safe: ["C4", "E4", "A4"],
  solved: ["C4", "E4", "G4", "C5", "E5"],

  fuel: ["G3", "D4", "A4"],
  ship: ["C3", "G3", "C4", "G4"],
  engine: ["D3", "A3", "D4", "F#4"],
  spin: ["C4", "D4", "G4", "A4"],
  accelerate: ["C4", "E4", "G4", "B4", "D5"],

  questionmore: ["G4", "C5", "F5"],
  uncertain: ["A3", "C4", "F4"],
  certain: ["C4", "G4", "B4", "C5"],
  agree: ["C4", "E4", "G4"],
  disagree: ["F3", "Bb3", "D4"],



  friendshipstrong: ["D4", "F#4", "A4", "C#5"],
  celebrate: ["C4", "E4", "G4", "D5"],
  successmission: ["C4", "E4", "G4", "B4", "E5"],
  goodbyefriend: ["A3", "E4", "G4", "C5"]
  
};

// -------------------------------------------------------------
// Note Generation Logic (based on Rocky's Fun Modes)
// -------------------------------------------------------------

export function generateNotesForWord(word: string, mode: FunMode): string[] {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleanWord) return ["C4"];

  // If word exists in dictionary and we are in 'canon' mode, return it
  if (mode === 'canon' && rockyDictionary[cleanWord]) {
    return rockyDictionary[cleanWord];
  }

  // Hash word to get deterministic behavior
  let hash = 0;
  for (let i = 0; i < cleanWord.length; i++) {
    hash = cleanWord.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  // Scaler pools representing the emotional color of the mode
  const scales = {
    canon: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"],
    scientific: ["C4", "G4", "C5", "G5", "C6", "G6"], // Perfect 5ths and octaves
    curious: ["C4", "E4", "G4", "B4", "D5", "F#5", "A5", "B5"], // Lydian ascending feel
    excited: ["C5", "E5", "G5", "A5", "C6", "D6", "E6", "G6"], // High pentatonic, bright
    confused: ["C4", "C#4", "F#4", "G#4", "D5", "Eb5", "A5"], // Dissonant intervals (tritones, minor seconds)
    jazz: ["C4", "Eb4", "E4", "G4", "A4", "Bb4", "D5", "F5"], // Blues & extended tones
    sleepy: ["C3", "F3", "G3", "Bb3", "C4", "Eb4", "G4"] // Low, deep pentatonic tones
  };

  const pool = scales[mode] || scales.canon;

  // Determine chord size (Rocky speaks in double-vocal-chord nodes, i.e., 2-4 simultaneous pitches)
  let chordSize = 3;
  if (mode === 'scientific') chordSize = 2;
  if (mode === 'sleepy') chordSize = 2;
  if (mode === 'excited') chordSize = 4;
  if (mode === 'jazz') chordSize = 4;

  const notes: string[] = [];
  for (let i = 0; i < chordSize; i++) {
    const idx = (hash + i * 17) % pool.length;
    const note = pool[idx];
    if (!notes.includes(note)) {
      notes.push(note);
    }
  }

  // Sort notes from lowest pitch to highest pitch
  notes.sort((a, b) => {
    const getMidiValue = (n: string) => {
      const match = n.match(/^([A-G]#?|Bb?)(\d)$/i);
      if (!match) return 60;
      const letter = match[1];
      const octave = parseInt(match[2]);
      const noteOffset: Record<string, number> = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
      };
      return octave * 12 + noteOffset[letter];
    };
    return getMidiValue(a) - getMidiValue(b);
  });

  return notes.length > 0 ? notes : ["C4"];
}

// -------------------------------------------------------------
// Eridian Symbol & SVG Glyph Mapper
// -------------------------------------------------------------

export function mapNotesToUnicodeSymbols(notes: string[], index: number): string {
  const symbolPool = ["♫", "♬", "♪", "♩", "⁕", "✦", "◈", "◇", "⚬"];
  const charSum = notes.join('').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pickedSymbol = symbolPool[(charSum + index) % symbolPool.length];
  return pickedSymbol;
}

/**
 * Generates coordinate paths inside a pentagon (representing Rocky's body structure)
 * to represent Eridian written glyphs.
 */
export function generateEridianGlyph(notes: string[]): { path: string; points: { x: number; y: number }[] } {
  // Center is (50, 50), radius is 40
  const cx = 50;
  const cy = 50;
  const r = 40;
  const points: { x: number; y: number }[] = [];

  // Eridian coordinates have 5-fold pentagonal symmetry (0 to 4 vertices)
  // Map notes to vertices using pitch index
  const notesMidiMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };

  notes.forEach((note) => {
    const match = note.match(/^([A-G]#?|Bb?)(\d)$/i);
    if (!match) return;
    const letter = match[1];
    const octave = parseInt(match[2]);

    const noteVal = notesMidiMap[letter] || 0;
    // Calculate pentagonal vertex index (0 to 4)
    const vertexIndex = (noteVal + octave) % 5;
    
    // Scale radius based on octave (lower octave = closer to center, higher octave = closer to perimeter)
    // Octaves range from 3 to 6
    const pct = (octave - 2) / 4; // 0.25 to 1.0
    const currentRadius = r * (0.3 + pct * 0.7);

    // Calculate angle (0 degrees is straight up: -Math.PI / 2)
    const angle = (vertexIndex * 2 * Math.PI) / 5 - Math.PI / 2;

    const px = cx + currentRadius * Math.cos(angle);
    const py = cy + currentRadius * Math.sin(angle);
    points.push({ x: Math.round(px * 10) / 10, y: Math.round(py * 10) / 10 });
  });

  // Make sure we have at least 2 points to draw a path
  if (points.length === 0) {
    points.push({ x: cx, y: cy });
  }

  // Draw lines connecting the vertices
  let path = '';
  if (points.length === 1) {
    // Single node - just a small circle at point
    path = `M ${points[0].x} ${points[0].y} m -3, 0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0`;
  } else {
    // Connect points
    path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    // Connect back to start if there are more than 2 points to form a polygon
    if (points.length > 2) {
      path += ' Z';
    }
    
    // Add lines radiating from the center to each point (representing coordination rays)
    points.forEach(pt => {
      path += ` M ${cx} ${cy} L ${pt.x} ${pt.y}`;
    });
  }

  return { path, points };
}

// -------------------------------------------------------------
// Translation Coordinator
// -------------------------------------------------------------

export function translateEnglishToRocky(input: string, mode: FunMode): Translation {
  const words = input
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  if (words.length === 0) {
    return {
      input,
      translation: '',
      notes: [],
      symbols: '',
      audioReady: false,
      words: [],
      items: []
    };
  }

  const items: WordTranslation[] = words.map((word, index) => {
    const notes = generateNotesForWord(word, mode);
    const symbol = mapNotesToUnicodeSymbols(notes, index);
    const glyphInfo = generateEridianGlyph(notes);

    return {
      word,
      notes,
      symbols: symbol,
      glyphPath: glyphInfo.path,
      glyphPoints: glyphInfo.points
    };
  });

  const allNotes = items.map(item => item.notes);
  const allSymbols = items.map(item => item.symbols).join(' ');

  return {
    input,
    translation: allSymbols,
    notes: allNotes,
    symbols: allSymbols,
    audioReady: true,
    words,
    items
  };
}

// -------------------------------------------------------------
// Audio Engine with Eridian Acoustics
// -------------------------------------------------------------

class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private reverb: Tone.Reverb | null = null;
  private limiter: Tone.Limiter | null = null;
  private analyser: Tone.Analyser | null = null;
  private recorder: Tone.Recorder | null = null;
  private isRecording: boolean = false;

  constructor() {
    // Lazy loaded audio nodes to comply with browser user-interaction rules
  }

  public init() {
    if (this.synth) return;

    // Use a PolySynth composed of Synth elements with custom settings
    // Rocky's vocalizations are slightly metallic and resonating, similar to an FM or sine-heavy triangle wave.
    this.synth = new Tone.PolySynth(Tone.Synth, {
      volume: -4, // Lowered internal gain to prevent digital clipping distortion
      oscillator: {
        type: 'triangle' // Triangle wave has soft flutey/reed-like harmonics, very Eridian!
      },
      envelope: {
        attack: 0.16, // Softer whistle-like attack (fade-in)
        decay: 0.2,
        sustain: 0.95,
        release: 0.9 // Ringing, atmospheric decay
      }
    });

    // Subtly modulate frequencies using a Vibrato effec
    const vibrato = new Tone.Vibrato({
      frequency: 5.5,
      depth: 0.12
    });

    // Spacecraft acoustics
    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.32,
      wet: 0.35 // Higher wet mix for ethereal echos
    });

    this.reverb = new Tone.Reverb({
      decay: 2.2, // Atmospheric metallic hall reverb length
      wet: 0.45 
    });

    // Add a Compressor to keep it loud and dense without clipping
    const compressor = new Tone.Compressor({
      threshold: -12,
      ratio: 4,
      attack: 0.03,
      release: 0.08
    });

    this.limiter = new Tone.Limiter(0); // Guard final outputs at 0dB limit
    this.analyser = new Tone.Analyser('waveform', 256);
    this.recorder = new Tone.Recorder();

    // Route: Synth -> Vibrato -> Delay -> Reverb -> Compressor -> Analyser -> Limiter -> Destination
    this.synth.chain(
      vibrato,
      this.delay,
      this.reverb,
      compressor,
      this.analyser,
      this.limiter,
      Tone.Destination
    );

    // Separately route the audio output to the recorder
    this.limiter.connect(this.recorder);
  }

  public getAnalyser(): Tone.Analyser | null {
    this.init();
    return this.analyser;
  }

  public async playChord(notes: string[], durationSeconds: number, timeOffset: number = 0) {
    this.init();
    await Tone.start();
    
    if (this.synth) {
      // Rocky sounds musical: slightly randomize play timing for an organic feel
      const humanizeDelay = Math.random() * 0.015;
      this.synth.triggerAttackRelease(
        notes,
        durationSeconds,
        Tone.now() + timeOffset + humanizeDelay
      );
    }
  }

  public stopAll() {
    if (this.synth) {
      this.synth.releaseAll();
    }
  }

  public setVolume(dbValue: number) {
    this.init();
    if (this.synth) {
      // dbValue runs from -40 (quiet) to 0 (loud)
      this.synth.volume.value = dbValue;
    }
  }

  public startRecording() {
    this.init();
    if (this.recorder && !this.isRecording) {
      this.recorder.start();
      this.isRecording = true;
    }
  }

  public async stopRecording(): Promise<string> {
    if (this.recorder && this.isRecording) {
      this.isRecording = false;
      const blob = await this.recorder.stop();
      return URL.createObjectURL(blob);
    }
    return '';
  }
}

export const rockyAudioEngine = new AudioEngine();

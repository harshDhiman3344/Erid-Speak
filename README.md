# Eridian Communication Interface (Erid-Speak)

A high-fidelity client-side spacecraft console inspired by Andy Weir's *Project Hail Mary*. This interface allows Ryland Grace (the user) to translate spoken or typed English messages into Rocky's musical, chord-based Eridian language, visualize the signal telemetry, and transmit (play) the resonance audio.

> [!IMPORTANT]
> **Dashboard Display Calibration**: For the best pixel-perfect, scroll-free dashboard layout, please **keep your browser zoom level set to 100% or 120%**.

---

## How to Use the Interface

This HUD is designed as a single-page dashboard. The communication sequence is structured into four simple steps:

### Step 1: Input Your Message
*   **Keypad Override**: Click the input field under **1. Enter English Message** and type any English phrase (e.g., `hello friend science yes`).
*   **Voice Link**: Click the microphone icon on the right side of the input field. Once the link glows red and indicates `AWAITING HUMAN SPEECH...`, speak clearly. The browser's speech-to-text engine will transcribe your voice into the input field in real time.

### Step 2: Set Rocky's Mood Profile
Use the **Mood Matrix** grid to calibrate Rocky's emotional state. Switching profiles instantly updates the harmonic character of the generated notes:
*   `canon`: Stable, peaceful major and minor chord structures.
*   `scientific`: Strict mathematical intervals (perfect fifths and octaves).
*   `curious`: Bright, ascending arpeggio sweeps.
*   `excited`: Rapid, high-register arpeggios.
*   `confused`: Unstable, dissonant tritone and minor-second clusters.
*   `jazz`: Rich, extended seventh and ninth chords.
*   `sleepy`: Slow, low-register ambient drone dyads.

### Step 3: Analyze the Translated Telemetry
As you type or speak, the system automatically translates the message:
*   **Acoustic Notation**: Under **2. Translated Eridian Resonance Chords**, view the raw chord notes (e.g., `C4E4G4`) and unicode chimes.
*   **Eridian Script Glyphs**: The interface maps the chord notes onto coordinates of a pentagon (representing Rocky's 5-fold physical symmetry). Click any individual glyph card to play that word's chord in isolation.
*   **Sheet Notation**: Look at **3. Sheet Notation** to see VexFlow render the chords sequentially onto a treble staff.

### THEN **Transmit**: Click **Transmit Message** to play the full sequence of translated chords.

### Step 4 (Optional) 
*   **Calibrate**: Use the sliders in the footer to adjust the output level (dB) and tempo speed (WPM).
*   **Export WAV**: Arm the **REC WAV** checkbox before clicking **Transmit**. The interface will record the audio and compile a download link to save a high-quality audio file.

---

## Technical Mechanics

### 1. Translation & Note Generation
The system processes text word-by-word through the translation pipeline in **[rockyEngine.ts](file:///d:/CODING/RockySpeak/erid-speak/src/services/rockyEngine.ts)**:
*   **Base Vocabulary**: Common words (like `hello`, `friend`, `science`, `human`, `save`, `earth`) are mapped directly to specific chords defined in the Eridian dictionary.
*   **Procedural Generator**: If you input a word not found in the dictionary, a hash algorithm generates a deterministic chord by mapping the characters of the word to scale intervals associated with the selected mood profile.

### 2. Geometric Glyphs
Eridians draw lines to communicate coordinate mathematics. The glyph generator maps each note in a chord to a vertex on a regular pentagon:
*   The **Pitch Class** (e.g., C, D, E) determines which of the 5 vertices is targeted.
*   The **Octave** (e.g., octave 3 vs. 5) determines the radius distance from the center.
*   Vertices are connected by glowing vector paths (`path`) to form a unique geometric signature for each word.

### 3. Sound Synthesis & Spacecraft Acoustics
Since Eridians have dual vocal cords, they speak in musical chords. The synthesizer engine is carefully structured in Tone.js to sound organic rather than electronic:
*   **Oscillator**: Uses a soft **triangle wave** instead of a pure sine wave, producing subtle flutey reed-harmonics that match Rocky's whistling voice.
*   **Amplitude Envelopes**: Built with a gentle attack (`0.16s`) and long release (`0.9s`) to prevent clicking and smoothly transition chords.
*   **Effects Chain**: Routes the synth through:
    1.  A frequency-modulating **Vibrato** (LFO at `5.5Hz`) to simulate biological throat oscillations.
    2.  A stereo **Feedback Delay** and long hall **Reverb** to replicate the metal acoustics inside the *Hail Mary* cockpit.
    3.  A master **Compressor** and hard **Limiter** to keep the output loud and dense while strictly clip-guarding against digital distortion.

---

## File Architecture

The codebase is kept concise to avoid file clutter:
*   **[App.tsx](file:///d:/CODING/RockySpeak/erid-speak/src/App.tsx)**: Manages main dashboard state, keyboard overrides, recording events, speech dictation API, and the animated radar scope.
*   **[rockyEngine.ts](file:///d:/CODING/RockySpeak/erid-speak/src/services/rockyEngine.ts)**: Configures vocabulary dictionaries, scale pools, Eridian SVG glyph calculations, and Tone.js routing nodes.
*   **[SheetMusic.tsx](file:///d:/CODING/RockySpeak/erid-speak/src/components/SheetMusic.tsx)**: Draws scrollable musical staff notations dynamically using the VexFlow SVG backend.
*   **[Visualizer.tsx](file:///d:/CODING/RockySpeak/erid-speak/src/components/Visualizer.tsx)**: Captures time-domain audio buffers to draw a responsive oscilloscope line.
*   **[index.css](file:///d:/CODING/RockySpeak/erid-speak/src/index.css)**: Implemented all styling tokens, column-split grid setups, CRT overlays, and neon glow effects.

---

## Running Locally

1. Install package dependencies:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm run dev
   ```
3. Open your browser and point it to the printed URL (typically `http://localhost:5173`).
